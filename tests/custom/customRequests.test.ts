/**
 * Good Things Co. — Custom Requests Comprehensive Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCustomManagement } from '../../server/custom/service';
import { memoryCustomRepository, sampleCustomRequest } from './memory';
import {
  generateCustomReferenceNumber,
  validateCustomSubmission,
  calculateCustomQuoteTotal,
  CustomHttpError,
} from '../../server/custom/domain';
import type { CustomRequest } from '../../src/types/customRequest';

describe('Custom / Create Requests Phase Test Suite', () => {
  const adminToken = 'Bearer valid-admin-token';
  const userToken = 'Bearer normal-user-token';

  const mockVerify = async (token: string) => {
    if (token === 'valid-admin-token') return { uid: 'adm-1', admin: true, email: 'admin@goodthingsco.ng' };
    if (token === 'normal-user-token') return { uid: 'usr-1', admin: false, email: 'client@example.com' };
    throw new Error('Invalid token');
  };

  const sampleValidSubmission = () => ({
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
      material: 'Rigid Matte Board',
      colour: 'Obsidian Black',
      size: '32cm x 24cm x 10cm',
      packaging: 'Custom Velvet Tray',
      branding: 'Gold Foil Stamping',
      personalisation: 'Laser Inscribed Names',
      additionalNotes: 'Champagne gold pantone 465C',
    },
    assets: [
      {
        type: 'logo',
        url: 'https://res.cloudinary.com/goodthingsco/image/upload/v1/logo.png',
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileSize: 1200000,
      },
    ],
  });

  // ============================================================
  // 1. SUBMISSION & CREATION TESTS
  // ============================================================
  describe('1. Submission Lifecycle', () => {
    it('generates human-readable reference number with format GTC-CUSTOM-YYYYMMDD-XXXX', () => {
      const ref = generateCustomReferenceNumber(new Date('2026-10-03T12:00:00.000Z'));
      assert.match(ref, /^GTC-CUSTOM-20261003-[2-9A-Z]{4}$/);
    });

    it('submits a valid bespoke request and persists in Firestore repository', async () => {
      const { repository } = memoryCustomRepository();
      const notificationsDispatched: string[] = [];

      const mockNotify = {
        customRequestCreated: async (req: CustomRequest) => {
          notificationsDispatched.push(`ack-${req.referenceNumber}`);
          return [];
        },
      } as any;

      const service = createCustomManagement({
        repository,
        verify: mockVerify,
        notify: mockNotify,
      });

      const res = await service.submitRequest(sampleValidSubmission(), '127.0.0.1');
      assert.equal(res.success, true);
      assert.match(res.referenceNumber, /^GTC-CUSTOM-\d{8}-[2-9A-Z]{4}$/);
      assert.equal(res.request.requestStatus, 'submitted');
      assert.equal(res.request.quote.status, 'not-prepared');
      assert.equal(res.request.customer.fullName, 'Damilola Adeleke');
      assert.equal(res.request.assets?.length, 1);

      // Verify customer acknowledgment triggered
      assert.equal(notificationsDispatched.length, 1);
      assert.equal(notificationsDispatched[0], `ack-${res.referenceNumber}`);

      // Verify persisted in repo
      const stored = await repository.getById(res.request.id);
      assert.ok(stored);
      assert.equal(stored.referenceNumber, res.referenceNumber);
    });

    it('does not fail or delete request when notification service encounters an error', async () => {
      const { repository } = memoryCustomRepository();
      const mockNotify = {
        customRequestCreated: async () => {
          throw new Error('Resend provider 500 network timeout');
        },
      } as any;

      const service = createCustomManagement({
        repository,
        verify: mockVerify,
        notify: mockNotify,
      });

      const res = await service.submitRequest(sampleValidSubmission(), '127.0.0.1');
      assert.equal(res.success, true);
      const stored = await repository.getById(res.request.id);
      assert.ok(stored);
      assert.equal(stored.requestStatus, 'submitted');
    });

    it('prevents duplicate requests when idempotency key is re-submitted', async () => {
      const { repository } = memoryCustomRepository();
      const service = createCustomManagement({ repository, verify: mockVerify });

      const payload = {
        ...sampleValidSubmission(),
        idempotencyKey: 'client-key-unique-789',
      };

      const first = await service.submitRequest(payload, '127.0.0.1');
      const second = await service.submitRequest(payload, '127.0.0.1');

      assert.equal(first.referenceNumber, second.referenceNumber);
      assert.equal(first.request.id, second.request.id);
      const list = await repository.list();
      assert.equal(list.length, 1);
    });
  });

  // ============================================================
  // 2. INPUT VALIDATION TESTS
  // ============================================================
  describe('2. Input & Asset Validation', () => {
    it('rejects submissions with missing or short customer name', () => {
      const payload = sampleValidSubmission();
      (payload.customer as any).fullName = 'A';
      assert.throws(() => validateCustomSubmission(payload), /full name must be at least 2 characters/i);
    });

    it('rejects submissions with invalid customer email', () => {
      const payload = sampleValidSubmission();
      payload.customer.email = 'not-an-email';
      assert.throws(() => validateCustomSubmission(payload), /valid customer contact email is required/i);
    });

    it('rejects submissions with invalid customer phone number', () => {
      const payload = sampleValidSubmission();
      payload.customer.phone = '123'; // too short
      assert.throws(() => validateCustomSubmission(payload), /valid customer phone number is required/i);
    });

    it('rejects unsupported creation types', () => {
      const payload = sampleValidSubmission();
      (payload as any).requestType = 'arbitrary-unsupported-type';
      assert.throws(() => validateCustomSubmission(payload), /invalid request type/i);
    });

    it('rejects zero or negative quantities', () => {
      const payload = sampleValidSubmission();
      payload.requestDetails.quantity = 0;
      assert.throws(() => validateCustomSubmission(payload), /positive whole number/i);

      payload.requestDetails.quantity = -10;
      assert.throws(() => validateCustomSubmission(payload), /positive whole number/i);
    });

    it('rejects dangerous or executable asset extensions (.exe, .bat, .sh)', () => {
      const payload: any = sampleValidSubmission();
      payload.assets = [
        {
          type: 'artwork',
          url: 'https://cdn.example.com/exploit.exe',
          fileName: 'trojan_brief.exe',
        },
      ];
      assert.throws(() => validateCustomSubmission(payload), /dangerous or unsupported file extension/i);
    });

    it('rejects unsafe non-http/https URL schemes in assets', () => {
      const payload: any = sampleValidSubmission();
      payload.assets = [
        {
          type: 'logo',
          url: 'javascript:alert(1)',
          fileName: 'script.png',
        },
      ];
      assert.throws(() => validateCustomSubmission(payload), /must use https, http, or safe image reference/i);
    });

    it('rejects more than 10 attached assets', () => {
      const payload: any = sampleValidSubmission();
      payload.assets = Array.from({ length: 12 }, (_, i) => ({
        type: 'reference' as const,
        url: `https://example.com/file-${i}.jpg`,
        fileName: `file-${i}.jpg`,
      }));
      assert.throws(() => validateCustomSubmission(payload), /maximum of 10 design reference files/i);
    });
  });

  // ============================================================
  // 3. ADMIN AUTHORIZATION & INQUIRY LISTING
  // ============================================================
  describe('3. Admin Authorization & Queries', () => {
    it('denies unauthenticated requests without bearer token', async () => {
      const { repository } = memoryCustomRepository([sampleCustomRequest()]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      await assert.rejects(
        () => service.listRequests(undefined, new URLSearchParams()),
        (err: any) => err instanceof CustomHttpError && err.statusCode === 401
      );
    });

    it('denies authenticated requests from non-admin users', async () => {
      const { repository } = memoryCustomRepository([sampleCustomRequest()]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      await assert.rejects(
        () => service.listRequests(userToken, new URLSearchParams()),
        (err: any) => err instanceof CustomHttpError && err.statusCode === 403
      );
    });

    it('allows verified admin to list and search requests', async () => {
      const req1 = sampleCustomRequest('req-1', 'GTC-CUSTOM-20261003-AAAA');
      const req2 = sampleCustomRequest('req-2', 'GTC-CUSTOM-20261003-BBBB');
      req2.customer.fullName = 'Babatunde Fashola';
      req2.requestDetails.item = 'Monogrammed Leather Briefcase';
      req2.requestStatus = 'in-review' as any;

      const { repository } = memoryCustomRepository([req1, req2]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const all = await service.listRequests(adminToken, new URLSearchParams());
      assert.equal(all.total, 2);

      const searched = await service.listRequests(
        adminToken,
        new URLSearchParams('search=Briefcase')
      );
      assert.equal(searched.requests.length, 1);
      assert.equal(searched.requests[0].id, 'req-2');
    });

    it('allows admin to fetch single request details', async () => {
      const req = sampleCustomRequest('req-1', 'GTC-CUSTOM-20261003-ABCD');
      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const details = await service.getRequestDetails(adminToken, 'req-1');
      assert.equal(details.referenceNumber, 'GTC-CUSTOM-20261003-ABCD');
    });
  });

  // ============================================================
  // 4. QUOTATION WORKFLOW
  // ============================================================
  describe('4. Quotation Calculations & Workflow', () => {
    it('correctly calculates quotation total: subtotal + fees - discount', () => {
      const quote = {
        subtotal: 500000,
        designFee: 50000,
        productionFee: 150000,
        packagingFee: 45000,
        deliveryFee: 25000,
        discount: 20000,
      };
      const total = calculateCustomQuoteTotal(quote);
      // 500k + 50k + 150k + 45k + 25k - 20k = 750,000
      assert.equal(total, 750000);
    });

    it('never calculates negative quote total even if discount exceeds sum', () => {
      const quote = {
        subtotal: 50000,
        discount: 100000,
      };
      const total = calculateCustomQuoteTotal(quote);
      assert.equal(total, 0);
    });

    it('saves quote as draft without dispatching customer email', async () => {
      const req = sampleCustomRequest('req-1');
      const { repository } = memoryCustomRepository([req]);
      let emailDispatched = false;

      const mockNotify = {
        customQuoteSent: async () => {
          emailDispatched = true;
          return [];
        },
      } as any;

      const service = createCustomManagement({
        repository,
        verify: mockVerify,
        notify: mockNotify,
      });

      const updated = await service.saveQuoteDraft(adminToken, 'req-1', {
        subtotal: 400000,
        designFee: 50000,
        deliveryFee: 20000,
        notes: 'Draft quotation',
      });

      assert.equal(updated.quote.status, 'draft');
      assert.equal(updated.quote.total, 470000);
      assert.equal(emailDispatched, false); // No email for drafts
    });

    it('sends quote to customer, updates status to quote-sent, and triggers quote email', async () => {
      const req = sampleCustomRequest('req-1');
      const { repository } = memoryCustomRepository([req]);
      let sentEventId = '';

      const mockNotify = {
        customQuoteSent: async (_item: CustomRequest, eventId: string) => {
          sentEventId = eventId;
          return [];
        },
      } as any;

      const service = createCustomManagement({
        repository,
        verify: mockVerify,
        notify: mockNotify,
      });

      const updated = await service.sendQuote(adminToken, 'req-1', {
        subtotal: 500000,
        productionFee: 100000,
        notes: 'Official pricing with bespoke delivery',
      });

      assert.equal(updated.quote.status, 'sent');
      assert.equal(updated.requestStatus, 'quote-sent');
      assert.ok(updated.quote.sentAt);
      assert.equal(sentEventId, `quote-${req.referenceNumber}`);
    });

    it('supports admin marking quote accepted', async () => {
      const req = sampleCustomRequest('req-1');
      req.requestStatus = 'quote-sent';
      req.quote.status = 'sent';

      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const updated = await service.acceptQuote(adminToken, 'req-1', 'Client approved pricing via phone.');
      assert.equal(updated.quote.status, 'accepted');
      assert.equal(updated.requestStatus, 'accepted');
      assert.ok(updated.quote.acceptedAt);
    });

    it('supports admin declining quote with decline reason', async () => {
      const req = sampleCustomRequest('req-1');
      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const updated = await service.declineQuote(
        adminToken,
        'req-1',
        'Requested material unobtainable before deadline',
        'Customer notified via concierge'
      );
      assert.equal(updated.quote.status, 'declined');
      assert.equal(updated.requestStatus, 'declined');
      assert.equal(updated.quote.declineReason, 'Requested material unobtainable before deadline');
    });
  });

  // ============================================================
  // 5. PRODUCTION STAGE & AUDIT TRACKING
  // ============================================================
  describe('5. Production Stage Progression & Auditing', () => {
    it('progresses sequentially through full production pipeline', async () => {
      const req = sampleCustomRequest('req-1');
      req.requestStatus = 'accepted';
      req.quote.status = 'accepted';

      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const stages = [
        'design',
        'sample',
        'awaiting-approval',
        'production',
        'packaging',
        'delivery',
        'delivered',
      ] as const;

      for (const stage of stages) {
        const updated = await service.updateProductionStage(adminToken, 'req-1', stage);
        assert.equal(updated.requestStatus, stage);
      }

      const finalState = await repository.getById('req-1');
      assert.equal(finalState?.requestStatus, 'delivered');
      assert.ok(finalState?.statusHistory.length! >= 8);
    });

    it('rejects invalid backward or nonsensical transitions', async () => {
      const req = sampleCustomRequest('req-1');
      req.requestStatus = 'delivered';

      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      await assert.rejects(
        () => service.updateProductionStage(adminToken, 'req-1', 'design'),
        (err: any) => err instanceof CustomHttpError && err.statusCode === 400
      );
    });

    it('prevents duplicate status history when retrying with same changeId', async () => {
      const req = sampleCustomRequest('req-1');
      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const changeId = 'retry-proof-change-999';

      await service.updateStatus(adminToken, 'req-1', {
        status: 'under-review',
        note: 'Reviewing inquiry parameters',
        changeId,
      });

      await service.updateStatus(adminToken, 'req-1', {
        status: 'under-review',
        note: 'Retry review update',
        changeId,
      });

      const stored = await repository.getById('req-1');
      const matchEntries = stored?.statusHistory.filter((h) => h.changeId === changeId);
      assert.equal(matchEntries?.length, 1);
    });

    it('allows updating private admin notes without altering customer-visible fields', async () => {
      const req = sampleCustomRequest('req-1');
      const { repository } = memoryCustomRepository([req]);
      const service = createCustomManagement({ repository, verify: mockVerify });

      const updated = await service.updateAdminNotes(
        adminToken,
        'req-1',
        'Confidential supplier cost: ₦35,000/unit from Lekki wood atelier'
      );

      assert.equal(
        updated.adminNotes,
        'Confidential supplier cost: ₦35,000/unit from Lekki wood atelier'
      );
      assert.equal(updated.requestStatus, 'submitted');
    });
  });
});
