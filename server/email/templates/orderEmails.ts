import type { OrderEmailData, OrderEmailEvent } from '../types';
import { money, renderLayout, safeUrl, type EmailTemplate } from './layout';

const statusCopy = {
  ORDER_PREPARING: ['Preparing', 'We are thoughtfully preparing your order.'],
  ORDER_PACKAGED: ['Packaged', 'Your order is carefully packaged and ready for dispatch.'],
  ORDER_DISPATCHED: ['Dispatched', 'Your order has been handed over for delivery.'],
  ORDER_OUT_FOR_DELIVERY: ['Out for Delivery', 'Your order is on its final journey to the recipient.'],
  ORDER_DELIVERED: ['Delivered', 'Your order has been marked as delivered. Thank you for choosing Good Things Co.'],
} as const;

export function orderEmail(event: OrderEmailEvent, data: OrderEmailData, message?: string): EmailTemplate {
  const details: Array<[string, string]> = [['Order reference', data.orderNumber]];
  const admin = event.endsWith('_ADMIN');
  let title: string;
  let subject: string;
  let paragraphs: string[];
  let showItems = false;
  switch (event) {
    case 'ORDER_PLACED':
      title = 'Your order is received';
      subject = `We’ve received your Good Things Co. order — ${data.orderNumber}`;
      paragraphs = [`Hello ${data.customerName},`, 'Thank you for choosing something thoughtful. We have received your order.',
        data.paymentStatus === 'paid' ? 'Payment is recorded as paid.' : 'Your order has been received. Payment has not yet been confirmed.'];
      showItems = true;
      break;
    case 'PAYMENT_CONFIRMED':
      title = 'Payment confirmed';
      subject = `Payment confirmed — ${data.orderNumber}`;
      paragraphs = [`Hello ${data.customerName},`, `Your payment of ${money(data.total)} has been verified.`,
        data.orderStatus === 'confirmed-review-required'
          ? 'Our team is reviewing a fulfillment issue and will contact you with the next steps.'
          : 'Next, our team will begin preparing your order with care.'];
      showItems = true;
      break;
    case 'ORDER_DELAYED':
      title = 'An update on your order';
      subject = `An update on your delivery — ${data.orderNumber}`;
      if (!message?.trim()) throw new Error('A delay message is required');
      paragraphs = [`Hello ${data.customerName},`, message.trim().slice(0, 2000), 'Thank you for your patience. Please reply if you need help.'];
      break;
    case 'NEW_ORDER_ADMIN':
    case 'PAYMENT_CONFIRMED_ADMIN':
    case 'ORDER_EXCEPTION_ADMIN':
      title = event === 'NEW_ORDER_ADMIN' ? 'New order received'
        : event === 'PAYMENT_CONFIRMED_ADMIN' ? 'Order payment confirmed' : 'Order needs attention';
      subject = `${title} — ${data.orderNumber}`;
      paragraphs = [event === 'ORDER_EXCEPTION_ADMIN'
        ? (message?.trim().slice(0, 2000) || 'Please review this order before fulfillment.')
        : 'The following order is ready for your review.'];
      details.push(['Customer', data.customerName], ['Customer email', data.customerEmail]);
      showItems = true;
      break;
    default: {
      const [status, copy] = statusCopy[event];
      title = status;
      subject = `${status} — ${data.orderNumber}`;
      paragraphs = [`Hello ${data.customerName},`, copy];
      details.push(['Current status', status]);
    }
  }
  details.push(['Recipient', data.recipientName]);
  if (showItems) {
    details.push(['Subtotal', money(data.subtotal)], ['Delivery', money(data.deliveryFee)], ['Total', money(data.total)],
      ['Payment status', data.paymentStatus]);
  }
  if (data.preferredDeliveryDate) details.push(['Preferred delivery date', data.preferredDeliveryDate]);
  const address = data.deliveryAddress;
  // Customer status notices only need the destination city, not full private contact data.
  details.push(['Delivery location', (admin
    ? [address.addressLine1, address.addressLine2, address.city, address.state, address.country, address.postalCode]
    : [address.city, address.state, address.country]).filter(Boolean).join(', ')]);
  if (data.expectedDeliveryDate) details.push(['Expected delivery date', data.expectedDeliveryDate]);
  if (data.courierName) details.push(['Courier', data.courierName]);
  if (data.trackingNumber) details.push(['Tracking number', data.trackingNumber]);
  const trackingUrl = safeUrl(data.trackingUrl);
  return renderLayout({ subject, title, paragraphs, details, items: showItems ? data.items : undefined,
    cta: trackingUrl ? { label: 'Track delivery', url: trackingUrl } : undefined });
}
