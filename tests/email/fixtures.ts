import type { Order } from '../../src/types/order';
import type { ValidatedCheckoutPayload } from '../../src/types/checkout';
import { toOrderEmailData, type EmailNotification, STATUS_EVENTS, type FulfillmentStatus } from '../../server/email/types';

export function sampleOrder(): Order {
  return {
    id: 'order-1', orderNumber: 'GTC-20261002-DEMO',
    customer: { fullName: 'Ada Example', email: 'customer@example.com', phone: '+234-private-customer' },
    recipient: { isSelf: false, fullName: 'Tomi Example', phone: '+234-private-recipient' },
    items: [{ productId: 'product-1', slug: 'thoughtful-gift', name: 'The Thoughtful Gift Box',
      unitPrice: 25000, quantity: 2, subtotal: 50000, giftMessage: 'PRIVATE GIFT MESSAGE' }],
    subtotal: 50000, deliveryFee: 3500, total: 53500, currency: 'NGN',
    payment: { status: 'pending', provider: 'paystack', reference: 'private-payment-reference', amountKobo: 5350000, currency: 'NGN' },
    orderStatus: 'pending-payment',
    delivery: { address: { addressLine1: '12 Example Lane', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
      zone: 'lagos', preferredDate: '2026-10-08', deliveryFee: 3500 },
    createdAt: '2026-10-02T12:00:00.000Z', updatedAt: '2026-10-02T12:00:00.000Z',
  };
}

export function sampleNotifications(): EmailNotification[] {
  const order = sampleOrder();
  const pending = toOrderEmailData(order);
  const paid = { ...pending, paymentStatus: 'paid' as const, orderStatus: 'confirmed' as const };
  const request = { requestNumber: 'REQ-DEMO', customerName: 'Ada Example', customerEmail: 'customer@example.com', summary: 'A thoughtful selection for our team.' };
  return [
    { event: 'ORDER_PLACED', eventId: 'placed-demo', data: pending },
    { event: 'PAYMENT_CONFIRMED', eventId: 'paid-demo', data: paid },
    ...Object.entries(STATUS_EVENTS).map(([status, event]) => ({ event, eventId: `status-${status}`, data: {
      ...paid, orderStatus: status as FulfillmentStatus, courierName: 'Example Courier', trackingNumber: 'TRACK-DEMO',
      trackingUrl: 'https://example.com/track/DEMO', expectedDeliveryDate: '2026-10-08',
    } })),
    { event: 'ORDER_DELAYED', eventId: 'delay-demo', data: { ...paid, expectedDeliveryDate: '2026-10-09' },
      message: 'Your delivery is taking a little longer than expected. We are arranging a new delivery window and will keep you informed.' },
    { event: 'NEW_ORDER_ADMIN', eventId: 'admin-demo', data: pending },
    { event: 'PAYMENT_CONFIRMED_ADMIN', eventId: 'admin-paid-demo', data: paid },
    { event: 'ORDER_EXCEPTION_ADMIN', eventId: 'exception-demo', data: paid, message: 'Inventory needs manual review.' },
    { event: 'CORPORATE_REQUEST_RECEIVED', eventId: 'corporate-demo', data: request },
    { event: 'CUSTOM_REQUEST_RECEIVED', eventId: 'custom-demo', data: request },
    { event: 'CORPORATE_REQUEST_ADMIN', eventId: 'corporate-admin-demo', data: request },
    { event: 'CUSTOM_REQUEST_ADMIN', eventId: 'custom-admin-demo', data: request },
    { event: 'ABANDONED_CHECKOUT', eventId: 'checkout-demo', data: {
      checkoutId: 'CHECKOUT-DEMO', customerName: 'Ada Example', customerEmail: 'customer@example.com', resumeUrl: 'https://example.com/checkout',
    } },
    { event: 'TEST_EMAIL', eventId: 'test-demo', data: { recipient: 'customer@example.com' } },
  ];
}

export function sampleCheckout(): ValidatedCheckoutPayload {
  const order = sampleOrder();
  return {
    customer: order.customer, recipient: order.recipient,
    delivery: { ...order.delivery, zone: 'lagos' },
    items: order.items.map(item => ({ ...item, id: `cart-${item.productId}`, image: { url: 'https://example.com/gift.jpg' } })),
    subtotal: order.subtotal, deliveryFee: order.deliveryFee, total: order.total, currency: order.currency,
    deliveryZoneName: 'Lagos Delivery', deliveryRequiresQuote: false, validatedAt: order.createdAt,
  };
}
