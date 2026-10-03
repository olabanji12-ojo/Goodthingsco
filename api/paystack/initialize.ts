import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPendingOrderServer } from '../../server/orderService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'goodthingsco.ng';
    const origin = `${protocol}://${host}`;

    const result = await createPendingOrderServer(req.body?.payload, origin);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API /api/paystack/initialize] Error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
}
