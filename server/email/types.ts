import type { Order, OrderDeliveryAddress, OrderStatus, PaymentStatus } from '../../src/types/order';

export const STATUS_EVENTS = {
  preparing: 'ORDER_PREPARING',
  packaged: 'ORDER_PACKAGED',
  dispatched: 'ORDER_DISPATCHED',
  'out-for-delivery': 'ORDER_OUT_FOR_DELIVERY',
  delivered: 'ORDER_DELIVERED',
} as const;
export type FulfillmentStatus = keyof typeof STATUS_EVENTS;
export type StatusEvent = typeof STATUS_EVENTS[FulfillmentStatus];
export type OrderEmailEvent = StatusEvent | 'ORDER_PLACED' | 'PAYMENT_CONFIRMED'
  | 'ORDER_DELAYED' | 'NEW_ORDER_ADMIN' | 'PAYMENT_CONFIRMED_ADMIN' | 'ORDER_EXCEPTION_ADMIN';
export type RequestEmailEvent = 'CORPORATE_REQUEST_RECEIVED' | 'CUSTOM_REQUEST_RECEIVED'
  | 'CORPORATE_REQUEST_ADMIN' | 'CUSTOM_REQUEST_ADMIN' | 'CORPORATE_QUOTE_SENT' | 'CUSTOM_QUOTE_SENT';
export type EmailEvent = OrderEmailEvent | RequestEmailEvent | 'ABANDONED_CHECKOUT' | 'TEST_EMAIL';

export interface DeliveryDetails {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  expectedDeliveryDate?: string;
}

export interface OrderEmailData extends DeliveryDetails {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  recipientName: string;
  items: Array<{ name: string; quantity: number; subtotal: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  preferredDeliveryDate: string;
  deliveryAddress: OrderDeliveryAddress;
}

// Explicit allowlist: no phones, gift messages, payment references or internal IDs.
export function toOrderEmailData(order: Order, delivery: DeliveryDetails = {}): OrderEmailData {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customer.fullName,
    customerEmail: order.customer.email,
    recipientName: order.recipient.fullName,
    items: order.items.map(({ name, quantity, subtotal }) => ({ name, quantity, subtotal })),
    subtotal: order.subtotal, deliveryFee: order.deliveryFee, total: order.total,
    paymentStatus: order.payment.status, orderStatus: order.orderStatus,
    preferredDeliveryDate: order.delivery.preferredDate,
    deliveryAddress: { ...order.delivery.address },
    courierName: delivery.courierName, trackingNumber: delivery.trackingNumber,
    trackingUrl: delivery.trackingUrl, expectedDeliveryDate: delivery.expectedDeliveryDate,
  };
}

export interface RequestEmailData {
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  summary: string;
}
export interface CorporateQuoteEmailData {
  referenceNumber: string;
  companyName: string;
  contactName: string;
  customerEmail: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  brandingFee?: number;
  discount?: number;
  quantity?: number;
  validUntil?: string;
  notes?: string;
}
export interface CustomQuoteEmailData {
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  item: string;
  quantity: number;
  total: number;
  subtotal?: number;
  designFee?: number;
  productionFee?: number;
  packagingFee?: number;
  deliveryFee?: number;
  discount?: number;
  validUntil?: string;
  notes?: string;
}
export interface AbandonedCheckoutData {
  checkoutId: string;
  customerName: string;
  customerEmail: string;
  resumeUrl: string;
  items?: Array<{ name: string; quantity: number; subtotal: number }>;
}
export type EmailNotification = {
  event: OrderEmailEvent;
  eventId: string;
  data: OrderEmailData;
  message?: string;
} | {
  event: 'CORPORATE_REQUEST_RECEIVED' | 'CUSTOM_REQUEST_RECEIVED' | 'CORPORATE_REQUEST_ADMIN' | 'CUSTOM_REQUEST_ADMIN';
  eventId: string;
  data: RequestEmailData;
} | {
  event: 'CORPORATE_QUOTE_SENT';
  eventId: string;
  data: CorporateQuoteEmailData;
} | {
  event: 'CUSTOM_QUOTE_SENT';
  eventId: string;
  data: CustomQuoteEmailData;
} | {
  event: 'ABANDONED_CHECKOUT';
  eventId: string;
  data: AbandonedCheckoutData;
} | {
  event: 'TEST_EMAIL';
  eventId: string;
  data: { recipient: string };
};

export type EmailResult =
  | { sent: true; skipped: false; provider: 'resend'; providerStatus: 'accepted'; providerId: string }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; skipped: false; error: string; httpStatus?: number };

export interface NotificationLog {
  timestamp: string;
  channel: 'email';
  event: EmailEvent;
  eventId: string;
  orderNumber?: string;
  recipient: string;
  result: EmailResult;
}
