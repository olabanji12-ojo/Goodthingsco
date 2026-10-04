/**
 * Good Things Co. — Server-Side Live Inventory & Pricing Revalidation for Recovered Checkouts
 */

import { getAdminFirestore } from '../firebase.js';
import type { CartItem } from '../../src/types/cart.js';
import type { CheckoutRecoveryItem } from '../../src/types/abandonedCheckout.js';
import { resolveDeliveryZone, getDeliveryFeeCalculation } from '../../src/config/shipping.js';
import { mapRecoveryItemToCartItem } from './domain.js';
import { settingsService } from '../settings/service.js';

export const PRODUCTS_COLLECTION = 'products';

export interface RevalidationResult {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  hasPriceChanges: boolean;
  hasUnavailableItems: boolean;
  warnings: string[];
}

export async function revalidateRecoveredCheckout(
  recoveryItems: CheckoutRecoveryItem[],
  deliveryAddress: { country?: string; state?: string }
): Promise<RevalidationResult> {
  const db = getAdminFirestore();
  const validatedItems: CartItem[] = [];
  const warnings: string[] = [];
  let subtotal = 0;
  let hasPriceChanges = false;
  let hasUnavailableItems = false;

  for (const item of recoveryItems) {
    const cartItem = mapRecoveryItemToCartItem(item);
    try {
      const prodSnap = await db.collection(PRODUCTS_COLLECTION).doc(item.productId).get();

      if (!prodSnap.exists) {
        hasUnavailableItems = true;
        cartItem.isUnavailable = true;
        cartItem.isOutOfStock = true;
        warnings.push(`"${item.name}" is no longer available in our collection.`);
        validatedItems.push(cartItem);
        continue;
      }

      const prodData = prodSnap.data() || {};

      // Archived or unavailable checks
      if (prodData.isArchived || prodData.isAvailable === false) {
        hasUnavailableItems = true;
        cartItem.isUnavailable = true;
        cartItem.isOutOfStock = true;
        warnings.push(`"${prodData.name || item.name}" is no longer available.`);
        validatedItems.push(cartItem);
        continue;
      }

      // Live price check
      const livePrice = typeof prodData.price === 'number' && prodData.price >= 0 ? prodData.price : item.unitPrice;
      if (livePrice !== item.unitPrice) {
        hasPriceChanges = true;
        cartItem.priceChanged = true;
        cartItem.currentPrice = livePrice;
        warnings.push(`The price for "${item.name}" has been updated from ₦${item.unitPrice.toLocaleString()} to ₦${livePrice.toLocaleString()}.`);
        cartItem.unitPrice = livePrice;
      }

      // Stock check
      const liveStock = typeof prodData.stock === 'number' ? prodData.stock : 0;
      cartItem.currentStock = liveStock;

      if (liveStock <= 0) {
        hasUnavailableItems = true;
        cartItem.isOutOfStock = true;
        warnings.push(`"${item.name}" is currently out of stock.`);
      } else if (cartItem.quantity > liveStock) {
        warnings.push(`Only ${liveStock} of "${item.name}" are available in stock (quantity adjusted from ${cartItem.quantity}).`);
        cartItem.quantity = liveStock;
      }

      const itemTotal = cartItem.unitPrice * cartItem.quantity;
      subtotal += itemTotal;
      validatedItems.push(cartItem);
    } catch {
      // Fallback: keep existing values if firestore read fails
      subtotal += item.unitPrice * item.quantity;
      validatedItems.push(cartItem);
    }
  }

  // Authoritative delivery zone & fee calculation
  const country = deliveryAddress.country || 'Nigeria';
  const state = deliveryAddress.state || 'Lagos';
  const zone = resolveDeliveryZone(country, state);
  const shippingSettings = await settingsService.getEffectiveShipping();
  const deliveryCalc = getDeliveryFeeCalculation(zone, shippingSettings);

  if (!deliveryCalc.enabled) {
    warnings.push('Delivery to this location is currently unavailable.');
  } else if (deliveryCalc.requiresQuote) {
    warnings.push('Delivery to this location requires a custom shipping quote.');
  }

  const deliveryFee = deliveryCalc.enabled && !deliveryCalc.requiresQuote ? deliveryCalc.fee : 0;

  return {
    items: validatedItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    hasPriceChanges,
    hasUnavailableItems,
    warnings,
  };
}
