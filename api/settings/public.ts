import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleSettingsHttp } from '../../server/settings/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleSettingsHttp(req, res);
}
