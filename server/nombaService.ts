/**
 * Good Things Co. — Server-Side Nomba Payment Service
 *
 * Implements:
 * - OAuth2 Client Credentials token management with proactive in-memory caching
 * - Nomba Hosted Checkout order creation (POST /v1/checkout/order)
 * - Single transaction verification via authoritative API (GET /v1/transactions/accounts/single)
 * - Strict RFC 3339 & HMAC-SHA256 Base64 webhook signature verification
 * - Decimal-safe monetary conversion to integer Kobo
 *
 * CRITICAL SECURITY RULE:
 * This file and NOMBA credentials MUST ONLY execute server-side.
 * They are never bundled into or accessible by client browser code.
 */

import crypto from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { db } from './firebase.js';
import { notificationService } from './services/notificationService.js';
import { effectiveHistory } from './orders/domain.js';
import type { Order } from '../src/types/order.js';

export const ORDERS_COLLECTION = 'orders';

export interface NombaCredentials {
  clientId: string;
  privateKey: string;
  accountId: string;
  webhookSecret: string;
  baseUrl: string;
}

export interface NombaInitParams {
  reference: string;
  amountNaira: number;
  customerEmail: string;
  callbackUrl: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface NombaInitResult {
  success: boolean;
  authorizationUrl?: string;
  reference: string;
  message?: string;
}

export interface NombaVerifyResult {
  success: boolean;
  status: 'success' | 'failed' | 'error';
  reference: string;
  amountKobo: number;
  amountNaira: number;
  currency: string;
  transactionId?: string;
  channel?: string;
  paidAt?: string;
  customerEmail?: string;
  message: string;
  isSimulated?: boolean;
  raw?: any;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;

function readEnvDirect(key: string): string {
  if (process.env.NODE_ENV === 'test') return '';
  if (process.env[key]) return process.env[key]!.trim();
  try {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match) return match[1].trim();
    }
  } catch {
    // ignore
  }
  return '';
}

/**
 * Retrieves and standardizes Nomba credentials from server environment variables.
 * Consistent naming: NOMBA_CLIENT_ID, NOMBA_PRIVATE_KEY, NOMBA_ACCOUNT_ID, NOMBA_WEBHOOK_SECRET.
 */
export function getNombaCredentials(): NombaCredentials {
  const baseUrl = (
    process.env.NOMBA_BASE_URL ||
    readEnvDirect('NOMBA_BASE_URL') ||
    'https://api.nomba.com'
  ).replace(/\/$/, '');

  const isSandbox = baseUrl.includes('sandbox');

  const clientId =
    (isSandbox ? (process.env.SANDBOX_CLIENT_ID || readEnvDirect('SANDBOX_CLIENT_ID')) : '') ||
    process.env.NOMBA_CLIENT_ID ||
    process.env.CLIENT_ID ||
    readEnvDirect('NOMBA_CLIENT_ID') ||
    readEnvDirect('CLIENT_ID');

  const privateKey =
    (isSandbox ? (process.env.SANDBOX_PRIVATE_KEY || readEnvDirect('SANDBOX_PRIVATE_KEY')) : '') ||
    process.env.NOMBA_PRIVATE_KEY ||
    process.env.NOMBA_CLIENT_SECRET ||
    process.env.PRIVATE_KEY ||
    readEnvDirect('NOMBA_PRIVATE_KEY') ||
    readEnvDirect('NOMBA_CLIENT_SECRET') ||
    readEnvDirect('PRIVATE_KEY');

  const accountId =
    (isSandbox ? (process.env.SANDBOX_ACCOUNT_ID || readEnvDirect('SANDBOX_ACCOUNT_ID')) : '') ||
    process.env.NOMBA_ACCOUNT_ID ||
    process.env.ACCOUNT_ID ||
    readEnvDirect('NOMBA_ACCOUNT_ID') ||
    readEnvDirect('ACCOUNT_ID');

  const webhookSecret =
    process.env.NOMBA_WEBHOOK_SECRET ||
    readEnvDirect('NOMBA_WEBHOOK_SECRET');

  return {
    clientId: (clientId || '').trim(),
    privateKey: (privateKey || '').trim(),
    accountId: (accountId || '').trim(),
    webhookSecret: (webhookSecret || '').trim(),
    baseUrl,
  };
}

