/**
 * Good Things Co. — Abandoned Checkout + Resume Flow Test Suite
 *
 * Verifies:
 * - Session creation, storage, and absence of payment/card credentials
 * - Debounced autosave with item and form state
 * - Inactivity-based abandonment detection and configurable threshold
 * - Reminder schedule, maximum reminders enforcement, and no-email skipping
 * - Atomic concurrency claiming & duplicate reminder prevention (idempotency)
 * - Safe provider failure recovery (retry without conversion)
 * - Cryptographic resume token generation, hashing, and tampering rejection
 * - Expiration enforcement
 * - Live server-side inventory and price revalidation
 * - Payment/order conversion integration and future reminder termination
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createAbandonedCheckoutService } from '../../server/checkout/service';
import {
  hashResumeToken,
  CheckoutHttpError,
} from '../../server/checkout/domain';
import { memoryAbandonedCheckoutRepository, sampleCartItem } from './memory';
import type { AbandonedCheckoutConfig } from '../../server/checkout/abandonedConfig';
import type { RecoveredCheckoutPayload } from '../../src/types/abandonedCheckout';

function testConfig(overrides: Partial<AbandonedCheckoutConfig> = {}): AbandonedCheckoutConfig {
  return {
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
    maxReminders: 2,
    resumeExpiryDays: 7,
    tokenSecret: 'test-secure-checkout-secret-key-12345678',
    ...overrides,
  };
}

function setupTest(configOverrides: Partial<AbandonedCheckoutConfig> = {}) {
  const { store, repository } = memoryAbandonedCheckoutRepository();
  const config = testConfig(configOverrides);
  let currentTime = new Date('2026-10-03T12:00:00.000Z').getTime();
  const nowFn = () => new Date(currentTime).toISOString();

  const sentEmails: Array<{
    type: string;
    to: string;
    data: any;
    eventId: string;
  }> = [];

  let failEmail = false;

  const mockNotify: any = {
    async abandonedCheckoutReminder(payload: any, eventId: string) {
      if (failEmail) {
        throw new Error('Resend provider temporarily unavailable');
      }
      sentEmails.push({
        type: 'abandonedCheckoutReminder',
        to: payload.to || payload.customerEmail,
        data: payload.data || payload,
        eventId,
      });
      return [{ sent: true, provider: 'resend', id: `resend-${sentEmails.length}` }];
    },
  };

  const liveCatalog = new Map<string, any>([
    [
      'prod-1',
      {
        id: 'prod-1',
        name: 'Luxury Velvet Box',
        price: 25000,
        stock: 10,
        isAvailable: true,
        isArchived: false,
      },
    ],
    [
      'prod-2',
      {
        id: 'prod-2',
        name: 'Artisanal Scented Candle',
        price: 18000,
        stock: 5,
        isAvailable: true,
        isArchived: false,
      },
    ],
  ]);

  const mockRevalidate = async (
    items: any[],
    _address?: any
  ): Promise<Omit<RecoveredCheckoutPayload, 'sessionId' | 'customer' | 'recipient' | 'delivery' | 'giftMessage'>> => {
    let subtotal = 0;
    const revalidatedItems: any[] = [];
    const warnings: string[] = [];
    let hasPriceChanges = false;
    let hasUnavailableItems = false;

    for (const item of items) {
      const live = liveCatalog.get(item.productId);
      if (!live || live.isArchived || !live.isAvailable || live.stock <= 0) {
        warnings.push(`"${item.name}" is no longer available.`);
        hasUnavailableItems = true;
        continue;
      }

      let unitPrice = item.unitPrice;
      if (live.price !== item.unitPrice) {
        hasPriceChanges = true;
        warnings.push(`Price for "${item.name}" changed from ₦${item.unitPrice} to ₦${live.price}.`);
        unitPrice = live.price;
      }

      const qty = Math.min(item.quantity, live.stock);
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;

      revalidatedItems.push({
        ...item,
        unitPrice,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    const deliveryFee = 2500;
    return {
      items: revalidatedItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      currency: 'NGN',
      hasPriceChanges,
      hasUnavailableItems,
      warnings,
    };
  };

  const service = createAbandonedCheckoutService({
    repository,
    config: () => config,
    notify: mockNotify,
    revalidate: mockRevalidate,
    now: nowFn,
  });

  return {
    store,
    repository,
    config,
    service,
    sentEmails,
    liveCatalog,
    setFailEmail: (val: boolean) => {
      failEmail = val;
    },
    advanceTime: (ms: number) => {
      currentTime += ms;
    },
    nowIso: nowFn,
  };
}

// =========================================================================
// SECTION 1: SESSION PERSISTENCE & DEBOUNCED AUTOSAVE
// =========================================================================

test('1. Session creation generates unique ID, hashes token, and does not store payment card data', async () => {
  const { service, store } = setupTest();

  const item1 = sampleCartItem('prod-1', 'Luxury Box', 25000);
  const result = await service.initOrUpdateSession({
    customer: { fullName: 'Ada Lovelace', email: 'ada@example.com', phone: '08012345678' },
    items: [item1],
  });

  assert.ok(result.sessionId.startsWith('ac_'), 'Session ID should have prefix ac_');
  assert.ok(result.resumeToken.includes('.'), 'Resume token must be derived format sessionId.sig');
  assert.ok(result.resumeUrl.includes('/resume-checkout?token='), 'Resume URL must direct to /resume-checkout');

  const saved = store.get(result.sessionId);
  assert.ok(saved, 'Session must be saved in repository');
  assert.equal(saved.customer?.fullName, 'Ada Lovelace');
  assert.equal(saved.items.length, 1);
  assert.equal(saved.status, 'active');

  // Verify token hash is stored, never plaintext token
  assert.equal(saved.resumeTokenHash, hashResumeToken(result.resumeToken));
  assert.notEqual(saved.resumeTokenHash, result.resumeToken, 'Raw token must not equal stored hash');

  // Strict check: verify NO payment card data or credentials exist anywhere in the model
  const rawJson = JSON.stringify(saved);
  assert.ok(!rawJson.includes('cardNumber'), 'Must never store cardNumber');
  assert.ok(!rawJson.includes('cvv'), 'Must never store cvv');
  assert.ok(!rawJson.includes('authorization_code'), 'Must never store authorization credentials');
  assert.ok(!rawJson.includes('secretKey'), 'Must never store secret keys');
});

test('2. Debounced autosave safely updates session fields without overwriting status', async () => {
  const { service, store } = setupTest();

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Grace Hopper', email: 'grace@example.com' },
    items: [sampleCartItem('prod-1', 'Velvet Box', 25000)],
  });

  const updated = await service.autosaveSession(init.sessionId, {
    customer: { fullName: 'Grace Hopper', email: 'grace@example.com', phone: '08099998888' },
    delivery: {
      address: { addressLine1: '14 Marina St', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },
      zone: 'lagos',
      preferredDate: '2026-10-10',
    },
    giftMessage: 'With warmest wishes from Grace.',
  });

  assert.equal(updated.customer?.phone, '08099998888');
  assert.equal(updated.delivery?.address?.addressLine1, '14 Marina St');
  assert.equal(updated.giftMessage, 'With warmest wishes from Grace.');
  assert.equal(updated.status, 'active');

  const savedInStore = store.get(init.sessionId);
  assert.equal(savedInStore?.delivery?.address?.city, 'Lagos Island');
});

// =========================================================================
// SECTION 2: INACTIVITY-BASED ABANDONMENT & REMINDER PROCESSING
// =========================================================================

test('3. Inactivity beyond threshold marks session abandoned and triggers reminder 1', async () => {
  const { service, store, sentEmails, advanceTime } = setupTest({
    abandonedAfterMinutes: 60,
  });

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Bisi Silva', email: 'bisi@example.com' },
    items: [sampleCartItem('prod-1', 'Curated Box', 25000)],
  });

  // Recent session (< 60m): should NOT trigger reminders
  advanceTime(10 * 60 * 1000); // 10 minutes
  let stats = await service.processAbandonedCheckoutReminders();
  assert.equal(stats.sent, 0, 'Active recent session must not be sent a reminder');
  assert.equal(sentEmails.length, 0);

  // Advance past abandonment threshold (60m): 10m + 55m = 65m total
  advanceTime(55 * 60 * 1000);
  stats = await service.processAbandonedCheckoutReminders();
  assert.equal(stats.sent, 1, 'Abandoned session must receive Reminder 1');
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'bisi@example.com');
  assert.ok(sentEmails[0].data.resumeUrl.includes('/resume-checkout?token='));
  assert.ok(!sentEmails[0].data.resumeUrl.includes('bisi@example.com'), 'Email must NOT be in URL');

  const afterFirstReminder = store.get(init.sessionId);
  assert.equal(afterFirstReminder?.status, 'abandoned');
  assert.equal(afterFirstReminder?.reminderState.sentCount, 1);
  assert.ok(afterFirstReminder?.reminderState.nextEligibleAt);
});

test('4. Idempotency: Immediate second processor run does NOT send duplicate email', async () => {
  const { service, sentEmails, advanceTime } = setupTest({
    abandonedAfterMinutes: 60,
  });

  await service.initOrUpdateSession({
    customer: { fullName: 'Chinua Achebe', email: 'chinua@example.com' },
    items: [sampleCartItem('prod-1', 'Novel & Candle', 35000)],
  });

  advanceTime(70 * 60 * 1000); // Inactive for 70m
  await service.processAbandonedCheckoutReminders();
  assert.equal(sentEmails.length, 1);

  // Immediate second run without advancing time
  const secondRunStats = await service.processAbandonedCheckoutReminders();
  assert.equal(secondRunStats.sent, 0, 'Must not send duplicate reminder');
  assert.equal(sentEmails.length, 1, 'Total emails sent must remain 1');
});

test('5. Multi-stage reminder schedule advances and enforces max reminders', async () => {
  const { service, store, sentEmails, advanceTime } = setupTest({
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
    maxReminders: 2,
  });

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Wole Soyinka', email: 'wole@example.com' },
    items: [sampleCartItem('prod-1', 'Poetry Box', 40000)],
  });

  advanceTime(70 * 60 * 1000); // 70m: Reminder 1
  await service.processAbandonedCheckoutReminders();
  assert.equal(sentEmails.length, 1);
  assert.equal(store.get(init.sessionId)?.reminderState.sentCount, 1);

  // Advance 2 hours (less than 24h delay window): should NOT send reminder 2
  advanceTime(2 * 3600 * 1000);
  let run = await service.processAbandonedCheckoutReminders();
  assert.equal(run.sent, 0);
  assert.equal(sentEmails.length, 1);

  // Advance remaining 23 hours: total > 24h since Reminder 1
  advanceTime(23 * 3600 * 1000);
  run = await service.processAbandonedCheckoutReminders();
  assert.equal(run.sent, 1, 'Reminder 2 should now be sent');
  assert.equal(sentEmails.length, 2);
  assert.equal(store.get(init.sessionId)?.reminderState.sentCount, 2);

  // Advance another 48 hours: maxReminders (2) reached, no further emails
  advanceTime(48 * 3600 * 1000);
  run = await service.processAbandonedCheckoutReminders();
  assert.equal(run.sent, 0, 'Must enforce max reminders limit');
  assert.equal(sentEmails.length, 2);
});

test('6. Checkout session without email is ineligible for email delivery', async () => {
  const { service, store, sentEmails, advanceTime } = setupTest();

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Anonymous Visitor' }, // no email
    items: [sampleCartItem('prod-1', 'Box', 20000)],
  });

  advanceTime(90 * 60 * 1000);
  const stats = await service.processAbandonedCheckoutReminders();
  assert.equal(stats.sent, 0, 'No email must be sent');
  assert.equal(sentEmails.length, 0);
  assert.equal(store.get(init.sessionId)?.reminderState.sentCount, 0);
});

test('7. Provider delivery failure releases lock and permits safe retry later', async () => {
  const { service, store, sentEmails, setFailEmail, advanceTime } = setupTest();

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Fela Kuti', email: 'fela@example.com' },
    items: [sampleCartItem('prod-1', 'Afrobeat Vinyl', 50000)],
  });

  advanceTime(90 * 60 * 1000);

  // Simulate Resend provider failure
  setFailEmail(true);
  const failStats = await service.processAbandonedCheckoutReminders();
  assert.equal(failStats.failed, 1);
  assert.equal(sentEmails.length, 0);

  // Lock must be released
  const sessionAfterFailure = store.get(init.sessionId);
  assert.equal(sessionAfterFailure?.reminderState.claiming, false, 'Lock must be released on failure');
  assert.equal(sessionAfterFailure?.reminderState.sentCount, 0, 'Sent count must NOT increment on failure');

  // Retry when provider recovers
  setFailEmail(false);
  const recoverStats = await service.processAbandonedCheckoutReminders();
  assert.equal(recoverStats.sent, 1, 'Should succeed on retry');
  assert.equal(sentEmails.length, 1);
  assert.equal(store.get(init.sessionId)?.reminderState.sentCount, 1);
});

test('8. Concurrent processors do not duplicate send the same reminder', async () => {
  const { service, sentEmails, advanceTime } = setupTest();

  await service.initOrUpdateSession({
    customer: { fullName: 'Chimamanda Adichie', email: 'chimamanda@example.com' },
    items: [sampleCartItem('prod-1', 'Book Box', 30000)],
  });

  advanceTime(80 * 60 * 1000);

  // Launch two concurrent reminder workers simultaneously
  const [worker1, worker2] = await Promise.all([
    service.processAbandonedCheckoutReminders(),
    service.processAbandonedCheckoutReminders(),
  ]);

  const totalSent = worker1.sent + worker2.sent;
  assert.equal(totalSent, 1, 'Only one worker must win the atomic claim');
  assert.equal(sentEmails.length, 1, 'Exactly one email sent despite concurrency');
});

// =========================================================================
// SECTION 3: SECURE RESUME TOKENS & REVALIDATION
// =========================================================================

test('9. Resuming with valid token returns recovered payload and transitions status to resumed', async () => {
  const { service, store } = setupTest();

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Kofi Annan', email: 'kofi@example.com', phone: '08022223333' },
    delivery: {
      address: { addressLine1: 'Peace Way', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
      zone: 'lagos',
      preferredDate: '2026-10-15',
    },
    giftMessage: 'With diplomatic regards',
    items: [sampleCartItem('prod-1', 'Luxury Velvet Box', 25000)],
  });

  // Resume using the secure token
  const payload = await service.resumeCheckout(init.resumeToken);
  assert.equal(payload.sessionId, init.sessionId);
  assert.equal(payload.customer.fullName, 'Kofi Annan');
  assert.equal(payload.delivery.address.addressLine1, 'Peace Way');
  assert.equal(payload.giftMessage, 'With diplomatic regards');
  assert.equal(payload.items.length, 1);
  assert.equal(payload.total, 25000 + 2500); // item + delivery

  const sessionInStore = store.get(init.sessionId);
  assert.equal(sessionInStore?.status, 'resumed');
});

test('10. Tampered or invalid resume token is rejected', async () => {
  const { service } = setupTest();

  const init = await service.initOrUpdateSession({
    customer: { email: 'test@example.com' },
    items: [sampleCartItem('prod-1', 'Item', 10000)],
  });

  const tamperedToken = `${init.sessionId}.tamperedSignature12345`;
  await assert.rejects(
    () => service.resumeCheckout(tamperedToken),
    (err: any) => err instanceof CheckoutHttpError && err.status === 404
  );

  // Raw sessionId without signature must also fail
  await assert.rejects(
    () => service.resumeCheckout(init.sessionId),
    (err: any) => err instanceof CheckoutHttpError && err.status === 404
  );
});

test('11. Expired checkout token is rejected', async () => {
  const { service, advanceTime } = setupTest({
    resumeExpiryDays: 7,
  });

  const init = await service.initOrUpdateSession({
    customer: { email: 'expired@example.com' },
    items: [sampleCartItem('prod-1', 'Item', 10000)],
  });

  // Advance time beyond 7 days
  advanceTime(8 * 24 * 3600 * 1000);

  await assert.rejects(
    () => service.resumeCheckout(init.resumeToken),
    (err: any) => err instanceof CheckoutHttpError && err.status === 410
  );
});

test('12. Live product revalidation detects price changes and out-of-stock items', async () => {
  const { service, liveCatalog } = setupTest();

  const init = await service.initOrUpdateSession({
    customer: { email: 'shopper@example.com' },
    items: [
      sampleCartItem('prod-1', 'Luxury Velvet Box', 25000),
      sampleCartItem('prod-2', 'Artisanal Candle', 18000),
    ],
  });

  // Catalog update: prod-1 price increases, prod-2 becomes out of stock
  liveCatalog.set('prod-1', {
    id: 'prod-1',
    name: 'Luxury Velvet Box',
    price: 28000, // increased
    stock: 10,
    isAvailable: true,
    isArchived: false,
  });
  liveCatalog.set('prod-2', {
    id: 'prod-2',
    name: 'Artisanal Candle',
    price: 18000,
    stock: 0, // out of stock
    isAvailable: false,
    isArchived: false,
  });

  const recovered = await service.resumeCheckout(init.resumeToken);
  assert.equal(recovered.hasPriceChanges, true, 'Should detect price changes');
  assert.equal(recovered.hasUnavailableItems, true, 'Should detect unavailable items');
  assert.equal(recovered.items.length, 1, 'Unavailable item should be filtered');
  assert.equal(recovered.items[0].unitPrice, 28000, 'Price should be live price');
  assert.ok(recovered.warnings.some((w) => w.includes('Price for "Luxury Velvet Box" changed')));
  assert.ok(recovered.warnings.some((w) => w.includes('is no longer available')));
});

// =========================================================================
// SECTION 4: PAYMENT & ORDER CONVERSION
// =========================================================================

test('13. Payment conversion marks session converted and permanently stops future reminders', async () => {
  const { service, store, sentEmails, advanceTime } = setupTest({
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
    maxReminders: 2,
  });

  const init = await service.initOrUpdateSession({
    customer: { fullName: 'Ngozi Okonjo', email: 'ngozi@example.com' },
    items: [sampleCartItem('prod-1', 'Box', 30000)],
  });

  advanceTime(70 * 60 * 1000); // Reminder 1 sent
  await service.processAbandonedCheckoutReminders();
  assert.equal(sentEmails.length, 1);

  // Customer completes order payment
  await service.markConverted(init.sessionId, 'order-999', 'GTC-20261003-999');

  const converted = store.get(init.sessionId);
  assert.equal(converted?.status, 'converted');
  assert.equal(converted?.convertedOrderId, 'order-999');
  assert.equal(converted?.convertedOrderNumber, 'GTC-20261003-999');

  // Advance time past Reminder 2 window (48h)
  advanceTime(48 * 3600 * 1000);
  const postConversionRun = await service.processAbandonedCheckoutReminders();
  assert.equal(postConversionRun.sent, 0, 'No reminders may be sent for converted sessions');
  assert.equal(sentEmails.length, 1, 'Total sent emails must remain 1');
});

test('14. Conversion by customer email marks all matching abandoned sessions converted', async () => {
  const { service, store } = setupTest();

  const init1 = await service.initOrUpdateSession({
    customer: { email: 'buyer@example.com' },
    items: [sampleCartItem('prod-1', 'Box 1', 20000)],
  });

  const init2 = await service.initOrUpdateSession({
    customer: { email: 'buyer@example.com' },
    items: [sampleCartItem('prod-2', 'Box 2', 20000)],
  });

  await service.markConvertedByEmail('buyer@example.com', 'order-888', 'GTC-20261003-888');

  assert.equal(store.get(init1.sessionId)?.status, 'converted');
  assert.equal(store.get(init2.sessionId)?.status, 'converted');
});
