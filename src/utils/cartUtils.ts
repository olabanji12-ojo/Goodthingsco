/**
 * Good Things Co. — Cart Utilities
 *
 * Centralized helpers for cart calculations, deterministic item ID generation,
 * formatting, and resilient localStorage persistence.
 */

import { CartItem } from '../types/cart';

export const CART_STORAGE_KEY = 'goodthingsco_cart';

/**
 * Generates a unique, deterministic ID for a Cart item based on its product ID
 * and all user-configured choices (variants, packaging, ribbon, messages).
 *
 * This ensures:
 * - Adding the exact same product with identical options increases quantity.
 * - Adding the same product with a different ribbon, packaging, or message creates a separate line item.
 */
export function generateCartItemId(options: {
  productId: string;
  selectedVariants?: Record<string, string>;
  packaging?: string;
  ribbonColour?: string;
  giftMessage?: string;
  personalisationText?: string;
}): string {
  const parts: string[] = [options.productId.trim()];

  // 1. Canonical sorted variants
  if (options.selectedVariants && Object.keys(options.selectedVariants).length > 0) {
    const sortedVariants = Object.entries(options.selectedVariants)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k.trim().toLowerCase()}=${v.trim().toLowerCase()}`)
      .join('&');
    parts.push(`v:${sortedVariants}`);
  } else {
    parts.push('v:none');
  }

  // 2. Packaging selection
  const pkg = (options.packaging || '').trim().toLowerCase();
  parts.push(`pkg:${pkg || 'default'}`);

  // 3. Ribbon selection
  const ribbon = (options.ribbonColour || '').trim().toLowerCase();
  parts.push(`rib:${ribbon || 'none'}`);

  // 4. Gift message
  const msg = (options.giftMessage || '').trim();
  if (msg) {
    parts.push(`msg:${encodeURIComponent(msg)}`);
  }

  // 5. Personalisation text
  const personal = (options.personalisationText || '').trim();
  if (personal) {
    parts.push(`txt:${encodeURIComponent(personal)}`);
  }

  return parts.join('::');
}

/**
 * Formats a numeric amount into standard Nigerian Naira string.
 * Example: 35000 -> ₦35,000
 */
export function formatNaira(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `₦${safeAmount.toLocaleString('en-US')}`;
  }
}

/**
 * Calculates total merchandise subtotal for a list of CartItems.
 */
export function calculateCartSubtotal(items: CartItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => {
    const unitPrice = Number(item.unitPrice) || 0;
    const quantity = Number(item.quantity) || 0;
    return total + unitPrice * quantity;
  }, 0);
}

/**
 * Calculates total quantity of all items in the cart.
 */
export function calculateCartCount(items: CartItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
}

/**
 * Safely reads cart items from localStorage with defensive parsing.
 * Returns empty array if data is missing, corrupted, or incompatible.
 */
export function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[CartUtils] Invalid cart format in storage. Resetting to empty cart.');
      return [];
    }

    // Sanitize and validate each item
    const validItems: CartItem[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.productId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.unitPrice === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      ) {
        validItems.push({
          id: item.id,
          productId: item.productId,
          slug: typeof item.slug === 'string' ? item.slug : item.productId,
          name: item.name,
          image: item.image && typeof item.image.url === 'string' ? item.image : undefined,
          unitPrice: Math.max(0, item.unitPrice),
          quantity: Math.max(1, Math.floor(item.quantity)),
          selectedVariants: item.selectedVariants && typeof item.selectedVariants === 'object' ? item.selectedVariants : undefined,
          packaging: typeof item.packaging === 'string' ? item.packaging : undefined,
          ribbonColour: typeof item.ribbonColour === 'string' ? item.ribbonColour : undefined,
          giftMessage: typeof item.giftMessage === 'string' ? item.giftMessage : undefined,
          personalisationText: typeof item.personalisationText === 'string' ? item.personalisationText : undefined,
          addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
          currentStock: typeof item.currentStock === 'number' ? item.currentStock : undefined,
          isOutOfStock: Boolean(item.isOutOfStock),
          isUnavailable: Boolean(item.isUnavailable),
          priceChanged: Boolean(item.priceChanged),
          currentPrice: typeof item.currentPrice === 'number' ? item.currentPrice : undefined,
        });
      }
    }

    return validItems;
  } catch (error) {
    console.warn('[CartUtils] Failed to load cart from localStorage:', error);
    return [];
  }
}

/**
 * Safely persists cart items to localStorage.
 */
export function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(items);
    window.localStorage.setItem(CART_STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('[CartUtils] Failed to save cart to localStorage:', error);
  }
}
