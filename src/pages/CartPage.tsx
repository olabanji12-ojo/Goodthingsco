/**
 * Good Things Co. — Customer Cart Page
 *
 * Full /cart route providing:
 * - Product image, name, and deep configuration breakdown
 * - Responsive quantity controls clamped to live Firestore stock
 * - Live stock warnings, out-of-stock flags, and unavailable states
 * - Naira subtotal calculation (merchandise total only)
 * - Clear empty state with call-to-action
 * - Accessible mobile-first layout (no desktop table overflow)
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { useCart } from '../contexts/CartContext';
import { formatNaira } from '../utils/cartUtils';
import { getProductImageUrl } from '../services/cloudinaryService';
import { CartItem } from '../types/cart';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    totalQuantity,
    subtotal,
    isValidating,
    hasOutOfStockItems,
    hasUnavailableItems,
    hasStockExceededItems,
    isCartValidForCheckout,
    removeItem,
    updateQuantity,
    clearCart,
    revalidateStock,
  } = useCart();

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Trigger live stock revalidation on mount
  useEffect(() => {
    revalidateStock();
  }, [revalidateStock]);

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleQuantityDecrease = (item: CartItem) => {
    if (item.quantity <= 1) return;
    const res = updateQuantity(item.id, item.quantity - 1);
    if (!res.success) {
      showNotice(res.message);
    }
  };

  const handleQuantityIncrease = (item: CartItem) => {
    const maxStock = typeof item.currentStock === 'number' ? item.currentStock : 999;
    if (item.quantity >= maxStock) {
      showNotice(`Cannot increase: only ${maxStock} in stock.`);
      return;
    }
    const res = updateQuantity(item.id, item.quantity + 1);
    if (!res.success) {
      showNotice(res.message);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    removeItem(item.id);
    showNotice(`Removed "${item.name}" from your cart.`);
  };

  const handleProceedToCheckout = () => {
    if (!isCartValidForCheckout) return;
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
        {/* Navigation */}
        <GatewayNav activePath="shop" />

        <main className="w-full py-6 sm:py-10">
          {/* Top Breadcrumb & Live Refresh Button */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-medium hover:text-brand-dark transition-colors"
            >
              <ArrowLeft size={14} /> Continue Gifting Discovery
            </Link>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  revalidateStock();
                  showNotice('Revalidating current inventory with atelier...');
                }}
                disabled={isValidating}
                className="inline-flex items-center gap-1.5 text-[11px] font-sans text-brand-light hover:text-brand-dark transition-colors cursor-pointer"
                title="Verify current stock from atelier"
              >
                <RefreshCw size={13} className={isValidating ? 'animate-spin text-gold-600' : ''} />
                <span>{isValidating ? 'Checking stock...' : 'Verify Inventory'}</span>
              </button>
            )}
          </div>

          {/* Toast / Feedback Notice */}
          {feedbackNotice && (
            <div className="fixed bottom-6 right-6 z-50 bg-brand-dark text-white px-5 py-3.5 rounded-xl shadow-2xl font-sans text-xs font-medium flex items-center gap-2.5 border border-white/10 animate-fade-in">
              <CheckCircle2 size={16} className="text-gold-400 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}

          {/* Page Heading */}
          <div className="border-b border-brand-dark/10 pb-5 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
                Your Atelier Cart
              </h1>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/80 mt-1">
                Review your bespoke gifting curations and configured packaging details.
              </p>
            </div>
            {items.length > 0 && (
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-light">
                {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'} in Selection
              </span>
            )}
          </div>

          {/* Global Warnings Bar if any stock issue exists */}
          {items.length > 0 && (hasOutOfStockItems || hasUnavailableItems || hasStockExceededItems) && (
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 font-sans text-xs flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Inventory adjustments required before checkout:</div>
                {hasOutOfStockItems && (
                  <div>• One or more items in your cart are currently out of stock. Please remove them to proceed.</div>
                )}
                {hasUnavailableItems && (
                  <div>• One or more items are no longer available in our active catalog. Please remove them to proceed.</div>
                )}
                {hasStockExceededItems && (
                  <div>• The requested quantity exceeds available atelier stock. Please adjust quantities to available levels.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Empty Cart State ── */}
          {items.length === 0 ? (
            <div className="max-w-xl mx-auto my-12 p-8 sm:p-14 text-center bg-white rounded-3xl border border-brand-dark/10 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-brand-cream/80 border border-brand-dark/10 flex items-center justify-center mx-auto mb-5 text-brand-medium">
                <ShoppingBag size={28} />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-2">
                Your Cart is Empty
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/80 max-w-md mx-auto leading-relaxed mb-6">
                Discover bespoke gift boxes, intentional curations, and signature packaging crafted with care.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-[0.16em] hover:bg-gold-600 transition-colors shadow-sm"
              >
                <span>Explore Curated Gifts</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            /* ── Cart with Items (Responsive Grid) ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Cart Items List (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {items.map((item) => {
                  const maxStock = typeof item.currentStock === 'number' ? item.currentStock : 999;
                  const itemIsOutOfStock = item.isOutOfStock || maxStock === 0;
                  const itemExceedsStock = !itemIsOutOfStock && item.quantity > maxStock;
                  const itemIsUnavailable = item.isUnavailable;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-6 rounded-2xl bg-white border transition-all ${
                        itemIsOutOfStock || itemIsUnavailable
                          ? 'border-rose-300/80 bg-rose-50/20'
                          : itemExceedsStock
                          ? 'border-amber-300/80 bg-amber-50/20'
                          : 'border-brand-dark/10 hover:border-brand-dark/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image Thumbnail */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-brand-cream/80 border border-brand-dark/10 shrink-0">
                          <img
                            src={
                              item.image?.url
                                ? getProductImageUrl(item.image.url)
                                : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={item.name}
                            className="w-full h-full object-cover object-center"
                          />
                          {itemIsOutOfStock && (
                            <div className="absolute inset-0 bg-brand-dark/75 backdrop-blur-[2px] flex items-center justify-center p-1 text-center">
                              <span className="font-sans text-[9px] font-bold text-white uppercase tracking-wider">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Details & Selections */}
                        <div className="flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/shop/product/${item.slug}`}
                                className="font-serif text-lg sm:text-xl font-normal text-brand-dark hover:text-gold-600 transition-colors"
                              >
                                {item.name}
                              </Link>

                              {/* Remove Item Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item)}
                                className="text-brand-light hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                aria-label={`Remove ${item.name} from cart`}
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Unit Price */}
                            <div className="font-sans text-xs sm:text-sm font-semibold text-brand-dark mt-1">
                              {formatNaira(item.unitPrice)} each
                              {item.priceChanged && item.currentPrice && (
                                <span className="ml-2 text-gold-700 text-[11px] font-normal">
                                  (Atelier price updated to {formatNaira(item.currentPrice)})
                                </span>
                              )}
                            </div>

                            {/* Bespoke Selections Breakdown */}
                            <div className="mt-3 flex flex-wrap gap-1.5 font-sans text-[11px]">
                              {/* Packaging */}
                              {item.packaging && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark">
                                  <Package size={11} className="text-gold-600" />
                                  <span>Box: {item.packaging}</span>
                                </span>
                              )}

                              {/* Ribbon */}
                              {item.ribbonColour && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark">
                                  <span className="w-2 h-2 rounded-full bg-gold-500" />
                                  <span>Ribbon: {item.ribbonColour}</span>
                                </span>
                              )}

                              {/* Variants */}
                              {item.selectedVariants &&
                                Object.entries(item.selectedVariants).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark"
                                  >
                                    {k}: <strong>{v}</strong>
                                  </span>
                                ))}

                              {/* Monogram / Personalisation */}
                              {item.personalisationText && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-950 font-medium">
                                  <Sparkles size={11} className="text-gold-600" />
                                  <span>Text: "{item.personalisationText}"</span>
                                </span>
                              )}
                            </div>

                            {/* Gift Card Message */}
                            {item.giftMessage && (
                              <div className="mt-2.5 p-2 rounded-lg bg-[#FAF8F5] border border-brand-dark/5 font-serif italic text-xs text-brand-medium/90">
                                💬 "{item.giftMessage}"
                              </div>
                            )}

                            {/* Warning States */}
                            {itemIsOutOfStock && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 font-sans font-medium">
                                <AlertCircle size={14} />
                                <span>Item currently out of stock. Please remove to continue.</span>
                              </div>
                            )}

                            {itemIsUnavailable && !itemIsOutOfStock && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 font-sans font-medium">
                                <AlertCircle size={14} />
                                <span>Product is no longer available in the atelier catalog.</span>
                              </div>
                            )}

                            {itemExceedsStock && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 font-sans font-medium">
                                <AlertTriangle size={14} />
                                <span>Only {maxStock} available. Please reduce quantity to {maxStock}.</span>
                              </div>
                            )}
                          </div>

                          {/* Bottom Row: Quantity Controls & Item Total */}
                          <div className="flex items-center justify-between pt-3 border-t border-brand-dark/5 mt-1">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-xs text-brand-light hidden sm:inline">
                                Quantity:
                              </span>
                              <div className="flex items-center border border-brand-dark/20 rounded-lg bg-[#FAF8F5] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityDecrease(item)}
                                  disabled={item.quantity <= 1 || itemIsOutOfStock}
                                  className="w-8 h-8 flex items-center justify-center text-brand-dark hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-10 text-center font-sans text-xs font-bold text-brand-dark">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityIncrease(item)}
                                  disabled={item.quantity >= maxStock || itemIsOutOfStock}
                                  className="w-8 h-8 flex items-center justify-center text-brand-dark hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              {/* Available stock hint */}
                              {typeof item.currentStock === 'number' && item.currentStock > 0 && (
                                <span className="font-sans text-[11px] text-brand-light ml-1">
                                  ({item.currentStock} in stock)
                                </span>
                              )}
                            </div>

                            {/* Item Subtotal */}
                            <div className="text-right">
                              <span className="font-serif text-lg font-bold text-brand-dark">
                                {formatNaira(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Clear Cart Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all items from your cart?')) {
                        clearCart();
                        showNotice('Cart cleared.');
                      }
                    }}
                    className="font-sans text-xs text-brand-light hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear Entire Cart
                  </button>
                </div>
              </div>

              {/* Right Column: Order Summary (4 cols) */}
              <div className="lg:col-span-4">
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs sticky top-24 space-y-6">
                  <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal pb-4 border-b border-brand-dark/10">
                    Curation Summary
                  </h2>

                  <div className="space-y-3 font-sans text-xs sm:text-sm">
                    <div className="flex justify-between text-brand-medium">
                      <span>Merchandise Subtotal</span>
                      <span className="font-semibold text-brand-dark">{formatNaira(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-brand-medium">
                      <span>Signature Packaging</span>
                      <span className="text-gold-700 font-medium">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-brand-medium">
                      <span>Calligraphy Gift Card</span>
                      <span className="text-gold-700 font-medium">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-brand-medium">
                      <span>Courier Shipping</span>
                      <span className="text-brand-light italic">Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-dark/10 flex justify-between items-baseline">
                    <div>
                      <span className="font-sans text-xs uppercase tracking-wider text-brand-light block">
                        Estimated Total
                      </span>
                      <span className="font-sans text-[10px] text-brand-light">Excludes shipping fee</span>
                    </div>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark">
                      {formatNaira(subtotal)}
                    </span>
                  </div>

                  {/* Proceed to Checkout CTA */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      disabled={!isCartValidForCheckout}
                      className={`w-full py-4 rounded-2xl font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isCartValidForCheckout
                          ? 'bg-brand-dark text-white hover:bg-gold-600 active:scale-[0.99] cursor-pointer'
                          : 'bg-brand-light/40 text-brand-medium/50 cursor-not-allowed border border-brand-dark/5'
                      }`}
                    >
                      <span>Proceed to Checkout</span>
                      <span>→</span>
                    </button>

                    {!isCartValidForCheckout && (
                      <p className="font-sans text-[11px] text-rose-600 text-center leading-relaxed">
                        Please resolve out-of-stock, unavailable, or exceeded inventory items above before proceeding.
                      </p>
                    )}
                  </div>

                  {/* Trust Notes */}
                  <div className="pt-4 border-t border-brand-dark/10 space-y-2.5 font-sans text-xs text-brand-medium/80">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={16} className="text-gold-600 shrink-0" />
                      <span>Authentic Goods & Guaranteed Curation Quality</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Package size={16} className="text-gold-600 shrink-0" />
                      <span>Hand-assembled & sealed with silk ribbon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
