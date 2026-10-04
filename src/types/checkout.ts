/**
 * Good Things Co. — Checkout Type Definitions
 *
 * Data contracts for guest checkout, delivery coordination,
 * form validation, and prepared order payloads for Paystack.
 */

import { DeliveryZone } from '../config/shipping.js';
import { CartItem } from './cart.js';

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface RecipientDetails {
  isSelf: boolean;
  fullName: string;
  phone: string;
}

export interface DeliveryAddressDetails {
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
}

export interface DeliveryDetails {
  address: DeliveryAddressDetails;
  zone: DeliveryZone;
  preferredDate: string; // ISO date string YYYY-MM-DD
  specialInstructions?: string;
}

export interface CheckoutFormData {
  customer: CustomerDetails;
  recipient: RecipientDetails;
  delivery: DeliveryDetails;
  giftMessage?: string;
}

export interface CheckoutValidationErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  country?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  preferredDate?: string;
  inventory?: string;
}

export interface StockRevalidationItemResult {
  cartItemId: string;
  productId: string;
  name: string;
  requestedQuantity: number;
  availableStock: number;
  currentPrice: number;
  originalPrice: number;
  isAvailable: boolean;
  isArchived: boolean;
  hasPriceChanged: boolean;
  status: 'valid' | 'stock_exceeded' | 'out_of_stock' | 'unavailable';
  errorMessage?: string;
}

export interface StockRevalidationSummary {
  isValid: boolean;
  results: StockRevalidationItemResult[];
  errors: string[];
  warnings: string[];
}

export interface ValidatedCheckoutPayload {
  customer: CustomerDetails;
  recipient: RecipientDetails;
  delivery: DeliveryDetails;
  giftMessage?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  deliveryZoneName: string;
  deliveryRequiresQuote: boolean;
  validatedAt: string;
  checkoutSessionId?: string;
}
