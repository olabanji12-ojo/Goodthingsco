import { createHash, timingSafeEqual } from 'node:crypto';
import type { Order, OrderStatusEntry, OrderStatus } from '../../src/types/order';
import type { OrderUpdateInput, TrackingOrder, OrderListItem } from '../../src/types/orderManagement';
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS, normalizeTrackingPhone, safeTrackingUrl } from '../../src/utils/orderManagement';

export class OrderHttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const TRACKING_MISS = "We couldn't find an order matching those details.";
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new OrderHttpError(400, 'Invalid request.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max) throw new OrderHttpError(400, 'Invalid field length or value.');
  return value.trim();
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new OrderHttpError(400, 'Unsupported update field.');
}
export function validateUpdate(value: unknown): OrderUpdateInput {
  const body = object(value);
  keys(body, ['eventId', 'expectedRevision', 'status', 'note', 'confirmCancellation', 'delivery', 'deliveryIssue']);
  const eventId = text(body.eventId, 80);
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(eventId) || !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0)
    throw new OrderHttpError(400, 'A valid change ID and revision are required.');
  const result: OrderUpdateInput = { eventId, expectedRevision: Number(body.expectedRevision) };
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !Object.prototype.hasOwnProperty.call(ORDER_STATUS_LABELS, body.status)) throw new OrderHttpError(400, 'Invalid order status.');
    result.status = body.status as OrderStatus;
  }
  if (body.note !== undefined) result.note = text(body.note, 1000);
  if (body.confirmCancellation !== undefined) {
    if (typeof body.confirmCancellation !== 'boolean') throw new OrderHttpError(400, 'Invalid cancellation confirmation.');
    result.confirmCancellation = body.confirmCancellation;
  }
  if (body.delivery !== undefined) {
    const d = object(body.delivery);
    keys(d, ['courierName', 'trackingNumber', 'trackingUrl', 'expectedDeliveryDate']);
    const url = text(d.trackingUrl, 2048);
    const date = text(d.expectedDeliveryDate, 10);
    if (url && !safeTrackingUrl(url)) throw new OrderHttpError(400, 'Tracking URL must use HTTPS without embedded credentials.');
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))
      || new Date(date).toISOString().slice(0, 10) !== date)) throw new OrderHttpError(400, 'Enter a valid expected delivery date.');
    result.delivery = { courierName: text(d.courierName, 120), trackingNumber: text(d.trackingNumber, 160),
      trackingUrl: safeTrackingUrl(url) || '', expectedDeliveryDate: date };
  }
  if (body.deliveryIssue !== undefined) {
    const issue = object(body.deliveryIssue);
    keys(issue, ['active', 'message']);
    if (typeof issue.active !== 'boolean') throw new OrderHttpError(400, 'Invalid issue status.');
    const message = text(issue.message, 1000);
    if (issue.active && !message) throw new OrderHttpError(400, 'Add a customer-facing issue message.');
    result.deliveryIssue = { active: issue.active, message: issue.active ? message : '' };
  }
  return result;
}
export function effectiveHistory(order: Order): OrderStatusEntry[] {
  if (order.statusHistory?.length) return order.statusHistory;
  const history: OrderStatusEntry[] = [{ eventId: 'legacy-created', status: 'pending-payment', changedAt: order.createdAt, changedBy: 'system:legacy' }];
  if (order.orderStatus !== 'pending-payment') history.push({ eventId: 'legacy-current', status: order.orderStatus,
    changedAt: order.updatedAt || order.createdAt, changedBy: 'system:legacy' });
  return history;
}
export function applyUpdate(order: Order, update: OrderUpdateInput, actor: string, now: string) {
  if ((order.revision || 0) !== update.expectedRevision) throw new OrderHttpError(409, 'This order changed. Reload it before saving.');
  const statusChanged = Boolean(update.status && update.status !== order.orderStatus);
  if (statusChanged) {
    if (!ORDER_TRANSITIONS[order.orderStatus].includes(update.status!)) throw new OrderHttpError(409, 'That status transition is not allowed.');
    if (update.status === 'cancelled' && (!update.confirmCancellation || !update.note))
      throw new OrderHttpError(400, 'Confirm cancellation and add an internal reason. Refunds and stock returns are handled separately.');
    if (update.status !== 'cancelled' && order.payment.status !== 'paid') throw new OrderHttpError(409, 'Only paid orders can proceed to fulfillment.');
  }
  const next = structuredClone(order);
  let changed = statusChanged;
  if (update.delivery) {
    for (const field of ['courierName', 'trackingNumber', 'trackingUrl', 'expectedDeliveryDate'] as const) {
      if ((next.delivery[field] || '') !== update.delivery[field]) changed = true;
      next.delivery[field] = update.delivery[field];
    }
  }
  let issueChanged = false;
  if (update.deliveryIssue) {
    const issue = update.deliveryIssue;
    issueChanged = issue.active !== Boolean(order.deliveryIssue?.active)
      || issue.message !== (order.deliveryIssue?.message || '')
      || (issue.active && (next.delivery.expectedDeliveryDate || '') !== (order.deliveryIssue?.updatedExpectedDeliveryDate || ''));
    if (issueChanged) next.deliveryIssue = { ...issue, createdAt: order.deliveryIssue?.createdAt || now, updatedAt: now,
      updatedExpectedDeliveryDate: next.delivery.expectedDeliveryDate || '' };
    changed ||= issueChanged;
  } else if (next.deliveryIssue?.active && update.delivery && next.delivery.expectedDeliveryDate !== order.delivery.expectedDeliveryDate) {
    issueChanged = true; changed = true;
    next.deliveryIssue = { ...next.deliveryIssue, updatedAt: now, updatedExpectedDeliveryDate: next.delivery.expectedDeliveryDate || '' };
  }
  if (changed) {
    next.revision = (order.revision || 0) + 1;
    next.updatedAt = now;
    next.statusHistory = effectiveHistory(order);
    if (statusChanged) {
      next.orderStatus = update.status!;
      next.statusHistory.push({ eventId: update.eventId, status: update.status!, changedAt: now, changedBy: actor,
        ...(update.note ? { note: update.note } : {}) });
    }
  }
  return { order: next, changed, statusChanged, notifyIssue: issueChanged && Boolean(next.deliveryIssue?.active) };
}
function same(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function parseTracking(value: unknown) {
  const body = object(value);
  const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().toUpperCase() : '';
  const verification = typeof body.verification === 'string' ? body.verification.trim() : '';
  if (!/^GTC-\d{8}-[A-Z0-9]{4}$/.test(orderNumber) || verification.length > 254
    || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verification) && !normalizeTrackingPhone(verification)))
    throw new OrderHttpError(404, TRACKING_MISS);
  return { orderNumber, verification };
}
export function verificationMatches(order: Order, verification: string): boolean {
  if (verification.includes('@')) return same(order.customer.email.trim().toLowerCase(), verification.trim().toLowerCase());
  const expected = normalizeTrackingPhone(order.customer.phone);
  const actual = normalizeTrackingPhone(verification);
  return Boolean(expected && actual && same(expected, actual));
}
export function trackingSummary(order: Order): TrackingOrder {
  const delivery = order.delivery;
  return {
    orderNumber: order.orderNumber, createdAt: order.createdAt, paymentStatus: order.payment.status, orderStatus: order.orderStatus,
    items: order.items.map(({ name, quantity }) => ({ name, quantity })),
    destination: [delivery.address.city, delivery.address.state, delivery.address.country].filter(Boolean).join(', '),
    preferredDeliveryDate: delivery.preferredDate, expectedDeliveryDate: delivery.expectedDeliveryDate || undefined,
    courierName: delivery.courierName || undefined, trackingNumber: delivery.trackingNumber || undefined,
    trackingUrl: safeTrackingUrl(delivery.trackingUrl),
    statusHistory: effectiveHistory(order).map(({ status, changedAt }) => ({ status, changedAt })),
    ...(order.deliveryIssue?.active ? { deliveryIssue: { active: true, message: order.deliveryIssue.message,
      updatedExpectedDeliveryDate: order.deliveryIssue.updatedExpectedDeliveryDate } } : {}),
  };
}
export function listSummary(order: Order): OrderListItem {
  return { id: order.id!, orderNumber: order.orderNumber, customerName: order.customer.fullName, createdAt: order.createdAt,
    total: order.total, paymentStatus: order.payment.status, orderStatus: order.orderStatus,
    preferredDeliveryDate: order.delivery.preferredDate, deliveryLocation: [order.delivery.address.city, order.delivery.address.state].join(', '),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0) };
}
