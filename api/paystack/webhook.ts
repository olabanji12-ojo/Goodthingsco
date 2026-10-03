import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmPaidOrderServer } from '../../server/orderService';
import { verifyWebhookSignature } from '../../server/paystackService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['x-paystack-signature'] as string | undefined;

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Webhook] Invalid Paystack signature received');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    if (event.event === 'charge.success' && event.data?.reference) {
      await confirmPaidOrderServer(event.data.reference);
    }

    return res.status(200).json({ status: 'received' });
  } catch (err: any) {
    console.error('[API /api/paystack/webhook] Error:', err);
    return res.status(500).json({ message: 'Webhook processing error' });
  }
}
