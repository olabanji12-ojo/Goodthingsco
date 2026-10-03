/**
 * Good Things Co. — Resume Checkout Page
 *
 * Route: /resume-checkout?token=...
 *
 * Securely recovers customer checkout state using a hashed resume token:
 * - Authoritative server-side live stock & price revalidation
 * - Safe restoration of goodthingsco_cart and goodthingsco_checkout
 * - Active cart conflict handling (replace vs keep)
 * - Clear, friendly display of inventory or price updates
 * - No sensitive customer details in URL
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  Loader2,
  MapPin,
  User,
} from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { useCart } from '../contexts/CartContext';
import { resumeCheckoutSession, setStoredSessionId } from '../services/checkoutSessionService';
import { saveCheckoutToStorage } from '../utils/checkoutUtils';
import { formatNaira } from '../utils/cartUtils';
import type { RecoveredCheckoutPayload } from '../types/abandonedCheckout';
import type { CheckoutFormData } from '../types/checkout';

export const ResumeCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { items: activeCartItems, replaceCart } = useCart();

  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<RecoveredCheckoutPayload | null>(null);
  const [showCartConflict, setShowCartConflict] = useState<boolean>(false);
  const [restored, setRestored] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setError('No checkout recovery token was provided. Please check your link or start a new checkout.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchSession() {
      setLoading(true);
      setError(null);

      const result = await resumeCheckoutSession(token);

      if (!isMounted) return;

      if (!result.success || !result.payload) {
        setError(result.message || 'This checkout session has expired or is no longer available.');
        setLoading(false);
        return;
      }

      const recovered = result.payload;
      setPayload(recovered);
      setLoading(false);

      // Check if user has an active cart with different items
      const hasExistingDiffItems =
        activeCartItems.length > 0 &&
        JSON.stringify(activeCartItems.map((i) => i.productId).sort()) !==
          JSON.stringify(recovered.items.map((i) => i.productId).sort());

      if (hasExistingDiffItems) {
        setShowCartConflict(true);
      } else {
        // Automatically restore cart and form state
        applyRestoration(recovered);
      }
    }

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function applyRestoration(data: RecoveredCheckoutPayload) {
    // 1. Restore cart items
    replaceCart(data.items);

    // 2. Restore form data
    const formData: CheckoutFormData = {
      customer: data.customer,
      recipient: data.recipient,
      delivery: data.delivery,
      giftMessage: data.giftMessage || '',
    };
    saveCheckoutToStorage(formData);

    // 3. Track session ID for seamless continuity
    setStoredSessionId(data.sessionId);

    setRestored(true);
    setShowCartConflict(false);
  }

  function handleContinueToCheckout() {
    if (payload && !restored) {
      applyRestoration(payload);
    }
    navigate('/checkout');
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
        <GatewayNav activePath="shop" />

        <main className="w-full py-8 sm:py-12 max-w-3xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-6 text-gold-600 animate-spin">
                <Loader2 size={32} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-brand-dark mb-3">
                Recovering Your Selection
              </h1>
              <p className="font-sans text-sm text-brand-medium/80 max-w-md mx-auto leading-relaxed">
                Revalidating current inventory, live pricing, and delivery arrangements...
              </p>
            </div>
          )}

          {/* Error / Expired State */}
          {!loading && error && (
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-brand-dark/10 shadow-sm text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5">
                <Clock size={28} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-brand-dark mb-3">
                Checkout Session Unavailable
              </h1>
              <p className="font-sans text-sm text-brand-medium/80 max-w-md mx-auto mb-8 leading-relaxed">
                {error}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/cart"
                  className="px-6 py-3 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition-colors"
                >
                  View Active Cart
                </Link>
                <Link
                  to="/shop"
                  className="px-6 py-3 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors shadow-sm"
                >
                  Browse Curated Gifts →
                </Link>
              </div>
            </div>
          )}

          {/* Active Cart Conflict Modal / Alert */}
          {!loading && !error && payload && showCartConflict && (
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-amber-200/80 shadow-md mb-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-normal text-brand-dark mb-1">
                    Active Cart Detected
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-brand-medium/80 leading-relaxed">
                    You currently have items in your shopping bag. Would you like to resume your saved checkout session ({payload.items.length} items) or keep your current bag?
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-brand-dark/5">
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="px-5 py-2.5 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition-colors"
                >
                  Keep Current Bag
                </button>
                <button
                  type="button"
                  onClick={() => applyRestoration(payload)}
                  className="px-6 py-2.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors shadow-sm"
                >
                  Resume Saved Checkout →
                </button>
              </div>
            </div>
          )}

          {/* Recovered Checkout Summary & Continue Action */}
          {!loading && !error && payload && !showCartConflict && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center sm:text-left mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium mb-3">
                  <CheckCircle2 size={13} />
                  <span>Checkout Session Ready</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-normal text-brand-dark">
                  Welcome Back{payload.customer.fullName ? `, ${payload.customer.fullName.split(' ')[0]}` : ''}
                </h1>
                <p className="font-sans text-xs sm:text-sm text-brand-medium/80 mt-1">
                  We’ve restored your checkout details and revalidated current stock and delivery rates.
                </p>
              </div>

              {/* Price / Stock Change Warnings */}
              {payload.warnings && payload.warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs sm:text-sm space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle size={15} />
                    <span>Catalog Updates</span>
                  </div>
                  {payload.warnings.map((w, i) => (
                    <p key={i} className="pl-6 leading-relaxed text-amber-900/90">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Restored Items Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-brand-dark/5 mb-4">
                  <h2 className="font-serif text-lg font-medium text-brand-dark flex items-center gap-2">
                    <Package size={18} className="text-brand-medium" />
                    <span>Curated Selection ({payload.items.length})</span>
                  </h2>
                  <span className="font-mono text-xs text-brand-medium">
                    Subtotal: {formatNaira(payload.subtotal)}
                  </span>
                </div>

                <div className="divide-y divide-brand-dark/5">
                  {payload.items.map((item) => {
                    const imgSrc = typeof item.image === 'string' ? item.image : item.image?.url || '';
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-brand-cream/60 overflow-hidden shrink-0 border border-brand-dark/5">
                            {imgSrc ? (
                              <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-medium/40">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-serif text-sm text-brand-dark truncate">{item.name}</p>
                            <p className="font-sans text-xs text-brand-medium/70">
                              Qty: {item.quantity} × {formatNaira(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-sm text-brand-dark font-medium shrink-0">
                          {formatNaira(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Snapshot */}
                <div className="mt-6 pt-5 border-t border-brand-dark/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {payload.customer.email && (
                    <div className="flex items-start gap-2 text-brand-medium">
                      <User size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-brand-dark block">Contact</span>
                        <span>{payload.customer.fullName || 'Guest'}</span>
                        <span className="block text-brand-medium/70">{payload.customer.email}</span>
                      </div>
                    </div>
                  )}

                  {payload.delivery?.address?.addressLine1 && (
                    <div className="flex items-start gap-2 text-brand-medium">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-brand-dark block">Delivery Address</span>
                        <span>{payload.delivery.address.addressLine1}</span>
                        <span className="block text-brand-medium/70">
                          {payload.delivery.address.city}, {payload.delivery.address.state}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total & Action */}
                <div className="mt-8 pt-5 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="font-sans text-xs text-brand-medium block">Total (incl. delivery)</span>
                    <span className="font-serif text-2xl font-semibold text-brand-dark">
                      {formatNaira(payload.total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinueToCheckout}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors shadow-md flex items-center justify-center gap-2 group"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-brand-medium/60 py-2">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Protected with Good Things Co. cryptographic session encryption</span>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
