/**
 * In-Memory Corporate Request Repository for Testing
 */

import type { CorporateRequestRepository } from '../../server/corporate/repository';
import type { CorporateRequest, CorporateStatusHistoryEntry } from '../../src/types/corporate';

export function sampleCorporateRequest(id = 'req-1', ref = 'GTC-CORP-20261003-AB12'): CorporateRequest {
  const now = new Date('2026-10-03T12:00:00.000Z').toISOString();
  return {
    id,
    referenceNumber: ref,
    company: {
      companyName: 'Apex Financial Services',
      contactName: 'Nkem Chukwu',
      email: 'nkem@apexfinancial.ng',
      phone: '+234 802 333 4444',
    },
    giftingPurpose: 'client',
    giftType: 'choose-gift',
    budgetRange: '50000-100000',
    quantity: 50,
    selectedProducts: [
      {
        productId: 'prod-luxury',
        name: 'The Executive Leather Journal & Pen',
        unitPriceSnapshot: 45000,
        quantity: 50,
      },
    ],
    customisation: {
      packaging: 'Atelier Wood Keepsake',
      ribbonColour: 'Burgundy Silk',
      companyMessage: 'With appreciation for your enduring partnership.',
      brandingRequired: true,
      logoAsset: {
        url: 'https://res.cloudinary.com/goodthingsco/image/upload/v1/logo.png',
        originalFilename: 'apex_logo.png',
      },
    },
    recipients: [
      {
        id: 'rec-1',
        name: 'Managing Director, First Bank',
        address: 'Marina, Lagos',
        phone: '+234 803 111 2222',
      },
    ],
    delivery: {
      preferredDeliveryDate: '2026-10-25',
      deliveryMethod: 'single-hub',
    },
    quote: {
      status: 'not-prepared',
    },
    requestStatus: 'submitted',
    statusHistory: [
      {
        eventId: 'sub-init',
        status: 'submitted',
        changedAt: now,
        changedBy: 'customer',
        note: 'Online inquiry submission',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function memoryCorporateRepository(initial: CorporateRequest[] = []) {
  const store = new Map<string, CorporateRequest>(initial.map((r) => [r.id || r.referenceNumber, structuredClone(r)]));
  const rateLimits = new Map<string, number>();

  const repository: CorporateRequestRepository = {
    async create(request: Omit<CorporateRequest, 'id'>) {
      const id = `req_${store.size + 1}`;
      const saved: CorporateRequest = { ...structuredClone(request), id };
      store.set(id, saved);
      return structuredClone(saved);
    },

    async getById(id: string) {
      const found = store.get(id);
      return found ? structuredClone(found) : null;
    },

    async getByReference(referenceNumber: string) {
      for (const item of store.values()) {
        if (item.referenceNumber === referenceNumber) {
          return structuredClone(item);
        }
      }
      return null;
    },

    async getByIdempotencyKey(key: string) {
      for (const item of store.values()) {
        if (item.idempotencyKey === key) {
          return structuredClone(item);
        }
      }
      return null;
    },

    async list(filter = {}) {
      const items = [...store.values()];
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return items.filter((req) => {
        if (filter.status && req.requestStatus !== filter.status) return false;
        if (filter.quoteStatus && req.quote?.status !== filter.quoteStatus) return false;
        if (filter.search) {
          const s = filter.search.toLowerCase();
          const match =
            req.referenceNumber.toLowerCase().includes(s) ||
            req.company.companyName.toLowerCase().includes(s) ||
            req.company.contactName.toLowerCase().includes(s) ||
            req.company.email.toLowerCase().includes(s) ||
            req.company.phone.includes(s);
          if (!match) return false;
        }
        return true;
      });
    },

    async update(id: string, partial: Partial<CorporateRequest>) {
      const existing = store.get(id);
      if (existing) {
        store.set(id, { ...existing, ...structuredClone(partial) });
      }
    },

    async updateWithHistory(
      id: string,
      update: Partial<CorporateRequest>,
      historyEntry: CorporateStatusHistoryEntry
    ) {
      const existing = store.get(id);
      if (!existing) throw new Error('Corporate request not found');

      const history = Array.isArray(existing.statusHistory) ? [...existing.statusHistory] : [];
      if (!history.some((h) => h.eventId === historyEntry.eventId)) {
        history.push(historyEntry);
      }

      const merged: CorporateRequest = {
        ...existing,
        ...structuredClone(update),
        id,
        statusHistory: history,
        updatedAt: historyEntry.changedAt,
      };

      store.set(id, merged);
      return structuredClone(merged);
    },

    async throttle(key: string, maxPerWindow: number) {
      const current = rateLimits.get(key) || 0;
      if (current >= maxPerWindow) return false;
      rateLimits.set(key, current + 1);
      return true;
    },
  };

  return { store, repository };
}
