/**
 * Good Things Co. — Server-Side Paystack Payment Service
 *
 * Handles secure communication with the Paystack API using the PAYSTACK_SECRET_KEY.
 *
 * CRITICAL SECURITY RULE:
 * This file and PAYSTACK_SECRET_KEY MUST ONLY execute server-side.
 * It is never bundled into or accessible by client browser code.
 */

import crypto from 'crypto';

interface PaystackApiResponse<T> {
  status: boolean;
  message?: string;
  data?: T;
}

interface PaystackInitializationData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackTransactionData {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  id: number | string;
  paid_at?: string | null;
  customer?: { email?: string };
}

export interface PaystackInitParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitResult {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  message?: string;
  isSimulated?: boolean;
}

export interface PaystackVerifyResult {
  success: boolean;
  status: string;
  reference: string;
  amountKobo: number;
  currency: string;
  channel?: string;
  transactionId?: string;
  paidAt?: string;
  customerEmail?: string;
  message: string;
  isSimulated?: boolean;
  raw?: any;
}

/**
 * Retrieves the Paystack Secret Key from server environment variables.
 */
export function getPaystackSecretKey(): string {
  const key =
    process.env.PAYSTACK_SECRET_KEY ||
    (typeof process !== 'undefined' && process.env ? process.env.PAYSTACK_SECRET_KEY : '');
  return (key || '').trim();
}

/**
 * Checks if Paystack is running in placeholder/simulation test mode.
 */
export function isPaystackSimulationMode(): boolean {
  const key = getPaystackSecretKey();
  return !key || key === 'sk_test_placeholder' || key.startsWith('sk_test_placeholder');
}

/**
 * Initializes a transaction with the Paystack API.
 * Calls https://api.paystack.co/transaction/initialize
 */
export async function initializePaystackTransaction(
  params: PaystackInitParams
): Promise<PaystackInitResult> {
  const secretKey = getPaystackSecretKey();

  // If secret key is not yet configured with real test key, run in simulated test mode
  if (isPaystackSimulationMode()) {
    console.log('[PaystackService] Operating in local simulated test mode (placeholder key detected)');
    const simulatedAuthUrl = `${params.callbackUrl}${params.callbackUrl.includes('?') ? '&' : '?'}reference=${encodeURIComponent(params.reference)}&simulated=true`;
    return {
      success: true,
      authorizationUrl: simulatedAuthUrl,
      accessCode: `sim_access_${Date.now().toString(36)}`,
      reference: params.reference,
      message: 'Simulated Paystack initialization (test mode)',
      isSimulated: true,
    };
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        callback_url: params.callbackUrl,
        currency: 'NGN',
        metadata: params.metadata || {},
      }),
    });

    const data = await response.json() as PaystackApiResponse<PaystackInitializationData>;

    if (!response.ok || !data.status || !data.data) {
      console.error('[PaystackService.initialize] Paystack error:', data);
      return {
        success: false,
        reference: params.reference,
        message: data.message || 'Failed to initialize transaction with Paystack.',
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
      message: data.message,
    };
  } catch (error: any) {
    console.error('[PaystackService.initialize] Network/API exception:', error);
    return {
      success: false,
      reference: params.reference,
      message: error?.message || 'Network communication error connecting to Paystack.',
    };
  }
}

/**
 * Verifies a transaction by reference with the Paystack API.
 * Calls https://api.paystack.co/transaction/verify/:reference
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  const secretKey = getPaystackSecretKey();

  // If in simulation test mode or reference contains simulated flag
  if (isPaystackSimulationMode() || reference.includes('sim_')) {
    console.log('[PaystackService] Verifying transaction in simulated test mode:', reference);
    return {
      success: true,
      status: 'success',
      reference,
      amountKobo: 0, // Server-side order verification will match with stored order amount
      currency: 'NGN',
      channel: 'card_simulation',
      transactionId: `sim_txn_${Date.now()}`,
      paidAt: new Date().toISOString(),
      message: 'Simulated payment verification successful',
      isSimulated: true,
    };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as PaystackApiResponse<PaystackTransactionData>;

    if (!response.ok || !data.status || !data.data) {
      return {
        success: false,
        status: data?.data?.status || 'failed',
        reference,
        amountKobo: data?.data?.amount || 0,
        currency: data?.data?.currency || 'NGN',
        message: data.message || 'Payment verification failed at gateway.',
        raw: data,
      };
    }

    const txn = data.data;
    const isSuccess = txn.status === 'success';

    return {
      success: isSuccess,
      status: txn.status,
      reference: txn.reference,
      amountKobo: txn.amount,
      currency: txn.currency,
      channel: txn.channel,
      transactionId: String(txn.id),
      paidAt: txn.paid_at || new Date().toISOString(),
      customerEmail: txn.customer?.email,
      message: isSuccess ? 'Payment verified successfully.' : `Payment status: ${txn.status}`,
      raw: txn,
    };
  } catch (error: any) {
    console.error('[PaystackService.verify] Network/API exception:', error);
    return {
      success: false,
      status: 'error',
      reference,
      amountKobo: 0,
      currency: 'NGN',
      message: error?.message || 'Unable to communicate with Paystack for transaction verification.',
    };
  }
}

/**
 * Validates HMAC SHA512 signature for Paystack Webhook events.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
  if (!signatureHeader) return false;
  const secretKey = getPaystackSecretKey();
  if (!secretKey) return false;

  try {
    const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
    return hash === signatureHeader;
  } catch {
    return false;
  }
}
