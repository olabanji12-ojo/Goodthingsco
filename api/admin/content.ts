import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleContentHttp } from '../../server/content/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleContentHttp(req, res);
}