/**
 * Decimal-safe monetary conversion from Naira (number or string e.g. "35000.50") to integer Kobo.
 * Prevents IEEE 754 floating point inaccuracies.
 */
export function nairaToKoboSafe(amount: number | string): number {
  const str = String(amount).trim();
  if (!str || !/^-?\d+(\.\d+)?$/.test(str)) {
    throw new Error(`Invalid monetary amount: ${amount}`);
  }
  const isNegative = str.startsWith('-');
  const clean = isNegative ? str.slice(1) : str;
  const parts = clean.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').slice(0, 2).padEnd(2, '0');
  const kobo = parseInt(whole, 10) * 100 + parseInt(fraction, 10);
  return isNegative ? -kobo : kobo;
}

/**
 * Validates strict RFC 3339 / ISO 8601 timestamp formatting.
 * Example: 2026-11-19T10:51:44Z or 2026-11-19T10:51:44+01:00
 */
const RFC3339_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/i;
export function isValidRfc3339(timestamp: string): boolean {
  if (!timestamp || typeof timestamp !== 'string') return false;
  if (!RFC3339_REGEX.test(timestamp)) return false;
  const parsed = Date.parse(timestamp);
  return !Number.isNaN(parsed);
}

/**
 * Constructs the exact colon-separated string signed by Nomba per SDK specification:
 * event_type:requestId:userId:walletId:transactionId:type:time:responseCode:timestamp
 */
export function buildNombaSigningString(payload: any, timestamp: string): string {
  const event_type = payload?.event_type || '';
  const requestId = payload?.requestId || '';
  const userId = payload?.data?.merchant?.userId || payload?.userId || '';
  const walletId = payload?.data?.merchant?.walletId || payload?.walletId || '';
  const transactionId = payload?.data?.transaction?.transactionId || payload?.transactionId || '';
  const type = payload?.data?.transaction?.type || payload?.type || '';
  const time = payload?.data?.transaction?.time || payload?.time || '';
  const responseCode = payload?.data?.transaction?.responseCode || payload?.responseCode || '';

  return [
    event_type,
    requestId,
    userId,
    walletId,
    transactionId,
    type,
    time,
    responseCode,
    timestamp,
  ].join(':');
}

/**
 * Verifies Nomba webhook signature using constant-time Base64 HMAC-SHA256 comparison.
 */
