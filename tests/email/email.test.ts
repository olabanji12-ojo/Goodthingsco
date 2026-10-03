import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createEmailService } from '../../server/services/emailService';
import { createNotificationService } from '../../server/services/notificationService';
import { getEmailConfig } from '../../server/email/config';
import { renderEmail } from '../../server/email/templates';
import { STATUS_EVENTS, toOrderEmailData, type NotificationLog } from '../../server/email/types';
import { sampleNotifications, sampleOrder, sampleCheckout } from './fixtures';
import { confirmPaidOrderServer, createPendingOrderServer } from '../../server/orderService';
import { resetOrderMocks, state } from './orderMocks';

const configuredEnv = {
  RESEND_API_KEY: 're_FAKE_TEST_KEY_NEVER_SENT', EMAIL_FROM: 'Good Things Co. <sender@example.com>',
  EMAIL_REPLY_TO: 'reply@example.com', ADMIN_NOTIFICATION_EMAIL: 'admin@example.com',
};
const configured = getEmailConfig(configuredEnv);
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const originalInfo = console.info;
const originalError = console.error;
const originalWarn = console.warn;
let requests: Array<{ url: string; init: RequestInit }>;
let capturedLogs: string[];

beforeEach(() => {
  Object.assign(process.env, configuredEnv);
  process.env.NODE_ENV = 'development';
  requests = []; capturedLogs = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init! });
    return new Response(JSON.stringify({ id: 'email-test-id' }), { status: 200 });
  };
  console.info = (...args) => { capturedLogs.push(args.join(' ')); };
  console.error = (...args) => { capturedLogs.push(args.join(' ')); };
  console.warn = (...args) => { capturedLogs.push(args.join(' ')); };
  resetOrderMocks();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of [...Object.keys(configuredEnv), 'NODE_ENV']) {
    if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key];
  }
  console.info = originalInfo; console.error = originalError; console.warn = originalWarn;
});

function service(overrides: Parameters<typeof createEmailService>[0] = {}) {
  const logs: NotificationLog[] = [];
  return { email: createEmailService({ config: () => configured, log: entry => logs.push(entry), ...overrides }), logs };
}
const notification = () => sampleNotifications()[0];

test('each missing configuration variable skips delivery honestly, with no fetch', async () => {
  for (const key of Object.keys(configuredEnv)) {
    const incomplete = { ...configuredEnv, [key]: '' };
    const { email, logs } = service({ config: () => getEmailConfig(incomplete) });
    assert.deepEqual(await email.sendEmail(notification()), { sent: false, skipped: true, reason: 'Email provider not configured' });
    assert.equal(logs[0].event, 'ORDER_PLACED');
    assert.equal(logs[0].orderNumber, sampleOrder().orderNumber);
    assert.equal(logs[0].recipient, 'customer@example.com');
  }
  assert.equal(requests.length, 0);
});

test('configuration rejects header injection and reads environment lazily', async () => {
  assert.equal(getEmailConfig({ ...configuredEnv, EMAIL_FROM: 'Good <sender@example.com>\r\nBcc: victim@example.com' }).configured, false);
  assert.equal(getEmailConfig({ ...configuredEnv, EMAIL_REPLY_TO: 'a@example.com,b@example.com' }).configured, false);
  const email = createEmailService();
  delete process.env.RESEND_API_KEY;
  assert.equal((await email.sendEmail(notification())).skipped, true);
  process.env.RESEND_API_KEY = configuredEnv.RESEND_API_KEY;
  assert.equal((await email.sendEmail(notification())).sent, true);
});

test('Resend request uses central sender/reply-to, HTML/text and stable idempotency keys', async () => {
  const { email, logs } = service();
  const result = await email.sendEmail(notification());
  assert.deepEqual(result, { sent: true, skipped: false, provider: 'resend', providerStatus: 'accepted', providerId: 'email-test-id' });
  await email.sendEmail(notification());
  assert.equal(requests[0].url, 'https://api.resend.com/emails');
  const body = JSON.parse(String(requests[0].init.body));
  assert.equal(body.from, configuredEnv.EMAIL_FROM);
  assert.equal(body.reply_to, configuredEnv.EMAIL_REPLY_TO);
  assert.deepEqual(body.to, ['customer@example.com']);
  assert.match(body.html, /GOOD THINGS CO/);
  assert.match(body.text, /Payment has not yet been confirmed/);
  assert.equal((requests[0].init.headers as Record<string, string>)['Idempotency-Key'],
    (requests[1].init.headers as Record<string, string>)['Idempotency-Key']);
  assert.equal(JSON.stringify(logs).includes(configuredEnv.RESEND_API_KEY), false);
  assert.equal(JSON.stringify(logs).includes('<html'), false);
});

