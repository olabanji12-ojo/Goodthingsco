/**
 * Good Things Co. — Corporate Requests Firestore Repository
 */

import type {
  CorporateRequest,
  CorporateStatusHistoryEntry,
} from '../../src/types/corporate.js';
import { getAdminFirestore } from '../firebase.js';

export const CORPORATE_REQUESTS_COLLECTION = 'corporateRequests';

export interface CorporateRequestRepository {
  create(request: Omit<CorporateRequest, 'id'>): Promise<CorporateRequest>;
  getById(id: string): Promise<CorporateRequest | null>;
  getByReference(referenceNumber: string): Promise<CorporateRequest | null>;
  getByIdempotencyKey(key: string): Promise<CorporateRequest | null>;
  list(filter?: {
    status?: string;
    quoteStatus?: string;
    search?: string;
  }): Promise<CorporateRequest[]>;
  update(id: string, partial: Partial<CorporateRequest>): Promise<void>;
  updateWithHistory(
    id: string,
    update: Partial<CorporateRequest>,
    historyEntry: CorporateStatusHistoryEntry
  ): Promise<CorporateRequest>;
  throttle(key: string, maxPerWindow: number, windowMs: number): Promise<boolean>;
}

// In-memory rate limiting map for server environment
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export const firestoreCorporateRequests: CorporateRequestRepository = {
  async create(request: Omit<CorporateRequest, 'id'>): Promise<CorporateRequest> {
    const docRef = await getAdminFirestore()
      .collection(CORPORATE_REQUESTS_COLLECTION)
      .add(request);
    return { ...request, id: docRef.id };
  },

  async getById(id: string): Promise<CorporateRequest | null> {
    const snap = await getAdminFirestore()
      .collection(CORPORATE_REQUESTS_COLLECTION)
      .doc(id)
      .get();
    if (!snap.exists) return null;
    return { ...snap.data(), id: snap.id } as CorporateRequest;
  },

  async getByReference(referenceNumber: string): Promise<CorporateRequest | null> {
    const snap = await getAdminFirestore()
      .collection(CORPORATE_REQUESTS_COLLECTION)
      .where('referenceNumber', '==', referenceNumber)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { ...doc.data(), id: doc.id } as CorporateRequest;
  },

  async getByIdempotencyKey(key: string): Promise<CorporateRequest | null> {
    const snap = await getAdminFirestore()
      .collection(CORPORATE_REQUESTS_COLLECTION)
      .where('idempotencyKey', '==', key)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { ...doc.data(), id: doc.id } as CorporateRequest;
  },

  async list(filter = {}): Promise<CorporateRequest[]> {
    let queryRef = getAdminFirestore().collection(CORPORATE_REQUESTS_COLLECTION);
    const snap = await queryRef.get();

    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as CorporateRequest));

    // Sort newest first
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return items.filter((req) => {
      if (filter.status && req.requestStatus !== filter.status) return false;
      if (filter.quoteStatus && req.quote?.status !== filter.quoteStatus) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matches =
          req.referenceNumber?.toLowerCase().includes(s) ||
          req.company?.companyName?.toLowerCase().includes(s) ||
          req.company?.contactName?.toLowerCase().includes(s) ||
          req.company?.email?.toLowerCase().includes(s) ||
          req.company?.phone?.includes(s);
        if (!matches) return false;
      }
      return true;
    });
  },

  async update(id: string, partial: Partial<CorporateRequest>): Promise<void> {
    await getAdminFirestore()
      .collection(CORPORATE_REQUESTS_COLLECTION)
      .doc(id)
      .update(partial);
  },

  async updateWithHistory(
    id: string,
    update: Partial<CorporateRequest>,
    historyEntry: CorporateStatusHistoryEntry
  ): Promise<CorporateRequest> {
    const docRef = getAdminFirestore().collection(CORPORATE_REQUESTS_COLLECTION).doc(id);
    return await getAdminFirestore().runTransaction(async (txn) => {
      const snap = await txn.get(docRef);
      if (!snap.exists) {
        throw new Error('Corporate request not found');
      }
      const current = snap.data() as CorporateRequest;
      const history = Array.isArray(current.statusHistory) ? [...current.statusHistory] : [];
      // Idempotency: skip adding history if eventId already recorded
      if (!history.some((h) => h.eventId === historyEntry.eventId)) {
        history.push(historyEntry);
      }

      const merged: CorporateRequest = {
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
