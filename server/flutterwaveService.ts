/**
 * Good Things Co. — Server-Side Flutterwave Payment Service
 *
 * Handles secure communication with the Flutterwave v3 API using FLUTTERWAVE_SECRET_KEY.
 *
 * CRITICAL SECURITY RULE:
 * This file and FLUTTERWAVE_SECRET_KEY MUST ONLY execute server-side.
 * It is never bundled into or accessible by client browser code.
 */

interface FlutterwaveApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

interface FlutterwavePaymentInitData {
  link: string;
}

interface FlutterwaveTransactionData {
  id: number;
  tx_ref: string;
  flw_ref?: string;
  device_fingerprint?: string;
  amount: number;
  currency: string;
  charged_amount?: number;
  app_fee?: number;
  merchant_fee?: number;
  processor_response?: string;
  auth_model?: string;
  ip?: string;
  narration?: string;
  status: 'successful' | 'failed' | 'cancelled';
  payment_type?: string;
  created_at?: string;
  customer?: {
    id?: number;
    name?: string;
    phone_number?: string;
    email?: string;
    created_at?: string;
  };
}

export interface FlutterwaveInitParams {
  email: string;
  amountNaira: number;
  reference: string; // tx_ref
  callbackUrl: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface FlutterwaveInitResult {
  success: boolean;
  authorizationUrl?: string;
  reference: string;
  message?: string;
  isSimulated?: boolean;
}

export interface FlutterwaveVerifyResult {
  success: boolean;
  status: 'success' | 'failed' | 'error';
  reference: string;
  amountKobo: number;
  amountNaira: number;
  currency: string;
  channel?: string;
  transactionId?: string;
  paidAt?: string;
  customerEmail?: string;
  message: string;
  isSimulated?: boolean;
  raw?: any;
}

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readEnvDirect(key: string): string {
  if (process.env[key]) return process.env[key]!.trim();
  try {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match) return match[1].trim();
    }
  } catch {}
  return '';
}

/**
 * Retrieves the Flutterwave Secret Key from server environment variables.
 */
export function getFlutterwaveSecretKey(): string {
  const key =
    process.env.FLUTTERWAVE_SECRET_KEY ||
    process.env.FLW_SECRET_KEY ||
    readEnvDirect('FLUTTERWAVE_SECRET_KEY');
  return (key || '').trim();
}

/**
 * Checks if Flutterwave is running in local simulation or test mode.
 */
export function isFlutterwaveSimulationMode(): boolean {
  if (process.env.FLUTTERWAVE_MODE === 'simulation') {
    return !process.env.VERCEL;
  }
  const secretKey = getFlutterwaveSecretKey();
  const isVercelProd = Boolean(process.env.VERCEL) && process.env.NODE_ENV === 'production';
  // Auto-simulate in local development if no key or placeholder key is configured
  return (!secretKey || secretKey.includes('placeholder')) && !isVercelProd;
}

/**
 * Validates Flutterwave key formatting and safety.
 */
export function validateFlutterwaveKeySafety(): { valid: boolean; error?: string } {
  if (isFlutterwaveSimulationMode()) {
    return { valid: true };
  }

  const secret = getFlutterwaveSecretKey();
  if (!secret) {
    return {
      valid: false,
      error: 'Flutterwave secret key is missing. Please add FLUTTERWAVE_SECRET_KEY in .env.',
    };
  }

  // Flutterwave secret keys typically start with FLWSECK_TEST- or FLWSECK-
  if (!secret.startsWith('FLWSECK_TEST-') && !secret.startsWith('FLWSECK-')) {
    return {
      valid: false,
      error: 'Invalid FLUTTERWAVE_SECRET_KEY format. Must start with FLWSECK_TEST- or FLWSECK-.',
    };
  }

  return { valid: true };
}

/**
 * Initializes a transaction with the Flutterwave standard hosted checkout API.
 * Calls POST https://api.flutterwave.com/v3/payments
 */
