/**
 * Good Things Co. — Website Content CMS HTTP Handler
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'url';
import { contentService } from './service';
import { ContentHttpError, isValidPageId } from './domain';
import type { ContentPageId } from '../../src/types/content';

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      throw new ContentHttpError(400, 'Invalid JSON body.');
    }
  }

  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 65536) {
      throw new ContentHttpError(413, 'Payload too large (maximum 64KB).');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new ContentHttpError(400, 'Invalid JSON body.');
  }
}

export function createContentHttp(service = contentService) {
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    // Pattern matching:
    // /api/content/:pageId
    // /api/admin/content/:pageId
    const publicMatch = path.match(/^\/api\/content\/([a-zA-Z0-9_-]+)$/);
    const adminMatch = path.match(/^\/api\/admin\/content\/([a-zA-Z0-9_-]+)$/);

    if (!publicMatch && !adminMatch) return false;

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
      // 1. GET /api/content/:pageId (Public safe endpoint)
      if (publicMatch && method === 'GET') {
        const pageId = publicMatch[1];
        if (!isValidPageId(pageId)) {
          send(404, { success: false, message: `Page "${pageId}" not found.` });
          return true;
        }
        const data = await service.getPublicPageContent(pageId as ContentPageId);
        send(200, { success: true, ...data });
        return true;
      }

      // 2. GET /api/admin/content/:pageId (Admin view endpoint)
      if (adminMatch && method === 'GET') {
        const pageId = adminMatch[1];
        if (!isValidPageId(pageId)) {
          send(404, { success: false, message: `Page "${pageId}" not found.` });
          return true;
        }
        const data = await service.getPageContentAsAdmin(authorization, pageId as ContentPageId);
        send(200, { success: true, ...data });
        return true;
      }

      // 3. PATCH or PUT /api/admin/content/:pageId (Admin update endpoint)
      if (adminMatch && (method === 'PATCH' || method === 'PUT')) {
        const pageId = adminMatch[1];
        if (!isValidPageId(pageId)) {
          send(404, { success: false, message: `Page "${pageId}" not found.` });
          return true;
        }
        const body = await readJson(req);
        const saved = await service.updatePageContent(authorization, pageId as ContentPageId, body.content || body);
        send(200, { success: true, message: 'Content updated successfully', ...saved });
        return true;
      }

      send(405, { success: false, message: 'Method not allowed on content endpoint.' });
      return true;
    } catch (error) {
      if (error instanceof ContentHttpError) {
        send(error.statusCode, { success: false, message: error.message });
      } else {
        console.error('[ContentHttp] Exception:', error);
        send(500, { success: false, message: 'Content service temporarily unavailable.' });
      }
      return true;
    }
  };
}

export const handleContentHttp = createContentHttp();
