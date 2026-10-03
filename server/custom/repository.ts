/**
 * Good Things Co. — Custom Requests Firestore Repository
 */

import type {
  CustomRequest,
  CustomStatusHistoryEntry,
} from '../../src/types/customRequest';
import { getAdminFirestore } from '../firebase';

export const CUSTOM_REQUESTS_COLLECTION = 'customRequests';

export interface CustomRequestRepository {
  create(request: Omit<CustomRequest, 'id'>): Promise<CustomRequest>;
  getById(id: string): Promise<CustomRequest | null>;
  getByReference(referenceNumber: string): Promise<CustomRequest | null>;
  getByIdempotencyKey(key: string): Promise<CustomRequest | null>;
  list(filter?: {
    status?: string;
    quoteStatus?: string;
    search?: string;
  }): Promise<CustomRequest[]>;
  update(id: string, partial: Partial<CustomRequest>): Promise<void>;
  updateWithHistory(
    id: string,
    update: Partial<CustomRequest>,
    historyEntry: CustomStatusHistoryEntry
  ): Promise<CustomRequest>;
  throttle(key: string, maxPerWindow: number, windowMs: number): Promise<boolean>;
}

// In-memory rate limiting map for server environment
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export const firestoreCustomRequests: CustomRequestRepository = {
  async create(request: Omit<CustomRequest, 'id'>): Promise<CustomRequest> {
    const docRef = await getAdminFirestore()
      .collection(CUSTOM_REQUESTS_COLLECTION)
      .add(request);
    return { ...request, id: docRef.id };
  },

  async getById(id: string): Promise<CustomRequest | null> {
    const snap = await getAdminFirestore()
      .collection(CUSTOM_REQUESTS_COLLECTION)
      .doc(id)
      .get();
    if (!snap.exists) return null;
    return { ...snap.data(), id: snap.id } as CustomRequest;
  },

  async getByReference(referenceNumber: string): Promise<CustomRequest | null> {
    const snap = await getAdminFirestore()
      .collection(CUSTOM_REQUESTS_COLLECTION)
      .where('referenceNumber', '==', referenceNumber)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { ...doc.data(), id: doc.id } as CustomRequest;
  },

  async getByIdempotencyKey(key: string): Promise<CustomRequest | null> {
    const snap = await getAdminFirestore()
      .collection(CUSTOM_REQUESTS_COLLECTION)
      .where('idempotencyKey', '==', key)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { ...doc.data(), id: doc.id } as CustomRequest;
  },

  async list(filter = {}): Promise<CustomRequest[]> {
    const queryRef = getAdminFirestore().collection(CUSTOM_REQUESTS_COLLECTION);
    const snap = await queryRef.get();

    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as CustomRequest));

    // Sort newest first
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return items.filter((req) => {
      if (filter.status && req.requestStatus !== filter.status) return false;
      if (filter.quoteStatus && req.quote?.status !== filter.quoteStatus) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matches =
          req.referenceNumber?.toLowerCase().includes(s) ||
          req.customer?.fullName?.toLowerCase().includes(s) ||
          req.customer?.email?.toLowerCase().includes(s) ||
          req.customer?.phone?.includes(s) ||
          req.customer?.companyName?.toLowerCase().includes(s) ||
          req.requestDetails?.item?.toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    });
  },

  async update(id: string, partial: Partial<CustomRequest>): Promise<void> {
    await getAdminFirestore()
      .collection(CUSTOM_REQUESTS_COLLECTION)
      .doc(id)
      .update(partial);
  },

  async updateWithHistory(
    id: string,
    update: Partial<CustomRequest>,
    historyEntry: CustomStatusHistoryEntry
  ): Promise<CustomRequest> {
    const docRef = getAdminFirestore().collection(CUSTOM_REQUESTS_COLLECTION).doc(id);
    return await getAdminFirestore().runTransaction(async (txn) => {
      const snap = await txn.get(docRef);
      if (!snap.exists) {
        throw new Error('Custom request not found');
      }
      const current = snap.data() as CustomRequest;
      const history = Array.isArray(current.statusHistory) ? [...current.statusHistory] : [];

      // Idempotency: skip adding history if changeId already recorded
      if (!historyEntry.changeId || !history.some((h) => h.changeId === historyEntry.changeId)) {
        history.push(historyEntry);
      }

      const merged: CustomRequest = {
        ...current,
        ...update,
        id,
        statusHistory: history,
        updatedAt: historyEntry.changedAt,
      };

      txn.set(docRef, merged, { merge: true });
      return merged;
    });
  },

  async throttle(key: string, maxPerWindow: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.expiresAt <= now) {
      rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
      return true;
    }

    if (entry.count >= maxPerWindow) {
      return false;
    }

    entry.count++;
    return true;
  },
};
