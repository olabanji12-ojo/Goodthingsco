/**
 * Good Things Co. — Abandoned Checkout Type Definitions
 */

import type { CartItem } from './cart';
import type { CustomerDetails, RecipientDetails, DeliveryDetails } from './checkout';

export type AbandonedCheckoutStatus =
  | 'active'
  | 'abandoned'
  | 'resumed'
  | 'converted'
  | 'expired';

export interface CheckoutRecoveryItem {
  cartItemId: string;
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image?: {
    url: string;
    publicId?: string;
    alt?: string;
  };
  selectedVariants?: Record<string, string>;
  packaging?: string;
  ribbonColour?: string;
  giftMessage?: string;
  personalisationText?: string;
}

export interface AbandonedCheckoutSession {
  id?: string;
  sessionId: string;

  customer: {
    fullName?: string;
    email?: string;
    phone?: string;
  };

  recipient?: {
    isSelf?: boolean;
    fullName?: string;
    phone?: string;
  };

  delivery?: {
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    zone?: string;
    preferredDate?: string;
    specialInstructions?: string;
  };

  giftMessage?: string;

  items: CheckoutRecoveryItem[];

  subtotalSnapshot: number;
  deliveryFeeSnapshot: number;
  totalSnapshot: number;

  status: AbandonedCheckoutStatus;

  resumeTokenHash: string;

  reminderState: {
    sentCount: number;
    lastSentAt?: string;
    nextEligibleAt?: string;
    lastEventId?: string;
    claiming?: boolean;
    claimedAt?: string;
  };

  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  expiresAt: string;

  convertedOrderId?: string;
  convertedOrderNumber?: string;
  convertedAt?: string;
}

export interface RecoveredCheckoutPayload {
  sessionId: string;
  customer: CustomerDetails;
  recipient: RecipientDetails;
  delivery: DeliveryDetails;
  giftMessage: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  hasPriceChanges: boolean;
  hasUnavailableItems: boolean;
  warnings: string[];
}

export interface CheckoutSessionInput {
  sessionId?: string;
  customer?: Partial<CustomerDetails>;
  recipient?: Partial<RecipientDetails>;
  delivery?: Partial<DeliveryDetails>;
  giftMessage?: string;
  items?: CartItem[];
}
