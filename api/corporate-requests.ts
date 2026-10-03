import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCorporateHttp } from '../server/corporate/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleCorporateHttp(req, res);
}
