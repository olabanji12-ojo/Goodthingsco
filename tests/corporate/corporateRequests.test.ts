/**
 * Good Things Co. — Corporate Requests & Quote Workflow Test Suite
 *
 * Verifies:
 * - Public request submission, sanitization, and reference generation
 * - Initial statuses ('submitted' and quote 'not-prepared')
 * - Customer acknowledgment and admin notification email hooks
 * - Resilience to notification provider outages
 * - Idempotency via client submission key
 * - Input validation & security checks (malformed assets, bad emails, zero quantity)
 * - Abuse rate-limiting
 * - Admin authorization protection
 * - Admin search, filtering, and pagination
 * - Status workflow state transitions & audit trail
 * - Pro-forma quote calculations & draft saving
 * - Official quote sending & quote email delivery
 * - Quote acceptance and decline lifecycle
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createCorporateManagement } from '../../server/corporate/service';
import { CorporateHttpError } from '../../server/corporate/domain';
import { memoryCorporateRepository, sampleCorporateRequest } from './memory';

function setupCorporateTest() {
  const initial = sampleCorporateRequest();
  const { store, repository } = memoryCorporateRepository([initial]);
  let currentTime = new Date('2026-10-03T14:00:00.000Z').getTime();
  const nowIso = () => new Date(currentTime).toISOString();

  const sentNotifications: Array<{ type: string; payload: any; eventId?: string }> = [];
  let failEmail = false;

  const mockNotify: any = {
    async corporateRequestCreated(req: any) {
      if (failEmail) throw new Error('Resend provider outage');
      sentNotifications.push({ type: 'corporateRequestCreated', payload: req });
      return [{ sent: true, provider: 'resend', providerId: 'msg-1' }];
    },
    async corporateQuoteSent(req: any, eventId?: string) {
      if (failEmail) throw new Error('Resend provider outage');
      sentNotifications.push({ type: 'corporateQuoteSent', payload: req, eventId });
      return [{ sent: true, provider: 'resend', providerId: 'msg-2' }];
    },
  };

  const service = createCorporateManagement({
    repository,
    verify: async (token) => {
      if (token === 'admin-token') return { uid: 'adm-1', admin: true, email: 'concierge@goodthingsco.ng' };
      if (token === 'user-token') return { uid: 'usr-1', admin: false, email: 'customer@gmail.com' };
      throw new Error('Invalid token');
    },
    notify: mockNotify,
    now: nowIso,
  });

  return {
    store,
    repository,
    service,
    sentNotifications,
    setFailEmail: (f: boolean) => {
      failEmail = f;
    },
    advanceTime: (ms: number) => {
      currentTime += ms;
    },
  };
}

// =========================================================================
// SECTION 1: PUBLIC REQUEST SUBMISSION & IDEMPOTENCY
// =========================================================================

test('1. Valid corporate request submission creates document, generates reference number, and initialises statuses', async () => {
  const { service, sentNotifications } = setupCorporateTest();

  const result = await service.submitRequest({
    company: {
      companyName: 'Dangote Industries Ltd',
      contactName: 'Aliko Bello',
      email: 'a.bello@dangote.com',
      phone: '+234 802 000 1122',
    },
    giftingPurpose: 'executive',
    giftType: 'choose-gift',
    budgetRange: '100000-plus',
    quantity: 100,
    selectedProducts: [
      {
        productId: 'prod-exec',
        name: 'The Imperial Curation',
        unitPriceSnapshot: 120000,
        quantity: 100,
      },
    ],
    customisation: {
      packaging: 'Handcrafted Atelier Walnut Box',
      ribbonColour: 'Midnight Blue',
      companyMessage: 'In recognition of outstanding corporate governance.',
      brandingRequired: true,
      logoAsset: {
        url: 'https://res.cloudinary.com/goodthingsco/image/upload/v123/dangote.png',
        originalFilename: 'dangote.png',
      },
    },
    delivery: {
      preferredDeliveryDate: '2026-11-01',
      deliveryMethod: 'single-hub',
    },
  });

  assert.equal(result.success, true);
  assert.ok(result.referenceNumber.startsWith('GTC-CORP-'));

  const saved = await service.getRequestDetails('Bearer admin-token', result.request.id!);
  assert.equal(saved.company.companyName, 'Dangote Industries Ltd');
  assert.equal(saved.quantity, 100);
  assert.equal(saved.requestStatus, 'submitted');
  assert.equal(saved.quote.status, 'not-prepared');
  assert.equal(saved.statusHistory.length, 1);
  assert.equal(saved.statusHistory[0].status, 'submitted');

  // Verify notifications triggered
  assert.equal(sentNotifications.length, 1);
  assert.equal(sentNotifications[0].type, 'corporateRequestCreated');
});

test('2. Notification delivery failure does not prevent request creation', async () => {
  const { service, setFailEmail } = setupCorporateTest();
  setFailEmail(true); // Simulate Resend mail server outage

  const result = await service.submitRequest({
    company: {
      companyName: 'Zenith Tech',
      contactName: 'Chidi Okeke',
      email: 'chidi@zenithtech.ng',
      phone: '+234 803 444 5555',
    },
    giftingPurpose: 'employee',
    giftType: 'build-your-own',
    budgetRange: '25000-50000',
    quantity: 30,
  });

  assert.equal(result.success, true);
  assert.ok(result.referenceNumber.startsWith('GTC-CORP-'));
});

test('3. Duplicate submission with same idempotency key returns existing request', async () => {
  const { service } = setupCorporateTest();
  const idempotencyKey = 'client-req-key-abc-123';

  const first = await service.submitRequest({
    idempotencyKey,
    company: {
      companyName: 'Access Holding Plc',
      contactName: 'Tari Douglas',
      email: 'tari@accessholding.ng',
      phone: '+234 809 888 7777',
    },
    giftingPurpose: 'client',
    giftType: 'branded-merchandise',
    budgetRange: '50000-100000',
    quantity: 45,
  });

  // Client retries due to network hiccup
  const second = await service.submitRequest({
    idempotencyKey,
    company: {
      companyName: 'Access Holding Plc',
      contactName: 'Tari Douglas',
      email: 'tari@accessholding.ng',
      phone: '+234 809 888 7777',
    },
    giftingPurpose: 'client',
    giftType: 'branded-merchandise',
    budgetRange: '50000-100000',
    quantity: 45,
  });

  assert.equal(first.referenceNumber, second.referenceNumber);
  assert.equal(first.request.id, second.request.id);
});

// =========================================================================
// SECTION 2: INPUT VALIDATION & RATE LIMITING
// =========================================================================

test('4. Validation rejects missing company name, invalid email, and non-positive quantity', async () => {
  const { service } = setupCorporateTest();

  // Missing company
  await assert.rejects(
    () =>
      service.submitRequest({
        company: { companyName: '', contactName: 'Valid Name', email: 'test@co.com', phone: '08012345678' },
        giftingPurpose: 'client',
        giftType: 'choose-gift',
        budgetRange: '25000-50000',
        quantity: 10,
      }),
    (err: any) => err instanceof CorporateHttpError && err.status === 400 && err.message.includes('Company name')
  );

  // Invalid email
  await assert.rejects(
    () =>
      service.submitRequest({
        company: { companyName: 'Valid Co', contactName: 'Valid Name', email: 'not-an-email', phone: '08012345678' },
        giftingPurpose: 'client',
        giftType: 'choose-gift',
        budgetRange: '25000-50000',
        quantity: 10,
      }),
    (err: any) => err instanceof CorporateHttpError && err.status === 400 && err.message.includes('valid corporate email')
  );

  // Quantity 0
  await assert.rejects(
    () =>
      service.submitRequest({
        company: { companyName: 'Valid Co', contactName: 'Valid Name', email: 'test@co.com', phone: '08012345678' },
        giftingPurpose: 'client',
        giftType: 'choose-gift',
        budgetRange: '25000-50000',
        quantity: 0,
      }),
    (err: any) => err instanceof CorporateHttpError && err.status === 400 && err.message.includes('positive number')
  );
});

test('5. Rejects malicious javascript: asset URLs', async () => {
  const { service } = setupCorporateTest();

  await assert.rejects(
    () =>
      service.submitRequest({
        company: { companyName: 'Valid Co', contactName: 'Valid Name', email: 'test@co.com', phone: '08012345678' },
        giftingPurpose: 'client',
        giftType: 'choose-gift',
        budgetRange: '25000-50000',
        quantity: 10,
        customisation: {
          logoAsset: {
            url: 'javascript:alert(1)',
          },
        },
      }),
    (err: any) => err instanceof CorporateHttpError && err.status === 400 && err.message.includes('Invalid asset')
  );
});

test('6. Rate limiting blocks rapid automated submissions', async () => {
  const { service } = setupCorporateTest();
  const clientIp = '192.168.1.50';

  const validPayload = {
    company: { companyName: 'Spam Corp', contactName: 'Bot', email: 'bot@spam.com', phone: '08012345678' },
    giftingPurpose: 'custom' as const,
    giftType: 'choose-gift' as const,
    budgetRange: 'under-25000' as const,
    quantity: 5,
  };

  // Submit up to limit (15)
  for (let i = 0; i < 15; i++) {
    await service.submitRequest(validPayload, clientIp);
  }

  // 16th request must be rejected with 429
  await assert.rejects(
    () => service.submitRequest(validPayload, clientIp),
    (err: any) => err instanceof CorporateHttpError && err.status === 429
  );
});

// =========================================================================
// SECTION 3: ADMIN ACCESS & LISTING
// =========================================================================

test('7. Admin listing requires admin claims and rejects unauthenticated/normal users', async () => {
  const { service } = setupCorporateTest();

  // No auth header
  await assert.rejects(
    () => service.listRequests(undefined, new URLSearchParams()),
    (err: any) => err instanceof CorporateHttpError && err.status === 401
  );

  // Normal user token
  await assert.rejects(
    () => service.listRequests('Bearer user-token', new URLSearchParams()),
    (err: any) => err instanceof CorporateHttpError && err.status === 403
  );

  // Admin token succeeds
  const list = await service.listRequests('Bearer admin-token', new URLSearchParams());
  assert.ok(Array.isArray(list.requests));
  assert.ok(list.total >= 1);
});

test('8. Admin filtering by status and search keyword works accurately', async () => {
  const { service } = setupCorporateTest();

  // Search by reference or company
  const searchResult = await service.listRequests('Bearer admin-token', new URLSearchParams({ search: 'Apex Financial' }));
  assert.equal(searchResult.requests.length, 1);
  assert.equal(searchResult.requests[0].company.companyName, 'Apex Financial Services');

  // Search by non-matching term
  const emptySearch = await service.listRequests('Bearer admin-token', new URLSearchParams({ search: 'NonExistent' }));
  assert.equal(emptySearch.requests.length, 0);

  // Filter by requestStatus
  const statusFilter = await service.listRequests('Bearer admin-token', new URLSearchParams({ status: 'submitted' }));
  assert.equal(statusFilter.requests.length, 1);
});

// =========================================================================
// SECTION 4: STATUS WORKFLOW & QUOTE LIFECYCLE
// =========================================================================

test('9. Status workflow enforces valid transitions and appends audit history', async () => {
  const { service } = setupCorporateTest();
  const id = 'req-1';

  // Valid: submitted -> under-review
  const updated1 = await service.updateStatus('Bearer admin-token', id, {
    status: 'under-review',
    note: 'Concierge review started by specialist',
  });
  assert.equal(updated1.requestStatus, 'under-review');
  const latestHistory = updated1.statusHistory[updated1.statusHistory.length - 1];
  assert.equal(latestHistory.status, 'under-review');
  assert.equal(latestHistory.note, 'Concierge review started by specialist');

  // Invalid: under-review directly to delivered (skipping production/delivery)
  await assert.rejects(
    () => service.updateStatus('Bearer admin-token', id, { status: 'delivered' }),
    (err: any) => err instanceof CorporateHttpError && err.status === 400 && err.message.includes('Cannot transition')
  );
});

test('10. Quote draft saves live calculated total without sending customer email', async () => {
  const { service, sentNotifications } = setupCorporateTest();
  const id = 'req-1';

  const drafted = await service.saveQuoteDraft('Bearer admin-token', id, {
    subtotal: 2250000,
    deliveryFee: 50000,
    brandingFee: 100000,
    discount: 150000,
    notes: 'Volume discount of 150k applied for 50 units.',
    validUntil: '2026-11-15',
    action: 'draft',
  });

  assert.equal(drafted.quote.status, 'draft');
  assert.equal(drafted.quote.subtotal, 2250000);
  assert.equal(drafted.quote.deliveryFee, 50000);
  assert.equal(drafted.quote.brandingFee, 100000);
  assert.equal(drafted.quote.discount, 150000);
  // Authoritative total: 2250000 + 50000 + 100000 - 150000 = 2250000
  assert.equal(drafted.quote.total, 2250000);

  // Crucial check: Draft should NOT trigger quote email
  assert.ok(!sentNotifications.some((n) => n.type === 'corporateQuoteSent'));
});

test('11. Sending quote updates statuses and delivers customer quote notification', async () => {
  const { service, sentNotifications } = setupCorporateTest();
  const id = 'req-1';

  const sent = await service.sendQuote('Bearer admin-token', id, {
    subtotal: 2250000,
    deliveryFee: 50000,
    brandingFee: 100000,
    discount: 150000,
    notes: 'Special pro-forma quote with bespoke walnut wood casing.',
    validUntil: '2026-11-15',
    action: 'send',
  });

  assert.equal(sent.quote.status, 'sent');
  assert.equal(sent.requestStatus, 'quote-sent');
  assert.ok(sent.quote.sentAt);

  // Check email sent
  const quoteEmail = sentNotifications.find((n) => n.type === 'corporateQuoteSent');
  assert.ok(quoteEmail, 'corporateQuoteSent hook must be called');
  assert.equal(quoteEmail?.payload.quote.total, 2250000);
});

test('12. Quote acceptance advances request to accepted state and enables production sequence', async () => {
  const { service } = setupCorporateTest();
  const id = 'req-1';

  // Move to quote-sent first
  await service.sendQuote('Bearer admin-token', id, {
    subtotal: 1000000,
    action: 'send',
  });

  // Client accepts quote
  const accepted = await service.acceptQuote('Bearer admin-token', id, 'Signed pro-forma PO received');
  assert.equal(accepted.quote.status, 'accepted');
  assert.equal(accepted.requestStatus, 'accepted');

  // Can now transition through production pipeline
  const inProd = await service.updateStatus('Bearer admin-token', id, { status: 'production' });
  assert.equal(inProd.requestStatus, 'production');

  const inPack = await service.updateStatus('Bearer admin-token', id, { status: 'packaging' });
  assert.equal(inPack.requestStatus, 'packaging');

  const dispatched = await service.updateStatus('Bearer admin-token', id, { status: 'delivery' });
  assert.equal(dispatched.requestStatus, 'delivery');

  const delivered = await service.updateStatus('Bearer admin-token', id, { status: 'delivered' });
  assert.equal(delivered.requestStatus, 'delivered');
});

test('13. Quote decline records audit reason and sets declined state', async () => {
  const { service } = setupCorporateTest();
  const id = 'req-1';

  // Decline quote
  const declined = await service.declineQuote('Bearer admin-token', id, 'Event cancelled by client board');
  assert.equal(declined.quote.status, 'declined');
  assert.equal(declined.requestStatus, 'declined');
  assert.equal(declined.quote.declineReason, 'Event cancelled by client board');
});
