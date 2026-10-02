/**
 * Good Things Co. — Customer Checkout & Delivery Coordination Page
 *
 * Dedicated /checkout experience providing:
 * - Guest checkout without account requirement
 * - Customer / Sender contact details
 * - Recipient details (Self vs Gift recipient)
 * - Structured delivery address with Nigerian state selector & international support
 * - Dynamic delivery zone resolution (Lagos, Other Nigerian States, International)
 * - Configurable delivery fee calculation
 * - Preferred delivery date picker (strictly non-past)
 * - Optional calligraphy gift message with character limit
 * - Special delivery instructions
 * - Comprehensive order summary with itemized configurations
 * - Strict live Firestore stock and price revalidation before payment
 * - Safe localStorage progress persistence (key: goodthingsco_checkout)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { useCart } from '../contexts/CartContext';
import { formatNaira } from '../utils/cartUtils';
import { getProductImageUrl } from '../services/cloudinaryService';
import {
  NIGERIAN_STATES,
  SUPPORTED_COUNTRIES,
  resolveDeliveryZone,
  getDeliveryFeeCalculation,
} from '../config/shipping';
import {
  CheckoutFormData,
  CheckoutValidationErrors,
  StockRevalidationSummary,
  ValidatedCheckoutPayload,
} from '../types/checkout';
import {
  validateCheckoutForm,
  revalidateCartInventory,
  loadCheckoutFromStorage,
  saveCheckoutToStorage,
  getMinDeliveryDateString,
} from '../utils/checkoutUtils';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, totalQuantity, revalidateStock } = useCart();

  // Initial State from LocalStorage or Clean Defaults
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const saved = loadCheckoutFromStorage();
    return {
      customer: {
        fullName: saved?.customer?.fullName || '',
        email: saved?.customer?.email || '',
        phone: saved?.customer?.phone || '',
      },
      recipient: {
        isSelf: saved?.recipient?.isSelf ?? false,
        fullName: saved?.recipient?.fullName || '',
        phone: saved?.recipient?.phone || '',
      },
      delivery: {
        address: {
          country: saved?.delivery?.address?.country || 'Nigeria',
          addressLine1: saved?.delivery?.address?.addressLine1 || '',
          addressLine2: saved?.delivery?.address?.addressLine2 || '',
          city: saved?.delivery?.address?.city || '',
          state: saved?.delivery?.address?.state || 'Lagos',
          postalCode: saved?.delivery?.address?.postalCode || '',
        },
        zone: saved?.delivery?.zone || 'lagos',
        preferredDate: saved?.delivery?.preferredDate || '',
        specialInstructions: saved?.delivery?.specialInstructions || '',
      },
      giftMessage: saved?.giftMessage || '',
    };
  });

  const [errors, setErrors] = useState<CheckoutValidationErrors>({});
  const [revalidationSummary, setRevalidationSummary] = useState<StockRevalidationSummary | null>(null);
  const [validatingOrder, setValidatingOrder] = useState<boolean>(false);
  const [preparedPayload, setPreparedPayload] = useState<ValidatedCheckoutPayload | null>(null);
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState<boolean>(false);

  // Auto-sync form changes to localStorage
  useEffect(() => {
    saveCheckoutToStorage(formData);
  }, [formData]);

  // Compute live delivery zone from country and state
  const currentZone = useMemo(() => {
    return resolveDeliveryZone(
      formData.delivery.address.country,
      formData.delivery.address.state
    );
  }, [formData.delivery.address.country, formData.delivery.address.state]);

  // Sync resolved zone into form data if different
  useEffect(() => {
    if (formData.delivery.zone !== currentZone) {
      setFormData((prev) => ({
        ...prev,
        delivery: {
          ...prev.delivery,
          zone: currentZone,
        },
      }));
    }
  }, [currentZone, formData.delivery.zone]);

  // Compute delivery fee
  const deliveryCalc = useMemo(() => {
    return getDeliveryFeeCalculation(currentZone);
  }, [currentZone]);

  const deliveryFee = deliveryCalc.fee;
  const orderTotal = subtotal + deliveryFee;

  // Handle self-order recipient copy
  useEffect(() => {
    if (formData.recipient.isSelf) {
      setFormData((prev) => ({
        ...prev,
        recipient: {
          ...prev.recipient,
          fullName: prev.customer.fullName,
          phone: prev.customer.phone,
        },
      }));
    }
  }, [formData.recipient.isSelf, formData.customer.fullName, formData.customer.phone]);

  const handleCustomerChange = (field: keyof typeof formData.customer, value: string) => {
    setFormData((prev) => {
      const updatedCustomer = { ...prev.customer, [field]: value };
      const updatedRecipient = prev.recipient.isSelf
        ? {
            ...prev.recipient,
            fullName: field === 'fullName' ? value : prev.recipient.fullName,
            phone: field === 'phone' ? value : prev.recipient.phone,
          }
        : prev.recipient;

      return {
        ...prev,
        customer: updatedCustomer,
        recipient: updatedRecipient,
      };
    });

    if (errors[field === 'fullName' ? 'customerName' : field === 'email' ? 'customerEmail' : 'customerPhone']) {
      setErrors((prev) => ({
        ...prev,
        [field === 'fullName' ? 'customerName' : field === 'email' ? 'customerEmail' : 'customerPhone']: undefined,
      }));
    }
  };

  const handleRecipientChange = (field: 'fullName' | 'phone', value: string) => {
    setFormData((prev) => ({
      ...prev,
      recipient: {
        ...prev.recipient,
        [field]: value,
      },
    }));

    const errorKey = field === 'fullName' ? 'recipientName' : 'recipientPhone';
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleAddressChange = (field: keyof typeof formData.delivery.address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        address: {
          ...prev.delivery.address,
          [field]: value,
        },
      },
    }));

    if (errors[field as keyof CheckoutValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field as keyof CheckoutValidationErrors]: undefined }));
    }
  };

  /**
   * Final checkout validation before proceeding toward payment:
   * 1. Validates all required form fields
   * 2. Live re-fetches inventory and pricing from Firestore
   * 3. Blocks progression if stock is exceeded, items out of stock, or products archived
   */
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevalidationSummary(null);

    // 1. Form validation
    const formCheck = validateCheckoutForm(formData);
    if (!formCheck.isValid) {
      setErrors(formCheck.errors);
      // Scroll to first error
      const firstErrorKey = Object.keys(formCheck.errors)[0];
      const el = document.getElementById(`checkout-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setValidatingOrder(true);

    try {
      // 2. Strict Live Inventory & Price Revalidation against Firestore
      const stockCheck = await revalidateCartInventory(items);
      setRevalidationSummary(stockCheck);

      if (!stockCheck.isValid) {
        // Trigger global cart revalidation to ensure cart state matches
        await revalidateStock();
        setValidatingOrder(false);
        return;
      }

      // 3. Assemble validated payload ready for Orders & Paystack
      const payload: ValidatedCheckoutPayload = {
        customer: { ...formData.customer },
        recipient: { ...formData.recipient },
        delivery: { ...formData.delivery },
        giftMessage: formData.giftMessage?.trim() || undefined,
        items: [...items],
        subtotal,
        deliveryFee,
        total: orderTotal,
        currency: 'NGN',
        deliveryZoneName: deliveryCalc.name,
        deliveryRequiresQuote: deliveryCalc.requiresQuote,
        validatedAt: new Date().toISOString(),
      };

      setPreparedPayload(payload);
      setPaymentNoticeOpen(true);
    } catch (err) {
      console.error('[CheckoutPage] Validation error:', err);
      setErrors({
        inventory: 'Failed to verify inventory with the atelier. Please try again.',
      });
    } finally {
      setValidatingOrder(false);
    }
  };

  // If cart is empty, render friendly empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
          <GatewayNav activePath="shop" />
          <main className="w-full py-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-cream/80 border border-brand-dark/10 flex items-center justify-center mx-auto mb-5 text-brand-medium">
              <ShoppingBag size={28} />
            </div>
            <h1 className="font-serif text-3xl font-normal text-brand-dark mb-3">
              Your Cart is Empty
            </h1>
            <p className="font-sans text-xs sm:text-sm text-brand-medium/80 mb-6 leading-relaxed">
              You must add items to your cart before proceeding to checkout.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/cart"
                className="px-6 py-3 rounded-xl border border-brand-dark text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition-colors"
              >
                View Cart
              </Link>
              <Link
                to="/shop"
                className="px-6 py-3 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors shadow-sm"
              >
                Explore Curated Gifts →
              </Link>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const isNigeria =
    formData.delivery.address.country.trim().toLowerCase() === 'nigeria' ||
    formData.delivery.address.country.trim().toLowerCase() === 'ng';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
        <GatewayNav activePath="shop" />

        <main className="w-full py-6 sm:py-10">
          {/* Top Back Link */}
          <div className="mb-6 sm:mb-8">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-medium hover:text-brand-dark transition-colors"
            >
              <ArrowLeft size={14} /> Back to Cart
            </Link>
          </div>

          {/* Heading */}
          <div className="border-b border-brand-dark/10 pb-5 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
                Guest Checkout & Delivery
              </h1>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/80 mt-1">
                Enter your details, recipient gifting instructions, and delivery schedule.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-sans font-semibold text-gold-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <ShieldCheck size={14} />
              <span>Guest Order — No Account Required</span>
            </div>
          </div>

          {/* Inventory Revalidation Failure Alert */}
          {revalidationSummary && !revalidationSummary.isValid && (
            <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 font-sans text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-700">
                <AlertTriangle size={18} />
                <span>Inventory update required before proceeding to payment:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {revalidationSummary.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  to="/cart"
                  className="font-semibold text-rose-800 underline hover:text-rose-950 transition-colors"
                >
                  Return to Cart to adjust quantities or remove unavailable items →
                </Link>
              </div>
            </div>
          )}

          {/* Price Warning Notification */}
          {revalidationSummary && revalidationSummary.warnings.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-sans text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Pricing Update:</span>
                {revalidationSummary.warnings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
            </div>
          )}

          {/* Form and Summary Grid */}
          <form onSubmit={handleProceedToPayment}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Form Sections (7 cols) */}
              <div className="lg:col-span-7 space-y-8">
                {/* ── Section 1: Customer / Sender Details ── */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-dark text-white font-sans text-xs font-bold flex items-center justify-center">
                        1
                      </div>
                      <h2 className="font-serif text-xl text-brand-dark font-normal">
                        Customer (Sender) Details
                      </h2>
                    </div>
                    <span className="text-[11px] font-sans text-brand-light">Who is placing this order?</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div id="checkout-customerName" className="sm:col-span-2">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Your Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customer.fullName}
                        onChange={(e) => handleCustomerChange('fullName', e.target.value)}
                        placeholder="e.g. Tofunmi Adebayo"
                        autoComplete="name"
                        className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                          errors.customerName ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                        }`}
                      />
                      {errors.customerName && (
                        <p className="font-sans text-xs text-rose-600 mt-1">{errors.customerName}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div id="checkout-customerEmail">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Email Address <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.customer.email}
                        onChange={(e) => handleCustomerChange('email', e.target.value)}
                        placeholder="tofunmi@example.com"
                        autoComplete="email"
                        className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                          errors.customerEmail ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                        }`}
                      />
                      {errors.customerEmail && (
                        <p className="font-sans text-xs text-rose-600 mt-1">{errors.customerEmail}</p>
                      )}
                      <span className="font-sans text-[10px] text-brand-light mt-1 block">
                        Order confirmation and receipt will be sent here.
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div id="checkout-customerPhone">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Phone Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.customer.phone}
                        onChange={(e) => handleCustomerChange('phone', e.target.value)}
                        placeholder="e.g. +234 803 123 4567"
                        autoComplete="tel"
                        className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                          errors.customerPhone ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                        }`}
                      />
                      {errors.customerPhone && (
                        <p className="font-sans text-xs text-rose-600 mt-1">{errors.customerPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Recipient Details ── */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-dark text-white font-sans text-xs font-bold flex items-center justify-center">
                        2
                      </div>
                      <h2 className="font-serif text-xl text-brand-dark font-normal">
                        Recipient Information
                      </h2>
                    </div>
                  </div>

                  {/* "This order is for me" Switch */}
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-brand-dark/10 cursor-pointer hover:bg-brand-cream/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.recipient.isSelf}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recipient: {
                            ...prev.recipient,
                            isSelf: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 rounded text-gold-600 focus:ring-gold-500 border-brand-dark/20"
                    />
                    <div className="font-sans text-xs text-brand-dark">
                      <strong className="block text-brand-dark font-semibold">
                        This order is for me
                      </strong>
                      <span className="text-brand-medium/80">
                        Deliver this curation to my own address using my contact information.
                      </span>
                    </div>
                  </label>

                  {/* Recipient Input Fields (If not self) */}
                  {!formData.recipient.isSelf && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in pt-1">
                      {/* Recipient Full Name */}
                      <div id="checkout-recipientName">
                        <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                          Recipient's Full Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.recipient.fullName}
                          onChange={(e) => handleRecipientChange('fullName', e.target.value)}
                          placeholder="e.g. Kosemani Balogun"
                          className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                            errors.recipientName ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                          }`}
                        />
                        {errors.recipientName && (
                          <p className="font-sans text-xs text-rose-600 mt-1">{errors.recipientName}</p>
                        )}
                      </div>

                      {/* Recipient Phone */}
                      <div id="checkout-recipientPhone">
                        <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                          Recipient's Phone Number <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.recipient.phone}
                          onChange={(e) => handleRecipientChange('phone', e.target.value)}
                          placeholder="e.g. +234 812 345 6789"
                          className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                            errors.recipientPhone ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                          }`}
                        />
                        {errors.recipientPhone && (
                          <p className="font-sans text-xs text-rose-600 mt-1">{errors.recipientPhone}</p>
                        )}
                        <span className="font-sans text-[10px] text-brand-light mt-1 block">
                          Required by the courier for delivery coordination.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 3: Delivery Address & Zone ── */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-dark text-white font-sans text-xs font-bold flex items-center justify-center">
                        3
                      </div>
                      <h2 className="font-serif text-xl text-brand-dark font-normal">
                        Delivery Destination & Address
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country Selector */}
                    <div id="checkout-country">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Country <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={formData.delivery.address.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        className="w-full p-3 rounded-xl border border-brand-dark/15 text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark cursor-pointer"
                      >
                        {SUPPORTED_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State Selector / Input */}
                    <div id="checkout-state">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        State / Province <span className="text-rose-600">*</span>
                      </label>
                      {isNigeria ? (
                        <select
                          value={formData.delivery.address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark cursor-pointer ${
                            errors.state ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                          }`}
                        >
                          <option value="">Select Nigerian State...</option>
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st.code} value={st.name}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.delivery.address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          placeholder="e.g. Greater London or Ontario"
                          className="w-full p-3 rounded-xl border border-brand-dark/15 text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark"
                        />
                      )}
                      {errors.state && (
                        <p className="font-sans text-xs text-rose-600 mt-1">{errors.state}</p>
                      )}
                    </div>

                    {/* City */}
                    <div id="checkout-city">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        City / Town <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.delivery.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="e.g. Victoria Island, Ikeja, or Abuja"
                        className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                          errors.city ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                        }`}
                      />
                      {errors.city && (
                        <p className="font-sans text-xs text-rose-600 mt-1">{errors.city}</p>
                      )}
                    </div>

                    {/* Postal Code (optional) */}
                    <div>
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Postal Code <span className="text-brand-light font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.delivery.address.postalCode}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        placeholder="e.g. 101241"
                        className="w-full p-3 rounded-xl border border-brand-dark/15 text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark"
                      />
                    </div>

                    {/* Address Line 1 */}
                    <div id="checkout-addressLine1" className="sm:col-span-2">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Street Address <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.delivery.address.addressLine1}
                        onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                        placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                        autoComplete="street-address"
                        className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark transition-colors ${
                          errors.addressLine1 ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                        }`}
                      />
                      {errors.addressLine1 && (
                        <p className="font-sans text-xs text-rose-600 mt-1">{errors.addressLine1}</p>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div className="sm:col-span-2">
                      <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                        Apartment, Suite, Unit <span className="text-brand-light font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.delivery.address.addressLine2}
                        onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                        placeholder="e.g. Block B, Apartment 4"
                        className="w-full p-3 rounded-xl border border-brand-dark/15 text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark"
                      />
                    </div>
                  </div>

                  {/* Dynamic Delivery Zone Indicator */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                    <Truck size={20} className="text-gold-700 shrink-0 mt-0.5" />
                    <div className="font-sans text-xs text-amber-950 space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <span>{deliveryCalc.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gold-600 text-white text-[10px] uppercase font-bold">
                          {deliveryCalc.requiresQuote ? 'Quote Required' : formatNaira(deliveryFee)}
                        </span>
                      </div>
                      <p className="text-amber-900/80">
                        {deliveryCalc.requiresQuote
                          ? 'International delivery rates vary by destination weight and customs. The atelier team will confirm exact shipping before dispatch.'
                          : `Estimated dispatch window: ${deliveryCalc.estimatedDeliveryTime}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Preferred Delivery Date & Gifting Instructions ── */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-dark text-white font-sans text-xs font-bold flex items-center justify-center">
                        4
                      </div>
                      <h2 className="font-serif text-xl text-brand-dark font-normal">
                        Schedule & Gifting Instructions
                      </h2>
                    </div>
                  </div>

                  {/* Preferred Delivery Date */}
                  <div id="checkout-preferredDate">
                    <label className="font-sans text-xs font-semibold text-brand-dark block mb-1.5">
                      Preferred Delivery Date <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={getMinDeliveryDateString()}
                        value={formData.delivery.preferredDate}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            delivery: { ...prev.delivery, preferredDate: e.target.value },
                          }));
                          if (errors.preferredDate) {
                            setErrors((prev) => ({ ...prev, preferredDate: undefined }));
                          }
                        }}
                        className={`w-full p-3 rounded-xl border text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark cursor-pointer ${
                          errors.preferredDate ? 'border-rose-400 bg-rose-50/20' : 'border-brand-dark/15'
                        }`}
                      />
                    </div>
                    {errors.preferredDate && (
                      <p className="font-sans text-xs text-rose-600 mt-1">{errors.preferredDate}</p>
                    )}
                    <span className="font-sans text-[10px] text-brand-light mt-1 block">
                      Our atelier team hand-prepares and coordinates courier timing around your chosen date.
                    </span>
                  </div>

                  {/* Calligraphy Gift Message */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="checkout-gift-message"
                        className="font-sans text-xs font-semibold text-brand-dark"
                      >
                        Handwritten Calligraphy Card Message{' '}
                        <span className="text-brand-light font-normal">(Optional)</span>
                      </label>
                      <span className="text-[11px] font-sans text-brand-light">
                        {formData.giftMessage?.length || 0}/400 chars
                      </span>
                    </div>
                    <textarea
                      id="checkout-gift-message"
                      value={formData.giftMessage}
                      maxLength={400}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, giftMessage: e.target.value }))
                      }
                      rows={3}
                      placeholder="e.g. Wishing you love, prosperity, and joyous celebrations on this milestone. From all of us at Renda."
                      className="w-full p-3 rounded-xl border border-brand-dark/15 text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark resize-none"
                    />
                  </div>

                  {/* Special Delivery Instructions */}
                  <div>
                    <label
                      htmlFor="checkout-instructions"
                      className="font-sans text-xs font-semibold text-brand-dark block mb-1.5"
                    >
                      Special Delivery Instructions{' '}
                      <span className="text-brand-light font-normal">(Optional)</span>
                    </label>
                    <input
                      id="checkout-instructions"
                      type="text"
                      value={formData.delivery.specialInstructions}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          delivery: {
                            ...prev.delivery,
                            specialInstructions: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Do not call recipient before arrival; Leave with reception if unavailable"
                      className="w-full p-3 rounded-xl border border-brand-dark/15 text-sm font-sans bg-[#FAF8F5] focus:outline-none focus:border-brand-dark"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary & Payment Button (5 cols) */}
              <div className="lg:col-span-5">
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-brand-dark/10 shadow-xs sticky top-24 space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-4">
                    <h2 className="font-serif text-2xl text-brand-dark font-normal">
                      Order Summary
                    </h2>
                    <span className="font-sans text-xs font-semibold text-brand-light">
                      {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                  {/* Cart Items List Preview */}
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 text-xs font-sans pb-3 border-b border-brand-dark/5 last:border-b-0">
                        <img
                          src={
                            item.image?.url
                              ? getProductImageUrl(item.image.url)
                              : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover bg-brand-cream/80 border border-brand-dark/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-sm text-brand-dark truncate font-normal">
                            {item.name}
                          </h4>
                          <div className="text-brand-light text-[11px] mt-0.5">
                            Qty: <strong className="text-brand-dark">{item.quantity}</strong> × {formatNaira(item.unitPrice)}
                          </div>
                          {(item.packaging || item.ribbonColour) && (
                            <div className="text-[10px] text-brand-medium/80 truncate mt-0.5">
                              {item.packaging && `Box: ${item.packaging}`}
                              {item.packaging && item.ribbonColour && ' • '}
                              {item.ribbonColour && `Ribbon: ${item.ribbonColour}`}
                            </div>
                          )}
                        </div>
                        <div className="font-serif text-sm font-semibold text-brand-dark shrink-0">
                          {formatNaira(item.unitPrice * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-2 border-t border-brand-dark/10 space-y-2.5 font-sans text-xs sm:text-sm">
                    <div className="flex justify-between text-brand-medium">
                      <span>Merchandise Subtotal</span>
                      <span className="font-semibold text-brand-dark">{formatNaira(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-brand-medium">
                      <span>Delivery Fee ({deliveryCalc.name})</span>
                      <span className="font-semibold text-brand-dark">
                        {deliveryCalc.requiresQuote ? 'Quote Required' : formatNaira(deliveryFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-brand-medium">
                      <span>Calligraphy Card & Wrapping</span>
                      <span className="text-gold-700 font-medium">Complimentary</span>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="pt-4 border-t border-brand-dark/10 flex justify-between items-baseline">
                    <div>
                      <span className="font-sans text-xs uppercase tracking-wider text-brand-light block">
                        Total Amount
                      </span>
                      {deliveryCalc.requiresQuote && (
                        <span className="font-sans text-[10px] text-amber-700">
                          (Excludes international freight quote)
                        </span>
                      )}
                    </div>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark">
                      {formatNaira(orderTotal)}
                    </span>
                  </div>

                  {/* Continue to Payment Button */}
                  <button
                    id="checkout-submit-button"
                    type="submit"
                    disabled={validatingOrder}
                    className="w-full py-4 rounded-2xl bg-brand-dark text-white font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] hover:bg-gold-600 active:scale-[0.99] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{validatingOrder ? 'Validating Inventory...' : 'Continue to Payment'}</span>
                    <span>→</span>
                  </button>

                  {/* Security Guarantee */}
                  <div className="pt-3 border-t border-brand-dark/10 space-y-2 font-sans text-xs text-brand-medium/80">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-gold-600 shrink-0" />
                      <span>Secured with Firebase SSL & 256-Bit Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gold-600 shrink-0" />
                      <span>Complimentary luxury packaging with silk ribbon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* ── Ready for Payment Summary Confirmation Modal ── */}
      {paymentNoticeOpen && preparedPayload && (
        <div className="fixed inset-0 z-50 bg-brand-dark/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-dark/10 space-y-5 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
                    Checkout Information Validated
                  </h3>
                  <p className="font-sans text-xs text-brand-light">
                    Ready for the Paystack payment & order fulfillment phase.
                  </p>
                </div>
              </div>
            </div>

            {/* Recipient & Delivery Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-3 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-brand-light block">
                    Customer (Sender)
                  </span>
                  <div className="font-semibold text-brand-dark">{preparedPayload.customer.fullName}</div>
                  <div className="text-brand-medium">{preparedPayload.customer.email}</div>
                  <div className="text-brand-medium">{preparedPayload.customer.phone}</div>
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-brand-light block">
                    Recipient
                  </span>
                  <div className="font-semibold text-brand-dark">
                    {preparedPayload.recipient.isSelf ? 'Self Delivery' : preparedPayload.recipient.fullName}
                  </div>
                  <div className="text-brand-medium">{preparedPayload.recipient.phone}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-brand-dark/10">
                <span className="font-bold uppercase tracking-wider text-[10px] text-brand-light block">
                  Delivery Destination
                </span>
                <div className="text-brand-dark font-medium">
                  {preparedPayload.delivery.address.addressLine1}
                  {preparedPayload.delivery.address.addressLine2 && `, ${preparedPayload.delivery.address.addressLine2}`}
                </div>
                <div className="text-brand-medium">
                  {preparedPayload.delivery.address.city}, {preparedPayload.delivery.address.state},{' '}
                  {preparedPayload.delivery.address.country}
                </div>
                <div className="text-gold-700 font-semibold mt-1">
                  Zone: {preparedPayload.deliveryZoneName} ({preparedPayload.deliveryRequiresQuote ? 'Quote Required' : formatNaira(preparedPayload.deliveryFee)})
                </div>
              </div>

              {preparedPayload.delivery.preferredDate && (
                <div className="pt-2 border-t border-brand-dark/10 flex items-center gap-2">
                  <Calendar size={14} className="text-gold-600" />
                  <span>
                    Preferred Delivery Date:{' '}
                    <strong className="text-brand-dark font-semibold">
                      {new Date(preparedPayload.delivery.preferredDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                </div>
              )}

              {preparedPayload.giftMessage && (
                <div className="pt-2 border-t border-brand-dark/10 font-serif italic text-xs text-brand-medium">
                  "{preparedPayload.giftMessage}"
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-baseline pt-2">
              <span className="font-sans text-xs uppercase tracking-wider text-brand-light">
                Order Total ({preparedPayload.items.length} curations)
              </span>
              <span className="font-serif text-2xl font-bold text-brand-dark">
                {formatNaira(preparedPayload.total)}
              </span>
            </div>

            {/* Next Steps Info */}
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-950 border border-amber-200 text-xs font-sans leading-relaxed">
              <strong>Phase Note:</strong> All customer, recipient, delivery address, preferred date, and live inventory validations are complete. Paystack payment gateway initialization and Firestore order persistence will be connected in the following phase.
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setPaymentNoticeOpen(false)}
                className="w-full py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer"
              >
                Return to Review Form
              </button>
              <Link
                to="/cart"
                onClick={() => setPaymentNoticeOpen(false)}
                className="w-full py-3.5 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider text-center hover:bg-black/5 transition-colors"
              >
                Edit Cart Items
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CheckoutPage;
