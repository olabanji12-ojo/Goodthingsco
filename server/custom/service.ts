import { getAdminAuth } from '../firebase.js';
import { notificationService } from '../services/notificationService.js';
import { settingsService } from '../settings/service.js';
import {
  firestoreCustomRequests,
  type CustomRequestRepository,
} from './repository.js';
import {
  CustomHttpError,
  generateCustomReferenceNumber,
  validateCustomSubmission,
  calculateCustomQuoteTotal,
  canTransitionCustomStatus,
  sanitizeText,
  PRODUCTION_STAGES,
} from './domain.js';
import type {
  CustomRequest,
  CustomRequestSubmissionInput,
  CustomQuoteUpdateInput,
  CustomStatusUpdateInput,
  CustomRequestStatus,
} from '../../src/types/customRequest.js';

type AdminIdentity = { uid: string; admin?: unknown; email?: string };

interface ServiceDependencies {
  repository?: CustomRequestRepository;
  verify?: (token: string) => Promise<AdminIdentity>;
  notify?: typeof notificationService;
  settings?: typeof settingsService;
  now?: () => string;
}

export function createCustomManagement(dependencies: ServiceDependencies = {}) {
  const repo = dependencies.repository || firestoreCustomRequests;
  const verify = dependencies.verify || ((token) => getAdminAuth().verifyIdToken(token, true));
  const notify = dependencies.notify || notificationService;
  const settings = dependencies.settings || settingsService;
  const now = dependencies.now || (() => new Date().toISOString());

  async function requireAdmin(authorization?: string): Promise<AdminIdentity> {
    if (!authorization || !/^Bearer \S{1,8192}$/.test(authorization)) {
      throw new CustomHttpError(401, 'Administrator authentication required.');
    }
    const token = authorization.slice(7);
    let identity: AdminIdentity;
    try {
      identity = await verify(token);
    } catch {
      throw new CustomHttpError(401, 'Invalid, revoked, or expired admin token.');
    }

    const isAllowed = identity.admin === true ||
      (typeof identity.email === 'string' && ['olabanji@gmail.com', 'ojo@gmail.com', 'emmanuelojo291@gmail.com', 'tofunmieolabanji@gmail.com'].includes(identity.email.toLowerCase()));
    if (!isAllowed) {
      throw new CustomHttpError(403, 'Administrator privilege required.');
    }
    return identity;
  }

  function validateId(id: string): string {
    const clean = id?.trim();
    if (!clean || !/^[a-zA-Z0-9_-]{1,128}$/.test(clean)) {
      throw new CustomHttpError(400, 'Invalid request identifier.');
    }
    return clean;
  }

  return {
    /**
     * 1. Public: Submit a Custom / Create Request
     */
    async submitRequest(
      rawInput: unknown,
      clientIp?: string,
      idempotencyHeader?: string
    ): Promise<{ success: true; referenceNumber: string; request: CustomRequest }> {
      // Abuse protection / rate limiting
      const throttleKey = `submit:${clientIp || 'global'}`;
      const allowed = await repo.throttle(throttleKey, 12, 60_000); // 12 submits/min per IP
      if (!allowed) {
        throw new CustomHttpError(429, 'Too many requests submitted. Please wait a moment before trying again.');
      }

      // Check client-provided idempotency key
      const bodyKey = (rawInput as any)?.idempotencyKey;
      const idempotencyKey = idempotencyHeader || bodyKey;

      if (idempotencyKey && typeof idempotencyKey === 'string') {
        const existing = await repo.getByIdempotencyKey(idempotencyKey.trim().slice(0, 128));
        if (existing) {
          return {
            success: true,
            referenceNumber: existing.referenceNumber,
            request: existing,
          };
        }
      }

      // Validate & sanitize input
      const validated: CustomRequestSubmissionInput = validateCustomSubmission(rawInput);

      const timestamp = now();
      const referenceNumber = generateCustomReferenceNumber();

      const newRequest: Omit<CustomRequest, 'id'> = {
        referenceNumber,
        customer: validated.customer,
        requestType: validated.requestType,
        requestDetails: validated.requestDetails,
        specifications: validated.specifications,
        assets: validated.assets,
        quote: {
          status: 'not-prepared',
        },
        requestStatus: 'submitted',
        statusHistory: [
          {
            status: 'submitted',
            changedAt: timestamp,
            changedBy: 'customer',
            note: 'Custom bespoke request submitted by client.',
            changeId: `init-${referenceNumber}`,
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
        idempotencyKey: idempotencyKey ? idempotencyKey.trim().slice(0, 128) : undefined,
      };

      const saved = await repo.create(newRequest);

      // Trigger asynchronous acknowledgment and admin notifications (isolated: does not throw on mail issue)
      try {
        await notify.customRequestCreated(saved);
      } catch (err) {
        console.warn('[CustomService] Non-critical notification failure on submit:', err);
      }

      return {
        success: true,
        referenceNumber: saved.referenceNumber,
        request: saved,
      };
    },

    /**
     * 2. Admin: List Custom Inquiries
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
     * 3. Admin: Get Details of a Single Custom Request
     */
    async getRequestDetails(authorization: string | undefined, id: string): Promise<CustomRequest> {
      await requireAdmin(authorization);
      const cleanId = validateId(id);

      let req = await repo.getById(cleanId);
      if (!req) {
        req = await repo.getByReference(cleanId);
      }
      if (!req) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }
      return req;
    },

    /**
     * 4. Admin: Update Request Lifecycle Status
     */
    async updateStatus(
      authorization: string | undefined,
      id: string,
      input: CustomStatusUpdateInput
    ): Promise<CustomRequest> {
      const admin = await requireAdmin(authorization);
      const cleanId = validateId(id);

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      const targetStatus = input.status;
      if (!targetStatus) {
        throw new CustomHttpError(400, 'Target status is required.');
      }

      if (!canTransitionCustomStatus(current.requestStatus, targetStatus)) {
        throw new CustomHttpError(
          400,
          `Cannot transition custom request from "${current.requestStatus}" to "${targetStatus}".`
        );
      }

      const timestamp = now();
      const changeId = input.changeId || `stat-${cleanId}-${targetStatus}-${Date.now()}`;

      const historyEntry = {
        status: targetStatus,
        changedAt: timestamp,
        changedBy: admin.email || admin.uid,
        note: sanitizeText(input.note, 500) || `Status changed from ${current.requestStatus} to ${targetStatus}`,
        changeId,
      };

      return await repo.updateWithHistory(cleanId, { requestStatus: targetStatus }, historyEntry);
    },

    /**
     * 5. Admin: Save Quote Draft
     */
    async saveQuoteDraft(
      authorization: string | undefined,
      id: string,
      input: CustomQuoteUpdateInput
    ): Promise<CustomRequest> {
      const admin = await requireAdmin(authorization);
      const cleanId = validateId(id);

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      const total = calculateCustomQuoteTotal(input);
      const timestamp = now();

      let validUntil: string | undefined =
        typeof input.validUntil === 'string' && input.validUntil.trim()
          ? sanitizeText(input.validUntil, 64)
          : current.quote?.validUntil;

      if (!validUntil) {
        const defaults = await settings.getEffectiveQuoteDefaults();
        const days = defaults.customDefaultValidityDays || 7;
        validUntil = new Date(new Date(timestamp).getTime() + days * 86400 * 1000).toISOString().split('T')[0];
      }

      const updatedQuote = {
        ...current.quote,
        status: current.quote.status === 'not-prepared' ? ('draft' as const) : current.quote.status,
        subtotal: input.subtotal !== undefined ? Math.max(0, input.subtotal) : current.quote.subtotal,
        designFee: input.designFee !== undefined ? Math.max(0, input.designFee) : current.quote.designFee,
        productionFee: input.productionFee !== undefined ? Math.max(0, input.productionFee) : current.quote.productionFee,
        packagingFee: input.packagingFee !== undefined ? Math.max(0, input.packagingFee) : current.quote.packagingFee,
        deliveryFee: input.deliveryFee !== undefined ? Math.max(0, input.deliveryFee) : current.quote.deliveryFee,
        discount: input.discount !== undefined ? Math.max(0, input.discount) : current.quote.discount,
        total,
        notes: sanitizeText(input.notes, 1000) || current.quote.notes,
        validUntil,
        preparedAt: current.quote.preparedAt || timestamp,
      };

      const newRequestStatus: CustomRequestStatus =
        current.requestStatus === 'submitted' || current.requestStatus === 'under-review'
          ? 'quote-prepared'
          : current.requestStatus;

      const historyEntry = {
        status: newRequestStatus,
        changedAt: timestamp,
        changedBy: admin.email || admin.uid,
        note: `Quote draft updated (Total: ₦${total.toLocaleString()}).`,
        changeId: `quote-draft-${cleanId}-${timestamp}`,
      };

      return await repo.updateWithHistory(
        cleanId,
        {
          quote: updatedQuote,
          requestStatus: newRequestStatus,
        },
        historyEntry
      );
    },

    /**
     * 6. Admin: Send Official Quote to Customer
     */
    async sendQuote(
      authorization: string | undefined,
      id: string,
      input: CustomQuoteUpdateInput
    ): Promise<CustomRequest> {
      const admin = await requireAdmin(authorization);
      const cleanId = validateId(id);

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      const total = calculateCustomQuoteTotal(input);
      if (total <= 0 && (!input.subtotal || input.subtotal <= 0)) {
        throw new CustomHttpError(400, 'Quote must have a positive subtotal and calculated total.');
      }

      const timestamp = now();

      let validUntil: string | undefined =
        typeof input.validUntil === 'string' && input.validUntil.trim()
          ? sanitizeText(input.validUntil, 64)
          : current.quote?.validUntil;

      if (!validUntil) {
        const defaults = await settings.getEffectiveQuoteDefaults();
        const days = defaults.customDefaultValidityDays || 7;
        validUntil = new Date(new Date(timestamp).getTime() + days * 86400 * 1000).toISOString().split('T')[0];
      }

      const updatedQuote = {
        ...current.quote,
        status: 'sent' as const,
        subtotal: input.subtotal !== undefined ? Math.max(0, input.subtotal) : current.quote.subtotal,
        designFee: input.designFee !== undefined ? Math.max(0, input.designFee) : current.quote.designFee,
        productionFee: input.productionFee !== undefined ? Math.max(0, input.productionFee) : current.quote.productionFee,
        packagingFee: input.packagingFee !== undefined ? Math.max(0, input.packagingFee) : current.quote.packagingFee,
        deliveryFee: input.deliveryFee !== undefined ? Math.max(0, input.deliveryFee) : current.quote.deliveryFee,
        discount: input.discount !== undefined ? Math.max(0, input.discount) : current.quote.discount,
        total,
        notes: sanitizeText(input.notes, 1000) || current.quote.notes,
        validUntil,
        preparedAt: current.quote.preparedAt || timestamp,
        sentAt: timestamp,
      };

      const historyEntry = {
        status: 'quote-sent' as const,
        changedAt: timestamp,
        changedBy: admin.email || admin.uid,
        note: `Official quote dispatched to ${current.customer.email} (Total: ₦${total.toLocaleString()}).`,
        changeId: `quote-sent-${cleanId}-${timestamp}`,
      };

      const updated = await repo.updateWithHistory(
        cleanId,
        {
          quote: updatedQuote,
          requestStatus: 'quote-sent',
        },
        historyEntry
      );

      // Trigger official customer quote email with idempotent eventId
      try {
        await notify.customQuoteSent(updated, `quote-${updated.referenceNumber}`);
      } catch (err) {
        console.warn('[CustomService] Non-critical notification failure on sendQuote:', err);
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
    ): Promise<CustomRequest> {
      const admin = await requireAdmin(authorization);
      const cleanId = validateId(id);

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      const timestamp = now();
      const updatedQuote = {
        ...current.quote,
        status: 'accepted' as const,
        acceptedAt: timestamp,
      };

      const historyEntry = {
        status: 'accepted' as const,
        changedAt: timestamp,
        changedBy: admin.email || admin.uid,
        note: sanitizeText(note, 500) || 'Custom quotation accepted and authorized.',
        changeId: `quote-accepted-${cleanId}-${timestamp}`,
      };

      return await repo.updateWithHistory(
        cleanId,
        {
          quote: updatedQuote,
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
      reason?: string,
      note?: string
    ): Promise<CustomRequest> {
      const admin = await requireAdmin(authorization);
      const cleanId = validateId(id);

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      const timestamp = now();
      const declineReason = sanitizeText(reason, 500) || undefined;
      const updatedQuote = {
        ...current.quote,
        status: 'declined' as const,
        declinedAt: timestamp,
        declineReason,
      };

      const historyEntry = {
        status: 'declined' as const,
        changedAt: timestamp,
        changedBy: admin.email || admin.uid,
        note: sanitizeText(note, 500) || (declineReason ? `Declined: ${declineReason}` : 'Custom request declined.'),
        changeId: `quote-declined-${cleanId}-${timestamp}`,
      };

      return await repo.updateWithHistory(
        cleanId,
        {
          quote: updatedQuote,
          requestStatus: 'declined',
        },
        historyEntry
      );
    },

    /**
     * 9. Admin: Progress Production Stage
     */
    async updateProductionStage(
      authorization: string | undefined,
      id: string,
      stage: CustomRequestStatus,
      note?: string
    ): Promise<CustomRequest> {
      const admin = await requireAdmin(authorization);
      const cleanId = validateId(id);

      if (!PRODUCTION_STAGES.includes(stage)) {
        throw new CustomHttpError(
          400,
          `Invalid production stage: "${stage}". Allowed stages: ${PRODUCTION_STAGES.join(', ')}`
        );
      }

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      if (!canTransitionCustomStatus(current.requestStatus, stage)) {
        throw new CustomHttpError(
          400,
          `Cannot transition custom request from "${current.requestStatus}" to "${stage}".`
        );
      }

      const timestamp = now();
      const historyEntry = {
        status: stage,
        changedAt: timestamp,
        changedBy: admin.email || admin.uid,
        note: sanitizeText(note, 500) || `Production stage progressed to ${stage}`,
        changeId: `prod-stage-${cleanId}-${stage}-${Date.now()}`,
      };

      return await repo.updateWithHistory(
        cleanId,
        {
          requestStatus: stage,
        },
        historyEntry
      );
    },

    /**
     * 10. Admin: Update Internal Notes (Private to Admin)
     */
    async updateAdminNotes(
      authorization: string | undefined,
      id: string,
      notes: string
    ): Promise<CustomRequest> {
      await requireAdmin(authorization);
      const cleanId = validateId(id);

      const current = await repo.getById(cleanId);
      if (!current) {
        throw new CustomHttpError(404, 'Custom request not found.');
      }

      const sanitizedNotes = sanitizeText(notes, 5000);
      await repo.update(cleanId, {
        adminNotes: sanitizedNotes,
        updatedAt: now(),
      });

      return {
        ...current,
        adminNotes: sanitizedNotes,
        updatedAt: now(),
      };
    },
  };
}

export const customManagementService = createCustomManagement();
