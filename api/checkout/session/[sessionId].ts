import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCheckoutHttp } from '../../../server/checkout/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleCheckoutHttp(req, res);
}
