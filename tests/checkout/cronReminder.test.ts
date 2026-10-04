/**
 * Good Things Co. — Abandoned Checkout Vercel Cron Integration Tests
 *
 * Verifies:
 * 1. Request with no Authorization header -> 401 Unauthorized
 * 2. Request with wrong Bearer token -> 401 Unauthorized
 * 3. Request with correct CRON_SECRET -> 200 Processor runs
 * 4. No eligible abandoned checkout -> safe success with 0 processed
 * 5. One eligible session -> one reminder attempt
 * 6. Run again immediately -> no duplicate reminder (idempotency)
 * 7. Converted session -> skipped
 * 8. Session already at max reminders -> skipped
 * 9. GET and POST methods both supported for Vercel Cron & webhook triggers
 * 10. Minimal safe response with aggregate stats, zero customer PII leakage
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createAbandonedCheckoutService } from '../../server/checkout/service';
import { createCheckoutHttp } from '../../server/checkout/http';
import { memoryAbandonedCheckoutRepository, sampleCartItem } from './memory';
import type { AbandonedCheckoutConfig } from '../../server/checkout/abandonedConfig';
import type { IncomingMessage, ServerResponse } from 'node:http';

const TEST_CRON_SECRET = 'test_cron_secret_key_9876543210_abcdef';

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

function setupCronTest(configOverrides: Partial<AbandonedCheckoutConfig> = {}) {
  const { store, repository } = memoryAbandonedCheckoutRepository();
  const config = testConfig(configOverrides);
  let currentTime = new Date('2026-10-04T08:00:00.000Z').getTime();
  const nowFn = () => new Date(currentTime).toISOString();

  const sentEmails: Array<{
    type: string;
    to: string;
    data: any;
    eventId: string;
  }> = [];

  const mockNotify: any = {
    async abandonedCheckoutReminder(payload: any, eventId: string) {
      sentEmails.push({
        type: 'abandonedCheckoutReminder',
        to: payload.to || payload.customerEmail,
        data: payload.data || payload,
        eventId,
      });
      return [{ sent: true, provider: 'resend', id: `mock-${sentEmails.length}` }];
    },
  };

  const service = createAbandonedCheckoutService({
    repository,
    config: () => config,
    now: nowFn,
    notify: mockNotify,
  });

  const httpHandler = createCheckoutHttp(service);

  async function simulateRequest({
    path = '/api/checkout/process-reminders',
    method = 'GET',
    headers = {},
  }: {
    path?: string;
    method?: string;
    headers?: Record<string, string>;
  }): Promise<{ status: number; headers: Record<string, string>; body: any }> {
    let statusCode = 0;
    const resHeaders: Record<string, string> = {};
    let responseData = '';

    const req = {
      url: path,
      method,
      headers: {
        host: 'goodthingsco.ng',
        'x-forwarded-proto': 'https',
        ...headers,
      },
      [Symbol.asyncIterator]: async function* () {
        // empty body for GET
      },
    } as unknown as IncomingMessage;

    const res = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        resHeaders[name.toLowerCase()] = value;
      },
      end(chunk?: string) {
        if (chunk) responseData += chunk;
      },
      get statusCodeVal() {
        return statusCode;
      },
      set statusCodeVal(v: number) {
        statusCode = v;
      },
    } as unknown as ServerResponse;

    Object.defineProperty(res, 'statusCode', {
      get() { return statusCode; },
      set(v) { statusCode = v; },
    });

    const handled = await httpHandler(req, res);
    assert.equal(handled, true, `Route ${path} should be handled by checkout HTTP handler`);

    let body = {};
    try {
      body = JSON.parse(responseData);
    } catch {
      body = { raw: responseData };
    }

    return { status: statusCode, headers: resHeaders, body };
  }

  return {
    service,
    store,
    repository,
    sentEmails,
    advanceTime: (ms: number) => { currentTime += ms; },
    simulateRequest,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('1. Request with no Authorization header returns 401 Unauthorized', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { simulateRequest } = setupCronTest();

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: {},
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Unauthorized.');
});

test('2. Request with wrong Bearer token returns 401 Unauthorized', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { simulateRequest } = setupCronTest();

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: 'Bearer wrong-secret-token' },
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Unauthorized.');
});

test('3. Request with correct CRON_SECRET succeeds with 200 and triggers processor', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { simulateRequest } = setupCronTest();

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.stats);
  assert.equal(typeof response.body.stats.examined, 'number');
  assert.equal(typeof response.body.stats.eligible, 'number');
  assert.equal(typeof response.body.stats.sent, 'number');
});

test('4. No eligible abandoned checkout sessions returns 200 with 0 processed', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { simulateRequest } = setupCronTest();

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.stats, {
    examined: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  });
});

test('5. One eligible abandoned checkout session results in one reminder attempt', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { service, sentEmails, advanceTime, simulateRequest } = setupCronTest({
    abandonedAfterMinutes: 60,
  });

  // Create an active session with valid customer email
  await service.initOrUpdateSession({
    customer: { fullName: 'Amina Bello', email: 'amina@example.com' },
    items: [sampleCartItem('box-1', 'Celebration Box', 45000)],
  });

  // Advance time past 60 min inactivity threshold
  advanceTime(70 * 60 * 1000);

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.stats.examined, 1);
  assert.equal(response.body.stats.eligible, 1);
  assert.equal(response.body.stats.sent, 1);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'amina@example.com');
});

test('6. Idempotency: Immediate re-run does not send duplicate reminder', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { service, sentEmails, advanceTime, simulateRequest } = setupCronTest({
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
  });

  await service.initOrUpdateSession({
    customer: { fullName: 'Kolawole Johnson', email: 'kola@example.com' },
    items: [sampleCartItem('box-2', 'Artisan Hamper', 65000)],
  });

  advanceTime(70 * 60 * 1000);

  // First cron execution
  const res1 = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(res1.body.stats.sent, 1);
  assert.equal(sentEmails.length, 1);

  // Immediate second cron execution
  const res2 = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(res2.body.stats.sent, 0, 'Must NOT send duplicate email on immediate re-run');
  assert.equal(sentEmails.length, 1, 'Total sent emails must remain 1');
});

test('7. Converted checkout session is skipped by the cron processor', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { service, sentEmails, advanceTime, simulateRequest } = setupCronTest({
    abandonedAfterMinutes: 60,
  });

  const session = await service.initOrUpdateSession({
    customer: { fullName: 'Tunde Bakare', email: 'tunde@example.com' },
    items: [sampleCartItem('box-3', 'Velvet Box', 50000)],
  });

  // Customer completes payment
  await service.markConverted(session.sessionId, 'ord-123', 'GTC-20261004-123');

  advanceTime(70 * 60 * 1000);

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.stats.sent, 0, 'Converted session must never receive reminders');
  assert.equal(sentEmails.length, 0);
});

test('8. Session at max reminders is skipped by the cron processor', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { service, sentEmails, advanceTime, simulateRequest } = setupCronTest({
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
    maxReminders: 2,
  });

  await service.initOrUpdateSession({
    customer: { fullName: 'Chioma Ade', email: 'chioma@example.com' },
    items: [sampleCartItem('box-4', 'Silk Box', 55000)],
  });

  // Reminder 1
  advanceTime(70 * 60 * 1000);
  await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(sentEmails.length, 1);

  // Reminder 2 (after 24h delay)
  advanceTime(25 * 3600 * 1000);
  await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(sentEmails.length, 2);

  // Attempt Reminder 3 (after another 48h): maxReminders is 2, so this must be skipped
  advanceTime(48 * 3600 * 1000);
  const res3 = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });

  assert.equal(res3.body.stats.sent, 0, 'Exceeded max reminders must be skipped');
  assert.equal(sentEmails.length, 2, 'No further emails sent after max reminders');
});

test('9. Both GET and POST methods, and both path aliases are supported', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { simulateRequest } = setupCronTest();

  // Test GET /api/checkout/process-reminders (Vercel Cron native)
  const get1 = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(get1.status, 200);

  // Test POST /api/checkout/process-reminders (Manual / CLI trigger)
  const post1 = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'POST',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(post1.status, 200);

  // Test GET /api/checkout/reminders/process (Legacy alias)
  const get2 = await simulateRequest({
    path: '/api/checkout/reminders/process',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(get2.status, 200);

  // Test POST /api/checkout/reminders/process (Legacy alias)
  const post2 = await simulateRequest({
    path: '/api/checkout/reminders/process',
    method: 'POST',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });
  assert.equal(post2.status, 200);
});

test('10. Response contains strictly aggregate stats and zero customer PII', async () => {
  process.env.CRON_SECRET = TEST_CRON_SECRET;
  const { service, advanceTime, simulateRequest } = setupCronTest();

  await service.initOrUpdateSession({
    customer: { fullName: 'Secret User', email: 'secret@private.com', phone: '+2348011223344' },
    items: [sampleCartItem('box-priv', 'Private Gift Box', 99000)],
  });

  advanceTime(70 * 60 * 1000);

  const response = await simulateRequest({
    path: '/api/checkout/process-reminders',
    method: 'GET',
    headers: { authorization: `Bearer ${TEST_CRON_SECRET}` },
  });

  const responseText = JSON.stringify(response.body);
  assert.ok(!responseText.includes('secret@private.com'), 'Must not leak customer email');
  assert.ok(!responseText.includes('Secret User'), 'Must not leak customer name');
  assert.ok(!responseText.includes('+2348011223344'), 'Must not leak phone');
  assert.ok(!responseText.includes('Private Gift Box'), 'Must not leak item names');
  assert.deepEqual(Object.keys(response.body), ['success', 'stats']);
  assert.deepEqual(Object.keys(response.body.stats).sort(), ['eligible', 'examined', 'failed', 'sent', 'skipped'].sort());
});
