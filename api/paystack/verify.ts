import type { VercelRequest, VercelResponse } from '@vercel/node';
import { confirmPaidOrderServer } from '../../server/orderService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const reference = req.body?.reference;
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Missing transaction reference' });
  }

  try {
    const result = await confirmPaidOrderServer(reference);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API /api/paystack/verify] Error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}
