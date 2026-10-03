import type { OrderStatus } from '../types/order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  'pending-payment': 'Pending Payment', confirmed: 'Confirmed', preparing: 'Preparing', packaged: 'Packaged',
  dispatched: 'Dispatched', 'out-for-delivery': 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
  'confirmed-review-required': 'Manual Review',
};
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  'pending-payment': ['cancelled'],
  confirmed: ['preparing', 'cancelled'],
  'confirmed-review-required': ['confirmed', 'cancelled'],
  preparing: ['packaged', 'cancelled'],
  packaged: ['dispatched', 'cancelled'],
  dispatched: ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered', 'cancelled'],
  delivered: [], cancelled: [],
};
export const FULFILLMENT_STEPS: OrderStatus[] = ['confirmed', 'preparing', 'packaged', 'dispatched', 'out-for-delivery', 'delivered'];

export function safeTrackingUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

// Same allowed characters as the checkout phone validator; additionally canonicalize Nigeria's local prefix.
export function normalizeTrackingPhone(value: string): string | undefined {
  let number = value.trim().replace(/[\s\-()]/g, '');
  if (!/^\+?\d{7,18}$/.test(number)) return undefined;
  number = number.replace(/^\+/, '').replace(/^00/, '');
  if (/^0\d{10}$/.test(number)) number = `234${number.slice(1)}`;
  return number;
}

export function formatOrderMoney(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
}
