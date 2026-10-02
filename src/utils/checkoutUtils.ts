/**
 * Good Things Co. — Checkout Utilities & Revalidation
 *
 * Helpers for:
 * - LocalStorage checkout state persistence
 * - Field and format validation (email, phone, delivery date)
 * - Live Firestore inventory and price revalidation before payment
 */

import { CartItem } from '../types/cart';
import {
  CheckoutFormData,
  CheckoutValidationErrors,
  StockRevalidationSummary,
  StockRevalidationItemResult,
} from '../types/checkout';
import { getProductById, getProductBySlug } from '../services/productService';

export const CHECKOUT_STORAGE_KEY = 'goodthingsco_checkout';

/**
 * Validates standard email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validates international and Nigerian phone numbers.
 * Allows leading +, spaces, hyphens, and requires 7 to 18 digits.
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-()]/g, '');
  // Must match digits optionally preceded by +
  const regex = /^\+?[0-9]{7,18}$/;
  return regex.test(clean);
}

/**
 * Verifies that a selected date string (YYYY-MM-DD) is not in the past.
 * Allows today and future dates.
 */
export function isDateNotPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const selected = new Date(dateStr);
  if (isNaN(selected.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD in local time
  const [year, month, day] = dateStr.split('-').map(Number);
  const selectedLocal = new Date(year, month - 1, day);
  selectedLocal.setHours(0, 0, 0, 0);

  return selectedLocal.getTime() >= today.getTime();
}

/**
 * Returns today's date formatted as YYYY-MM-DD for min date attributes.
 */
export function getMinDeliveryDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates all checkout form fields.
 */
export function validateCheckoutForm(data: CheckoutFormData): {
  isValid: boolean;
  errors: CheckoutValidationErrors;
} {
  const errors: CheckoutValidationErrors = {};

  // 1. Customer / Sender Details
  if (!data.customer.fullName?.trim()) {
    errors.customerName = 'Please enter your full name.';
  }

  if (!data.customer.email?.trim()) {
    errors.customerEmail = 'Please enter your email address for order confirmation.';
  } else if (!isValidEmail(data.customer.email)) {
    errors.customerEmail = 'Please provide a valid email address.';
  }

  if (!data.customer.phone?.trim()) {
    errors.customerPhone = 'Please enter your contact phone number.';
  } else if (!isValidPhone(data.customer.phone)) {
    errors.customerPhone = 'Please enter a valid phone number (at least 7 digits).';
  }

  // 2. Recipient Details (if not purchasing for self)
  if (!data.recipient.isSelf) {
    if (!data.recipient.fullName?.trim()) {
      errors.recipientName = "Please enter the recipient's full name.";
    }
    if (!data.recipient.phone?.trim()) {
      errors.recipientPhone = "Please enter the recipient's contact phone number.";
    } else if (!isValidPhone(data.recipient.phone)) {
      errors.recipientPhone = "Please enter a valid phone number for the recipient.";
    }
  }

  // 3. Delivery Address
  if (!data.delivery.address.country?.trim()) {
    errors.country = 'Please select a delivery country.';
  }

  if (!data.delivery.address.addressLine1?.trim()) {
    errors.addressLine1 = 'Please enter the street delivery address.';
  }

  if (!data.delivery.address.city?.trim()) {
    errors.city = 'Please enter the delivery city/town.';
  }

  const isNigeria =
    data.delivery.address.country?.trim().toLowerCase() === 'nigeria' ||
    data.delivery.address.country?.trim().toLowerCase() === 'ng';

  if (isNigeria && !data.delivery.address.state?.trim()) {
    errors.state = 'Please select the delivery state in Nigeria.';
  }

  // 4. Preferred Delivery Date
  if (!data.delivery.preferredDate?.trim()) {
    errors.preferredDate = 'Please select your preferred delivery date.';
  } else if (!isDateNotPast(data.delivery.preferredDate)) {
    errors.preferredDate = 'Preferred delivery date cannot be in the past.';
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

/**
 * Revalidates all items in the cart directly against Firestore before proceeding to payment.
 * Checks for:
 * - Missing products
 * - Archived or unavailable products
 * - Stock changes (sufficient stock vs out-of-stock vs reduced stock)
 * - Price discrepancies
 */
export async function revalidateCartInventory(
  items: CartItem[]
): Promise<StockRevalidationSummary> {
  const results: StockRevalidationItemResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Group unique product IDs
  const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId)));
  const productCache: Record<string, any> = {};

  await Promise.all(
    uniqueProductIds.map(async (id) => {
      let p = await getProductById(id);
      if (!p) {
        const item = items.find((i) => i.productId === id);
        if (item?.slug) {
          p = await getProductBySlug(item.slug, true);
        }
      }
      if (p) {
        productCache[id] = p;
      }
    })
  );

  for (const item of items) {
    const liveProd = productCache[item.productId];

    if (!liveProd) {
      results.push({
        cartItemId: item.id,
        productId: item.productId,
        name: item.name,
        requestedQuantity: item.quantity,
        availableStock: 0,
        currentPrice: item.unitPrice,
        originalPrice: item.unitPrice,
        isAvailable: false,
        isArchived: true,
        hasPriceChanged: false,
        status: 'unavailable',
        errorMessage: `"${item.name}" is no longer available in the atelier catalog.`,
      });
      errors.push(`"${item.name}" is no longer available in the atelier catalog.`);
      continue;
    }

    const availableStock = typeof liveProd.stock === 'number' ? liveProd.stock : 0;
    const isArchived = Boolean(liveProd.isArchived);
    const isAvailable = Boolean(liveProd.isAvailable);
    const currentPrice = typeof liveProd.price === 'number' ? liveProd.price : item.unitPrice;
    const hasPriceChanged = currentPrice !== item.unitPrice;

    if (hasPriceChanged) {
      warnings.push(
        `The price of "${item.name}" has been updated from ₦${item.unitPrice.toLocaleString()} to ₦${currentPrice.toLocaleString()}.`
      );
    }

    if (isArchived || !isAvailable) {
      results.push({
        cartItemId: item.id,
        productId: item.productId,
        name: item.name,
        requestedQuantity: item.quantity,
        availableStock,
        currentPrice,
        originalPrice: item.unitPrice,
        isAvailable: false,
        isArchived: true,
        hasPriceChanged,
        status: 'unavailable',
        errorMessage: `"${item.name}" is currently unavailable or archived.`,
      });
      errors.push(`"${item.name}" is currently unavailable or archived.`);
      continue;
    }

    if (availableStock <= 0) {
      results.push({
        cartItemId: item.id,
        productId: item.productId,
        name: item.name,
        requestedQuantity: item.quantity,
        availableStock: 0,
        currentPrice,
        originalPrice: item.unitPrice,
        isAvailable: true,
        isArchived: false,
        hasPriceChanged,
        status: 'out_of_stock',
        errorMessage: `"${item.name}" is now out of stock.`,
      });
      errors.push(`"${item.name}" is now out of stock.`);
      continue;
    }

    if (item.quantity > availableStock) {
      results.push({
        cartItemId: item.id,
        productId: item.productId,
        name: item.name,
        requestedQuantity: item.quantity,
        availableStock,
        currentPrice,
        originalPrice: item.unitPrice,
        isAvailable: true,
        isArchived: false,
        hasPriceChanged,
        status: 'stock_exceeded',
        errorMessage: `Only ${availableStock} of "${item.name}" are currently available in stock.`,
      });
      errors.push(`Only ${availableStock} of "${item.name}" are currently available in stock.`);
      continue;
    }

    results.push({
      cartItemId: item.id,
      productId: item.productId,
      name: item.name,
      requestedQuantity: item.quantity,
      availableStock,
      currentPrice,
      originalPrice: item.unitPrice,
      isAvailable: true,
      isArchived: false,
      hasPriceChanged,
      status: 'valid',
    });
  }

  const isValid = errors.length === 0;
  return { isValid, results, errors, warnings };
}

/**
 * Safely loads persisted checkout data from localStorage.
 */
export function loadCheckoutFromStorage(): Partial<CheckoutFormData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[CheckoutUtils] Failed to load checkout data from localStorage:', e);
    return null;
  }
}

/**
 * Safely stores checkout progress to localStorage.
 * NEVER stores credit card or sensitive credentials.
 */
export function saveCheckoutToStorage(data: CheckoutFormData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[CheckoutUtils] Failed to save checkout data to localStorage:', e);
  }
}

/**
 * Clears persisted checkout data from localStorage upon completion or reset.
 */
export function clearCheckoutStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch (e) {
    console.warn('[CheckoutUtils] Failed to clear checkout storage:', e);
  }
}
