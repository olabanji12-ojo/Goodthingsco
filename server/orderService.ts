/**
 * Good Things Co. — Server-Side Order & Payment Orchestration Service
 *
 * Implements:
 * - Authoritative stock and price validation against Firestore
 * - Human-readable unique order number generation
 * - Pending order creation
 * - Idempotent payment confirmation
 * - Atomic stock deduction via Firestore transactions
 * - Concurrency protection (no negative stock)
 * - Edge case handling for concurrent stock exhaustion ('confirmed-review-required')
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  limit as firestoreLimit,
  type Transaction,
} from './orderFirestore';
import { db } from './firebase';
import { notificationService } from './services/notificationService';
import { effectiveHistory } from './orders/domain';
import { Order, OrderItem, OrderStatus } from '../src/types/order';
import { ValidatedCheckoutPayload } from '../src/types/checkout';
import {
  generateOrderNumber,
  generatePaystackReference,
  nairaToKobo,
  mapCartItemToOrderItem,
} from '../src/utils/orderUtils';
import { resolveDeliveryZone, getDeliveryFeeCalculation } from '../src/config/shipping';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from './paystackService';
import { abandonedCheckoutService } from './checkout/service';
import { settingsService } from './settings/service';

export const ORDERS_COLLECTION = 'orders';
export const PRODUCTS_COLLECTION = 'products';

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  reference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  total?: number;
  message?: string;
  requiresShippingQuote?: boolean;
}

export interface ConfirmOrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  order?: Order;
  alreadyProcessed?: boolean;
  message: string;
}

/**
 * 1. CREATE PENDING ORDER
 *
 * Authoritatively validates items, stock, prices, and delivery fee.
 * Creates an immutable pending order document in Firestore.
 * Initializes the Paystack transaction.
 */
