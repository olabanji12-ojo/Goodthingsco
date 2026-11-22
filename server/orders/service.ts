import { authorizeAdmin } from '../auth/admin.js';
import { createHash, randomBytes } from 'node:crypto';
import type { Order } from '../../src/types/order.js';
import type { OrderUpdateResult } from '../../src/types/orderManagement.js';
import { getAdminAuth } from '../firebase.js';
import { notificationService } from '../services/notificationService.js';
import { STATUS_EVENTS, type FulfillmentStatus } from '../email/types.js';
import { firestoreOrders, type OrderRepository } from './repository.js';
import { OrderHttpError, TRACKING_MISS, applyUpdate, effectiveHistory, listSummary, parseTracking, trackingSummary, validateUpdate, verificationMatches } from './domain.js';
import { normalizeTrackingPhone } from '../../src/utils/orderManagement.js';

type Identity = { uid: string; admin?: unknown; email?: string };
interface Dependencies {
  repository: OrderRepository;
  verify: (token: string) => Promise<Identity>;
  notify: typeof notificationService;
  now: () => string;
}
export function createOrderManagement(dependencies: Partial<Dependencies> = {}) {
  const repo = dependencies.repository || firestoreOrders;
  const verify = dependencies.verify || (token => getAdminAuth().verifyIdToken(token, true));
  const notify = dependencies.notify || notificationService;
  const now = dependencies.now || (() => new Date().toISOString());
  const admin = (authorization?: string) => authorizeAdmin(authorization, OrderHttpError, verify);
  function validId(id: string) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new OrderHttpError(400, 'Invalid order ID.');
  }
  return {
    async list(authorization: string | undefined, query: { get(name: string): string | null }) {
      await admin(authorization);
      const search = (query.get('search') || '').trim().toLowerCase().slice(0, 254);
      const status = query.get('status'); const payment = query.get('payment'); const sort = query.get('sort');
      const view = query.get('view');
      const page = Math.max(1, Math.min(100000, Number(query.get('page')) || 1));
      if (!Number.isSafeInteger(page)) throw new OrderHttpError(400, 'Invalid page.');
      const normalizedSearchPhone = normalizeTrackingPhone(search);
      const allOrders = await repo.list();

      const isIncomplete = (order: Order) =>
        order.payment.status !== 'paid' &&
        (order.payment.status === 'pending' ||
         order.payment.status === 'abandoned' ||
         order.payment.status === 'failed' ||
         order.orderStatus === 'pending-payment');
      const isCompleted = (order: Order) => !isIncomplete(order);

      const completedCount = allOrders.filter(isCompleted).length;
      const incompleteCount = allOrders.filter(isIncomplete).length;

      const orders = allOrders.filter(order => {
        if (view === 'completed' && !isCompleted(order)) return false;
        if (view === 'incomplete' && !isIncomplete(order)) return false;
        if (status && order.orderStatus !== status) return false;
        if (payment && order.payment.status !== payment) return false;
        if (search) {
          const match = [order.orderNumber, order.customer.fullName, order.customer.email, order.customer.phone]
            .some(value => value.toLowerCase().includes(search))
            || Boolean(normalizedSearchPhone && normalizeTrackingPhone(order.customer.phone)?.includes(normalizedSearchPhone));
          if (!match) return false;
        }
        return true;
      });

      orders.sort((a, b) => sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt)
        : sort === 'delivery' ? (a.delivery.expectedDeliveryDate || a.delivery.preferredDate || '9999').localeCompare(b.delivery.expectedDeliveryDate || b.delivery.preferredDate || '9999')
        : b.createdAt.localeCompare(a.createdAt));
      return {
        orders: orders.slice((page - 1) * 30, page * 30).map(listSummary),
        total: orders.length,
        page,
        pageSize: 30,
        completedCount,
        incompleteCount,
      };
    },
    async delete(authorization: string | undefined, id: string) {
      await admin(authorization); validId(id);
      const success = await repo.delete(id);
      if (!success) throw new OrderHttpError(404, 'Order not found.');
      return { success: true, id };
    },
    async clear(authorization: string | undefined, scope: 'all' | 'incomplete' = 'all') {
      await admin(authorization);
      const result = await repo.clear(scope);
      return { success: true, ...result };
    },
    async detail(authorization: string | undefined, id: string) {
      await admin(authorization); validId(id);
      const order = await repo.get(id);
      if (!order) throw new OrderHttpError(404, 'Order not found.');
      return { ...order, statusHistory: effectiveHistory(order) };
    },
    async update(authorization: string | undefined, id: string, body: unknown): Promise<OrderUpdateResult> {
      const actor = await admin(authorization); validId(id);
      const input = validateUpdate(body);
      const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
      const committed = await repo.change(id, input.eventId, (order, prior) => {
        if (!order) throw new OrderHttpError(404, 'Order not found.');
        if (prior) {
          if (prior.hash !== hash || prior.actor !== actor.uid) throw new OrderHttpError(409, 'Change ID was already used for a different request.');
          return { result: { order, changed: prior.changed, replayed: true, statusChanged: false, notifyIssue: false, notifications: prior.notifications } };
        }
        const change = applyUpdate(order, input, actor.uid, now());
        const notifications = (change.statusChanged && Object.prototype.hasOwnProperty.call(STATUS_EVENTS, change.order.orderStatus)) || change.notifyIssue ? 'attempted' as const : 'none' as const;
        return { ...(change.changed ? { order: change.order } : {}),
          receipt: { hash, actor: actor.uid, createdAt: now(), revision: change.order.revision || 0,
            changed: change.changed, notifications, note: input.note || '' },
          result: { ...change, replayed: false, notifications },
        };
      });
      // Only the transaction creator sends. Receipts survive restarts and later status changes.
      let notifications = committed.notifications;
      if (!committed.replayed && notifications === 'attempted') {
        try {
          const tasks = [];
          if (committed.statusChanged && Object.prototype.hasOwnProperty.call(STATUS_EVENTS, committed.order.orderStatus)) tasks.push(
            notify.orderStatusChanged(committed.order, committed.order.orderStatus as FulfillmentStatus, `${id}:${input.eventId}:status`, committed.order.delivery));
          if (committed.notifyIssue) tasks.push(notify.orderDelayed(committed.order, committed.order.deliveryIssue!.message,
            `${id}:${input.eventId}:issue`, committed.order.delivery));
          const results = (await Promise.all(tasks)).flat();
          notifications = results.some(result => !result.sent && !result.skipped) ? 'failed'
            : results.every(result => result.skipped) ? 'skipped' : 'accepted';
        } catch { notifications = 'failed'; }
        try { await repo.recordResult(id, input.eventId, notifications); } catch {
          console.error('[OrderManagement] Notification receipt could not be updated');
        }
      }
      return { order: committed.order, changed: committed.changed, replayed: committed.replayed, notifications };
    },
    async track(body: unknown, clientAddress: string) {
      const clientKey = createHash('sha256').update(`tracking-client:${clientAddress}`).digest('hex');
      if (!await repo.throttle(clientKey, 30, 15 * 60_000)) throw new OrderHttpError(429, 'Too many attempts. Please try again in 15 minutes.');
      const input = parseTracking(body);
      const orderKey = createHash('sha256').update(`tracking-order:${input.orderNumber}`).digest('hex');
      if (!await repo.throttle(orderKey, 15, 15 * 60_000)) throw new OrderHttpError(429, 'Too many attempts. Please try again in 15 minutes.');
      const orders = await repo.find(input.orderNumber);
      if (orders.length !== 1 || !verificationMatches(orders[0], input.verification)) throw new OrderHttpError(404, TRACKING_MISS);
      const token = randomBytes(32).toString('hex');
      await repo.saveSession(createHash('sha256').update(token).digest('hex'), orders[0].id!, Date.now() + 30 * 60_000);
      return { order: trackingSummary(orders[0]), token };
    },
    async resume(token: string) {
      if (!/^[a-f0-9]{64}$/.test(token)) throw new OrderHttpError(401, 'Verify your order details to continue.');
      const session = await repo.session(createHash('sha256').update(token).digest('hex'));
      if (!session || session.expiresAt <= Date.now()) throw new OrderHttpError(401, 'Your tracking session expired. Please verify again.');
      const order = await repo.get(session.orderId);
      if (!order) throw new OrderHttpError(404, TRACKING_MISS);
      return trackingSummary(order);
    },
    async forget(token: string) {
      if (/^[a-f0-9]{64}$/.test(token)) await repo.deleteSession(createHash('sha256').update(token).digest('hex'));
    },
  };
}
export const orderManagement = createOrderManagement();