export function verifyNombaWebhookSignature(
  payload: any,
  headers: Record<string, string | string[] | undefined>,
  secretKey: string
): { valid: boolean; reason?: string } {
  if (!secretKey) {
    return { valid: false, reason: 'NOMBA_WEBHOOK_SECRET is not configured on server' };
  }

  const rawSigHeader = headers['nomba-signature'] || headers['nomba-sig-value'];
  const signature = Array.isArray(rawSigHeader) ? rawSigHeader[0] : rawSigHeader;
  if (!signature || typeof signature !== 'string') {
    return { valid: false, reason: 'Missing nomba-signature or nomba-sig-value header' };
  }

  const rawTimestamp = headers['nomba-timestamp'];
  const timestamp = Array.isArray(rawTimestamp) ? rawTimestamp[0] : rawTimestamp;
  if (!timestamp || typeof timestamp !== 'string' || !isValidRfc3339(timestamp)) {
    return { valid: false, reason: 'Invalid or missing RFC 3339 nomba-timestamp header' };
  }

  const rawAlgorithm = headers['nomba-signature-algorithm'];
  const algorithm = Array.isArray(rawAlgorithm) ? rawAlgorithm[0] : rawAlgorithm;
  if (algorithm && typeof algorithm === 'string' && algorithm.toLowerCase() !== 'hmacsha256') {
    return { valid: false, reason: `Unsupported signature algorithm: ${algorithm}` };
  }

  const signingString = buildNombaSigningString(payload, timestamp);
  const computedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signingString)
    .digest('base64');

  try {
    const receivedBuffer = Buffer.from(signature.trim(), 'base64');
    const computedBuffer = Buffer.from(computedSignature, 'base64');

    if (receivedBuffer.length !== computedBuffer.length) {
      return { valid: false, reason: 'Signature length mismatch' };
    }

    if (!crypto.timingSafeEqual(receivedBuffer, computedBuffer)) {
      return { valid: false, reason: 'Signature mismatch' };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Verification exception: ${err.message}` };
  }
}

/**
 * Acquires a processing lease for a webhook event by requestId using explicit states and leaseExpiresAt.
 * Recovers safely from abandoned/crashed processing attempts after lease expiry.
 */
export async function acquireNombaWebhookLock(
  requestId: string,
  orderReference?: string
): Promise<{ acquired: boolean; alreadyProcessed: boolean }> {
  if (!requestId || typeof requestId !== 'string') {
    return { acquired: false, alreadyProcessed: false };
  }

  try {
    const database = db();
    const eventRef = database.collection('nombaWebhookEvents').doc(requestId.trim());

    return await database.runTransaction(async (txn) => {
      const docSnap = await txn.get(eventRef);
      const now = Date.now();

      if (docSnap.exists) {
        const data = docSnap.data() || {};
        if (data.status === 'processed') {
          return { acquired: false, alreadyProcessed: true };
        }

        if (data.status === 'processing') {
          const leaseExpiresAt = Number(data.leaseExpiresAt) || 0;
          if (now < leaseExpiresAt) {
            // Still locked by active in-flight worker
            return { acquired: false, alreadyProcessed: false };
          }
          // Lease expired; recover lock
        }
      }

      const leaseExpiresAt = now + 60_000; // 60-second lease
      txn.set(
        eventRef,
        {
          requestId: requestId.trim(),
          status: 'processing',
          orderReference: orderReference ? orderReference.trim() : null,
          leaseExpiresAt,
          updatedAt: new Date().toISOString(),
          ...(docSnap.exists ? {} : { createdAt: new Date().toISOString() }),
        },
        { merge: true }
      );

      return { acquired: true, alreadyProcessed: false };
    });
  } catch (err) {
    console.warn('[NombaWebhookLock] Error acquiring lock for requestId:', requestId, err);
    // If database transaction fails, proceed conservatively
    return { acquired: true, alreadyProcessed: false };
  }
}

/**
 * Releases or updates the webhook lock to 'processed' or 'failed'.
 */
export async function releaseNombaWebhookLock(
  requestId: string,
  status: 'processed' | 'failed',
  error?: string
): Promise<void> {
  if (!requestId) return;
  try {
    const database = db();
    const eventRef = database.collection('nombaWebhookEvents').doc(requestId.trim());
    await eventRef.set(
      {
        status,
        updatedAt: new Date().toISOString(),
        ...(error ? { lastError: error } : {}),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[NombaWebhookLock] Failed to release lock:', requestId, err);
  }
}

/**
 * Obtains an OAuth2 bearer token from Nomba API, proactively caching it in-memory.
 */
export async function getNombaAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - now > 300_000) {
    return cachedToken.accessToken;
  }

  const { clientId, privateKey, accountId, baseUrl } = getNombaCredentials();

  if (!clientId || !privateKey || !accountId) {
    throw new Error(
      'Nomba credentials missing. Please set NOMBA_CLIENT_ID, NOMBA_PRIVATE_KEY, and NOMBA_ACCOUNT_ID.'
    );
  }

  const url = `${baseUrl}/v1/auth/token/issue`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accountId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: privateKey,
    }),
  });

  const json = (await response.json()) as any;

  if (!response.ok || json.code !== '00' || !json.data?.access_token) {
    const errMsg = json.description || json.message || `Auth failed with status ${response.status}`;
    throw new Error(`Nomba authentication rejected: ${errMsg}`);
  }

  const accessToken = json.data.access_token as string;
  let expiresAtMs = now + 3600_000; // default 1 hour fallback
  if (json.data.expiresAt) {
    const parsed = Date.parse(json.data.expiresAt);
    if (!Number.isNaN(parsed)) {
      expiresAtMs = parsed;
    }
  }

  cachedToken = {
    accessToken,
    expiresAtMs,
  };

  return accessToken;
}

/**
 * Resets the in-memory token cache (primarily for tests).
 */
export function resetNombaTokenCache(): void {
  cachedToken = null;
}

/**
 * Creates a hosted checkout order with Nomba API (POST /v1/checkout/order).
 */
export async function initializeNombaTransaction(
  params: NombaInitParams
): Promise<NombaInitResult> {
  const { accountId, baseUrl } = getNombaCredentials();

  try {
    const token = await getNombaAccessToken();
    const url = `${baseUrl}/v1/checkout/order`;

    const payload = {
      order: {
        orderReference: params.reference,
        customerEmail: params.customerEmail,
        amount: params.amountNaira,
        currency: 'NGN',
        callbackUrl: params.callbackUrl,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accountId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as any;

    if (!response.ok || json.code !== '00' || !json.data?.checkoutLink) {
      console.error('[NombaService.initialize] API error:', json);
      return {
        success: false,
        reference: params.reference,
        message: json.description || json.message || 'Failed to initialize checkout with Nomba.',
      };
    }

    return {
      success: true,
      authorizationUrl: json.data.checkoutLink,
      reference: json.data.orderReference || params.reference,
    };
  } catch (error: any) {
    console.error('[NombaService.initialize] Exception:', error);
    return {
      success: false,
      reference: params.reference,
      message: error?.message || 'Network communication error connecting to Nomba.',
    };
  }
}

/**
 * Verifies a transaction authoritatively via Nomba API (GET /v1/transactions/accounts/single).
 */
export async function verifyNombaTransaction(
  reference: string,
  transactionId?: string
): Promise<NombaVerifyResult> {
  const cleanRef = reference.trim();
  const { accountId, baseUrl } = getNombaCredentials();

  try {
    const token = await getNombaAccessToken();
    let url = `${baseUrl}/v1/transactions/accounts/single?orderReference=${encodeURIComponent(cleanRef)}`;

    let response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accountId,
        'Content-Type': 'application/json',
      },
    });

    let json = (await response.json()) as any;

    // If query with merchant reference returns not found and transactionId (Nomba orderId) is provided, query with transactionId as fallback
    if ((!response.ok || json.code !== '00' || !json.data) && transactionId && transactionId.trim() !== cleanRef) {
      const fallbackUrl = `${baseUrl}/v1/transactions/accounts/single?orderReference=${encodeURIComponent(transactionId.trim())}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accountId,
          'Content-Type': 'application/json',
        },
      });
      const fallbackJson = (await fallbackResponse.json()) as any;
      if (fallbackResponse.ok && fallbackJson.code === '00' && fallbackJson.data) {
        response = fallbackResponse;
        json = fallbackJson;
      }
    }

    if (!response.ok || json.code !== '00' || !json.data) {
      return {
        success: false,
        status: 'failed',
        reference: cleanRef,
        amountKobo: 0,
        amountNaira: 0,
        currency: 'NGN',
        message: json.description || 'Transaction not found or verification rejected by Nomba.',
        raw: json,
      };
    }

    const tx = json.data;
    const isSuccessful = tx.status === 'SUCCESS';
    const amountNaira = parseFloat(tx.amount || '0') || 0;
    const amountKobo = nairaToKoboSafe(tx.amount || 0);

    return {
      success: isSuccessful,
      status: isSuccessful ? 'success' : 'failed',
      reference: tx.onlineCheckoutOrderReference || tx.orderReference || cleanRef,
      amountKobo,
      amountNaira,
      currency: tx.currency || tx.onlineCheckoutCurrency || 'NGN',
      channel: tx.onlineCheckoutPaymentMethod || tx.type || 'card_payment',
      transactionId: tx.id || tx.onlineCheckoutOrderId,
      paidAt: tx.time,
      customerEmail: tx.onlineCheckoutCustomerEmail,
      message: isSuccessful ? 'Payment confirmed by Nomba.' : `Payment status is ${tx.status}.`,
      raw: tx,
    };
  } catch (error: any) {
    console.error('[NombaService.verify] Exception:', error);
    return {
      success: false,
      status: 'error',
      reference: cleanRef,
      amountKobo: 0,
      amountNaira: 0,
      currency: 'NGN',
      message: error?.message || 'Network communication error during Nomba verification.',
    };
  }
}

