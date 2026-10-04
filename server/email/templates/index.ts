import type { EmailNotification } from '../types.js';
import { orderEmail } from './orderEmails.js';
import { renderLayout, type EmailTemplate } from './layout.js';

export function renderEmail(notification: EmailNotification): EmailTemplate {
  if ('orderNumber' in notification.data) {
    return orderEmail(notification.event as Parameters<typeof orderEmail>[0], notification.data,
      'message' in notification ? notification.message : undefined);
  }
  if (notification.event === 'TEST_EMAIL') {
    return renderLayout({ subject: 'Good Things Co. — email connection test', title: 'A thoughtful beginning',
      paragraphs: ['This is a test of the Good Things Co. transactional email service.',
        'If this message reached your inbox, the sender and connection are ready for a live order test.'] });
  }
  if (notification.event === 'ABANDONED_CHECKOUT') {
    return renderLayout({
      subject: 'Still thinking it over? Your selection is ready',
      title: 'Continue when you are ready',
      paragraphs: [
        `Hello ${notification.data.customerName || 'there'},`,
        'We noticed you left before finishing your order. Your checkout details are ready for you to pick up right where you left off.',
        'Items and pricing will be refreshed when you return to ensure live availability.',
      ],
      items: notification.data.items,
      cta: { label: 'Resume Checkout', url: notification.data.resumeUrl },
    });
  }
  if (notification.event === 'CORPORATE_QUOTE_SENT') {
    const q = notification.data;
    const formatNaira = (val?: number) => (val !== undefined ? `₦${val.toLocaleString('en-NG')}` : '₦0');
    const details: Array<[string, string]> = [
      ['Quote Reference', q.referenceNumber],
      ['Company', q.companyName],
      ['Contact', q.contactName],
      ['Total Quote', formatNaira(q.total)],
    ];
    if (q.subtotal !== undefined) details.push(['Gifts Subtotal', formatNaira(q.subtotal)]);
    if (q.brandingFee) details.push(['Branding & Customisation', formatNaira(q.brandingFee)]);
    if (q.deliveryFee) details.push(['Delivery Fee', formatNaira(q.deliveryFee)]);
    if (q.discount) details.push(['Discount Applied', `-${formatNaira(q.discount)}`]);
    if (q.validUntil) details.push(['Valid Until', q.validUntil]);

    return renderLayout({
      subject: `Your Good Things Co. Corporate Quote — ${q.referenceNumber}`,
      title: 'Official Corporate Gifting Quote',
      paragraphs: [
        `Dear ${q.contactName || q.companyName},`,
        'Thank you for considering Good Things Co. for your corporate gifting. We have prepared an official pro-forma quote for your review:',
        ...(q.notes ? [`Notes from our team: "${q.notes}"`] : []),
        'To proceed with this order, or to adjust your specifications, simply reply directly to this email or contact your concierge specialist.',
      ],
      details,
    });
  }
  if (notification.event === 'CUSTOM_QUOTE_SENT') {
    const q = notification.data;
    const formatNaira = (val?: number) => (val !== undefined ? `₦${val.toLocaleString('en-NG')}` : '₦0');
    const details: Array<[string, string]> = [
      ['Quote Reference', q.referenceNumber],
      ['Bespoke Item', q.item],
      ['Quantity', `${q.quantity} units`],
      ['Total Quotation', formatNaira(q.total)],
    ];
    if (q.subtotal !== undefined) details.push(['Materials & Base Subtotal', formatNaira(q.subtotal)]);
    if (q.designFee) details.push(['Atelier Design Fee', formatNaira(q.designFee)]);
    if (q.productionFee) details.push(['Production & Tooling Fee', formatNaira(q.productionFee)]);
    if (q.packagingFee) details.push(['Custom Packaging Finish', formatNaira(q.packagingFee)]);
    if (q.deliveryFee) details.push(['White-Glove Delivery', formatNaira(q.deliveryFee)]);
    if (q.discount) details.push(['Discount Applied', `-${formatNaira(q.discount)}`]);
    if (q.validUntil) details.push(['Quotation Valid Until', q.validUntil]);

    return renderLayout({
      subject: `Your Good Things Co. Custom Creation Quote — ${q.referenceNumber}`,
      title: 'Bespoke Atelier Quotation',
      paragraphs: [
        `Dear ${q.customerName},`,
        `Thank you for commissioning Good Things Co. for your bespoke project "${q.item}". We have prepared an official quotation based on your atelier specifications:`,
        ...(q.notes ? [`Atelier Notes: "${q.notes}"`] : []),
        'To approve this quotation and authorize production, or to adjust your specifications, reply directly to this email or contact your bespoke concierge.',
      ],
      details,
    });
  }
  const corporate = notification.event.startsWith('CORPORATE');
  const admin = notification.event.endsWith('_ADMIN');
  const kind = corporate ? 'corporate' : 'custom';
  const data = notification.data;
  if (!('requestNumber' in data)) throw new Error('Invalid request notification');
  return renderLayout({ subject: `${admin ? 'New' : 'We’ve received your'} ${kind} request — ${data.requestNumber}`,
    title: admin ? `New ${kind} request` : 'Your request is received',
    paragraphs: admin ? ['A new request is ready for review.', data.summary.slice(0, 2000)]
      : [`Hello ${data.customerName},`, `Thank you for sharing your ${kind} request. Our team will review the details and be in touch.`],
    details: [['Request reference', data.requestNumber], ...(admin
      ? [['Customer', data.customerName], ['Email', data.customerEmail]] as Array<[string, string]> : [])] });
}
