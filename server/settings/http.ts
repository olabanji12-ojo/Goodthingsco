/**
 * Good Things Co. — Store Settings HTTP Handler
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'url';
import { settingsService } from './service.js';
import { SettingsHttpError } from './domain.js';

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      throw new SettingsHttpError(400, 'Invalid JSON body.');
    }
  }

  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 65536) {
      throw new SettingsHttpError(413, 'Payload too large (maximum 64KB).');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new SettingsHttpError(400, 'Invalid JSON body.');
  }
}

export function createSettingsHttp(service = settingsService) {
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    const isPublicSettings = path === '/api/settings/public';
    const isAdminSettings = path === '/api/admin/settings';

    if (!isPublicSettings && !isAdminSettings) return false;

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };

    const method = (req.method || 'GET').toUpperCase();
    const authorization = req.headers.authorization;

    try {
      // 1. GET /api/settings/public (Public safe settings)
      if (isPublicSettings && method === 'GET') {
        const publicSettings = await service.getPublicStoreSettings();
        send(200, { success: true, settings: publicSettings });
        return true;
      }

      // 2. GET /api/admin/settings (Admin complete settings)
      if (isAdminSettings && method === 'GET') {
        // Require admin token before returning full (internal) settings
        const fullSettings = await service.getStoreSettingsAsAdmin(authorization);
        send(200, { success: true, settings: fullSettings });
        return true;
      }

      // 3. PATCH /api/admin/settings (Admin update settings)
      if (isAdminSettings && method === 'PATCH') {
        const body = await readJson(req);
        const updated = await service.updateStoreSettings(authorization, body);
        send(200, { success: true, settings: updated });
        return true;
      }

      send(405, { success: false, message: 'Method not allowed on settings endpoint.' });
      return true;
    } catch (error) {
      if (error instanceof SettingsHttpError) {
        send(error.statusCode, { success: false, message: error.message });
      } else {
        console.error('[SettingsHttp] Exception:', error);
        send(500, { success: false, message: 'Settings service temporarily unavailable.' });
      }
      return true;
    }
  };
}

export const handleSettingsHttp = createSettingsHttp();
