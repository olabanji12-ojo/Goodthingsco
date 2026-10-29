/**
 * Good Things Co. — Abandoned Checkout Firestore Repository
 */

import type { AbandonedCheckoutSession } from '../../src/types/abandonedCheckout.js';
import { getAdminFirestore } from '../firebase.js';

export const ABANDONED_CHECKOUTS_COLLECTION = 'abandonedCheckouts';

export interface AbandonedCheckoutRepository {
  getBySessionId(sessionId: string): Promise<AbandonedCheckoutSession | null>;
  getByTokenHash(tokenHash: string): Promise<AbandonedCheckoutSession | null>;
  save(session: Omit<AbandonedCheckoutSession, 'id'>): Promise<AbandonedCheckoutSession>;
  update(sessionId: string, partial: Partial<AbandonedCheckoutSession>): Promise<void>;
  findEligibleForReminders(options: {
    nowIso: string;
    abandonedThresholdIso: string;
    maxReminders: number;
  }): Promise<AbandonedCheckoutSession[]>;
  claimReminder(sessionId: string, expectedSentCount: number, claimedAtIso: string): Promise<boolean>;
  recordReminderResult(
    sessionId: string,
    update: {
      sentCount: number;
      lastSentAt: string;
      nextEligibleAt?: string;
      lastEventId: string;
    }
  ): Promise<void>;
  releaseReminderClaim(sessionId: string): Promise<void>;
  markConverted(sessionId: string, orderId: string, orderNumber: string, convertedAtIso: string): Promise<void>;
  markConvertedByEmail(email: string, orderId: string, orderNumber: string, convertedAtIso: string): Promise<number>;
}


const sessions = () => getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION);
export const firestoreAbandonedCheckouts: AbandonedCheckoutRepository = {
  async getBySessionId(id) {
    const doc = await sessions().doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } as AbandonedCheckoutSession : null;
  },
  async getByTokenHash(hash) {
    const snap = await sessions().where('resumeTokenHash', '==', hash).limit(1).get();
    return snap.empty ? null : { ...snap.docs[0].data(), id: snap.docs[0].id } as AbandonedCheckoutSession;
  },
  async save(session) {
    const ref = sessions().doc(session.sessionId);
    await getAdminFirestore().runTransaction(async tx => {
      const previous = await tx.get(ref);
      if (previous.exists && previous.data()?.status === 'converted') throw new Error('Checkout already converted');
      tx.set(ref, session, { merge: true });
    });
    return { ...session, id: session.sessionId };
  },
  async update(id, partial) {
    const ref = sessions().doc(id);
    await getAdminFirestore().runTransaction(async tx => {
      const previous = await tx.get(ref);
      if (!previous.exists || previous.data()?.status === 'converted') return;
      tx.update(ref, { ...partial, updatedAt: new Date().toISOString() });
    });
  },
  async findEligibleForReminders({ nowIso, abandonedThresholdIso, maxReminders }) {
    const snap = await sessions().where('status', 'in', ['active', 'abandoned', 'resumed']).get();
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AbandonedCheckoutSession)).filter(s =>
      Boolean(s.customer.email?.trim()) && s.reminderState.sentCount < maxReminders &&
      s.expiresAt > nowIso && s.lastActivityAt <= abandonedThresholdIso &&
      (!s.reminderState.nextEligibleAt || s.reminderState.nextEligibleAt <= nowIso) &&
      (!s.reminderState.claiming || !s.reminderState.claimedAt ||
        Date.parse(nowIso) - Date.parse(s.reminderState.claimedAt) >= 300000));
  },
  async claimReminder(id, expected, nowIso) {
    const ref = sessions().doc(id);
    return getAdminFirestore().runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (!doc.exists) return false;
      const s = doc.data() as AbandonedCheckoutSession;
      if (s.status === 'converted' || s.status === 'expired' || s.expiresAt <= nowIso ||
        s.reminderState.sentCount !== expected) return false;
      if (s.reminderState.claiming && s.reminderState.claimedAt &&
        Date.parse(nowIso) - Date.parse(s.reminderState.claimedAt) < 300000) return false;
      const paid = await tx.get(getAdminFirestore().collection('orders').where('checkoutSessionId', '==', id));
      if (paid.docs.some(order => order.data().payment?.status === 'paid')) {
        tx.update(ref, { status: 'converted', updatedAt: nowIso }); return false;
      }
      tx.update(ref, { status: 'abandoned', 'reminderState.claiming': true,
        'reminderState.claimedAt': nowIso, updatedAt: nowIso });
      return true;
    });
  },
  async recordReminderResult(id, update) {
    await sessions().doc(id).update({
      'reminderState.sentCount': update.sentCount, 'reminderState.lastSentAt': update.lastSentAt,
      'reminderState.nextEligibleAt': update.nextEligibleAt || null,
      'reminderState.lastEventId': update.lastEventId,
      'reminderState.claiming': false, 'reminderState.claimedAt': null, updatedAt: update.lastSentAt,
    });
  },
  async releaseReminderClaim(id) {
    await sessions().doc(id).update({ 'reminderState.claiming': false, 'reminderState.claimedAt': null });
  },
  async markConverted(id, orderId, orderNumber, now) {
    const ref = sessions().doc(id);
    await getAdminFirestore().runTransaction(async tx => {
      if (!(await tx.get(ref)).exists) return;
      tx.update(ref, { status: 'converted', convertedOrderId: orderId, convertedOrderNumber: orderNumber,
        convertedAt: now, updatedAt: now, 'reminderState.claiming': false, 'reminderState.nextEligibleAt': null });
    });
  },
  async markConvertedByEmail(email, orderId, orderNumber, now) {
    const snap = await sessions().where('customer.email', '==', email.trim().toLowerCase()).get();
    const active = snap.docs.filter(doc => ['active', 'abandoned', 'resumed'].includes(doc.data().status));
    for (const doc of active) await this.markConverted(doc.id, orderId, orderNumber, now);
    return active.length;
  },
};
