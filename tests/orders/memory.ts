import type { OrderRepository, ChangeReceipt } from '../../server/orders/repository';
import type { Order } from '../../src/types/order';
import { sampleOrder } from '../email/fixtures';

export function managedOrder(): Order {
  const order = sampleOrder();
  order.customer.phone = '09012345678'; order.orderStatus = 'confirmed'; order.payment.status = 'paid';
  order.payment.paidAt = '2026-10-02T12:01:00.000Z'; order.revision = 0;
  order.statusHistory = [
    { eventId: 'created', status: 'pending-payment', changedAt: order.createdAt, changedBy: 'system:checkout' },
    { eventId: 'paid', status: 'confirmed', changedAt: order.payment.paidAt, changedBy: 'system:paystack' },
  ];
  return order;
}
export function memoryRepository(initial: Order[] = [managedOrder()]) {
  const orders = new Map(initial.map(order => [order.id!, structuredClone(order)]));
  const receipts = new Map<string, ChangeReceipt>();
  const sessions = new Map<string, { orderId: string; expiresAt: number }>();
  const counters = new Map<string, number>();
  let queue = Promise.resolve();
  const controls = { failWrite: false, failLog: false };
  const repository: OrderRepository = {
    async list() { return structuredClone([...orders.values()]); },
    async get(id) { return structuredClone(orders.get(id) || null); },
    async find(number) { return structuredClone([...orders.values()].filter(order => order.orderNumber === number)); },
    async change(id, eventId, work) {
      const prior = queue; let release!: () => void;
      queue = new Promise<void>(resolve => { release = resolve; }); await prior;
      try {
        const outcome = work(structuredClone(orders.get(id) || null), structuredClone(receipts.get(`${id}:${eventId}`) || null));
        if (controls.failWrite) throw new Error('database unavailable');
        if (outcome.order) orders.set(id, structuredClone(outcome.order));
        if (outcome.receipt) receipts.set(`${id}:${eventId}`, structuredClone(outcome.receipt));
        return structuredClone(outcome.result);
      } finally { release(); }
    },
    async recordResult(id, eventId, notifications) {
      if (controls.failLog) throw new Error('receipt unavailable');
      receipts.get(`${id}:${eventId}`)!.notifications = notifications;
    },
    async throttle(key, max) { const count = counters.get(key) || 0; counters.set(key, count + 1); return count < max; },
    async saveSession(hash, orderId, expiresAt) { sessions.set(hash, { orderId, expiresAt }); },
    async session(hash) { return sessions.get(hash) || null; },
    async deleteSession(hash) { sessions.delete(hash); },
  };
  return { repository, orders, receipts, sessions, counters, controls };
}
