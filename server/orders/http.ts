import type { IncomingMessage, ServerResponse } from 'node:http';
import { orderManagement } from './service.js';
import { OrderHttpError } from './domain.js';

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new OrderHttpError(415, 'Send a JSON request.');
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 16384) throw new OrderHttpError(413, 'Request is too large.');
    try { return JSON.parse(raw); } catch { throw new OrderHttpError(400, 'Invalid JSON request.'); }
  }
  let bytes = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk); bytes += buffer.length;
    if (bytes > 16384) throw new OrderHttpError(413, 'Request is too large.');
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new OrderHttpError(400, 'Invalid JSON request.'); }
}
export function createOrderHttp(service = orderManagement) {
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;
    if (!path.startsWith('/api/admin/orders') && path !== '/api/track-order' && !path.startsWith('/api/orders/')) return false;
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, body: unknown) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    try {
      if (path.startsWith('/api/orders/')) {
        send(410, { success: false, message: 'Please verify your details at /track-order.' }); return true;
      }
      const authorization = req.headers.authorization;
      const cookieToken = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('gtc_tracking='))?.slice(13) || '';
      const cookie = (token: string, age: number) => `gtc_tracking=${token}; Path=/api/track-order; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      const match = path.match(/^\/api\/admin\/orders\/([a-zA-Z0-9_-]{1,128})$/);
      if (path === '/api/track-order' && req.method === 'POST') {
        // Trust the platform header only on Vercel, where it is set by their proxy.
        // Other deployments use the socket peer; arbitrary forwarded headers are ignored.
        const forwarded = process.env.VERCEL === '1' ? req.headers['x-vercel-forwarded-for'] : undefined;
        const clientAddress = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
        const { order, token } = await service.track(await readJson(req), clientAddress);
        res.setHeader('Set-Cookie', cookie(token, 1800));
        send(200, { success: true, order });
      } else if (path === '/api/track-order' && req.method === 'GET') {
        send(200, { success: true, order: await service.resume(cookieToken) });
      } else if (path === '/api/track-order' && req.method === 'DELETE') {
        await service.forget(cookieToken); res.setHeader('Set-Cookie', cookie('', 0));
        send(200, { success: true });
      } else if (path === '/api/admin/orders' && req.method === 'GET') {
        send(200, { success: true, ...await service.list(authorization, url.searchParams) });
      } else if (match && req.method === 'GET') {
        send(200, { success: true, order: await service.detail(authorization, match[1]) });
      } else if (match && req.method === 'PATCH') {
        send(200, { success: true, ...await service.update(authorization, match[1], await readJson(req)) });
      } else { send(405, { success: false, message: 'Method or route not supported.' }); }
    } catch (error) {
      if (error instanceof OrderHttpError) {
        if (error.status === 429) res.setHeader('Retry-After', '900');
        send(error.status, { success: false, message: error.message });
      } else {
        console.error('[OrderManagement] Request failed');
        send(503, { success: false, message: 'Orders are temporarily unavailable. Please try again shortly.' });
      }
    }
    return true;
  };
}
export const handleOrderHttp = createOrderHttp();