/**
 * Handles a payment_failed webhook event safely.
 * Strict protection: A delayed payment_failed event MUST NEVER downgrade an already-paid order.
 */
export async function handleNombaPaymentFailed(
  orderReference: string,
  payload?: any
): Promise<{ success: boolean; ignored?: boolean; message: string }> {
  if (!orderReference) return { success: false, message: 'Missing orderReference' };

  try {
    const database = db();
    const ordersCol = database.collection(ORDERS_COLLECTION);
    const snap = await ordersCol.where('payment.reference', '==', orderReference.trim()).limit(1).get();

    if (snap.empty) {
      return { success: false, message: `No order found for reference: ${orderReference}` };
    }

    const orderDoc = snap.docs[0];
    const orderData = orderDoc.data() as Order;

    // Strict Guard: Never downgrade an already-paid order
    if (orderData.payment?.status === 'paid') {
      console.warn(`[NombaService] Ignored delayed payment_failed for already-paid order ${orderData.orderNumber}`);
      return { success: true, ignored: true, message: 'Order is already confirmed as paid. Failure ignored.' };
    }

    const failureReason =
      payload?.data?.transaction?.responseMessage ||
      payload?.data?.transaction?.status ||
      'Payment failed at gateway';

    await orderDoc.ref.update({
      'payment.status': 'failed',
      'payment.paymentException': failureReason,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: `Order payment marked as failed: ${failureReason}` };
  } catch (err: any) {
    console.error('[NombaService.handleNombaPaymentFailed] Exception:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Handles a payment_reversal event safely.
 * Documents reversal in order history, transitions order to 'confirmed-review-required',
 * notifies store administrators, and DOES NOT restore inventory automatically.
 */
export async function handleNombaPaymentReversal(
  orderReference: string,
  payload?: any
): Promise<{ success: boolean; message: string }> {
  if (!orderReference) return { success: false, message: 'Missing orderReference' };

  try {
    const database = db();
    const ordersCol = database.collection(ORDERS_COLLECTION);
    const snap = await ordersCol.where('payment.reference', '==', orderReference.trim()).limit(1).get();

    if (snap.empty) {
      return { success: false, message: `No order found for reversal reference: ${orderReference}` };
    }

    const orderDoc = snap.docs[0];
    const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

    // Re-verify transaction with Nomba API
    const verifyResult = await verifyNombaTransaction(orderReference);
    const txId = verifyResult.transactionId || payload?.data?.transaction?.transactionId || Date.now().toString(36);
    const reversalNote = `Payment reversal received from Nomba: ${verifyResult.message || 'Chargeback/Reversal processed'}`;

    const newStatusHistory = [
      ...effectiveHistory(orderData),
      {
        eventId: `nomba-reversal-${txId}`,
        status: 'confirmed-review-required' as const,
        changedAt: new Date().toISOString(),
        changedBy: 'system:nomba-webhook',
        note: reversalNote,
      },
    ];

    await orderDoc.ref.update({
      'payment.status': 'refunded',
      'payment.paymentException': reversalNote,
      orderStatus: 'confirmed-review-required',
      statusHistory: newStatusHistory,
      updatedAt: new Date().toISOString(),
    });

    // Alert administrators
    await notificationService.orderException(
      orderData,
      `Payment reversal received from Nomba for order ${orderData.orderNumber}. Flagged for review. Inventory has NOT been auto-restocked.`,
      `${orderData.orderNumber}:nomba-reversal`
    );

    return { success: true, message: 'Order transitioned to confirmed-review-required on reversal.' };
  } catch (err: any) {
    console.error('[NombaService.handleNombaPaymentReversal] Exception:', err);
    return { success: false, message: err.message };
  }
}

export interface NombaWebhookDispatchResult {
  statusCode: number;
  data: {
    status?: string;
    message?: string;
    error?: string;
    reason?: string;
  };
}

/**
 * Reusable, authoritative dispatcher for Nomba webhook events.
 * Shared directly between production (api/index.ts) and local development (server/viteApiPlugin.ts).
 */
export async function processNombaWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  confirmPaidOrder: (reference: string) => Promise<{ success: boolean; retryable?: boolean; message?: string }>
): Promise<NombaWebhookDispatchResult> {
  const { webhookSecret } = getNombaCredentials();
  if (!webhookSecret) {
    console.error('[NombaWebhook] NOMBA_WEBHOOK_SECRET is not configured on server');
    return { statusCode: 500, data: { error: 'Webhook configuration missing on server' } };
  }

  let payload: any = {};
  try {
    payload = typeof rawBody === 'object' && rawBody !== null ? rawBody : JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, data: { error: 'Invalid JSON payload' } };
  }

  const verification = verifyNombaWebhookSignature(payload, headers, webhookSecret);
  if (!verification.valid) {
    console.warn('[NombaWebhook] Invalid signature received:', verification.reason);
    return { statusCode: 401, data: { error: 'Invalid webhook signature', reason: verification.reason } };
  }

  const requestId = payload.requestId || '';
  const eventType = payload.event_type || '';
  const orderReference =
    payload.data?.order?.orderReference ||
    payload.data?.transaction?.merchantTxRef ||
    payload.orderReference;

  if (!requestId) {
    return { statusCode: 400, data: { error: 'Missing requestId in payload' } };
  }

  // Event-level idempotency lock
  const lock = await acquireNombaWebhookLock(requestId, orderReference);
  if (lock.alreadyProcessed) {
    return { statusCode: 200, data: { status: 'received', message: 'Event already processed' } };
  }
  if (!lock.acquired) {
    return { statusCode: 200, data: { status: 'processing', message: 'Event is currently processing' } };
  }

  try {
    if (eventType === 'payment_success' || eventType === 'checkout_order_successful') {
      if (orderReference) {
        const confirmed = await confirmPaidOrder(orderReference);
        if (!confirmed.success && confirmed.retryable) {
          await releaseNombaWebhookLock(requestId, 'failed', confirmed.message);
          return { statusCode: 503, data: { status: 'retry', message: confirmed.message } };
        }
      }
      await releaseNombaWebhookLock(requestId, 'processed');
      return { statusCode: 200, data: { status: 'received' } };
    }

    if (eventType === 'payment_failed' || eventType === 'checkout_order_failed') {
      if (orderReference) {
        await handleNombaPaymentFailed(orderReference, payload);
      }
      await releaseNombaWebhookLock(requestId, 'processed');
      return { statusCode: 200, data: { status: 'received' } };
    }

    if (eventType === 'payment_reversal' || eventType === 'transaction_reversed') {
      if (orderReference) {
        await handleNombaPaymentReversal(orderReference, payload);
      }
      await releaseNombaWebhookLock(requestId, 'processed');
      return { statusCode: 200, data: { status: 'received' } };
    }

    // Unhandled / informational event
    await releaseNombaWebhookLock(requestId, 'processed');
    return { statusCode: 200, data: { status: 'received', message: `Event ${eventType} recorded` } };
  } catch (err: any) {
    console.error('[NombaWebhook] Error processing event:', err);
    await releaseNombaWebhookLock(requestId, 'failed', err?.message);
    return { statusCode: 500, data: { error: 'Webhook processing exception', message: err?.message } };
  }
}
