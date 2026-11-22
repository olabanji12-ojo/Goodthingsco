import { restoreApiUrl } from '../server/apiRouting.js';
/**
 * Good Things Co. — Unified API Serverless Function
 *
 * Consolidates all API routes into a single Serverless Function to stay
 * strictly within the Vercel Hobby plan limit (<= 12 Serverless Functions).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual, createHash } from 'node:crypto';
import { getAdminFirestore } from '../server/firebase.js';
import { handleOrderHttp } from '../server/orders/http.js';
import { handleCheckoutHttp } from '../server/checkout/http.js';
import { handleCorporateHttp } from '../server/corporate/http.js';
import { handleCustomHttp } from '../server/custom/http.js';
import { handleSettingsHttp } from '../server/settings/http.js';
import { handleContentHttp } from '../server/content/http.js';
import { createPendingOrderServer, confirmPaidOrderServer } from '../server/orderService.js';
import { verifyWebhookSignature } from '../server/paystackService.js';
import { verifyFlutterwaveWebhookSignature } from '../server/flutterwaveService.js';
import { processNombaWebhook } from '../server/nombaService.js';

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

    // Maintenance / Reset Test Data (Orders, Corporate Requests, Custom Requests)
    if (url === '/api/admin/clean-test-data' && method === 'POST') {
      const authHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
      const expectedSecret = (process.env.CRON_SECRET || '').trim();
      const isAuthorized = Boolean(
        expectedSecret &&
        authHeader &&
        timingSafeEqual(
          createHash('sha256').update(authHeader).digest(),
          createHash('sha256').update(expectedSecret).digest()
        )
      );

      if (!isAuthorized) {
        return sendJson(res, 401, { success: false, message: 'Unauthorized maintenance request' });
      }

      const db = getAdminFirestore();
      let deletedOrders = 0;
      let deletedCorporate = 0;
      let deletedCustom = 0;

      // 1. Delete all orders and subcollections
      const ordersSnap = await db.collection('orders').get();
      for (const orderDoc of ordersSnap.docs) {
        const events = await orderDoc.ref.collection('managementEvents').get();
        const batch = db.batch();
        events.docs.forEach((e) => batch.delete(e.ref));
        batch.delete(orderDoc.ref);
        await batch.commit();
        deletedOrders++;
      }

      // 2. Delete all corporate requests
      const corpSnap = await db.collection('corporateRequests').get();
      if (!corpSnap.empty) {
        const batch = db.batch();
        corpSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deletedCorporate = corpSnap.size;
      }

      // 3. Delete all custom requests
      const custSnap = await db.collection('customRequests').get();
      if (!custSnap.empty) {
        const batch = db.batch();
        custSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deletedCustom = custSnap.size;
      }

      // 4. Also clean up any tracking sessions
      const sessionsSnap = await db.collection('orderTrackingSessions').get();
      if (!sessionsSnap.empty) {
        const batch = db.batch();
        sessionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Successfully cleared all test orders, corporate requests, and custom requests.',
        deletedOrders,
        deletedCorporate,
        deletedCustom,
      });
    }

    // 2. Payment Initialization (Flutterwave / Nomba)
    if (
      (url === '/api/flutterwave/initialize' ||
        url === '/api/payment/initialize' ||
        url === '/api/paystack/initialize' ||
        url === '/api/nomba/initialize') &&
      method === 'POST'
    ) {
      const body = await parseBody(req);
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'goodthingsco.ng';
      const origin = `${protocol}://${host}`;

      const selectedProvider =
        url === '/api/nomba/initialize'
          ? 'nomba'
          : body.payload?.paymentProvider === 'nomba'
          ? 'nomba'
          : 'flutterwave';

      const payload = { ...body.payload, paymentProvider: selectedProvider };

      const result = await createPendingOrderServer(payload, origin, req.headers.authorization?.replace(/^Bearer /, ''));
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 3. Payment Verification (Flutterwave / Nomba / Paystack)
    if (
      (url === '/api/flutterwave/verify' ||
        url === '/api/payment/verify' ||
        url === '/api/paystack/verify' ||
        url === '/api/nomba/verify') &&
      method === 'POST'
    ) {
      const body = await parseBody(req);
      const reference = body.reference || body.tx_ref || body.orderReference;
      if (!reference) {
        return sendJson(res, 400, { success: false, message: 'Missing transaction reference' });
      }
      const result = await confirmPaidOrderServer(reference, body.transaction_id || body.transactionId);
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

    // 6. POST /api/nomba/webhook
    if (url === '/api/nomba/webhook' && method === 'POST') {
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

      const result = await processNombaWebhook(rawBody, req.headers as any, confirmPaidOrderServer);
      return sendJson(res, result.statusCode, result.data);
    }

    // 7. Unknown route fallback
    return sendJson(res, 404, { success: false, message: 'API route not found' });
  } catch (error: any) {
    console.error('[API Router Error]', error);
    return sendJson(res, 500, { success: false, message: 'Service temporarily unavailable. Please try again shortly.' });
  }
}
