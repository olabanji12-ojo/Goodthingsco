/**
 * Good Things Co. — Corporate Requests HTTP Handler
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'url';
import { corporateManagement } from './service.js';
import { CorporateHttpError } from './domain.js';

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      throw new CorporateHttpError(400, 'Invalid JSON body.');
    }
  }

  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 65536) {
      throw new CorporateHttpError(413, 'Payload too large (maximum 64KB).');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new CorporateHttpError(400, 'Invalid JSON body.');
  }
}

export function createCorporateHttp(service = corporateManagement) {
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    const isPublicCorp = path === '/api/corporate-requests';
    const isAdminCorp = path.startsWith('/api/admin/corporate');

    if (!isPublicCorp && !isAdminCorp) return false;

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
      // 1. POST /api/corporate-requests (Public submission)
      if (isPublicCorp && method === 'POST') {
        // Trust the platform header only on Vercel, where it is set by their proxy.
        const forwarded = process.env.VERCEL === '1' ? req.headers['x-forwarded-for'] : undefined;
        const clientIp =
          typeof forwarded === 'string' ? forwarded.split(',')[0].trim() :
          req.socket.remoteAddress || 'unknown';

        const body = await readJson(req);
        const result = await service.submitRequest(body, clientIp);
        send(201, result);
        return true;
      }

      // 2. GET /api/admin/corporate (Admin list)
      if (path === '/api/admin/corporate' && method === 'GET') {
        const result = await service.listRequests(authorization, url.searchParams);
        send(200, { success: true, ...result });
        return true;
      }

      // 3. GET /api/admin/corporate/:id (Admin detail)
      const detailMatch = path.match(/^\/api\/admin\/corporate\/([a-zA-Z0-9_-]{1,128})$/);
      if (detailMatch && method === 'GET') {
        const id = detailMatch[1];
        const request = await service.getRequestDetails(authorization, id);
        send(200, { success: true, request });
        return true;
      }

      // 4. PATCH /api/admin/corporate/:id/status (Admin status update)
      const statusMatch = path.match(/^\/api\/admin\/corporate\/([a-zA-Z0-9_-]{1,128})\/status$/);
      if (statusMatch && method === 'PATCH') {
        const id = statusMatch[1];
        const body = await readJson(req);
        const request = await service.updateStatus(authorization, id, body);
        send(200, { success: true, request });
        return true;
      }

      // 5. POST /api/admin/corporate/:id/quote (Admin quote management)
      const quoteMatch = path.match(/^\/api\/admin\/corporate\/([a-zA-Z0-9_-]{1,128})\/quote$/);
      if (quoteMatch && method === 'POST') {
        const id = quoteMatch[1];
        const body = await readJson(req);
        const action = body.action;

        let updated;
        if (action === 'draft') {
          updated = await service.saveQuoteDraft(authorization, id, body);
        } else if (action === 'send') {
          updated = await service.sendQuote(authorization, id, body);
        } else if (action === 'accept') {
          updated = await service.acceptQuote(authorization, id, body.note);
        } else if (action === 'decline') {
          updated = await service.declineQuote(authorization, id, body.reason);
        } else {
          throw new CorporateHttpError(400, 'Invalid quote action. Use draft, send, accept, or decline.');
        }

        send(200, { success: true, request: updated });
        return true;
      }

      send(405, { success: false, message: 'Method not allowed on this corporate endpoint.' });
      return true;
    } catch (error) {
      if (error instanceof CorporateHttpError) {
        send(error.status, { success: false, message: error.message });
      } else {
        console.error('[CorporateHttp] Exception:', error);
        send(500, { success: false, message: 'Corporate request service temporarily unavailable.' });
      }
      return true;
    }
  };
}

export const handleCorporateHttp = createCorporateHttp();
