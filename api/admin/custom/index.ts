import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCustomHttp } from '../../../server/custom/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleCustomHttp(req, res);
}
