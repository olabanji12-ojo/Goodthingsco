/**
 * Good Things Co. — Order & Payment Utility Helpers
 *
 * Centralized logic for human-readable order numbers, unique Paystack references,
 * currency conversions (Naira <-> Kobo), and order item formatting.
 */

import { CartItem } from '../types/cart';
import { OrderItem } from '../types/order';

/**
 * Generates a clean, customer-support friendly unique order number.
 * Format: GTC-YYYYMMDD-XXXX (e.g., GTC-20261002-K92X)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;

  // 4 uppercase alphanumeric characters (excluding ambiguous 0/O and 1/I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomSegment = '';
  for (let i = 0; i < 4; i++) {
    randomSegment += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `GTC-${dateSegment}-${randomSegment}`;
}

/**
 * Generates a unique Paystack payment reference.
 * Includes timestamp to guarantee uniqueness across retries of the same order.
 */
export function generatePaystackReference(orderNumber: string): string {
  const cleanOrderNum = orderNumber.replace(/[^A-Za-z0-9]/g, '_');
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `pay_${cleanOrderNum}_${timestamp}_${randomSuffix}`;
}

/**
 * Converts Nigerian Naira (NGN) to Kobo (smallest currency unit).
 * Paystack strictly expects amount in kobo (1 Naira = 100 kobo).
 * Example: ₦35,000 -> 3500000 kobo.
 */
export function nairaToKobo(naira: number): number {
  const safeNaira = Number.isFinite(naira) ? Math.max(0, naira) : 0;
  return Math.round(safeNaira * 100);
}

/**
 * Converts Kobo to Nigerian Naira (NGN).
 */
export function koboToNaira(kobo: number): number {
  const safeKobo = Number.isFinite(kobo) ? Math.max(0, kobo) : 0;
  return Math.round(safeKobo / 100);
}

/**
 * Converts a CartItem into an immutable OrderItem snapshot.
 * Preserves the exact name, unit price, quantity, packaging, and ribbon selected at time of purchase.
 */
export function mapCartItemToOrderItem(item: CartItem): OrderItem {
  return {
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    imageUrl: item.image?.url,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.unitPrice * item.quantity,
    selectedVariants: item.selectedVariants,
    packaging: item.packaging,
    ribbonColour: item.ribbonColour,
    giftMessage: item.giftMessage,
    personalisationText: item.personalisationText,
  };
}
