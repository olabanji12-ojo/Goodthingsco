/**
 * Good Things Co. — Cart Type Definitions
 *
 * Types for the customer cart system.
 * Supports multiple products, complex configurations, stock tracking, and revalidation.
 */

export interface CartItemImage {
  url: string;
  publicId?: string;
  alt?: string;
}

export interface CartItem {
  id: string; // Unique composite key of productId + sorted variants + packaging + ribbon + personalisation
  productId: string;
  slug: string;
  name: string;
  image?: CartItemImage;
  unitPrice: number;
  quantity: number;

  // Configuration options
  selectedVariants?: Record<string, string>;
  packaging?: string;
  ribbonColour?: string;
  giftMessage?: string;
  personalisationText?: string;
  addedAt?: string;

  // Live stock & pricing revalidation metadata
  currentStock?: number;
  isOutOfStock?: boolean;
  isUnavailable?: boolean; // isArchived || !isAvailable
  priceChanged?: boolean;
  currentPrice?: number;
}

export interface CartState {
  items: CartItem[];
  lastRevalidatedAt?: string;
  isValidating: boolean;
  error?: string | null;
}

export interface CartAddResult {
  success: boolean;
  message: string;
  cartItemId?: string;
  isNewItem?: boolean;
}

export interface CartQuantityResult {
  success: boolean;
  message: string;
}

export interface CartContextType {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  isValidating: boolean;
  hasOutOfStockItems: boolean;
  hasUnavailableItems: boolean;
  hasStockExceededItems: boolean;
  isCartValidForCheckout: boolean;

  // Core Actions
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => CartAddResult;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => CartQuantityResult;
  clearCart: () => void;
  replaceCart: (newItems: CartItem[]) => void;
  revalidateStock: (targetItems?: CartItem[]) => Promise<void>;

  // Computed Getters
  getCartCount: () => number;
  getCartSubtotal: () => number;
}
