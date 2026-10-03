import type { Order } from '../../src/types/order';
import type { CorporateRequest } from '../../src/types/corporate';
import type { CustomRequest } from '../../src/types/customRequest';
import { toOrderEmailData, type DeliveryDetails, type EmailResult, type FulfillmentStatus } from '../email/types';
import { emailService } from './emailService';

// Channel orchestration boundary. Only email is implemented in this phase.
// These hooks are internal: call after a trusted server operation has committed.
export function createNotificationService(email = emailService) {
  async function isolate(work: () => Promise<EmailResult[]>): Promise<EmailResult[]> {
    try { return await work(); } catch {
      try { console.error('[Notification]', JSON.stringify({ channel: 'email', error: 'Notification hook failed' })); } catch { /* best effort */ }
      return [{ sent: false, skipped: false, error: 'Notification hook failed' }];
    }
  }
  return {
    orderCreated: (order: Order) => isolate(() => {
      const data = toOrderEmailData(order);
      return Promise.all([email.sendOrderPlacedEmail(data), email.sendAdminNewOrderEmail(data)]);
    }),
    paymentConfirmed: (order: Order, verification: { isSimulated: boolean }) => isolate(() => {
      const data = toOrderEmailData(order);
      const options = verification.isSimulated ? { skipReason: 'Simulated payment; no verified payment email sent' } : undefined;
      const tasks = [email.sendPaymentConfirmedEmail(data, options), email.sendAdminPaymentEmail(data, options)];
      if (order.orderStatus === 'confirmed-review-required') {
        tasks.push(email.sendAdminExceptionEmail(data,
          'Payment is recorded, but inventory requires manual review. Please review this order before fulfillment.',
          `${order.orderNumber}:inventory-review`, options));
      }
      return Promise.all(tasks);
    }),
    orderException: (order: Order, message: string, eventId: string) => isolate(async () =>
      [await email.sendAdminExceptionEmail(toOrderEmailData(order), message, eventId)]),
    // Persist status first in the future authenticated admin operation, then call this hook.
    orderStatusChanged: (order: Order, status: FulfillmentStatus, eventId: string, delivery: DeliveryDetails = {}) => isolate(async () => {
      if (order.orderStatus !== status) return [{ sent: false, skipped: true, reason: 'Order status has not been committed' }];
      return [await email.sendOrderStatusEmail(status, toOrderEmailData(order, delivery), eventId)];
    }),
    orderDelayed: (order: Order, message: string, eventId: string, delivery: DeliveryDetails = {}) => isolate(async () =>
      [await email.sendOrderDelayEmail(toOrderEmailData(order, delivery), message, eventId)]),
    abandonedCheckoutReminder: (data: {
      sessionId: string;
      customerName: string;
      customerEmail: string;
      resumeUrl: string;
      items?: Array<{ name: string; quantity: number; subtotal: number }>;
      eventId: string;
    }) => isolate(async () => [
      await email.sendAbandonedCheckoutEmail({
        checkoutId: data.sessionId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        resumeUrl: data.resumeUrl,
        items: data.items,
      }, data.eventId),
    ]),
    corporateRequestCreated: (req: CorporateRequest) => isolate(() => {
      const summary = `Company: ${req.company.companyName} | Contact: ${req.company.contactName} (${req.company.phone}) | Purpose: ${req.giftingPurpose} | Type: ${req.giftType} | Qty: ${req.quantity} | Budget: ${req.budgetRange}${req.delivery?.preferredDeliveryDate ? ` | Delivery: ${req.delivery.preferredDeliveryDate}` : ''}`;
      const customerData = {
        requestNumber: req.referenceNumber,
        customerName: req.company.contactName || req.company.companyName,
        customerEmail: req.company.email,
        summary,
      };
      return Promise.all([
        email.sendCorporateRequestEmail(customerData),
        email.sendAdminCorporateRequestEmail(customerData),
      ]);
    }),
    corporateQuoteSent: (req: CorporateRequest, eventId?: string) => isolate(async () => [
      await email.sendCorporateQuoteEmail({
        referenceNumber: req.referenceNumber,
        companyName: req.company.companyName,
        contactName: req.company.contactName,
        customerEmail: req.company.email,
        total: req.quote.total || 0,
        subtotal: req.quote.subtotal,
        deliveryFee: req.quote.deliveryFee,
        brandingFee: req.quote.brandingFee,
        discount: req.quote.discount,
        quantity: req.quantity,
        validUntil: req.quote.validUntil,
        notes: req.quote.notes,
      }, eventId),
    ]),
    customRequestCreated: (req: CustomRequest) => isolate(() => {
      const summary = `Item: ${req.requestDetails.item} | Type: ${req.requestType} | Qty: ${req.requestDetails.quantity}${req.requestDetails.budgetRange ? ` | Budget: ${req.requestDetails.budgetRange}` : ''}${req.requestDetails.preferredDeliveryDate ? ` | Delivery: ${req.requestDetails.preferredDeliveryDate}` : ''}${req.requestDetails.description ? ` | Brief: ${req.requestDetails.description}` : ''}`;
      const customerData = {
        requestNumber: req.referenceNumber,
        customerName: req.customer.fullName,
        customerEmail: req.customer.email,
        summary,
      };
      return Promise.all([
        email.sendCustomRequestEmail(customerData),
        email.sendAdminCustomRequestEmail(customerData),
      ]);
    }),
    customQuoteSent: (req: CustomRequest, eventId?: string) => isolate(async () => [
      await email.sendCustomQuoteEmail({
        referenceNumber: req.referenceNumber,
        customerName: req.customer.fullName,
        customerEmail: req.customer.email,
        item: req.requestDetails.item,
        quantity: req.requestDetails.quantity,
        total: req.quote.total || 0,
        subtotal: req.quote.subtotal,
        designFee: req.quote.designFee,
        productionFee: req.quote.productionFee,
        packagingFee: req.quote.packagingFee,
        deliveryFee: req.quote.deliveryFee,
        discount: req.quote.discount,
        validUntil: req.quote.validUntil,
        notes: req.quote.notes,
      }, eventId),
    ]),
  };
}

export const notificationService = createNotificationService();
