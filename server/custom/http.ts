/**
 * Good Things Co. — Custom Requests HTTP Handler
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'url';
import { customManagementService } from './service.js';
import { CustomHttpError } from './domain.js';

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      throw new CustomHttpError(400, 'Invalid JSON body.');
    }
  }

  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 131072) { // 128KB max payload for custom requests with design references
      throw new CustomHttpError(413, 'Payload too large (maximum 128KB).');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new CustomHttpError(400, 'Invalid JSON body.');
  }
}

export function createCustomHttp(service = customManagementService) {
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    const isPublicCustom = path === '/api/custom-requests';
    const isAdminCustom = path.startsWith('/api/admin/custom');

    if (!isPublicCustom && !isAdminCustom) return false;

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
      // 1. POST /api/custom-requests (Public submission)
      if (isPublicCustom && method === 'POST') {
        // Trust the platform header only on Vercel, where it is set by their proxy.
        const forwarded = process.env.VERCEL === '1' ? req.headers['x-forwarded-for'] : undefined;
        const clientIp =
          typeof forwarded === 'string' ? forwarded.split(',')[0].trim() :
          req.socket.remoteAddress || 'unknown';
        const idempotencyHeader = req.headers['idempotency-key'] as string | undefined;

        const body = await readJson(req);
        const result = await service.submitRequest(body, clientIp, idempotencyHeader);
        send(201, result);
        return true;
      }

      // 2. GET /api/admin/custom (Admin list)
      if (path === '/api/admin/custom' && method === 'GET') {
        const result = await service.listRequests(authorization, url.searchParams);
        send(200, { success: true, ...result });
        return true;
      }

      // 3. GET /api/admin/custom/:id (Admin detail)
      const detailMatch = path.match(/^\/api\/admin\/custom\/([a-zA-Z0-9_-]{1,128})$/);
      if (detailMatch && method === 'GET') {
        const id = detailMatch[1];
        const request = await service.getRequestDetails(authorization, id);
        send(200, { success: true, request });
        return true;
      }

      // 4. PATCH /api/admin/custom/:id/status (Admin status update)
      const statusMatch = path.match(/^\/api\/admin\/custom\/([a-zA-Z0-9_-]{1,128})\/status$/);
      if (statusMatch && method === 'PATCH') {
        const id = statusMatch[1];
        const body = await readJson(req);
        const request = await service.updateStatus(authorization, id, body);
        send(200, { success: true, request });
        return true;
      }

      // 5. POST /api/admin/custom/:id/quote (Admin quote management)
      const quoteMatch = path.match(/^\/api\/admin\/custom\/([a-zA-Z0-9_-]{1,128})\/quote$/);
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
          updated = await service.declineQuote(authorization, id, body.reason, body.note);
        } else {
          throw new CustomHttpError(400, 'Invalid quote action. Use draft, send, accept, or decline.');
        }

        send(200, { success: true, request: updated });
        return true;
      }

      // 6. PATCH /api/admin/custom/:id/production (Admin production stage update)
      const prodMatch = path.match(/^\/api\/admin\/custom\/([a-zA-Z0-9_-]{1,128})\/production$/);
      if (prodMatch && method === 'PATCH') {
        const id = prodMatch[1];
        const body = await readJson(req);
        const request = await service.updateProductionStage(authorization, id, body.stage, body.note);
        send(200, { success: true, request });
        return true;
      }

      // 7. PATCH /api/admin/custom/:id/notes (Admin internal notes)
      const notesMatch = path.match(/^\/api\/admin\/custom\/([a-zA-Z0-9_-]{1,128})\/notes$/);
      if (notesMatch && method === 'PATCH') {
        const id = notesMatch[1];
        const body = await readJson(req);
        const request = await service.updateAdminNotes(authorization, id, body.notes || '');
        send(200, { success: true, request });
        return true;
      }

      send(405, { success: false, message: 'Method not allowed on this custom request endpoint.' });
      return true;
    } catch (error) {
      if (error instanceof CustomHttpError) {
        send(error.statusCode, { success: false, message: error.message });
      } else {
        console.error('[CustomHttp] Exception:', error);
        send(500, { success: false, message: 'Custom request service temporarily unavailable.' });
      }
      return true;
    }
  };
}

export const handleCustomHttp = createCustomHttp();