for (const fixture of sampleNotifications().filter(n => n.event !== 'ABANDONED_CHECKOUT')) {
  test(`${fixture.event}: renders and reaches mocked Resend with correct recipient`, async () => {
    const { email } = service();
    assert.equal((await email.sendEmail(fixture)).sent, true);
    const body = JSON.parse(String(requests[0].init.body));
    assert.deepEqual(body.to, [fixture.event.endsWith('_ADMIN') ? 'admin@example.com' : 'customer@example.com']);
    assert.match(body.html, /max-width:600px/);
    assert.match(body.html, /name="viewport"/);
    assert.ok(body.text.length > 100);
    if ('orderNumber' in fixture.data) assert.ok(body.text.includes(fixture.data.orderNumber));
  });
}

test('templates escape user HTML, strip subject newlines, reject unsafe tracking links, omit private fields', () => {
  const order = sampleOrder();
  order.customer.fullName = '<img src=x onerror=alert(1)>';
  order.items[0].name = '<script>alert("x")</script>';
  order.orderNumber = 'ORDER\r\nBcc: somebody';
  const rendered = renderEmail({ event: 'ORDER_PLACED', eventId: 'escape',
    data: toOrderEmailData(order, { trackingUrl: 'javascript:alert(1)' }) });
  assert.ok(!rendered.html.includes('<script>'));
  assert.ok(!rendered.html.includes('<img'));
  assert.ok(rendered.html.includes('&lt;script&gt;'));
  assert.ok(!rendered.html.includes('javascript:'));
  assert.ok(!rendered.subject.includes('\n'));
  for (const privateValue of ['PRIVATE GIFT MESSAGE', 'private-payment-reference', '+234-private', '12 Example Lane']) {
    assert.ok(!rendered.html.includes(privateValue));
    assert.ok(!rendered.text.includes(privateValue));
  }
});

test('provider errors, malformed responses and network failures return failures without leaking raw errors', async () => {
  for (const status of [401, 422, 429, 500]) {
    const { email } = service({ fetch: async () => new Response(`secret ${configuredEnv.RESEND_API_KEY}`, { status }) });
    assert.deepEqual(await email.sendEmail(notification()), { sent: false, skipped: false, error: 'Resend rejected the email', httpStatus: status });
  }
  for (const fetcher of [
    async () => { throw new Error(configuredEnv.RESEND_API_KEY); },
    async () => new Response('not json'),
    async () => new Response('{}'),
  ]) {
    const { email, logs } = service({ fetch: fetcher });
    const result = await email.sendEmail(notification());
    assert.equal(result.sent, false); assert.equal(result.skipped, false);
    assert.ok(!JSON.stringify(logs).includes(configuredEnv.RESEND_API_KEY));
  }
});

test('timeout is bounded and logging failure cannot reject email work', async () => {
  const { email } = service({ timeoutMs: 10, log: () => { throw new Error('logger unavailable'); },
    fetch: async (_url, init) => new Promise((_resolve, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('test watchdog')), 1000);
      init!.signal!.addEventListener('abort', () => { clearTimeout(keepAlive); reject(init!.signal!.reason); });
    }) });
  const started = Date.now();
  assert.deepEqual(await email.sendEmail(notification()), { sent: false, skipped: false, error: 'Email provider timed out' });
  assert.ok(Date.now() - started < 1000);
});

test('invalid recipient, missing delay message and unpaid confirmations cannot send', async () => {
  const { email } = service();
  const data = toOrderEmailData(sampleOrder());
  assert.equal((await email.sendPaymentConfirmedEmail(data)).sent, false);
  assert.equal((await email.sendOrderDelayEmail(data, '', 'delay')).sent, false);
  assert.equal((await email.sendOrderPlacedEmail({ ...data, customerEmail: 'a@example.com,b@example.com' })).sent, false);
  assert.equal(requests.length, 0);
});

test('status hooks require committed status and include delivery details', async () => {
  const { email } = service();
  const notifications = createNotificationService(email);
  const order = sampleOrder();
  assert.equal((await notifications.orderStatusChanged(order, 'preparing', 'rev-1'))[0].skipped, true);
  for (const status of Object.keys(STATUS_EVENTS) as Array<keyof typeof STATUS_EVENTS>) {
    order.orderStatus = status;
    const result = await notifications.orderStatusChanged(order, status, `rev-${status}`, {
      courierName: 'Example Courier', trackingNumber: 'TRACK-42', trackingUrl: 'https://example.com/track/42', expectedDeliveryDate: '2026-10-09',
    });
    assert.equal(result[0].sent, true);
    const body = JSON.parse(String(requests.at(-1)!.init.body));
    assert.match(body.text, /TRACK-42/); assert.match(body.text, /2026-10-09/);
  }
  assert.equal((await notifications.orderDelayed(order, 'A delivery issue is being resolved.', 'delay-2', { expectedDeliveryDate: '2026-10-10' }))[0].sent, true);
});

