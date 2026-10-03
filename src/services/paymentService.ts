/**
 * Good Things Co. — Client-Side Payment & Order API Client
 *
 * Communicates with secure server-side payment endpoints.
 * Never handles or stores Paystack secret keys directly.
 */

import { ValidatedCheckoutPayload } from '../types/checkout';
import { Order, PaystackInitResponse, PaystackVerifyResponse } from '../types/order';

/**
 * Initializes a pending order and Paystack payment on the server.
 */
export async function initializeOrderPayment(
  payload: ValidatedCheckoutPayload
): Promise<PaystackInitResponse> {
  try {
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        reference: data?.reference || '',
        orderNumber: data?.orderNumber || '',
        orderId: data?.orderId || '',
        message: data?.message || 'Payment initialization was rejected by server.',
      };
    }

    return {
      success: true,
      authorizationUrl: data.authorizationUrl,
      accessCode: data.accessCode,
      reference: data.reference,
      orderNumber: data.orderNumber,
      orderId: data.orderId,
    };
  } catch (error: any) {
    console.error('[PaymentService.initializeOrderPayment] Network error:', error);
    return {
      success: false,
      reference: '',
      orderNumber: '',
      orderId: '',
      message: error?.message || 'Could not connect to payment server. Please check your connection.',
    };
  }
}

/**
 * Verifies a completed transaction reference with the secure server.
 */
export async function verifyOrderPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  try {
    const response = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        orderNumber: data?.orderNumber,
        orderId: data?.orderId,
        message: data?.message || 'Payment verification failed.',
      };
    }

    return {
      success: true,
      orderNumber: data.orderNumber,
      orderId: data.orderId,
      order: data.order,
      alreadyProcessed: data.alreadyProcessed,
      message: data.message || 'Payment successfully verified.',
    };
  } catch (error: any) {
    console.error('[PaymentService.verifyOrderPayment] Network error:', error);
    return {
      success: false,
      message: error?.message || 'Network error verifying payment with server.',
    };
  }
}

/**
 * Retrieves safe order summary by human-readable order number.
 */
export async function fetchOrderByNumber(
  orderNumber: string
): Promise<Order | null> {
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success && data.order ? data.order : null;
  } catch (err) {
    console.error('[PaymentService.fetchOrderByNumber] Error:', err);
    return null;
  }
}
