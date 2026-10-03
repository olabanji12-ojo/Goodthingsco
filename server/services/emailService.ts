import { createHash, randomUUID } from 'node:crypto';
import { env } from 'node:process';
import { getEmailConfig, isEmailAddress, type EmailConfig } from '../email/config';
import { renderEmail } from '../email/templates';
import { STATUS_EVENTS, type AbandonedCheckoutData, type CorporateQuoteEmailData, type CustomQuoteEmailData, type EmailNotification, type EmailResult,
  type FulfillmentStatus, type NotificationLog, type OrderEmailData, type RequestEmailData } from '../email/types';

interface EmailDependencies {
  config?: () => EmailConfig;
  fetch?: typeof fetch;
  log?: (entry: NotificationLog) => void;
  timeoutMs?: number;
}
export interface SendOptions { skipReason?: string }

function defaultLog(entry: NotificationLog): void {
  // Structured, body-free logs can later be ingested into notificationLogs.
  console.info('[Notification]', JSON.stringify(entry));
}

export function createEmailService(dependencies: EmailDependencies = {}) {
  const readConfig = dependencies.config || getEmailConfig;
  const request = dependencies.fetch || ((...args: Parameters<typeof fetch>) => fetch(...args));
  const writeLog = dependencies.log || defaultLog;

  async function sendEmail(notification: EmailNotification, options: SendOptions = {}): Promise<EmailResult> {
    let recipient = '';
    let result: EmailResult;
    try {
      const config = readConfig();
      recipient = notification.event.endsWith('_ADMIN') ? config.adminEmail
        : notification.event === 'TEST_EMAIL' ? notification.data.recipient : notification.data.customerEmail;
      if (notification.event === 'TEST_EMAIL' && env.NODE_ENV !== 'development') {
        result = { sent: false, skipped: true, reason: 'Test email is only available in development' };
      } else if (options.skipReason) {
        result = { sent: false, skipped: true, reason: options.skipReason };
      } else if (!config.configured) {
        result = { sent: false, skipped: true, reason: 'Email provider not configured' };
      } else if (!isEmailAddress(recipient) || !notification.eventId.trim()) {
        result = { sent: false, skipped: false, error: 'Invalid notification recipient or event ID' };
      } else if ((notification.event === 'PAYMENT_CONFIRMED' || notification.event === 'PAYMENT_CONFIRMED_ADMIN')
        && notification.data.paymentStatus !== 'paid') {
        result = { sent: false, skipped: true, reason: 'Payment has not been verified' };
      } else {
        const template = renderEmail(notification);
        // Stable per event + recipient; raw customer details never appear in the header.
        const key = createHash('sha256').update(`${notification.event}:${notification.eventId}:${recipient.toLowerCase()}`).digest('hex');
        const response = await request('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json',
            'Idempotency-Key': `goodthingsco/${key}` },
          body: JSON.stringify({ from: config.from, to: [recipient], reply_to: config.replyTo,
            subject: template.subject, html: template.html, text: template.text }),
          signal: AbortSignal.timeout(dependencies.timeoutMs ?? 4000),
        });
        if (!response.ok) {
          // Do not log provider bodies, which may echo input or sensitive data.
          result = { sent: false, skipped: false, error: 'Resend rejected the email', httpStatus: response.status };
          await response.body?.cancel();
        } else {
          const body: unknown = await response.json();
          if (body && typeof body === 'object' && 'id' in body && typeof body.id === 'string'
            && /^[a-zA-Z0-9_-]{1,128}$/.test(body.id)) {
            result = { sent: true, skipped: false, provider: 'resend', providerStatus: 'accepted', providerId: body.id };
          } else {
            result = { sent: false, skipped: false, error: 'Invalid Resend response' };
          }
        }
      }
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      result = { sent: false, skipped: false, error: timedOut ? 'Email provider timed out' : 'Email could not be sent' };
    }
    try {
      writeLog({ timestamp: new Date().toISOString(), channel: 'email', event: notification.event,
        eventId: notification.eventId, orderNumber: 'orderNumber' in notification.data ? notification.data.orderNumber : undefined,
        recipient, result });
    } catch { /* Logging failures must not affect successful orders either. */ }
    return result;
  }

  const orderId = (data: OrderEmailData, eventId?: string) => eventId || data.orderNumber;
  return {
    sendEmail,
    sendOrderPlacedEmail: (data: OrderEmailData, options?: SendOptions) =>
      sendEmail({ event: 'ORDER_PLACED', eventId: orderId(data), data }, options),
    sendPaymentConfirmedEmail: (data: OrderEmailData, options?: SendOptions) =>
      sendEmail({ event: 'PAYMENT_CONFIRMED', eventId: orderId(data), data }, options),
    sendOrderStatusEmail: (status: FulfillmentStatus, data: OrderEmailData, eventId: string) =>
      sendEmail({ event: STATUS_EVENTS[status], eventId, data }),
    sendOrderDelayEmail: (data: OrderEmailData, message: string, eventId: string) =>
      sendEmail({ event: 'ORDER_DELAYED', eventId, data, message }),
    sendAdminNewOrderEmail: (data: OrderEmailData, options?: SendOptions) =>
      sendEmail({ event: 'NEW_ORDER_ADMIN', eventId: orderId(data), data }, options),
    sendAdminPaymentEmail: (data: OrderEmailData, options?: SendOptions) =>
      sendEmail({ event: 'PAYMENT_CONFIRMED_ADMIN', eventId: orderId(data), data }, options),
    sendAdminExceptionEmail: (data: OrderEmailData, message: string, eventId: string, options?: SendOptions) =>
      sendEmail({ event: 'ORDER_EXCEPTION_ADMIN', eventId, data, message }, options),
    sendCorporateRequestEmail: (data: RequestEmailData) =>
      sendEmail({ event: 'CORPORATE_REQUEST_RECEIVED', eventId: data.requestNumber, data }),
    sendCorporateQuoteEmail: (data: CorporateQuoteEmailData, eventId?: string) =>
      sendEmail({ event: 'CORPORATE_QUOTE_SENT', eventId: eventId || `quote-${data.referenceNumber}`, data }),
    sendCustomRequestEmail: (data: RequestEmailData) =>
      sendEmail({ event: 'CUSTOM_REQUEST_RECEIVED', eventId: data.requestNumber, data }),
    sendCustomQuoteEmail: (data: CustomQuoteEmailData, eventId?: string) =>
      sendEmail({ event: 'CUSTOM_QUOTE_SENT', eventId: eventId || `quote-${data.referenceNumber}`, data }),
    sendAdminCorporateRequestEmail: (data: RequestEmailData) =>
      sendEmail({ event: 'CORPORATE_REQUEST_ADMIN', eventId: data.requestNumber, data }),
    sendAdminCustomRequestEmail: (data: RequestEmailData) =>
      sendEmail({ event: 'CUSTOM_REQUEST_ADMIN', eventId: data.requestNumber, data }),
    sendAbandonedCheckoutEmail: (data: AbandonedCheckoutData, eventId?: string, options?: SendOptions) =>
      sendEmail({ event: 'ABANDONED_CHECKOUT', eventId: eventId || data.checkoutId, data }, options),
    sendTestEmail: (recipient: string): Promise<EmailResult> =>
      sendEmail({ event: 'TEST_EMAIL', eventId: randomUUID(), data: { recipient } },
        env.NODE_ENV === 'development' ? {} : { skipReason: 'Test email is only available in development' }),
  };
}

export const emailService = createEmailService();
export const { sendEmail, sendOrderPlacedEmail, sendPaymentConfirmedEmail, sendOrderStatusEmail,
  sendOrderDelayEmail, sendAdminNewOrderEmail, sendAdminPaymentEmail, sendAdminExceptionEmail,
  sendCorporateRequestEmail, sendCorporateQuoteEmail, sendCustomRequestEmail, sendCustomQuoteEmail,
  sendAdminCorporateRequestEmail, sendAdminCustomRequestEmail, sendAbandonedCheckoutEmail, sendTestEmail } = emailService;
