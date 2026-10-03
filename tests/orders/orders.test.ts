import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createOrderManagement } from '../../server/orders/service';
import { createOrderHttp } from '../../server/orders/http';
import { applyUpdate, validateUpdate, verificationMatches, trackingSummary, OrderHttpError, TRACKING_MISS } from '../../server/orders/domain';
import { notificationService } from '../../server/services/notificationService';
import { OrderTimeline } from '../../src/components/orders/OrderTimeline';
import { normalizeTrackingPhone, safeTrackingUrl } from '../../src/utils/orderManagement';
import { managedOrder, memoryRepository } from './memory';
import type { OrderUpdateInput } from '../../src/types/orderManagement';
import type { OrderStatus } from '../../src/types/order';

const input = (status: OrderStatus = 'preparing', revision = 0, id = 'change-00000000000001'): OrderUpdateInput => ({ eventId: id, expectedRevision: revision, status });
function setup() {
  const memory = memoryRepository();
  const events: string[] = [];
  let emailFailure = false;
  const service = createOrderManagement({ repository: memory.repository,
    verify: async token => { if (token === 'revoked') throw new Error('revoked'); return { uid: 'admin-uid', admin: token === 'admin' }; },
    now: () => '2026-10-03T12:00:00.000Z',
    notify: { ...notificationService,
      async orderStatusChanged(order, status, eventId) {
        assert.equal(memory.orders.get(order.id!)?.orderStatus, status, 'persist before email');
        assert.ok(memory.receipts.size > 0, 'receipt must be durable first');
        events.push(eventId);
        if (emailFailure) throw new Error('mail outage');
        return [{ sent: false, skipped: true, reason: 'Email provider not configured' }];
      },
      async orderDelayed(order, message, eventId) {
        assert.equal(memory.orders.get(order.id!)?.deliveryIssue?.message, message);
        events.push(eventId); return [{ sent: false, skipped: true, reason: 'Email provider not configured' }];
      },
    },
  });
  return { ...memory, events, service, failEmail: () => { emailFailure = true; } };
}
for (const authorization of [undefined, 'Bearer normal', 'Bearer revoked', 'gtc_admin_auth=fake']) {
  test(`admin APIs reject unauthorized session: ${authorization}`, async () => {
    const { service, events, receipts } = setup();
    for (const action of [() => service.list(authorization, new URLSearchParams()), () => service.detail(authorization, 'order-1'), () => service.update(authorization, 'order-1', input())]) {
      await assert.rejects(action, error => error instanceof OrderHttpError && [401, 403].includes(error.status));
    }
    assert.equal(events.length, 0); assert.equal(receipts.size, 0);
  });
}
test('list defaults to newest and search covers number, customer, email and normalized phone', async () => {
  const { service, orders } = setup();
  const older = managedOrder(); older.id = 'order-2'; older.orderNumber = 'GTC-20261001-OLD2'; older.createdAt = '2026-10-01T00:00:00Z';
  older.customer = { fullName: 'Another Buyer', email: 'another@example.com', phone: '08098765432' }; older.orderStatus = 'packaged';
  older.payment.status = 'pending'; orders.set(older.id, older);
  const newest = await service.list('Bearer admin', new URLSearchParams());
  assert.equal(newest.orders[0].id, 'order-1');
  for (const search of ['GTC-20261002', 'ada', 'customer@example.com', '+2349012345678']) {
    const result = await service.list('Bearer admin', new URLSearchParams({ search }));
    assert.deepEqual(result.orders.map(order => order.id), ['order-1']);
  }
  assert.equal((await service.list('Bearer admin', new URLSearchParams({ status: 'packaged' }))).orders[0].id, 'order-2');
  assert.equal((await service.list('Bearer admin', new URLSearchParams({ payment: 'pending' }))).orders[0].id, 'order-2');
  assert.equal((await service.list('Bearer admin', new URLSearchParams({ sort: 'oldest' }))).orders[0].id, 'order-2');
  assert.equal((await service.detail('Bearer admin', 'order-1')).customer.phone, '09012345678');
});
test('whole fulfillment lifecycle persists history and sends each event once', async () => {
  const { service, orders, events } = setup();
  const statuses: OrderStatus[] = ['preparing', 'packaged', 'dispatched', 'out-for-delivery', 'delivered'];
  for (const [index, status] of statuses.entries()) {
    const update = input(status, index, `change-0000000000000${index}`);
    const result = await service.update('Bearer admin', 'order-1', update);
    assert.equal(result.order.orderStatus, status); assert.equal(result.order.revision, index + 1);
    const entry = result.order.statusHistory!.at(-1)!;
    assert.equal(entry.status, status); assert.equal(entry.changedBy, 'admin-uid'); assert.equal(entry.eventId, update.eventId);
    assert.equal((await service.update('Bearer admin', 'order-1', update)).replayed, true);
    assert.equal(events.length, index + 1);
  }
  assert.equal(orders.get('order-1')!.statusHistory!.length, 7);
  await assert.rejects(() => service.update('Bearer admin', 'order-1', input('preparing', 5, 'new-change-00000001')), /not allowed/);
});
test('concurrent identical retries produce one history entry and notification', async () => {
  const { service, events, orders } = setup();
  const results = await Promise.all([service.update('Bearer admin', 'order-1', input()), service.update('Bearer admin', 'order-1', input())]);
  assert.equal(results.filter(result => result.replayed).length, 1); assert.equal(events.length, 1);
  assert.equal(orders.get('order-1')!.statusHistory!.length, 3);
});
test('stale revisions, reused IDs with new content, and no-op changes cannot resend', async () => {
  const { service, events } = setup();
  await service.update('Bearer admin', 'order-1', input());
  await assert.rejects(() => service.update('Bearer admin', 'order-1', input('packaged', 0, 'different-event-123')), /changed/);
  await assert.rejects(() => service.update('Bearer admin', 'order-1', input('packaged', 1)), /already used/);
  const unchanged = await service.update('Bearer admin', 'order-1', input('preparing', 1, 'no-op-event-123456'));
  assert.equal(unchanged.changed, false); assert.equal(events.length, 1);
});
test('courier fields, dates and delivery issue persist; delay hook fires after commit', async () => {
  const { service, events } = setup();
  const change = { ...input('confirmed'), delivery: { courierName: 'Example Courier', trackingNumber: 'T-123',
    trackingUrl: 'https://example.com/tracking', expectedDeliveryDate: '2026-10-09' }, deliveryIssue: { active: true, message: 'Delivery is delayed by one day.' } };
  const result = await service.update('Bearer admin', 'order-1', change);
  assert.equal(result.order.delivery.courierName, 'Example Courier'); assert.equal(result.order.deliveryIssue?.updatedExpectedDeliveryDate, '2026-10-09');
  assert.equal(events.length, 1);
  await service.update('Bearer admin', 'order-1', change); assert.equal(events.length, 1);
  await service.update('Bearer admin', 'order-1', { ...input('confirmed', 1, 'resolve-event-123456'), deliveryIssue: { active: false, message: '' } });
  assert.equal(events.length, 1);
});
test('unsafe links, invalid dates and protected fields are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'http://example.com', 'https://user:pass@example.com']) {
    assert.equal(safeTrackingUrl(url), undefined);
    assert.throws(() => validateUpdate({ ...input(), delivery: { courierName: '', trackingNumber: '', expectedDeliveryDate: '', trackingUrl: url } }), /HTTPS/);
  }
  assert.throws(() => validateUpdate({ ...input(), delivery: { courierName: '', trackingNumber: '', expectedDeliveryDate: '2026-02-30', trackingUrl: '' } }), /date/);
  for (const field of ['payment', 'customer', 'statusHistory', 'total']) assert.throws(() => validateUpdate({ ...input(), [field]: {} }), /Unsupported/);
});
test('cancel requires confirmation/reason, unpaid fulfillment blocked, manual review can resolve', () => {
  const order = managedOrder();
  assert.throws(() => applyUpdate(order, input('cancelled'), 'admin', 'now'), /Confirm cancellation/);
  const cancelled = applyUpdate(order, { ...input('cancelled'), confirmCancellation: true, note: 'Customer requested cancellation' }, 'admin', 'now');
  assert.equal(cancelled.order.orderStatus, 'cancelled'); assert.equal(cancelled.order.payment.status, 'paid');
  order.payment.status = 'pending'; assert.throws(() => applyUpdate(order, input(), 'admin', 'now'), /paid/);
  order.payment.status = 'paid'; order.orderStatus = 'confirmed-review-required';
  assert.equal(applyUpdate(order, input('confirmed'), 'admin', 'now').order.orderStatus, 'confirmed');
});
test('failed persistence sends no emails; email failures never undo saved changes', async () => {
  const first = setup(); first.controls.failWrite = true;
  await assert.rejects(() => first.service.update('Bearer admin', 'order-1', input())); assert.equal(first.events.length, 0);
  assert.equal(first.orders.get('order-1')!.orderStatus, 'confirmed');
  const second = setup(); second.failEmail();
  const result = await second.service.update('Bearer admin', 'order-1', input());
  assert.equal(result.notifications, 'failed'); assert.equal(second.orders.get('order-1')!.orderStatus, 'preparing');
  await second.service.update('Bearer admin', 'order-1', input()); assert.equal(second.events.length, 1);
});
test('email and Nigerian phone normalization verify the customer, not the recipient', () => {
  const order = managedOrder();
  for (const value of [' CUSTOMER@EXAMPLE.COM ', '0901 234 5678', '+2349012345678', '002349012345678']) assert.equal(verificationMatches(order, value), true);
  assert.equal(verificationMatches(order, 'recipient@example.com'), false);
  assert.equal(normalizeTrackingPhone('090letters'), undefined);
});
test('wrong verification, malformed number and unknown order produce identical misses', async () => {
  const { service } = setup();
  for (const data of [{ orderNumber: 'GTC-20261002-DEMO', verification: 'wrong@example.com' },
    { orderNumber: 'GTC-20261002-NONE', verification: 'customer@example.com' },
    { orderNumber: 'bad', verification: 'customer@example.com' }, { orderNumber: 'GTC-20261002-DEMO' }]) {
    await assert.rejects(() => service.track(data, 'client'), error => error instanceof OrderHttpError && error.status === 404 && error.message === TRACKING_MISS);
  }
});
test('tracking allowlist omits personal contacts, IDs, notes and payment internals', () => {
  const order = managedOrder(); order.statusHistory![1].note = 'PRIVATE ADMIN NOTE';
  order.delivery.trackingUrl = 'javascript:bad()';
  const result = trackingSummary(order); const serialized = JSON.stringify(result);
  for (const secret of ['order-1', 'PRIVATE ADMIN NOTE', order.customer.email, order.customer.phone, '12 Example Lane', 'private-payment-reference', 'PRIVATE GIFT MESSAGE', 'changedBy', 'eventId', 'transactionId', 'javascript:']) assert.ok(!serialized.includes(secret), secret);
  assert.equal(result.items[0].quantity, 2);
});
test('tracking session refresh returns fresh state, expires, and can be cleared', async () => {
  const { service, orders, sessions } = setup();
  const { token, order } = await service.track({ orderNumber: 'gtc-20261002-demo', verification: '+2349012345678' }, 'client');
  assert.equal(order.orderNumber, 'GTC-20261002-DEMO'); assert.ok(!sessions.has(token));
  orders.get('order-1')!.orderStatus = 'preparing';
  assert.equal((await service.resume(token)).orderStatus, 'preparing');
  const hash = createHash('sha256').update(token).digest('hex'); sessions.get(hash)!.expiresAt = 0;
  await assert.rejects(() => service.resume(token), /expired/);
  await service.forget(token); assert.equal(sessions.size, 0);
});
test('distributed throttling stops repeated guessing', async () => {
  const { service } = setup();
  for (let index = 0; index < 15; index++) await assert.rejects(() => service.track({ orderNumber: 'GTC-20261002-DEMO', verification: 'wrong@example.com' }, `client-${index}`));
  await assert.rejects(() => service.track({ orderNumber: 'GTC-20261002-DEMO', verification: 'wrong@example.com' }, 'new-client'), error => error instanceof OrderHttpError && error.status === 429);
});
test('timeline marks only recorded steps; skipped future steps stay incomplete', () => {
  const order = managedOrder(); order.orderStatus = 'dispatched'; order.statusHistory!.push({ status: 'dispatched', changedAt: '2026-10-03', changedBy: 'admin', eventId: 'dispatch' });
  const html = renderToStaticMarkup(createElement(OrderTimeline, { order: trackingSummary(order) }));
  assert.ok(html.includes('aria-current="step"')); assert.ok(html.includes('Dispatched'));
  assert.equal((html.match(/No update recorded yet/g) || []).length, 4);
});
test('HTTP routes enforce authorization, no-store, HttpOnly session and retire legacy lookup', async () => {
  const { service } = setup(); const handle = createOrderHttp(service);
  const server = createServer((req, res) => { void handle(req, res); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number }; const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${base}/api/admin/orders`)).status, 401);
    assert.equal((await fetch(`${base}/api/orders/GTC-20261002-DEMO`)).status, 410);
    const response = await fetch(`${base}/api/track-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber: 'GTC-20261002-DEMO', verification: 'customer@example.com' }) });
    assert.equal(response.status, 200); assert.match(response.headers.get('cache-control')!, /no-store/);
    const cookie = response.headers.get('set-cookie')!; assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    const result = await response.json() as Record<string, unknown>; assert.deepEqual(Object.keys(result).sort(), ['order', 'success']);
    assert.equal((await fetch(`${base}/api/track-order`, { headers: { Cookie: cookie.split(';')[0] } })).status, 200);
    assert.equal((await fetch(`${base}/api/track-order`)).status, 401);
    assert.equal((await fetch(`${base}/api/track-order`, { method: 'DELETE', headers: { Cookie: cookie.split(';')[0] } })).status, 200);
    assert.equal((await fetch(`${base}/api/track-order`, { headers: { Cookie: cookie.split(';')[0] } })).status, 401);
    assert.equal((await fetch(`${base}/api/track-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
test('rules explicitly deny client order access and require custom admin claims for products', async () => {
  const rules = await readFile('firestore.rules', 'utf8');
  assert.match(rules, /request\.auth\.token\.admin == true/);
  assert.match(rules, /match \/orders\/\{orderId\} \{\s*allow read, write: if false;/);
  assert.ok(!rules.includes('allow create: if request.resource.data'));
});
