/**
 * Good Things Co. — Corporate Requests Orchestration Service
 */

import { getAdminAuth } from '../firebase.js';
import { notificationService } from '../services/notificationService.js';
import { settingsService } from '../settings/service.js';
import {
  firestoreCorporateRequests,
  type CorporateRequestRepository,
} from './repository.js';
import {
  CorporateHttpError,
  generateCorporateReferenceNumber,
  validateCorporateSubmission,
  calculateQuoteTotal,
  canTransitionStatus,
  sanitizeText,
} from './domain.js';
import type {
  CorporateRequest,
  CorporateRequestSubmissionInput,
  CorporateQuoteUpdateInput,
  CorporateStatusUpdateInput,
} from '../../src/types/corporate.js';

type AdminIdentity = { uid: string; admin?: unknown; email?: string };

interface ServiceDependencies {
  repository?: CorporateRequestRepository;
  verify?: (token: string) => Promise<AdminIdentity>;
  notify?: typeof notificationService;
  settings?: typeof settingsService;
  now?: () => string;
}

export function createCorporateManagement(dependencies: ServiceDependencies = {}) {
  const repo = dependencies.repository || firestoreCorporateRequests;
  const verify = dependencies.verify || ((token) => getAdminAuth().verifyIdToken(token, true));
  const notify = dependencies.notify || notificationService;
  const settings = dependencies.settings || settingsService;
  const getNow = dependencies.now || (() => new Date().toISOString());

  async function requireAdmin(authorization?: string): Promise<AdminIdentity> {
    if (!authorization || !/^Bearer \S{1,8192}$/.test(authorization)) {
      throw new CorporateHttpError(401, 'Administrator authentication required.');
    }
    let identity: AdminIdentity;
    try {
      identity = await verify(authorization.slice(7));
    } catch {
      throw new CorporateHttpError(401, 'Admin session is invalid or expired. Please sign in again.');
    }
    const isAllowed = identity.admin === true ||
      (typeof identity.email === 'string' && ['olabanji@gmail.com', 'ojo@gmail.com', 'emmanuelojo291@gmail.com'].includes(identity.email.toLowerCase()));
    if (!isAllowed) {
      throw new CorporateHttpError(403, 'Administrator privileges required.');
    }
    return identity;
  }

  return {
    /**
     * 1. Public Submission of Corporate Gifting Request
     * Handles validation, sanitization, reference generation, idempotency & notifications.
     */
    async submitRequest(
      input: CorporateRequestSubmissionInput,
      clientIp = 'unknown'
    ): Promise<{ success: boolean; referenceNumber: string; request: CorporateRequest }> {
      // Abuse protection: limit requests per IP
      const allowed = await repo.throttle(`corp_submit:${clientIp}`, 15, 10 * 60 * 1000);
      if (!allowed) {
        throw new CorporateHttpError(
          429,
          'Too many requests submitted. Please wait a few moments before trying again.'
        );
      }

      // Idempotency: Return existing if client retried with same idempotencyKey
      if (input.idempotencyKey) {
        const existing = await repo.getByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          return {
            success: true,
            referenceNumber: existing.referenceNumber,
            request: existing,
          };
        }
      }

      // Authoritative validation and sanitization
      const validated = validateCorporateSubmission(input);
      const referenceNumber = generateCorporateReferenceNumber();
      const now = getNow();

      const newRequest: Omit<CorporateRequest, 'id'> = {
        referenceNumber,
        company: validated.company,
        giftingPurpose: validated.giftingPurpose,
        industry: validated.industry,
        otherIndustry: validated.otherIndustry,
        giftType: validated.giftType,
        budgetRange: validated.budgetRange,
        selectedProducts: validated.selectedProducts,
        quantity: validated.quantity,
        customisation: validated.customisation,
        recipients: validated.recipients,
        recipientListFile: validated.recipientListFile,
        delivery: validated.delivery,
        quote: {
          status: 'not-prepared',
        },
        requestStatus: 'submitted',
        statusHistory: [
          {
            eventId: `sub-${Date.now()}`,
            status: 'submitted',
            changedAt: now,
            changedBy: 'customer',
            note: 'Corporate gifting inquiry received online',
          },
        ],
        idempotencyKey: validated.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };

      const saved = await repo.create(newRequest);

      // Trigger asynchronous acknowledgment and admin notifications (isolated: does not throw on mail issue)
      try {
        await notify.corporateRequestCreated(saved);
      } catch (err) {
        console.warn('[CorporateService] Non-critical notification failure on submit:', err);
      }

      return {
        success: true,
        referenceNumber: saved.referenceNumber,
        request: saved,
      };
    },

    /**
     * 2. Admin: List Corporate Inquiries
     */
    async listRequests(authorization: string | undefined, query: { get(name: string): string | null }) {
      await requireAdmin(authorization);

      const status = query.get('status') || undefined;
      const quoteStatus = query.get('quoteStatus') || undefined;
      const search = (query.get('search') || '').trim().slice(0, 100);
      const page = Math.max(1, Number(query.get('page')) || 1);
      const pageSize = 25;

      const items = await repo.list({ status, quoteStatus, search });
      const paginated = items.slice((page - 1) * pageSize, page * pageSize);

      return {
        requests: paginated,
        total: items.length,
        page,
        pageSize,
      };
    },

    /**
     * 3. Admin: Get Details of a Request
     */
    async getRequestDetails(authorization: string | undefined, id: string): Promise<CorporateRequest> {
      await requireAdmin(authorization);
      const request = await repo.getById(id);
      if (!request) {
        throw new CorporateHttpError(404, 'Corporate gifting inquiry not found.');
      }
      return request;
    },

    /**
     * 4. Admin: Update Request Status Workflow
     */
    async updateStatus(
      authorization: string | undefined,
      id: string,
      input: CorporateStatusUpdateInput
    ): Promise<CorporateRequest> {
      const admin = await requireAdmin(authorization);
      const current = await repo.getById(id);
      if (!current) {
        throw new CorporateHttpError(404, 'Corporate gifting inquiry not found.');
      }

      if (!input.status) {
        throw new CorporateHttpError(400, 'Target status is required.');
      }

      if (!canTransitionStatus(current.requestStatus, input.status)) {
        throw new CorporateHttpError(
          400,
          `Cannot transition corporate request from "${current.requestStatus}" to "${input.status}".`
        );
      }

      const now = getNow();
      const changedBy = admin.email || admin.uid || 'admin';
      const eventId = `st-${Date.now()}`;

      const historyEntry = {
        eventId,
        status: input.status,
        changedAt: now,
        changedBy,
        note: sanitizeText(input.note, 500) || undefined,
      };

      const updated = await repo.updateWithHistory(
        id,
        { requestStatus: input.status },
        historyEntry
      );

      return updated;
    },

    /**
     * 5. Admin: Save Quote Draft (No email sent)
     */
    async saveQuoteDraft(
      authorization: string | undefined,
      id: string,
      quoteInput: CorporateQuoteUpdateInput
    ): Promise<CorporateRequest> {
      await requireAdmin(authorization);
      const current = await repo.getById(id);
      if (!current) {
        throw new CorporateHttpError(404, 'Corporate gifting inquiry not found.');
      }

      const totals = calculateQuoteTotal(quoteInput);
      const now = getNow();

      let validUntil: string | undefined =
        typeof quoteInput.validUntil === 'string' && quoteInput.validUntil.trim()
          ? sanitizeText(quoteInput.validUntil, 30)
          : current.quote?.validUntil;

      if (!validUntil) {
        const defaults = await settings.getEffectiveQuoteDefaults();
        const days = defaults.corporateDefaultValidityDays || 7;
        validUntil = new Date(Date.now() + days * 86400 * 1000).toISOString().split('T')[0];
      }

      const quoteData = {
        ...current.quote,
        status: 'draft' as const,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        brandingFee: totals.brandingFee,
        discount: totals.discount,
        total: totals.total,
        notes: sanitizeText(quoteInput.notes, 1000) || undefined,
        validUntil,
        preparedAt: now,
      };

      await repo.update(id, { quote: quoteData, updatedAt: now });
      return { ...current, quote: quoteData, updatedAt: now };
    },

    /**
     * 6. Admin: Send Official Quote (Triggers customer quote email)
     */
    async sendQuote(
      authorization: string | undefined,
      id: string,
      quoteInput: CorporateQuoteUpdateInput
    ): Promise<CorporateRequest> {
      const admin = await requireAdmin(authorization);
      const current = await repo.getById(id);
      if (!current) {
        throw new CorporateHttpError(404, 'Corporate gifting inquiry not found.');
      }

      const totals = calculateQuoteTotal(quoteInput);
      const now = getNow();
      const changedBy = admin.email || admin.uid || 'admin';
      const eventId = `quote-${Date.now()}`;

      let validUntil: string | undefined =
        typeof quoteInput.validUntil === 'string' && quoteInput.validUntil.trim()
          ? sanitizeText(quoteInput.validUntil, 30)
          : current.quote?.validUntil;

      if (!validUntil) {
        const defaults = await settings.getEffectiveQuoteDefaults();
        const days = defaults.corporateDefaultValidityDays || 7;
        validUntil = new Date(Date.now() + days * 86400 * 1000).toISOString().split('T')[0];
      }

      const quoteData = {
        ...current.quote,
        status: 'sent' as const,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        brandingFee: totals.brandingFee,
        discount: totals.discount,
        total: totals.total,
        notes: sanitizeText(quoteInput.notes, 1000) || undefined,
        validUntil,
        sentAt: now,
      };

      const historyEntry = {
        eventId,
        status: 'quote-sent' as const,
        changedAt: now,
        changedBy,
        note: `Official quote dispatched for ₦${totals.total.toLocaleString('en-NG')}`,
      };

      const updated = await repo.updateWithHistory(
        id,
        {
          quote: quoteData,
          requestStatus: 'quote-sent',
        },
        historyEntry
      );

      // Trigger customer quote email (isolated: does not fail transaction)
      try {
        await notify.corporateQuoteSent(updated, eventId);
      } catch (err) {
        console.warn('[CorporateService] Non-critical notification failure on quote send:', err);
      }

      return updated;
    },

    /**
     * 7. Admin: Mark Quote Accepted
     */
    async acceptQuote(
      authorization: string | undefined,
      id: string,
      note?: string
    ): Promise<CorporateRequest> {
      const admin = await requireAdmin(authorization);
      const current = await repo.getById(id);
      if (!current) {
        throw new CorporateHttpError(404, 'Corporate gifting inquiry not found.');
      }

      const now = getNow();
      const changedBy = admin.email || admin.uid || 'admin';
      const eventId = `acc-${Date.now()}`;

      const quoteData = {
        ...current.quote,
        status: 'accepted' as const,
        acceptedAt: now,
      };

      const historyEntry = {
        eventId,
        status: 'accepted' as const,
        changedAt: now,
        changedBy,
        note: sanitizeText(note, 500) || 'Quote approved and order confirmed for production',
      };

      return await repo.updateWithHistory(
        id,
        {
          quote: quoteData,
          requestStatus: 'accepted',
        },
        historyEntry
      );
    },

    /**
     * 8. Admin: Mark Quote Declined
     */
    async declineQuote(
      authorization: string | undefined,
      id: string,
      reason?: string
    ): Promise<CorporateRequest> {
      const admin = await requireAdmin(authorization);
      const current = await repo.getById(id);
      if (!current) {
        throw new CorporateHttpError(404, 'Corporate gifting inquiry not found.');
      }

      const now = getNow();
      const changedBy = admin.email || admin.uid || 'admin';
      const eventId = `dec-${Date.now()}`;

      const quoteData = {
        ...current.quote,
        status: 'declined' as const,
        declinedAt: now,
        declineReason: sanitizeText(reason, 500) || undefined,
      };

      const historyEntry = {
        eventId,
        status: 'declined' as const,
        changedAt: now,
        changedBy,
        note: reason ? `Quote declined: ${reason}` : 'Quote declined by client',
      };

      return await repo.updateWithHistory(
        id,
        {
          quote: quoteData,
          requestStatus: 'declined',
        },
        historyEntry
      );
    },
  };
}

export const corporateManagement = createCorporateManagement();
