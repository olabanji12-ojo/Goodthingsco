/**
 * Good Things Co. — Abandoned Checkout Firestore Repository
 */

import type { AbandonedCheckoutSession } from '../../src/types/abandonedCheckout';
import { getAdminFirestore } from '../firebase';

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

export const firestoreAbandonedCheckouts: AbandonedCheckoutRepository = {
  async getBySessionId(sessionId: string): Promise<AbandonedCheckoutSession | null> {
    const snap = await getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId).get();
    if (!snap.exists) return null;
    return { ...snap.data(), id: snap.id } as AbandonedCheckoutSession;
  },

  async getByTokenHash(tokenHash: string): Promise<AbandonedCheckoutSession | null> {
    const querySnap = await getAdminFirestore()
      .collection(ABANDONED_CHECKOUTS_COLLECTION)
      .where('resumeTokenHash', '==', tokenHash)
      .limit(1)
      .get();
    if (querySnap.empty) return null;
    const docSnap = querySnap.docs[0];
    return { ...docSnap.data(), id: docSnap.id } as AbandonedCheckoutSession;
  },

  async save(session: Omit<AbandonedCheckoutSession, 'id'>): Promise<AbandonedCheckoutSession> {
    const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(session.sessionId);
    await docRef.set(session, { merge: true });
    return { ...session, id: session.sessionId };
  },

  async update(sessionId: string, partial: Partial<AbandonedCheckoutSession>): Promise<void> {
    const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);
    await docRef.update({
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  },

  async findEligibleForReminders({ nowIso, abandonedThresholdIso, maxReminders }): Promise<AbandonedCheckoutSession[]> {
    const db = getAdminFirestore();
    // Query unconverted sessions that have customer emails
    const snapshot = await db
      .collection(ABANDONED_CHECKOUTS_COLLECTION)
      .where('status', 'in', ['active', 'abandoned', 'resumed'])
      .get();

    const results: AbandonedCheckoutSession[] = [];
    for (const doc of snapshot.docs) {
      const data = { ...doc.data(), id: doc.id } as AbandonedCheckoutSession;
      // Must have valid email
      const email = data.customer?.email?.trim();
      if (!email || !email.includes('@')) continue;

      // Must not exceed max reminders
      const sentCount = data.reminderState?.sentCount || 0;
      if (sentCount >= maxReminders) continue;

      // Must not be expired
      if (data.expiresAt && data.expiresAt <= nowIso) continue;

      // If active or resumed, must be past inactivity threshold to become abandoned
      if (data.status !== 'abandoned' && data.lastActivityAt > abandonedThresholdIso) continue;

      // Check nextEligibleAt if present
      if (data.reminderState?.nextEligibleAt && data.reminderState.nextEligibleAt > nowIso) continue;

      // Check if locked/claimed recently (stale claim lock expires in 5 minutes)
      if (data.reminderState?.claiming && data.reminderState.claimedAt) {
        const claimAge = Date.now() - new Date(data.reminderState.claimedAt).getTime();
        if (claimAge < 5 * 60 * 1000) continue;
      }

      results.push(data);
    }

    return results;
  },

  async claimReminder(sessionId: string, expectedSentCount: number, claimedAtIso: string): Promise<boolean> {
    const db = getAdminFirestore();
    const docRef = db.collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);

    return db.runTransaction(async txn => {
      const snap = await txn.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AbandonedCheckoutSession;

      if (data.status === 'converted' || data.status === 'expired') return false;
      if ((data.reminderState?.sentCount || 0) !== expectedSentCount) return false;

      // Check active claim lock
      if (data.reminderState?.claiming && data.reminderState.claimedAt) {
        const claimAge = Date.now() - new Date(data.reminderState.claimedAt).getTime();
        if (claimAge < 5 * 60 * 1000) return false;
      }

      txn.update(docRef, {
        status: 'abandoned',
        'reminderState.claiming': true,
        'reminderState.claimedAt': claimedAtIso,
        updatedAt: claimedAtIso,
      });

      return true;
    });
  },

  async recordReminderResult(sessionId: string, update): Promise<void> {
    const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);
    await docRef.update({
      'reminderState.sentCount': update.sentCount,
      'reminderState.lastSentAt': update.lastSentAt,
      'reminderState.nextEligibleAt': update.nextEligibleAt || null,
      'reminderState.lastEventId': update.lastEventId,
      'reminderState.claiming': false,
      'reminderState.claimedAt': null,
      updatedAt: update.lastSentAt,
    });
  },

  async releaseReminderClaim(sessionId: string): Promise<void> {
    const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);
    await docRef.update({
      'reminderState.claiming': false,
      'reminderState.claimedAt': null,
      updatedAt: new Date().toISOString(),
    });
  },

  async markConverted(sessionId: string, orderId: string, orderNumber: string, convertedAtIso: string): Promise<void> {
    const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);
    const snap = await docRef.get();
    if (!snap.exists) return;

    await docRef.update({
      status: 'converted',
      convertedOrderId: orderId,
      convertedOrderNumber: orderNumber,
      convertedAt: convertedAtIso,
      'reminderState.claiming': false,
      'reminderState.nextEligibleAt': null,
      updatedAt: convertedAtIso,
    });
  },

  async markConvertedByEmail(email: string, orderId: string, orderNumber: string, convertedAtIso: string): Promise<number> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return 0;
    const db = getAdminFirestore();
    const snap = await db
      .collection(ABANDONED_CHECKOUTS_COLLECTION)
      .where('customer.email', '==', normalized)
      .where('status', 'in', ['active', 'abandoned', 'resumed'])
      .get();

    let count = 0;
    for (const doc of snap.docs) {
      await doc.ref.update({
        status: 'converted',
        convertedOrderId: orderId,
        convertedOrderNumber: orderNumber,
        convertedAt: convertedAtIso,
        'reminderState.claiming': false,
        'reminderState.nextEligibleAt': null,
        updatedAt: convertedAtIso,
      });
      count++;
    }
    return count;
  },
};