export async function initializeFlutterwaveTransaction(
  params: FlutterwaveInitParams
): Promise<FlutterwaveInitResult> {
  const safety = validateFlutterwaveKeySafety();
  if (!safety.valid && !isFlutterwaveSimulationMode()) {
    return {
      success: false,
      reference: params.reference,
      message: safety.error || 'Flutterwave configuration safety check failed.',
    };
  }

  // 1. Simulation fallback for local development if keys are not yet provided
  if (isFlutterwaveSimulationMode()) {
    console.log('[FlutterwaveService] Operating in local simulated mode');
    const separator = params.callbackUrl.includes('?') ? '&' : '?';
    const simulatedAuthUrl = `${params.callbackUrl}${separator}tx_ref=${encodeURIComponent(params.reference)}&status=successful&simulated=true`;
    return {
      success: true,
      authorizationUrl: simulatedAuthUrl,
      reference: params.reference,
      message: 'Simulated Flutterwave checkout initialization (development mode)',
      isSimulated: true,
    };
  }

  const secretKey = getFlutterwaveSecretKey();

  try {
    const payload = {
      tx_ref: params.reference,
      amount: params.amountNaira.toString(),
      currency: 'NGN',
      payment_options: 'card, banktransfer, ussd',
      redirect_url: params.callbackUrl,
      meta: params.metadata || {},
      customer: {
        email: params.email,
        phonenumber: params.customerPhone || '',
        name: params.customerName || '',
      },
      customizations: {
        title: 'Good Things Co.',
        description: `Order payment: ${params.metadata?.orderNumber || params.reference}`,
        logo: 'https://goodthingsco.ng/favicon.ico',
      },
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as FlutterwaveApiResponse<FlutterwavePaymentInitData>;

    if (!response.ok || data.status !== 'success' || !data.data?.link) {
      console.error('[FlutterwaveService.initialize] API error:', data);
      return {
        success: false,
        reference: params.reference,
        message: data.message || 'Failed to initialize transaction with Flutterwave.',
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.link,
      reference: params.reference,
      message: data.message,
    };
  } catch (error: any) {
    console.error('[FlutterwaveService.initialize] Network/API exception:', error);
    return {
      success: false,
      reference: params.reference,
      message: error?.message || 'Network communication error connecting to Flutterwave.',
    };
  }
}

/**
 * Verifies a transaction by tx_ref reference or transactionId with the Flutterwave API.
 */
export async function verifyFlutterwaveTransaction(
  reference: string,
  transactionId?: string
): Promise<FlutterwaveVerifyResult> {
  const cleanRef = reference.trim();

  // 1. Simulation fallback for local development
  if (isFlutterwaveSimulationMode()) {
    console.log('[FlutterwaveService] Verifying simulated Flutterwave transaction:', cleanRef);
    return {
      success: true,
      status: 'success',
      reference: cleanRef,
      amountKobo: 0, // Handled by caller comparing expected
      amountNaira: 0,
      currency: 'NGN',
      channel: 'card',
      transactionId: `flw_sim_${Date.now().toString(36)}`,
      paidAt: new Date().toISOString(),
      message: 'Simulated Flutterwave payment successfully verified (development mode)',
      isSimulated: true,
    };
  }

  const safety = validateFlutterwaveKeySafety();
  if (!safety.valid) {
    return {
      success: false,
      status: 'error',
      reference: cleanRef,
      amountKobo: 0,
      amountNaira: 0,
      currency: 'NGN',
      message: safety.error || 'Flutterwave configuration safety check failed.',
    };
  }

  const secretKey = getFlutterwaveSecretKey();

  try {
    const url = transactionId
      ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(cleanRef)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as FlutterwaveApiResponse<FlutterwaveTransactionData>;

    if (!response.ok || data.status !== 'success' || !data.data) {
      console.warn('[FlutterwaveService.verify] Verification failed or rejected:', data);
      return {
        success: false,
        status: 'failed',
        reference: cleanRef,
        amountKobo: 0,
        amountNaira: 0,
        currency: 'NGN',
        message: data.message || 'Payment verification failed at Flutterwave.',
        raw: data,
      };
    }

    const tx = data.data;
    const isSuccessful = tx.status === 'successful';
    const amountNaira = Number(tx.amount) || 0;
    const amountKobo = Math.round(amountNaira * 100);

    return {
      success: isSuccessful,
      status: isSuccessful ? 'success' : 'failed',
      reference: tx.tx_ref || cleanRef,
      amountKobo,
      amountNaira,
      currency: tx.currency || 'NGN',
      channel: tx.payment_type,
      transactionId: String(tx.id),
      paidAt: tx.created_at,
      customerEmail: tx.customer?.email,
      message: isSuccessful ? 'Payment confirmed by Flutterwave.' : `Payment status is ${tx.status}.`,
      raw: tx,
    };
  } catch (error: any) {
    console.error('[FlutterwaveService.verify] Network exception:', error);
    return {
      success: false,
      status: 'error',
      reference: cleanRef,
      amountKobo: 0,
      amountNaira: 0,
      currency: 'NGN',
      message: error?.message || 'Network communication error during Flutterwave verification.',
    };
  }
}

/**
 * Validates Flutterwave webhook secret hash.
 * Compares incoming 'verif-hash' header with FLUTTERWAVE_SECRET_HASH.
 */
export function verifyFlutterwaveWebhookSignature(signature: string | undefined): boolean {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH?.trim();
  if (!secretHash || !signature) {
    return false;
  }
  return signature.trim() === secretHash;
}
