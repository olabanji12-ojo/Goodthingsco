/**
 * Good Things Co. — Centralized Cart Context & State Management
 *
 * Provides customer cart capabilities:
 * - Adding multiple products and personalized variations
 * - Reusable actions: addItem, removeItem, updateQuantity, clearCart
 * - Live stock & price revalidation with Firestore
 * - Persistent guest cart via localStorage with defensive fallback
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  CartItem,
  CartContextType,
  CartAddResult,
  CartQuantityResult,
} from '../types/cart';
import {
  generateCartItemId,
  calculateCartSubtotal,
  calculateCartCount,
  loadCartFromStorage,
  saveCartToStorage,
} from '../utils/cartUtils';
import { getProductById, getProductBySlug } from '../services/productService';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Keep latest authoritative cart items in ref to avoid stale closure in async callbacks
  const itemsRef = useRef<CartItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Sync to localStorage on every items update
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  /**
   * Revalidate cart items against live Firestore product documents.
   * Detects:
   * - Stock changes (e.g. stock reduced or reached 0)
   * - Unavailable or archived products
   * - Price changes
   *
   * Accepts optional targetItems (e.g. immediately after bulk operations)
   * or defaults to the authoritative itemsRef.current.
   */
  const revalidateStock = useCallback(async (targetItems?: CartItem[]) => {
    const currentItems = targetItems || itemsRef.current;
    if (currentItems.length === 0) return;

    setIsValidating(true);
    try {
      // Collect unique product queries to minimize redundant reads
      const uniqueProductIds = Array.from(new Set(currentItems.map((i) => i.productId)));
      const productMap: Record<string, { prod: any; confirmedMissing: boolean }> = {};

      await Promise.all(
        uniqueProductIds.map(async (pId) => {
          try {
            let prod = await getProductById(pId);
            if (!prod) {
              // Fallback: search by slug if ID lookup didn't match
              const sampleItem = currentItems.find((i) => i.productId === pId);
              if (sampleItem?.slug) {
                prod = await getProductBySlug(sampleItem.slug, true);
              }
            }
            if (prod) {
              productMap[pId] = { prod, confirmedMissing: false };
            } else {
              // Only mark confirmed missing if lookup returned null without throwing
              productMap[pId] = { prod: null, confirmedMissing: true };
            }
          } catch (lookupErr) {
            console.warn(`[CartContext] Product query failed for ${pId}:`, lookupErr);
            // In case of query error / network hitch, do NOT falsely corrupt items
            productMap[pId] = { prod: null, confirmedMissing: false };
          }
        })
      );

      // Reconcile cart items with current live product data
      setItems((prevItems) => {
        let hasChanges = false;
        const updated = prevItems.map((item) => {
          const entry = productMap[item.productId];
          if (!entry) {
            // Product was added during async fetch — keep intact
            return item;
          }

          if (entry.confirmedMissing) {
            // Product confirmed missing from database
            if (!item.isUnavailable) hasChanges = true;
            return {
              ...item,
              isUnavailable: true,
              isOutOfStock: true,
              currentStock: 0,
            };
          }

          const liveProd = entry.prod;
          if (!liveProd) {
            // Lookup errored, do NOT corrupt item
            return item;
          }

          const currentStock = typeof liveProd.stock === 'number' ? liveProd.stock : 0;
          const isOutOfStock = currentStock === 0;
          const isUnavailable = Boolean(liveProd.isArchived || !liveProd.isAvailable);
          const priceChanged = liveProd.price !== item.unitPrice;
          const currentPrice = liveProd.price;

          if (
            item.currentStock !== currentStock ||
            item.isOutOfStock !== isOutOfStock ||
            item.isUnavailable !== isUnavailable ||
            item.priceChanged !== priceChanged ||
            item.currentPrice !== currentPrice
          ) {
            hasChanges = true;
            return {
              ...item,
              currentStock,
              isOutOfStock,
              isUnavailable,
              priceChanged,
              currentPrice,
            };
          }

          return item;
        });

        return hasChanges ? updated : prevItems;
      });
    } catch (err) {
      console.warn('[CartContext] Live stock revalidation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Revalidate stock on initial mount and when window regains focus
  useEffect(() => {
    revalidateStock();

    const handleFocus = () => {
      revalidateStock();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateStock]);

  /**
   * Adds an item to the cart.
   * If an item with IDENTICAL configuration exists, merges and increases quantity up to stock.
   * If ANY option differs, creates a separate distinct CartItem.
   */
  const addItem = useCallback(
    (input: Omit<CartItem, 'id' | 'addedAt'>): CartAddResult => {
      const generatedId = generateCartItemId({
        productId: input.productId,
        selectedVariants: input.selectedVariants,
        packaging: input.packaging,
        ribbonColour: input.ribbonColour,
        giftMessage: input.giftMessage,
        personalisationText: input.personalisationText,
      });

      const maxAvailableStock =
        typeof input.currentStock === 'number' ? input.currentStock : 999;

      if (maxAvailableStock <= 0 || input.isOutOfStock) {
        return {
          success: false,
          message: `Cannot add "${input.name}" to cart: this item is currently out of stock.`,
        };
      }

      let resultMessage = '';
      let isNew = false;

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((i) => i.id === generatedId);

        if (existingIndex > -1) {
          // Item with identical selections already exists in cart
          const existing = prevItems[existingIndex];
          const newQuantity = existing.quantity + input.quantity;

          if (newQuantity > maxAvailableStock) {
            // Cannot exceed maximum available stock
            const allowedAdd = Math.max(0, maxAvailableStock - existing.quantity);
            if (allowedAdd <= 0) {
              resultMessage = `All available stock (${maxAvailableStock}) for this item is already in your cart.`;
              return prevItems;
            }
            resultMessage = `Added ${allowedAdd} more. Reached maximum available stock (${maxAvailableStock}).`;
            const copy = [...prevItems];
            copy[existingIndex] = {
              ...existing,
              quantity: maxAvailableStock,
              currentStock: maxAvailableStock,
            };
            return copy;
          }

          resultMessage = `Increased quantity of "${input.name}" to ${newQuantity}.`;
          const copy = [...prevItems];
          copy[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            currentStock: maxAvailableStock,
          };
          return copy;
        }

        // New item configuration
        isNew = true;
        const initialQty = Math.min(input.quantity, maxAvailableStock);
        resultMessage = `Added "${input.name}" to your cart.`;

        const newItem: CartItem = {
          ...input,
          id: generatedId,
          quantity: initialQty,
          addedAt: new Date().toISOString(),
          currentStock: maxAvailableStock,
          isOutOfStock: false,
          isUnavailable: false,
        };

        return [newItem, ...prevItems];
      });

      return {
        success: true,
        message: resultMessage,
        cartItemId: generatedId,
        isNewItem: isNew,
      };
    },
    []
  );

  /**
   * Removes an item by its unique composite cartItemId.
   */
  const removeItem = useCallback((cartItemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== cartItemId));
  }, []);

  /**
   * Updates an item's quantity with stock bounds checking.
   * Clamped between 1 and available stock.
   */
  const updateQuantity = useCallback(
    (cartItemId: string, requestedQuantity: number): CartQuantityResult => {
      let resultMessage = 'Quantity updated.';
      let success = true;

      setItems((prevItems) => {
        const index = prevItems.findIndex((i) => i.id === cartItemId);
        if (index === -1) {
          success = false;
          resultMessage = 'Item not found in cart.';
          return prevItems;
        }

        const item = prevItems[index];
        const maxStock = typeof item.currentStock === 'number' ? item.currentStock : 999;

        if (requestedQuantity < 1) {
          resultMessage = 'Minimum order quantity is 1.';
          success = false;
          return prevItems;
        }

        if (requestedQuantity > maxStock) {
          resultMessage = `Only ${maxStock} of this curation is currently available.`;
          const copy = [...prevItems];
          copy[index] = {
            ...item,
            quantity: maxStock,
          };
          success = false;
          return copy;
        }

        const copy = [...prevItems];
        copy[index] = {
          ...item,
          quantity: Math.floor(requestedQuantity),
        };
        return copy;
      });

      return { success, message: resultMessage };
    },
    []
  );

  /**
   * Clears the entire cart.
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Atomically replaces the current cart with recovered or loaded items.
   */
  const replaceCart = useCallback((newItems: CartItem[]) => {
    setItems(Array.isArray(newItems) ? newItems : []);
  }, []);

  // Computed values
  const totalQuantity = useMemo(() => calculateCartCount(items), [items]);
  const subtotal = useMemo(() => calculateCartSubtotal(items), [items]);

  const hasOutOfStockItems = useMemo(
    () => items.some((item) => item.isOutOfStock || (typeof item.currentStock === 'number' && item.currentStock <= 0)),
    [items]
  );

  const hasUnavailableItems = useMemo(
    () => items.some((item) => item.isUnavailable),
    [items]
  );

  const hasStockExceededItems = useMemo(
    () => items.some((item) => typeof item.currentStock === 'number' && item.quantity > item.currentStock),
    [items]
  );

  const isCartValidForCheckout = useMemo(
    () => items.length > 0 && !hasOutOfStockItems && !hasUnavailableItems && !hasStockExceededItems,
    [items, hasOutOfStockItems, hasUnavailableItems, hasStockExceededItems]
  );

  const getCartCount = useCallback(() => totalQuantity, [totalQuantity]);
  const getCartSubtotal = useCallback(() => subtotal, [subtotal]);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      totalQuantity,
      subtotal,
      isValidating,
      hasOutOfStockItems,
      hasUnavailableItems,
      hasStockExceededItems,
      isCartValidForCheckout,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
      revalidateStock,
      getCartCount,
      getCartSubtotal,
    }),
    [
      items,
      totalQuantity,
      subtotal,
      isValidating,
      hasOutOfStockItems,
      hasUnavailableItems,
      hasStockExceededItems,
      isCartValidForCheckout,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
      revalidateStock,
      getCartCount,
      getCartSubtotal,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
