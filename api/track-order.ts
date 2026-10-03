import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOrderHttp } from '../server/orders/http';
export default async function handler(req: VercelRequest, res: VercelResponse) { await handleOrderHttp(req, res); }