export async function createPendingOrderServer(
  payload: ValidatedCheckoutPayload,
  callbackOrigin: string
): Promise<CreateOrderResult> {
  // A. Basic payload presence check
  if (!payload || !payload.customer || !payload.delivery || !Array.isArray(payload.items) || payload.items.length === 0) {
    return { success: false, message: 'Invalid order payload: missing customer or items.' };
  }

  try {
    // B. Authoritative Inventory and Pricing Verification
    let authoritativeSubtotal = 0;
    const verifiedOrderItems: OrderItem[] = [];

    for (const item of payload.items) {
      const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const prodSnap = await getDoc(prodRef);

      if (!prodSnap.exists()) {
        return {
          success: false,
          message: `Product "${item.name}" was not found in our catalog. Please review your cart.`,
        };
      }

      const prodData = prodSnap.data();

      // Availability and Archive checks
      if (prodData.isArchived || prodData.isAvailable === false) {
        return {
          success: false,
          message: `Product "${prodData.name || item.name}" is no longer available. Please remove it from your cart.`,
        };
      }

      // Stock verification
      const availableStock = typeof prodData.stock === 'number' ? prodData.stock : 0;
      if (availableStock <= 0) {
        return {
          success: false,
          message: `Product "${prodData.name || item.name}" is currently out of stock.`,
        };
      }

      if (item.quantity > availableStock) {
        return {
          success: false,
          message: `Only ${availableStock} of "${prodData.name || item.name}" available in stock (requested ${item.quantity}).`,
        };
      }

      // Authoritative Price Calculation
      const livePrice = typeof prodData.price === 'number' ? prodData.price : item.unitPrice;
      const itemSubtotal = livePrice * item.quantity;
      authoritativeSubtotal += itemSubtotal;

      verifiedOrderItems.push({
        ...mapCartItemToOrderItem(item),
        unitPrice: livePrice,
        subtotal: itemSubtotal,
      });
    }

    // C. Authoritative Delivery Zone and Fee Calculation
    const resolvedZone = resolveDeliveryZone(
      payload.delivery.address.country,
      payload.delivery.address.state
    );
    const shippingSettings = await settingsService.getEffectiveShipping();
    const deliveryCalc = getDeliveryFeeCalculation(resolvedZone, shippingSettings);

    if (!deliveryCalc.enabled) {
      return {
        success: false,
        message: 'Delivery to this location is currently unavailable.',
      };
    }

    if (deliveryCalc.requiresQuote) {
      return {
        success: false,
        message: 'Delivery to this location requires a custom shipping quote before checkout.',
        requiresShippingQuote: true,
      };
    }

    const authoritativeDeliveryFee = deliveryCalc.fee;
    const authoritativeTotal = authoritativeSubtotal + authoritativeDeliveryFee;
    const amountKobo = nairaToKobo(authoritativeTotal);

    // D. Generate Unique Order Number and Paystack Reference
    const orderNumber = generateOrderNumber();
    const reference = generatePaystackReference(orderNumber);

    // E. Assemble Order Document
    const orderDocData: Omit<Order, 'id'> = {
      revision: 0,
      statusHistory: [{ eventId: 'order-created', status: 'pending-payment', changedAt: new Date().toISOString(), changedBy: 'system:checkout' }],
      orderNumber,
      customer: {
        fullName: payload.customer.fullName.trim(),
        email: payload.customer.email.trim().toLowerCase(),
        phone: payload.customer.phone.trim(),
      },
      recipient: {
        isSelf: Boolean(payload.recipient.isSelf),
        fullName: payload.recipient.fullName.trim(),
        phone: payload.recipient.phone.trim(),
      },
      delivery: {
        address: {
          addressLine1: payload.delivery.address.addressLine1.trim(),
          addressLine2: payload.delivery.address.addressLine2?.trim() || '',
          city: payload.delivery.address.city.trim(),
          state: payload.delivery.address.state.trim(),
          country: payload.delivery.address.country.trim(),
          postalCode: payload.delivery.address.postalCode?.trim() || '',
        },
        zone: resolvedZone,
        preferredDate: payload.delivery.preferredDate,
        specialInstructions: payload.delivery.specialInstructions?.trim() || '',
        deliveryFee: authoritativeDeliveryFee,
      },
      giftMessage: payload.giftMessage?.trim() || '',
      items: verifiedOrderItems,
      subtotal: authoritativeSubtotal,
      deliveryFee: authoritativeDeliveryFee,
      total: authoritativeTotal,
      currency: 'NGN',
      payment: {
        status: 'pending',
        provider: 'paystack',
        reference,
        currency: 'NGN',
        amountKobo,
      },
      orderStatus: 'pending-payment',
      checkoutSessionId: payload.checkoutSessionId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // F. Save Pending Order to Firestore
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const docRef = await addDoc(ordersCol, orderDocData);
    const orderId = docRef.id;

    // The order is already durable. Delivery failures are isolated by the notification layer.
    await notificationService.orderCreated({ id: orderId, ...orderDocData });

    // G. Initialize with Paystack
    const callbackUrl = `${callbackOrigin.replace(/\/$/, '')}/order-confirmation/${orderNumber}`;
    const paystackResult = await initializePaystackTransaction({
      email: orderDocData.customer.email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: {
        orderNumber,
        orderId,
        customerName: orderDocData.customer.fullName,
      },
    });

    if (!paystackResult.success) {
      await notificationService.orderException({ id: orderId, ...orderDocData },
        'Payment initialization failed. The pending order is saved and may need assistance.',
        `${orderNumber}:payment-initialization`);
      return {
        success: false,
        orderNumber,
        orderId,
        message: paystackResult.message || 'Payment gateway initialization failed.',
      };
    }

    return {
      success: true,
      orderNumber,
      orderId,
      reference,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      total: authoritativeTotal,
    };
  } catch (error: any) {
    console.error('[OrderService.createPendingOrder] Exception:', error);
    return {
      success: false,
      message: error?.message || 'Failed to create order on server.',
    };
  }
}

/**
 * 2. CONFIRM PAID ORDER (IDEMPOTENT & ATOMIC)
 *
 * Verifies Paystack transaction, checks idempotency, and atomically deducts stock.
 */
export async function confirmPaidOrderServer(
  reference: string
): Promise<ConfirmOrderResult> {
  if (!reference || typeof reference !== 'string') {
    return { success: false, message: 'Valid payment reference is required.' };
  }

  try {
    // A. Locate the Order in Firestore by reference
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol, where('payment.reference', '==', reference.trim()), firestoreLimit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        message: `No order found matching payment reference: ${reference}`,
      };
    }

    const orderDocSnap = snapshot.docs[0];
    const orderId = orderDocSnap.id;
    const existingOrder = { id: orderId, ...orderDocSnap.data() } as Order;

    // B. IDEMPOTENCY CHECK: If already confirmed and paid, do not re-process
    if (existingOrder.payment?.status === 'paid') {
      return {
        success: true,
        alreadyProcessed: true,
        orderNumber: existingOrder.orderNumber,
        orderId,
        order: existingOrder,
        message: 'Payment was already verified and confirmed.',
      };
    }

    // C. Verify transaction with Paystack API
    const verifyResult = await verifyPaystackTransaction(reference);

    if (!verifyResult.success || verifyResult.status !== 'success') {
      // Record payment failure on order record
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      await runTransaction(db, async (txn: Transaction) => {
        txn.update(orderRef, {
          'payment.status': 'failed',
          'payment.paymentException': verifyResult.message,
          updatedAt: new Date().toISOString(),
        });
      });

      return {
        success: false,
        orderNumber: existingOrder.orderNumber,
        orderId,
        message: verifyResult.message || 'Payment verification failed at gateway.',
      };
    }

    // D. Validate amount match (unless in simulation mode)
    if (!verifyResult.isSimulated) {
      const expectedKobo = existingOrder.payment.amountKobo || nairaToKobo(existingOrder.total);
      if (verifyResult.amountKobo !== expectedKobo || verifyResult.currency !== existingOrder.currency) {
        console.error(
          `[OrderService] Amount mismatch for order ${existingOrder.orderNumber}: expected ${expectedKobo} kobo, received ${verifyResult.amountKobo} kobo`
        );
        await notificationService.orderException(existingOrder,
          'The verified payment amount or currency does not match the order. Please review the payment before fulfillment.',
          `${existingOrder.orderNumber}:payment-mismatch`);
        return {
          success: false,
          orderNumber: existingOrder.orderNumber,
          orderId,
          message: 'Payment amount mismatch. Order flagged for administrative review.',
        };
      }
    }

    // E. ATOMIC TRANSACTION: Stock Deduction and Order Status Update
    let finalOrderStatus: OrderStatus = 'confirmed';
    let paymentException: string | undefined = undefined;
    let confirmedByAnotherRequest: Order | undefined;

    await runTransaction(db, async (txn: Transaction) => {
      // Verification endpoint and webhook can run concurrently. Only the transaction
      // that changes pending -> paid may emit payment emails or deduct inventory.
      confirmedByAnotherRequest = undefined;
      paymentException = undefined;
      finalOrderStatus = 'confirmed';
      const liveOrder = await txn.get(doc(db, ORDERS_COLLECTION, orderId));
      if (!liveOrder.exists()) throw new Error('Order no longer exists');
      if (liveOrder.data().payment?.status === 'paid') {
        confirmedByAnotherRequest = { id: orderId, ...liveOrder.data() } as Order;
        return;
      }
      // 1. Read live product documents for all items
      const productDocs: { ref: any; data: any; qtyPurchased: number }[] = [];
      let isStockSufficient = true;

      for (const item of existingOrder.items) {
        const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const prodSnap = await txn.get(prodRef);

        if (!prodSnap.exists()) {
          isStockSufficient = false;
          paymentException = `Product ${item.name} (${item.productId}) removed before order fulfillment.`;
          continue;
        }

        const pData = prodSnap.data();
        const liveStock = typeof pData.stock === 'number' ? pData.stock : 0;

        if (liveStock < item.quantity) {
          isStockSufficient = false;
          paymentException = `Concurrent stock depletion for ${item.name}. Available: ${liveStock}, requested: ${item.quantity}.`;
        }

        productDocs.push({ ref: prodRef, data: pData, qtyPurchased: item.quantity });
      }

      // 2. Decrement stock if sufficient; otherwise flag for review without going negative
      if (isStockSufficient) {
        for (const p of productDocs) {
          const currentStock = typeof p.data.stock === 'number' ? p.data.stock : 0;
          const newStock = Math.max(0, currentStock - p.qtyPurchased);
          txn.update(p.ref, {
            stock: newStock,
            isAvailable: newStock > 0 ? (p.data.isAvailable ?? true) : false,
            updatedAt: new Date().toISOString(),
          });
        }
        finalOrderStatus = 'confirmed';
      } else {
        // Edge case: payment succeeded, but inventory exhausted concurrently
        console.warn(`[OrderService] Concurrent stock conflict on order ${existingOrder.orderNumber}: ${paymentException}`);
        finalOrderStatus = 'confirmed-review-required';
      }

      // 3. Update Order Document
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      txn.update(orderRef, {
        'payment.status': 'paid',
        revision: (liveOrder.data().revision || 0) + 1,
        statusHistory: [...effectiveHistory(liveOrder.data() as Order), {
          eventId: `payment-${orderId}`, status: finalOrderStatus,
          changedAt: verifyResult.paidAt || new Date().toISOString(), changedBy: 'system:paystack',
        }],
        'payment.paidAt': verifyResult.paidAt || new Date().toISOString(),
        'payment.channel': verifyResult.channel || 'card',
        'payment.transactionId': verifyResult.transactionId || '',
        'payment.paymentException': paymentException || null,
        orderStatus: finalOrderStatus,
        updatedAt: new Date().toISOString(),
      });
    });

    if (confirmedByAnotherRequest) {
      return { success: true, alreadyProcessed: true, orderNumber: existingOrder.orderNumber,
        orderId, order: confirmedByAnotherRequest, message: 'Payment was already verified and confirmed.' };
    }

    const updatedOrder: Order = {
      ...existingOrder,
      payment: {
        ...existingOrder.payment,
        status: 'paid',
        paidAt: verifyResult.paidAt || new Date().toISOString(),
        channel: verifyResult.channel,
        transactionId: verifyResult.transactionId,
        paymentException,
      },
      orderStatus: finalOrderStatus,
      updatedAt: new Date().toISOString(),
    };

    await notificationService.paymentConfirmed(updatedOrder, { isSimulated: Boolean(verifyResult.isSimulated) });

    // Mark abandoned checkout session converted if applicable (idempotent, stops all future reminders)
    try {
      const sessionId = existingOrder.checkoutSessionId;
      if (sessionId) {
        await abandonedCheckoutService.markConverted(sessionId, orderId, existingOrder.orderNumber);
      }
      if (existingOrder.customer?.email) {
        await abandonedCheckoutService.markConvertedByEmail(existingOrder.customer.email, orderId, existingOrder.orderNumber);
      }
    } catch (acErr) {
      console.warn('[OrderService] Non-critical: Failed to mark abandoned checkout converted:', acErr);
    }

    return {
      success: true,
      orderNumber: existingOrder.orderNumber,
      orderId,
      order: updatedOrder,
      message: 'Payment confirmed and inventory updated successfully.',
    };
  } catch (error: any) {
    console.error('[OrderService.confirmPaidOrder] Exception:', error);
    return {
      success: false,
      message: error?.message || 'Failed to complete order payment verification.',
    };
  }
}

/**
 * 3. GET ORDER BY HUMAN-READABLE NUMBER
 */
export async function getOrderByNumberServer(orderNumber: string): Promise<Order | null> {
  if (!orderNumber || typeof orderNumber !== 'string') return null;

  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol, where('orderNumber', '==', orderNumber.trim()), firestoreLimit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Order;
  } catch (err) {
    console.error('[OrderService.getOrderByNumber] Error:', err);
    return null;
  }
}
