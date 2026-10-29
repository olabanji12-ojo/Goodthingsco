import { restoreApiUrl } from '../server/apiRouting.js';
/**
 * Good Things Co. — Unified API Serverless Function
 *
 * Consolidates all API routes into a single Serverless Function to stay
 * strictly within the Vercel Hobby plan limit (<= 12 Serverless Functions).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleOrderHttp } from '../server/orders/http.js';
import { handleCheckoutHttp } from '../server/checkout/http.js';
import { handleCorporateHttp } from '../server/corporate/http.js';
import { handleCustomHttp } from '../server/custom/http.js';
import { handleSettingsHttp } from '../server/settings/http.js';
import { handleContentHttp } from '../server/content/http.js';
import { createPendingOrderServer, confirmPaidOrderServer } from '../server/orderService.js';
import { verifyWebhookSignature } from '../server/paystackService.js';
import { verifyFlutterwaveWebhookSignature } from '../server/flutterwaveService.js';

async function parseBody(req: IncomingMessage & { body?: any }): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    try {
      return JSON.parse(String(req.body));
    } catch {
      return { rawBody: String(req.body) };
    }
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
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

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  try {
    // When deployed on Vercel with rewrites, req.url may be rewritten to '/api' or '/api?path=...'.
    // Restore the actual original client request path from Vercel headers or query param.
    const matchedPath = (req.headers['x-matched-path'] as string)
      || (req.headers['x-forwarded-uri'] as string)
      || (req.headers['x-original-url'] as string);

    req.url = restoreApiUrl(req.url || '/', matchedPath);

    // 1. Delegate to domain handlers
    if (await handleOrderHttp(req, res)) return;
    if (await handleCheckoutHttp(req, res)) return;
    if (await handleCorporateHttp(req, res)) return;
    if (await handleCustomHttp(req, res)) return;
    if (await handleSettingsHttp(req, res)) return;
    if (await handleContentHttp(req, res)) return;

    const url = (req.url || '').split('?')[0];
    const method = (req.method || 'GET').toUpperCase();

    // 2. Payment Initialization (Paystack, Flutterwave, or unified)
    if ((url === '/api/paystack/initialize' || url === '/api/flutterwave/initialize' || url === '/api/payment/initialize') && method === 'POST') {
      const body = await parseBody(req);
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'goodthingsco.ng';
      const origin = `${protocol}://${host}`;

      const payload = { ...body.payload };
      if (url === '/api/flutterwave/initialize') {
        payload.paymentProvider = 'flutterwave';
      }

      const result = await createPendingOrderServer(payload, origin, req.headers.authorization?.replace(/^Bearer /, ''));
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 3. Payment Verification (Paystack, Flutterwave, or unified)
    if ((url === '/api/paystack/verify' || url === '/api/flutterwave/verify' || url === '/api/payment/verify') && method === 'POST') {
      const body = await parseBody(req);
      const reference = body.reference || body.tx_ref;
      if (!reference) {
        return sendJson(res, 400, { success: false, message: 'Missing transaction reference' });
      }
      const result = await confirmPaidOrderServer(reference);
      return sendJson(res, result.success ? 200 : result.retryable ? 503 : 400, result);
    }

    // 4. POST /api/paystack/webhook
    if (url === '/api/paystack/webhook' && method === 'POST') {
      let rawBody = '';
      if (req.body !== undefined) {
        rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        await new Promise<void>((resolve) => {
          req.on('data', (chunk) => {
            rawBody += chunk.toString();
          });
          req.on('end', () => resolve());
        });
      }

      const signature = req.headers['x-paystack-signature'] as string | undefined;
      const isValid = verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        console.warn('[Webhook] Invalid Paystack signature received');
        return sendJson(res, 400, { message: 'Invalid webhook signature' });
      }

      const event = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody);
      if (event.event === 'charge.success' && event.data?.reference) {
        const confirmed = await confirmPaidOrderServer(event.data.reference);
        if (!confirmed.success) return sendJson(res, 503, { status: 'retry' });
      }

      return sendJson(res, 200, { status: 'received' });
    }

    // 5. POST /api/flutterwave/webhook
    if (url === '/api/flutterwave/webhook' && method === 'POST') {
      let rawBody = '';
      if (req.body !== undefined) {
        rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        await new Promise<void>((resolve) => {
          req.on('data', (chunk) => {
            rawBody += chunk.toString();
          });
          req.on('end', () => resolve());
        });
      }

      const signature = req.headers['verif-hash'] as string | undefined;
      const isValid = verifyFlutterwaveWebhookSignature(signature);

      if (!isValid && process.env.FLUTTERWAVE_SECRET_HASH) {
        console.warn('[Webhook] Invalid Flutterwave signature received');
        return sendJson(res, 400, { message: 'Invalid webhook signature' });
      }

      const event = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody);
      const reference = event.data?.tx_ref || event.txRef || event.data?.reference;
      if (reference && (event.event === 'charge.completed' || event.data?.status === 'successful')) {
        const confirmed = await confirmPaidOrderServer(reference);
        if (!confirmed.success) return sendJson(res, 503, { status: 'retry' });
      }

      return sendJson(res, 200, { status: 'received' });
    }

    // 5. Unknown route fallback
    return sendJson(res, 404, { success: false, message: 'API route not found' });
  } catch (error: any) {
    console.error('[API Router Error]', error);
    return sendJson(res, 500, { success: false, message: 'Service temporarily unavailable. Please try again shortly.' });
  }
}