test('abandoned checkout sends live reminder; test email is restricted to development', async () => {
  const { email } = service();
  const abandoned = sampleNotifications().find(n => n.event === 'ABANDONED_CHECKOUT')!;
  assert.equal((await email.sendEmail(abandoned)).sent, true);
  process.env.NODE_ENV = 'production';
  assert.equal((await email.sendTestEmail('test@example.com')).skipped, true);
  process.env.NODE_ENV = 'development';
  assert.equal((await email.sendTestEmail('test@example.com')).sent, true);
});

test('notification orchestration catches unexpected template/mapping errors', async () => {
  const notifications = createNotificationService();
  const order = sampleOrder();
  Object.defineProperty(order, 'items', { get() { throw new Error('bad snapshot'); } });
  assert.equal((await notifications.orderCreated(order))[0].sent, false);
});

test('real order creation path succeeds without email configuration', async () => {
  delete process.env.RESEND_API_KEY;
  const result = await createPendingOrderServer(sampleCheckout(), 'https://example.com');
  assert.equal(result.success, true);
  assert.equal(state.orders.get('new-order')?.payment.status, 'pending');
  assert.equal(requests.length, 0);
  assert.ok(capturedLogs.some(line => line.includes('ORDER_PLACED') && line.includes('Email provider not configured')));
  assert.ok(capturedLogs.some(line => line.includes('NEW_ORDER_ADMIN')));
});

test('order creation remains successful when Resend fails', async () => {
  globalThis.fetch = async () => { throw new Error('provider outage'); };
  const result = await createPendingOrderServer(sampleCheckout(), 'https://example.com');
  assert.equal(result.success, true);
  assert.ok(state.orders.has('new-order'));
});

test('verified payment persists successfully despite provider failure', async () => {
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  const result = await confirmPaidOrderServer('private-payment-reference');
  assert.equal(result.success, true);
  assert.equal(state.orders.get('order-1')?.payment.status, 'paid');
  assert.equal(state.stock, 8);
  assert.ok(capturedLogs.some(line => line.includes('PAYMENT_CONFIRMED') && line.includes('503')));
});

test('concurrent verification/webhook and replay send only one customer/admin pair', async () => {
  const results = await Promise.all([confirmPaidOrderServer('ref'), confirmPaidOrderServer('ref')]);
  assert.ok(results.every(result => result.success));
  assert.equal(results.filter(result => result.alreadyProcessed).length, 1);
  assert.equal(state.stock, 8);
  assert.equal(requests.length, 2);
  const replay = await confirmPaidOrderServer('ref');
  assert.equal(replay.alreadyProcessed, true);
  assert.equal(requests.length, 2);
});

test('simulated payment emits skipped logs but no live emails', async () => {
  state.verification.isSimulated = true;
  const result = await confirmPaidOrderServer('ref');
  assert.equal(result.success, true);
  assert.equal(requests.length, 0);
  assert.ok(capturedLogs.some(line => line.includes('Simulated payment')));
});

test('amount/currency mismatch alerts only admin and does not confirm payment', async () => {
  for (const mismatch of [{ amountKobo: 0, currency: 'NGN' }, { amountKobo: 5350000, currency: 'USD' }]) {
    resetOrderMocks(); requests = [];
    Object.assign(state.verification, mismatch);
    assert.equal((await confirmPaidOrderServer('ref')).success, false);
    assert.equal(state.orders.get('order-1')?.payment.status, 'pending');
    assert.equal(requests.length, 1);
    assert.deepEqual(JSON.parse(String(requests[0].init.body)).to, ['admin@example.com']);
  }
});

test('inventory exception confirms payment, alerts admin and avoids promising preparation', async () => {
  state.stock = 0;
  const result = await confirmPaidOrderServer('ref');
  assert.equal(result.success, true);
  assert.equal(result.order?.orderStatus, 'confirmed-review-required');
  assert.equal(requests.length, 3);
  const customerBody = requests.map(r => JSON.parse(String(r.init.body))).find(body => body.to[0] === 'customer@example.com');
  assert.match(customerBody.text, /reviewing a fulfillment issue/);
});
