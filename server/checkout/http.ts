/**
 * Good Things Co. — Abandoned Checkout HTTP Handler
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'url';
import { abandonedCheckoutService } from './service';
import { CheckoutHttpError } from './domain';

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      throw new CheckoutHttpError(400, 'Invalid JSON body.');
    }
  }

  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 32768) {
      throw new CheckoutHttpError(413, 'Payload too large.');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new CheckoutHttpError(400, 'Invalid JSON body.');
  }
}

function resolveOrigin(req: IncomingMessage): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost:5174';
  return `${protocol}://${host}`;
}

export function createCheckoutHttp(service = abandonedCheckoutService) {
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    if (!path.startsWith('/api/checkout/')) return false;

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };

    const origin = resolveOrigin(req);
    const method = (req.method || 'GET').toUpperCase();

    try {
      // 1. POST /api/checkout/session (create or upsert session)
      if (path === '/api/checkout/session' && method === 'POST') {
        const body = await readJson(req);
        const result = await service.initOrUpdateSession(body, origin);
        send(200, { success: true, ...result });
        return true;
      }

      // 2. PATCH /api/checkout/session/:sessionId (debounced autosave)
      const sessionMatch = path.match(/^\/api\/checkout\/session\/([a-zA-Z0-9_-]{1,128})$/);
      if (sessionMatch && method === 'PATCH') {
        const sessionId = sessionMatch[1];
        const body = await readJson(req);
        const session = await service.autosaveSession(sessionId, body);
        send(200, { success: true, session });
        return true;
      }

      // 3. GET /api/checkout/resume?token=... (resume saved checkout)
      if (path === '/api/checkout/resume' && method === 'GET') {
        const token = url.searchParams.get('token') || '';
        const payload = await service.resumeCheckout(token);
        send(200, { success: true, payload });
        return true;
      }

      // 4. POST /api/checkout/session/:sessionId/convert (mark converted upon successful payment)
      const convertMatch = path.match(/^\/api\/checkout\/session\/([a-zA-Z0-9_-]{1,128})\/convert$/);
      if (convertMatch && method === 'POST') {
        const sessionId = convertMatch[1];
        const body = await readJson(req);
        await service.markConverted(sessionId, body.orderId || '', body.orderNumber || '');
        send(200, { success: true, message: 'Session marked as converted.' });
        return true;
      }

      // 5. POST /api/checkout/reminders/process (trigger reminder evaluation)
      // Protected: caller must supply the CRON_SECRET to prevent unauthenticated triggering.
      if (path === '/api/checkout/reminders/process' && method === 'POST') {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.authorization;
        if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
          send(401, { success: false, message: 'Unauthorized.' });
          return true;
        }
        const stats = await service.processAbandonedCheckoutReminders(origin);
        send(200, { success: true, stats });
        return true;
      }

      send(405, { success: false, message: 'Method not allowed on this checkout route.' });
      return true;
    } catch (error) {
      if (error instanceof CheckoutHttpError) {
        send(error.status, { success: false, message: error.message });
      } else {
        console.error('[CheckoutHttp] Exception:', error);
        send(500, { success: false, message: 'Checkout service temporarily unavailable.' });
      }
      return true;
    }
  };
}

export const handleCheckoutHttp = createCheckoutHttp();
