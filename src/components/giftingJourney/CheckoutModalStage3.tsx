import React, { useState } from 'react';
import { PersonalisationDetails } from './PersonaliseModalStage2';

interface CheckoutModalStage3Props {
  details: PersonalisationDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onResetAll: () => void;
}

export const CheckoutModalStage3: React.FC<CheckoutModalStage3Props> = ({
  details,
  isOpen,
  onClose,
  onResetAll,
}) => {
  if (!isOpen || !details) return null;

  // Form Fields
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('Tomorrow — Priority Hand-Delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'applepay'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Handle Submit Order
  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const generatedId = `GTC-${Math.floor(10000 + Math.random() * 90000)}`;
      setOrderId(generatedId);
      setIsCompleted(true);
    }, 900);
  };

  const deliveryFee = 0; // Complimentary luxury white-glove gift delivery
  const finalTotal = details.totalPrice + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-heading"
          className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-brand-dark/10 overflow-hidden z-10 animate-fade-in"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-white border-b border-brand-dark/10 flex items-center justify-between">
            <div>
              <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600 block mb-1">
                {isCompleted ? 'Order Confirmed' : 'Stage 3 · Delivery & Checkout'}
              </span>
              <h3
                id="checkout-heading"
                className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal"
              >
                {isCompleted ? 'Thank You for Your Order' : 'Recipient & Delivery Details'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-brand-dark/10 hover:border-brand-dark flex items-center justify-center text-brand-dark/70 hover:text-brand-dark transition-colors cursor-pointer"
              aria-label="Close checkout"
            >
              ✕
            </button>
          </div>

          {!isCompleted ? (
            /* ── Checkout Form ── */
            <form onSubmit={handleCompleteOrder} className="p-6 sm:p-8 space-y-6">
              {/* Order Brief Strip */}
              <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 flex items-center justify-between text-xs font-sans">
                <div>
                  <span className="font-semibold text-brand-dark block">
                    {details.gift.title}
                  </span>
                  <span className="text-brand-medium/80">
                    {details.packaging.name} · {details.ribbon.name} Ribbon
                  </span>
                </div>
                <span className="font-serif text-base text-brand-dark font-semibold">
                  ₦{finalTotal.toLocaleString()}
                </span>
              </div>

              {/* Recipient Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Amara Johnson"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-brand-dark/15 focus:border-brand-dark focus:outline-none font-sans text-xs sm:text-sm text-brand-dark"
                  />
                </div>

                <div>
                  <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                    Recipient Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-brand-dark/15 focus:border-brand-dark focus:outline-none font-sans text-xs sm:text-sm text-brand-dark"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street address, apartment or suite, city, state..."
                  className="w-full p-4 rounded-xl bg-white border border-brand-dark/15 focus:border-brand-dark focus:outline-none font-sans text-xs sm:text-sm text-brand-dark resize-none"
                />
              </div>

              {/* Delivery Date Selection */}
              <div>
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                  Preferred Delivery Date
                </label>
                <select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-brand-dark/15 focus:border-brand-dark focus:outline-none font-sans text-xs sm:text-sm text-brand-dark cursor-pointer"
                >
                  <option value="Tomorrow — Priority Hand-Delivery">
                    Tomorrow — Priority White-Glove Hand-Delivery
                  </option>
                  <option value="In 2 Days — Scheduled Delivery">
                    In 2 Days — Scheduled Delivery
                  </option>
                  <option value="Weekend Special Delivery">
                    Upcoming Weekend Special Delivery
                  </option>
                  <option value="Specific Date On Request">
                    Specific Calendar Date (Coordinate via WhatsApp)
                  </option>
                </select>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'card', label: 'Debit / Card' },
                    { id: 'transfer', label: 'Bank Transfer' },
                    { id: 'applepay', label: 'Apple Pay' },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-sans font-medium transition-all text-center border cursor-pointer ${
                          isSelected
                            ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-2xs'
                            : 'bg-white text-brand-dark/80 border-brand-dark/10 hover:border-brand-dark/30'
                        }`}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Total & Submit */}
              <div className="pt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-sans text-brand-light uppercase tracking-wider block">
                    Total Amount Due
                  </span>
                  <span className="font-serif text-2xl text-brand-dark font-medium">
                    ₦{finalTotal.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-green-700 font-sans block">
                    ✓ White-Glove Hand Delivery Included
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 bg-brand-dark hover:bg-gold-600 disabled:opacity-50 text-brand-ivory font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Processing...' : 'Complete Order →'}
                </button>
              </div>
            </form>
          ) : (
            /* ── Order Confirmation & Order Tracker State ── */
            <div className="p-6 sm:p-10 space-y-8 animate-fade-in text-center sm:text-left">
              {/* Order Badge & Reference */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Order Successfully Placed</span>
                  </div>
                  <h4 className="font-serif text-2xl text-brand-dark font-normal">
                    Order Reference: #{orderId}
                  </h4>
                  <p className="font-sans text-xs text-brand-medium mt-1">
                    Delivering to <strong className="text-brand-dark">{recipientName}</strong> on {deliveryDate}.
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xs font-sans text-brand-light block">Amount Paid</span>
                  <span className="font-serif text-2xl text-gold-700 font-medium">
                    ₦{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ── Live Step-by-Step Order Tracker ── */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block mb-6">
                  Live Gift Tracking Status
                </span>

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-2">
                  {[
                    { step: '1', title: 'Order Confirmed', time: 'Just Now', active: true, done: true },
                    { step: '2', title: 'Gift Packaging', time: 'In Progress', active: true, done: false },
                    { step: '3', title: 'Out for Delivery', time: 'Scheduled', active: false, done: false },
                    { step: '4', title: 'Delivered with Care', time: 'Pending', active: false, done: false },
                  ].map((s) => (
                    <div key={s.step} className="flex sm:flex-col items-center gap-3 sm:text-center w-full">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-sans text-xs font-bold shrink-0 ${
                          s.done
                            ? 'bg-gold-600 text-white shadow-xs'
                            : s.active
                            ? 'bg-brand-dark text-white ring-4 ring-brand-dark/10 animate-pulse'
                            : 'bg-brand-cream/80 text-brand-dark/40 border border-brand-dark/10'
                        }`}
                      >
                        {s.done ? '✓' : s.step}
                      </div>
                      <div>
                        <span className="font-sans text-xs font-semibold text-brand-dark block">
                          {s.title}
                        </span>
                        <span className="font-sans text-[10px] text-brand-light">
                          {s.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Gift Card Preview */}
              <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-gold-300/40 font-serif italic text-sm text-brand-dark/90 leading-relaxed text-center sm:text-left">
                <span className="font-sans not-italic text-[10px] uppercase font-bold tracking-widest text-gold-700 block mb-1">
                  Card Attached to Gift:
                </span>
                "{details.message}"
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-dark/10">
                <p className="font-sans text-xs text-brand-medium">
                  A receipt & real-time tracking link have been dispatched to your mobile.
                </p>
                <button
                  type="button"
                  onClick={onResetAll}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                >
                  Send Another Gift →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModalStage3;
