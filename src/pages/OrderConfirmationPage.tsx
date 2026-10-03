/**
 * Good Things Co. — Order Confirmation & Payment Verification Page
 *
 * Dedicated /order-confirmation/:orderNumber route:
 * - Automatically verifies Paystack transaction reference server-side
 * - Idempotently clears Cart & checkout storage ONLY upon verified success
 * - Displays immutable order snapshot, item configurations, and delivery schedule
 * - Provides guest-friendly confirmation without requiring customer authentication
 * - Handles payment failure and clean retry without losing cart data
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Truck,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Clock,
} from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { useCart } from '../contexts/CartContext';
import { formatNaira } from '../utils/cartUtils';
import { Order } from '../types/order';
import { verifyOrderPayment } from '../services/paymentService';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(Boolean(reference));
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function handlePaymentVerificationAndFetch() {
      setLoading(true);

      // 1. If returning from Paystack with a transaction reference, verify with server
      if (reference) {
        setVerifying(true);
        try {
          const verifyResult = await verifyOrderPayment(reference);

          if (!isMounted) return;

          if (verifyResult.success && verifyResult.order) {
            setOrder(verifyResult.order);
            // Clear cart ONLY after server verification confirms payment!
            clearCart();
            // Clear saved checkout progress from localStorage
            try {
              localStorage.removeItem('goodthingsco_checkout');
            } catch (e) {
              console.warn('Failed to clear checkout storage:', e);
            }
          } else {
            setVerificationError(
              verifyResult.message || 'Payment verification was unsuccessful. Your cart items have been preserved.'
            );
            // If order was partially found, load it for reference
            if (verifyResult.order) {
              setOrder(verifyResult.order);
            }
          }
        } catch (err: any) {
          if (!isMounted) return;
          setVerificationError(err?.message || 'Error communicating with payment verification server.');
        } finally {
          if (isMounted) {
            setVerifying(false);
            setLoading(false);
          }
        }
        return;
      }

      // An order number alone is not authorization to read private order data.
      navigate(`/track-order${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ''}`, { replace: true });
    }

    handlePaymentVerificationAndFetch();

    return () => {
      isMounted = false;
    };
  }, [orderNumber, reference, clearCart, navigate]);

  const copyToClipboard = () => {
    if (order?.orderNumber && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrderNumber(true);
      setTimeout(() => setCopiedOrderNumber(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
        <GatewayNav activePath="shop" />

        <main className="w-full py-6 sm:py-10 max-w-4xl mx-auto">
          {/* ── State 0: Loading Order Details ── */}
          {loading && !verifying && (
            <div className="p-10 sm:p-16 rounded-3xl bg-white border border-brand-dark/10 text-center space-y-4 shadow-sm my-8 animate-fade-in">
              <Loader2 size={36} className="animate-spin text-gold-600 mx-auto" />
              <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                Retrieving Order Details
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-medium max-w-md mx-auto leading-relaxed">
                Fetching your order summary and delivery schedule...
              </p>
            </div>
          )}

          {/* ── State 1: Verifying with Paystack ── */}
          {verifying && (
            <div className="p-10 sm:p-16 rounded-3xl bg-white border border-brand-dark/10 text-center space-y-4 shadow-sm my-8 animate-fade-in">
              <Loader2 size={36} className="animate-spin text-gold-600 mx-auto" />
              <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                Confirming Your Payment
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-medium max-w-md mx-auto leading-relaxed">
                We are securely verifying your transaction with Paystack and reserving your bespoke curations in the atelier...
              </p>
            </div>
          )}

          {/* ── State 2: Verification Error / Payment Failure ── */}
          {!loading && !verifying && verificationError && (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-rose-200 text-center space-y-5 shadow-sm my-8 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle size={30} />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                Payment Verification Notice
              </h2>
              <p className="font-sans text-xs sm:text-sm text-rose-800 max-w-md mx-auto leading-relaxed">
                {verificationError}
              </p>
              <p className="font-sans text-xs text-brand-medium max-w-md mx-auto">
                Your items and delivery information have been preserved in your cart. You may retry your payment or return to checkout.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="px-6 py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  <span>Retry Payment at Checkout</span>
                </button>
                <Link
                  to="/cart"
                  className="px-6 py-3.5 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition-colors text-center"
                >
                  Return to Cart
                </Link>
              </div>
            </div>
          )}

          {/* ── State 3: Confirmed Paid Order ── */}
          {!loading && !verifying && !verificationError && order && (
            <div className="space-y-8 animate-fade-in">
              {/* Top Celebration Hero */}
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-brand-dark/10 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={34} />
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-sans text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Verified Paystack Payment · Order Confirmed</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
                  Thank You for Your Order
                </h1>

                <p className="font-sans text-xs sm:text-sm text-brand-medium max-w-lg mx-auto leading-relaxed">
                  Your bespoke gifting curation has been registered and our atelier artisans have queued your presentation box for hand-assembly and wax-sealed calligraphy.
                </p>

                {/* Human-Readable Order Reference Card */}
                <div className="pt-2">
                  <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-3 sm:px-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10">
                    <span className="font-sans text-xs uppercase tracking-wider text-brand-light font-semibold">
                      Order Reference:
                    </span>
                    <strong className="font-mono text-base sm:text-lg font-bold text-brand-dark tracking-wide">
                      {order.orderNumber}
                    </strong>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-1 text-[11px] font-sans text-gold-700 hover:text-gold-900 font-semibold cursor-pointer ml-1"
                      title="Copy order number"
                    >
                      {copiedOrderNumber ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Left Column: Delivery & Customer Info (6 cols) */}
                <div className="md:col-span-6 space-y-6">
                  {/* Delivery Schedule & Recipient */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-brand-dark/10">
                      <Truck size={18} className="text-gold-600" />
                      <h3 className="font-serif text-lg text-brand-dark font-normal">
                        Recipient & Delivery Details
                      </h3>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <span className="text-brand-light uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                          Recipient
                        </span>
                        <p className="font-semibold text-brand-dark">
                          {order.recipient.fullName} {order.recipient.isSelf ? '(Self-order)' : ''}
                        </p>
                        <p className="text-brand-medium">{order.recipient.phone}</p>
                      </div>

                      <div>
                        <span className="text-brand-light uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                          Delivery Destination
                        </span>
                        <p className="text-brand-dark font-medium leading-relaxed">
                          {order.delivery.address.addressLine1}
                          {order.delivery.address.addressLine2 && `, ${order.delivery.address.addressLine2}`}
                        </p>
                        <p className="text-brand-medium">
                          {order.delivery.address.city}, {order.delivery.address.state}, {order.delivery.address.country}
                        </p>
                      </div>

                      <div>
                        <span className="text-brand-light uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                          Preferred Delivery Date
                        </span>
                        <div className="flex items-center gap-1.5 text-gold-800 font-semibold">
                          <Calendar size={13} />
                          <span>{order.delivery.preferredDate || 'Standard Dispatch'}</span>
                        </div>
                      </div>

                      {order.delivery.specialInstructions && (
                        <div>
                          <span className="text-brand-light uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                            Special Instructions
                          </span>
                          <p className="text-brand-medium italic bg-[#FAF8F5] p-2.5 rounded-xl border border-brand-dark/5">
                            "{order.delivery.specialInstructions}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer / Order Contact */}
                  <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-brand-dark/10">
                      <Clock size={18} className="text-gold-600" />
                      <h3 className="font-serif text-lg text-brand-dark font-normal">
                        Order Information & Payment
                      </h3>
                    </div>

                    <div className="space-y-2.5 font-sans text-xs">
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Customer (Sender):</span>
                        <strong className="text-brand-dark">{order.customer.fullName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Email Address:</span>
                        <span className="text-brand-dark">{order.customer.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Phone Number:</span>
                        <span className="text-brand-dark">{order.customer.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Payment Provider:</span>
                        <span className="text-brand-dark capitalize">{order.payment.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Transaction Reference:</span>
                        <span className="font-mono text-[11px] text-brand-dark truncate max-w-[180px]">
                          {order.payment.reference}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-medium">Fulfillment Status:</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-gold-800 font-semibold text-[10px] uppercase tracking-wider">
                          {order.orderStatus.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gift Message Card */}
                  {order.giftMessage && (
                    <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-brand-dark/10 space-y-2">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-gold-600 block">
                        Included Calligraphy Gift Card Message:
                      </span>
                      <p className="font-serif italic text-sm text-brand-dark leading-relaxed">
                        "{order.giftMessage}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Purchased Items & Financial Breakdown (6 cols) */}
                <div className="md:col-span-6 space-y-6">
                  <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                      <h3 className="font-serif text-lg text-brand-dark font-normal">
                        Purchased Curations
                      </h3>
                      <span className="font-sans text-xs text-brand-light">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="divide-y divide-brand-dark/10">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-xl border border-brand-dark/10 bg-[#FAF8F5] shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-brand-cream/80 border border-brand-dark/10 flex items-center justify-center text-brand-medium shrink-0">
                              <Package size={20} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-base text-brand-dark truncate font-medium">
                              {item.name}
                            </h4>
                            <div className="font-sans text-xs text-brand-medium">
                              Qty: {item.quantity} × {formatNaira(item.unitPrice)}
                            </div>

                            {/* Configurations */}
                            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-sans text-brand-light">
                              {item.packaging && (
                                <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-brand-dark/5">
                                  {item.packaging}
                                </span>
                              )}
                              {item.ribbonColour && (
                                <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-brand-dark/5">
                                  Ribbon: {item.ribbonColour}
                                </span>
                              )}
                              {item.personalisationText && (
                                <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200/50">
                                  Engraved: "{item.personalisationText}"
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="font-serif text-sm font-semibold text-brand-dark">
                            {formatNaira(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-4 border-t border-brand-dark/10 space-y-2.5 font-sans text-xs">
                      <div className="flex justify-between text-brand-medium">
                        <span>Merchandise Subtotal</span>
                        <span className="font-semibold text-brand-dark">{formatNaira(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-brand-medium">
                        <span>Bespoke Packaging & Card</span>
                        <span className="text-gold-700 font-medium">Complimentary</span>
                      </div>
                      <div className="flex justify-between text-brand-medium">
                        <span>Delivery Fee ({order.delivery.zone})</span>
                        <span className="font-semibold text-brand-dark">
                          {order.deliveryFee > 0 ? formatNaira(order.deliveryFee) : 'Complimentary'}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-brand-dark/10 flex justify-between items-baseline">
                        <span className="font-sans text-xs uppercase font-bold text-brand-dark">Total Paid</span>
                        <span className="font-serif text-2xl font-bold text-brand-dark">
                          {formatNaira(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-brand-dark/10 space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`)}
                      className="w-full py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Package size={14} />
                      <span>Track Order</span>
                    </button>

                    <Link
                      to="/shop"
                      className="w-full py-3 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition-colors text-center block"
                    >
                      Continue Gifting Discovery →
                    </Link>
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

export default OrderConfirmationPage;
