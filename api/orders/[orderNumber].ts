import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOrderHttp } from '../../server/orders/http';
// Unverified order-number lookup is intentionally retired.
export default async function handler(req: VercelRequest, res: VercelResponse) { await handleOrderHttp(req, res); }
