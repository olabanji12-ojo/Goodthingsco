/**
 * In-Memory Custom Request Repository for Testing
 */

import type { CustomRequestRepository } from '../../server/custom/repository';
import type { CustomRequest, CustomStatusHistoryEntry } from '../../src/types/customRequest';

export function sampleCustomRequest(id = 'cust-1', ref = 'GTC-CUSTOM-20261003-AB12'): CustomRequest {
  const now = new Date('2026-10-03T12:00:00.000Z').toISOString();
  return {
    id,
    referenceNumber: ref,
    customer: {
      fullName: 'Damilola Adeleke',
      email: 'd.adeleke@enterprise.com',
      phone: '+234 803 456 7890',
      companyName: 'Adeleke Capital Holdings',
    },
    requestType: 'custom-gift',
    requestDetails: {
      item: 'VIP Milestone Appreciation Chest',
      quantity: 50,
      budgetRange: '50k-100k',
      purpose: 'Corporate Milestone',
      preferredDeliveryDate: '2026-10-25',
      description: 'Handcrafted luxury chests with gold foil inscription.',
    },
    specifications: {
      material: 'Rigid Matte Bookbinder Board (1200 GSM)',
      colour: 'Obsidian Black & Champagne Gold',
      size: 'Custom Box (32cm × 24cm × 10cm)',
      packaging: 'Custom Velvet Tray with Slide Lid',
      branding: 'Metallic Gold Foil Stamping',
      personalisation: 'Individual Recipient Name Laser Inscription',
      additionalNotes: 'Please ensure metallic foil matches champagne gold pantone 465C.',
    },
    assets: [
      {
        id: 'asset-1',
        type: 'logo',
        url: 'https://res.cloudinary.com/goodthingsco/image/upload/v1/logo.png',
        fileName: 'brand_vector_mark.png',
        mimeType: 'image/png',
        fileSize: 1200000,
        uploadedAt: now,
      },
    ],
    quote: {
      status: 'not-prepared',
    },
    requestStatus: 'submitted',
    statusHistory: [
      {
        changeId: 'init-sub',
        status: 'submitted',
        changedAt: now,
        changedBy: 'customer',
        note: 'Custom bespoke request submitted by client.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function memoryCustomRepository(initial: CustomRequest[] = []) {
  const store = new Map<string, CustomRequest>(initial.map((r) => [r.id || r.referenceNumber, structuredClone(r)]));
  const rateLimits = new Map<string, number>();

  const repository: CustomRequestRepository = {
    async create(request: Omit<CustomRequest, 'id'>) {
      const id = `req_${store.size + 1}`;
      const saved: CustomRequest = { ...structuredClone(request), id };
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
            req.customer.fullName.toLowerCase().includes(s) ||
            req.customer.email.toLowerCase().includes(s) ||
            req.customer.phone.includes(s) ||
            req.customer.companyName?.toLowerCase().includes(s) ||
            req.requestDetails.item.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    },

    async update(id: string, partial: Partial<CustomRequest>) {
      const existing = store.get(id);
      if (existing) {
        store.set(id, { ...existing, ...structuredClone(partial) });
      }
    },

    async updateWithHistory(
      id: string,
      update: Partial<CustomRequest>,
      historyEntry: CustomStatusHistoryEntry
    ) {
      const existing = store.get(id);
      if (!existing) throw new Error('Custom request not found');

      const history = Array.isArray(existing.statusHistory) ? [...existing.statusHistory] : [];
      if (!historyEntry.changeId || !history.some((h) => h.changeId === historyEntry.changeId)) {
        history.push(historyEntry);
      }

      const merged: CustomRequest = {
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
