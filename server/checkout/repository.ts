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

// In-memory fallback cache when Firestore credentials are not configured or temporarily unreachable
const inMemorySessions = new Map<string, AbandonedCheckoutSession>();

export const firestoreAbandonedCheckouts: AbandonedCheckoutRepository = {
  async getBySessionId(sessionId: string): Promise<AbandonedCheckoutSession | null> {
    try {
      const snap = await getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId).get();
      if (!snap.exists) return inMemorySessions.get(sessionId) || null;
      return { ...snap.data(), id: snap.id } as AbandonedCheckoutSession;
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable, using in-memory store for getBySessionId:', err);
      return inMemorySessions.get(sessionId) || null;
    }
  },

  async getByTokenHash(tokenHash: string): Promise<AbandonedCheckoutSession | null> {
    try {
      const querySnap = await getAdminFirestore()
        .collection(ABANDONED_CHECKOUTS_COLLECTION)
        .where('resumeTokenHash', '==', tokenHash)
        .limit(1)
        .get();
      if (querySnap.empty) {
        for (const s of inMemorySessions.values()) {
          if (s.resumeTokenHash === tokenHash) return s;
        }
        return null;
      }
      const docSnap = querySnap.docs[0];
      return { ...docSnap.data(), id: docSnap.id } as AbandonedCheckoutSession;
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable, searching in-memory store for token hash:', err);
      for (const s of inMemorySessions.values()) {
        if (s.resumeTokenHash === tokenHash) return s;
      }
      return null;
    }
  },

  async save(session: Omit<AbandonedCheckoutSession, 'id'>): Promise<AbandonedCheckoutSession> {
    const fullSession = { ...session, id: session.sessionId } as AbandonedCheckoutSession;
    inMemorySessions.set(session.sessionId, fullSession);
    try {
      const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(session.sessionId);
      await docRef.set(session, { merge: true });
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable, persisted in-memory fallback:', err);
    }
    return fullSession;
  },

  async update(sessionId: string, partial: Partial<AbandonedCheckoutSession>): Promise<void> {
    const existing = inMemorySessions.get(sessionId);
    if (existing) {
      inMemorySessions.set(sessionId, { ...existing, ...partial, updatedAt: new Date().toISOString() });
    }
    try {
      const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);
      await docRef.update({
        ...partial,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable for update, updated in-memory fallback:', err);
    }
  },

  async findEligibleForReminders({ nowIso, abandonedThresholdIso, maxReminders }): Promise<AbandonedCheckoutSession[]> {
    let docs: Array<{ id: string; data(): any }> = [];
    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection(ABANDONED_CHECKOUTS_COLLECTION)
        .where('status', 'in', ['active', 'abandoned', 'resumed'])
        .get();
      docs = snapshot.docs.map(d => ({ id: d.id, data: () => d.data() }));
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable for reminder evaluation, checking in-memory store:', err);
      docs = Array.from(inMemorySessions.values())
        .filter(s => ['active', 'abandoned', 'resumed'].includes(s.status))
        .map(s => ({ id: s.sessionId, data: () => s }));
    }

    const results: AbandonedCheckoutSession[] = [];
    for (const doc of docs) {
      const data = { ...doc.data(), id: doc.id } as AbandonedCheckoutSession;
      const email = data.customer?.email?.trim();
      if (!email || !email.includes('@')) continue;

      const sentCount = data.reminderState?.sentCount || 0;
      if (sentCount >= maxReminders) continue;

      if (data.expiresAt && data.expiresAt <= nowIso) continue;

      if (data.status !== 'abandoned' && data.lastActivityAt > abandonedThresholdIso) continue;

      if (data.reminderState?.nextEligibleAt && data.reminderState.nextEligibleAt > nowIso) continue;

      if (data.reminderState?.claiming && data.reminderState.claimedAt) {
        const claimAge = Date.now() - new Date(data.reminderState.claimedAt).getTime();
        if (claimAge < 5 * 60 * 1000) continue;
      }

      results.push(data);
    }

    return results;
  },

  async claimReminder(sessionId: string, expectedSentCount: number, claimedAtIso: string): Promise<boolean> {
    try {
      const db = getAdminFirestore();
      const docRef = db.collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);

      return await db.runTransaction(async txn => {
        const snap = await txn.get(docRef);
        if (!snap.exists) return false;
        const data = snap.data() as AbandonedCheckoutSession;

        if (data.status === 'converted' || data.status === 'expired') return false;
        if ((data.reminderState?.sentCount || 0) !== expectedSentCount) return false;

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
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore claimReminder fallback to in-memory:', err);
      const existing = inMemorySessions.get(sessionId);
      if (!existing) return false;
      if (existing.status === 'converted' || existing.status === 'expired') return false;
      if ((existing.reminderState?.sentCount || 0) !== expectedSentCount) return false;

      existing.status = 'abandoned';
      existing.reminderState = {
        ...existing.reminderState,
        sentCount: existing.reminderState?.sentCount || 0,
        claiming: true,
        claimedAt: claimedAtIso,
      };
      existing.updatedAt = claimedAtIso;
      return true;
    }
  },

  async recordReminderResult(sessionId: string, update): Promise<void> {
    const existing = inMemorySessions.get(sessionId);
    if (existing) {
      existing.reminderState = {
        ...existing.reminderState,
        sentCount: update.sentCount,
        lastSentAt: update.lastSentAt,
        nextEligibleAt: update.nextEligibleAt,
        lastEventId: update.lastEventId,
        claiming: false,
        claimedAt: undefined,
      };
      existing.updatedAt = update.lastSentAt;
    }
    try {
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
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable for recordReminderResult:', err);
    }
  },

  async releaseReminderClaim(sessionId: string): Promise<void> {
    const existing = inMemorySessions.get(sessionId);
    if (existing && existing.reminderState) {
      existing.reminderState.claiming = false;
      existing.reminderState.claimedAt = undefined;
      existing.updatedAt = new Date().toISOString();
    }
    try {
      const docRef = getAdminFirestore().collection(ABANDONED_CHECKOUTS_COLLECTION).doc(sessionId);
      await docRef.update({
        'reminderState.claiming': false,
        'reminderState.claimedAt': null,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable for releaseReminderClaim:', err);
    }
  },

  async markConverted(sessionId: string, orderId: string, orderNumber: string, convertedAtIso: string): Promise<void> {
    const existing = inMemorySessions.get(sessionId);
    if (existing) {
      existing.status = 'converted';
      existing.convertedOrderId = orderId;
      existing.convertedOrderNumber = orderNumber;
      existing.convertedAt = convertedAtIso;
      if (existing.reminderState) {
        existing.reminderState.claiming = false;
        existing.reminderState.nextEligibleAt = undefined;
      }
      existing.updatedAt = convertedAtIso;
    }
    try {
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
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable for markConverted:', err);
    }
  },

  async markConvertedByEmail(email: string, orderId: string, orderNumber: string, convertedAtIso: string): Promise<number> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return 0;
    let count = 0;
    for (const s of inMemorySessions.values()) {
      if (s.customer?.email?.toLowerCase() === normalized && ['active', 'abandoned', 'resumed'].includes(s.status)) {
        s.status = 'converted';
        s.convertedOrderId = orderId;
        s.convertedOrderNumber = orderNumber;
        s.convertedAt = convertedAtIso;
        if (s.reminderState) {
          s.reminderState.claiming = false;
          s.reminderState.nextEligibleAt = undefined;
        }
        s.updatedAt = convertedAtIso;
        count++;
      }
    }
    try {
      const db = getAdminFirestore();
      const snap = await db
        .collection(ABANDONED_CHECKOUTS_COLLECTION)
        .where('customer.email', '==', normalized)
        .where('status', 'in', ['active', 'abandoned', 'resumed'])
        .get();

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
    } catch (err) {
      console.warn('[AbandonedCheckoutRepo] Firestore unavailable for markConvertedByEmail:', err);
    }
    return count;
  },
};
