/**
 * Good Things Co. — Abandoned Checkout Domain Logic & Token Cryptography
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { CartItem } from '../../src/types/cart';
import type {
  AbandonedCheckoutSession,
  CheckoutRecoveryItem,
  CheckoutSessionInput,
} from '../../src/types/abandonedCheckout';

export class CheckoutHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function generateSessionId(): string {
  return `ac_${randomBytes(16).toString('hex')}`;
}

export function createResumeToken(sessionId: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(sessionId).digest('hex');
  return `${sessionId}.${signature}`;
}

export function hashResumeToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export function verifyResumeToken(token: string, secret: string): { valid: boolean; sessionId?: string } {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.trim().split('.');
  if (parts.length !== 2) return { valid: false };
  const [sessionId, signature] = parts;
  if (!sessionId.startsWith('ac_') || signature.length !== 64) return { valid: false };

  const expected = createHmac('sha256', secret).update(sessionId).digest('hex');
  try {
    const isMatch = timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    if (!isMatch) return { valid: false };
    return { valid: true, sessionId };
  } catch {
    return { valid: false };
  }
}

export function mapCartItemToRecoveryItem(item: CartItem): CheckoutRecoveryItem {
  const unitPrice = typeof item.unitPrice === 'number' && item.unitPrice >= 0 ? item.unitPrice : 0;
  const quantity = Math.max(1, Math.min(100, Math.floor(Number(item.quantity) || 1)));
  return {
    cartItemId: item.id || `item_${item.productId}`,
    productId: item.productId,
    slug: item.slug || '',
    name: item.name || 'Thoughtful Gift',
    unitPrice,
    quantity,
    subtotal: unitPrice * quantity,
    image: item.image ? { url: item.image.url, publicId: item.image.publicId, alt: item.image.alt } : undefined,
    selectedVariants: item.selectedVariants ? { ...item.selectedVariants } : undefined,
    packaging: item.packaging,
    ribbonColour: item.ribbonColour,
    giftMessage: item.giftMessage,
    personalisationText: item.personalisationText,
  };
}

export function mapRecoveryItemToCartItem(item: CheckoutRecoveryItem): CartItem {
  return {
    id: item.cartItemId,
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    image: item.image ? { url: item.image.url, publicId: item.image.publicId, alt: item.image.alt } : undefined,
    selectedVariants: item.selectedVariants ? { ...item.selectedVariants } : undefined,
    packaging: item.packaging,
    ribbonColour: item.ribbonColour,
    giftMessage: item.giftMessage,
    personalisationText: item.personalisationText,
  };
}

export function sanitizeSessionForPersistence(
  input: CheckoutSessionInput,
  existing?: AbandonedCheckoutSession | null,
  options?: { sessionId?: string; tokenHash?: string; now?: string; expiryDate?: string }
): Omit<AbandonedCheckoutSession, 'id'> {
  const now = options?.now || new Date().toISOString();
  const sessionId = existing?.sessionId || options?.sessionId || generateSessionId();
  const resumeTokenHash = existing?.resumeTokenHash || options?.tokenHash || '';

  const rawItems = Array.isArray(input.items) ? input.items : (existing?.items || []);
  const items = rawItems.map(item => 'cartItemId' in item ? (item as CheckoutRecoveryItem) : mapCartItemToRecoveryItem(item as CartItem));

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = typeof input.delivery?.zone === 'string' || existing?.delivery?.zone
    ? (existing?.deliveryFeeSnapshot || 0)
    : 0;

  return {
    sessionId,
    customer: {
      fullName: input.customer?.fullName?.trim() ?? existing?.customer.fullName ?? '',
      email: input.customer?.email?.trim().toLowerCase() ?? existing?.customer.email ?? '',
      phone: input.customer?.phone?.trim() ?? existing?.customer.phone ?? '',
    },
    recipient: {
      isSelf: input.recipient?.isSelf ?? existing?.recipient?.isSelf ?? false,
      fullName: input.recipient?.fullName?.trim() ?? existing?.recipient?.fullName ?? '',
      phone: input.recipient?.phone?.trim() ?? existing?.recipient?.phone ?? '',
    },
    delivery: {
      address: {
        addressLine1: input.delivery?.address?.addressLine1?.trim() ?? existing?.delivery?.address?.addressLine1 ?? '',
        addressLine2: input.delivery?.address?.addressLine2?.trim() ?? existing?.delivery?.address?.addressLine2 ?? '',
        city: input.delivery?.address?.city?.trim() ?? existing?.delivery?.address?.city ?? '',
        state: input.delivery?.address?.state?.trim() ?? existing?.delivery?.address?.state ?? '',
        country: input.delivery?.address?.country?.trim() ?? existing?.delivery?.address?.country ?? 'Nigeria',
        postalCode: input.delivery?.address?.postalCode?.trim() ?? existing?.delivery?.address?.postalCode ?? '',
      },
      zone: input.delivery?.zone ?? existing?.delivery?.zone ?? '',
      preferredDate: input.delivery?.preferredDate ?? existing?.delivery?.preferredDate ?? '',
      specialInstructions: input.delivery?.specialInstructions?.trim() ?? existing?.delivery?.specialInstructions ?? '',
    },
    giftMessage: input.giftMessage?.trim() ?? existing?.giftMessage ?? '',
    items,
    subtotalSnapshot: subtotal,
    deliveryFeeSnapshot: deliveryFee,
    totalSnapshot: subtotal + deliveryFee,
    status: existing?.status === 'converted' ? 'converted' : 'active',
    resumeTokenHash,
    reminderState: existing?.reminderState ?? {
      sentCount: 0,
    },
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastActivityAt: now,
    expiresAt: existing?.expiresAt || options?.expiryDate || new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    convertedOrderId: existing?.convertedOrderId,
    convertedOrderNumber: existing?.convertedOrderNumber,
    convertedAt: existing?.convertedAt,
  };
}
