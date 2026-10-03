/**
 * Good Things Co. — Vite Dev Server API Middleware Plugin
 *
 * Mounts secure server endpoints directly into the Vite development server:
 * - POST /api/paystack/initialize
 * - POST /api/paystack/verify
 * - POST /api/paystack/webhook
 * - GET  /api/orders/:orderNumber
 *
 * Keeps PAYSTACK_SECRET_KEY safely in Node process.env on the server.
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  createPendingOrderServer,
  confirmPaidOrderServer,
} from './orderService';
import { verifyWebhookSignature } from './paystackService';
import { handleOrderHttp } from './orders/http';
import { handleCheckoutHttp } from './checkout/http';
import { handleCorporateHttp } from './corporate/http';
import { handleCustomHttp } from './custom/http';
import { handleSettingsHttp } from './settings/http';
import { handleContentHttp } from './content/http';

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({ rawBody: body });
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function devApiPlugin(): Plugin {
  return {
    name: 'goodthingsco-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (await handleOrderHttp(req, res)) return;
        if (await handleCheckoutHttp(req, res)) return;
        if (await handleCorporateHttp(req, res)) return;
        if (await handleCustomHttp(req, res)) return;
        if (await handleSettingsHttp(req, res)) return;
        if (await handleContentHttp(req, res)) return;
        const url = req.url || '';
        const method = (req.method || 'GET').toUpperCase();

        // 1. POST /api/paystack/initialize
        if (url === '/api/paystack/initialize' && method === 'POST') {
          try {
            const body = await parseBody(req);
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost:5174';
            const origin = `${protocol}://${host}`;

            const result = await createPendingOrderServer(body.payload, origin);
            if (!result.success) {
              return sendJson(res, 400, result);
            }
            return sendJson(res, 200, result);
          } catch (err: any) {
            console.error('[API /api/paystack/initialize] Error:', err);
            return sendJson(res, 500, { success: false, message: err?.message || 'Server error' });
          }
        }

        // 2. POST /api/paystack/verify
        if (url === '/api/paystack/verify' && method === 'POST') {
          try {
            const body = await parseBody(req);
            const reference = body.reference;

            if (!reference) {
              return sendJson(res, 400, { success: false, message: 'Missing transaction reference' });
            }

            const result = await confirmPaidOrderServer(reference);
            if (!result.success) {
              return sendJson(res, 400, result);
            }
            return sendJson(res, 200, result);
          } catch (err: any) {
            console.error('[API /api/paystack/verify] Error:', err);
            return sendJson(res, 500, { success: false, message: err?.message || 'Server error' });
          }
        }

        // 3. POST /api/paystack/webhook
        if (url === '/api/paystack/webhook' && method === 'POST') {
          try {
            let rawBody = '';
            await new Promise<void>((resolve) => {
              req.on('data', (chunk) => {
                rawBody += chunk.toString();
              });
              req.on('end', () => resolve());
            });

            const signature = req.headers['x-paystack-signature'] as string | undefined;
            const isValid = verifyWebhookSignature(rawBody, signature);

            if (!isValid) {
              console.warn('[Webhook] Invalid Paystack signature received');
              return sendJson(res, 400, { message: 'Invalid webhook signature' });
            }

            const event = JSON.parse(rawBody);
            if (event.event === 'charge.success' && event.data?.reference) {
              await confirmPaidOrderServer(event.data.reference);
            }

            return sendJson(res, 200, { status: 'received' });
          } catch (err: any) {
            console.error('[API /api/paystack/webhook] Error:', err);
            return sendJson(res, 500, { message: 'Webhook processing error' });
          }
        }

        next();
      });
    },
  };
}

