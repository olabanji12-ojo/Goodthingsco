/**
 * In-Memory Abandoned Checkout Test Repository
 */

import type { AbandonedCheckoutRepository } from '../../server/checkout/repository';
import type { AbandonedCheckoutSession } from '../../src/types/abandonedCheckout';
import type { CartItem } from '../../src/types/cart';

export function sampleCartItem(id = 'prod-1', name = 'Luxury Velvet Box', price = 25000): CartItem {
  return {
    id: `cart-item-${id}`,
    productId: id,
    slug: 'luxury-velvet-box',
    name,
    unitPrice: price,
    quantity: 1,
    currentStock: 10,
    addedAt: '2026-10-03T10:00:00.000Z',
    packaging: 'Standard Luxe',
    ribbonColour: 'Gold',
  };
}

export function memoryAbandonedCheckoutRepository(initialSessions: AbandonedCheckoutSession[] = []) {
  const store = new Map<string, AbandonedCheckoutSession>(
    initialSessions.map((s) => [s.sessionId, structuredClone(s)])
  );

  let lockQueue = Promise.resolve();

  const repository: AbandonedCheckoutRepository = {
    async getBySessionId(sessionId: string) {
      const found = store.get(sessionId);
      return found ? structuredClone(found) : null;
    },

    async getByTokenHash(tokenHash: string) {
      for (const session of store.values()) {
        if (session.resumeTokenHash === tokenHash) {
          return structuredClone(session);
        }
      }
      return null;
    },

    async save(session: Omit<AbandonedCheckoutSession, 'id'>) {
      const cloned = structuredClone(session) as AbandonedCheckoutSession;
      cloned.id = session.sessionId;
      store.set(session.sessionId, cloned);
      return structuredClone(cloned);
    },

    async update(sessionId: string, partial: Partial<AbandonedCheckoutSession>) {
      const existing = store.get(sessionId);
      if (existing) {
        store.set(sessionId, { ...existing, ...structuredClone(partial) });
      }
    },

    async findEligibleForReminders({ nowIso, abandonedThresholdIso, maxReminders }) {
      const nowMs = new Date(nowIso).getTime();
      const thresholdMs = new Date(abandonedThresholdIso).getTime();

      const results: AbandonedCheckoutSession[] = [];
      for (const session of store.values()) {
        if (session.status === 'converted' || session.status === 'expired') continue;
        if (!session.customer?.email?.trim()) continue;
        if ((session.reminderState?.sentCount ?? 0) >= maxReminders) continue;

        const lastActivityMs = new Date(session.lastActivityAt || session.updatedAt).getTime();
        const isAbandonedTime = lastActivityMs <= thresholdMs;
        const isAlreadyAbandonedStatus = session.status === 'abandoned';
        if (!isAbandonedTime && !isAlreadyAbandonedStatus) continue;

        if (session.reminderState?.nextEligibleAt) {
          const nextMs = new Date(session.reminderState.nextEligibleAt).getTime();
          if (nextMs > nowMs) continue;
        }

        if (session.reminderState?.claiming) {
          const claimedMs = session.reminderState.claimedAt
            ? new Date(session.reminderState.claimedAt).getTime()
            : 0;
          if (nowMs - claimedMs < 300000) continue; // locked
        }

        results.push(structuredClone(session));
      }

      return results;
    },

    async claimReminder(sessionId: string, expectedSentCount: number, claimedAtIso: string) {
      const prior = lockQueue;
      let release!: () => void;
      lockQueue = new Promise<void>((resolve) => {
        release = resolve;
      });
      await prior;

      try {
        const session = store.get(sessionId);
        if (!session) return false;
        if (session.status === 'converted' || session.status === 'expired') return false;

        const sentCount = session.reminderState?.sentCount ?? 0;
        if (sentCount !== expectedSentCount) return false;

        if (session.reminderState?.claiming) {
          const claimedMs = session.reminderState.claimedAt
            ? new Date(session.reminderState.claimedAt).getTime()
            : 0;
          const nowMs = new Date(claimedAtIso).getTime();
          if (nowMs - claimedMs < 300000) return false;
        }

        session.reminderState = {
          ...session.reminderState,
          sentCount,
          claiming: true,
          claimedAt: claimedAtIso,
        };
        store.set(sessionId, session);
        return true;
      } finally {
        release();
      }
    },

    async recordReminderResult(sessionId: string, update) {
      const session = store.get(sessionId);
      if (session) {
        session.status = 'abandoned';
        session.reminderState = {
          ...session.reminderState,
          sentCount: update.sentCount,
          lastSentAt: update.lastSentAt,
          nextEligibleAt: update.nextEligibleAt,
          lastEventId: update.lastEventId,
          claiming: false,
          claimedAt: undefined,
        };
        store.set(sessionId, session);
      }
    },

    async releaseReminderClaim(sessionId: string) {
      const session = store.get(sessionId);
      if (session && session.reminderState) {
        session.reminderState.claiming = false;
        session.reminderState.claimedAt = undefined;
        store.set(sessionId, session);
      }
    },

    async markConverted(sessionId: string, orderId: string, orderNumber: string, convertedAtIso: string) {
      const session = store.get(sessionId);
      if (session) {
        session.status = 'converted';
        session.convertedOrderId = orderId;
        session.convertedOrderNumber = orderNumber;
        session.convertedAt = convertedAtIso;
        if (session.reminderState) {
          session.reminderState.claiming = false;
        }
        store.set(sessionId, session);
      }
    },

    async markConvertedByEmail(email: string, orderId: string, orderNumber: string, convertedAtIso: string) {
      let count = 0;
      const normalized = email.trim().toLowerCase();
      for (const session of store.values()) {
        if (
          session.customer?.email?.trim().toLowerCase() === normalized &&
          session.status !== 'converted'
        ) {
          session.status = 'converted';
          session.convertedOrderId = orderId;
          session.convertedOrderNumber = orderNumber;
          session.convertedAt = convertedAtIso;
          store.set(session.sessionId, session);
          count++;
        }
      }
      return count;
    },
  };

  return { store, repository };
}
