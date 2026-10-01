import React, { useState } from 'react';
import {
  GiftItem,
  PACKAGING_OPTIONS,
  RIBBON_COLORS,
  PackagingOption,
  RibbonColorOption,
} from '../../data/giftsData';

export interface PersonalisationDetails {
  gift: GiftItem;
  packaging: PackagingOption;
  ribbon: RibbonColorOption;
  message: string;
  hasMonogram: boolean;
  monogramText: string;
  totalPrice: number;
}

interface PersonaliseModalStage2Props {
  gift: GiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: (details: PersonalisationDetails) => void;
}

export const PersonaliseModalStage2: React.FC<PersonaliseModalStage2Props> = ({
  gift,
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  if (!isOpen || !gift) return null;

  const [selectedPackaging, setSelectedPackaging] = useState<PackagingOption>(
    PACKAGING_OPTIONS[0]
  );
  const [selectedRibbon, setSelectedRibbon] = useState<RibbonColorOption>(
    RIBBON_COLORS[0]
  );
  const [message, setMessage] = useState<string>('Wishing you moments of quiet joy, celebration, and inspired living.');
  const [hasMonogram, setHasMonogram] = useState<boolean>(false);
  const [monogramText, setMonogramText] = useState<string>('GTC');

  // Calculate live total
  const monogramCost = hasMonogram ? 3000 : 0;
  const totalPrice = gift.price + selectedPackaging.price + monogramCost;
  const formattedTotal = `₦${totalPrice.toLocaleString()}`;

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToCheckout({
      gift,
      packaging: selectedPackaging,
      ribbon: selectedRibbon,
      message,
      hasMonogram,
      monogramText: hasMonogram ? monogramText : '',
      totalPrice,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal / Drawer */}
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="personalise-heading"
          className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-brand-dark/10 overflow-hidden z-10 animate-fade-in"
        >
          {/* Header Bar */}
          <div className="p-6 sm:p-8 bg-white border-b border-brand-dark/10 flex items-center justify-between">
            <div>
              <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600 block mb-1">
                Stage 2 · Bespoke Presentation
              </span>
              <h3
                id="personalise-heading"
                className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal"
              >
                Personalise Your Gift
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-brand-dark/10 hover:border-brand-dark flex items-center justify-center text-brand-dark/70 hover:text-brand-dark transition-colors cursor-pointer"
              aria-label="Close personalisation panel"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleProceed} className="p-6 sm:p-8 space-y-8">
            {/* ── Item Summary Banner ── */}
            <div className="flex items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-white border border-brand-dark/10">
              <img
                src={gift.image}
                alt={gift.alt}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-brand-cream/80 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-gold-600 block">
                  {gift.subtitle}
                </span>
                <h4 className="font-serif text-lg sm:text-xl text-brand-dark font-normal truncate">
                  {gift.title}
                </h4>
                <div className="font-sans text-sm font-semibold text-brand-dark mt-1">
                  {gift.formattedPrice}
                </div>
              </div>
            </div>

            {/* ── 1. Packaging Type ── */}
            <div>
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark block mb-3">
                1. Select Packaging Finish
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PACKAGING_OPTIONS.map((pkg) => {
                  const isSelected = selectedPackaging.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackaging(pkg)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-white border-gold-600 ring-1 ring-gold-600/40 shadow-xs'
                          : 'bg-white/70 hover:bg-white border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans text-xs font-bold text-brand-dark">
                          {pkg.name}
                        </span>
                        <span className="font-sans text-xs text-gold-700 font-semibold">
                          +₦{pkg.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-brand-medium/80 leading-snug">
                        {pkg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Ribbon Colour Swatches ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark">
                  2. Select Silk Ribbon Colour
                </label>
                <span className="text-xs font-sans text-gold-600 font-medium">
                  {selectedRibbon.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {RIBBON_COLORS.map((ribbon) => {
                  const isSelected = selectedRibbon.id === ribbon.id;
                  return (
                    <button
                      key={ribbon.id}
                      type="button"
                      onClick={() => setSelectedRibbon(ribbon)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-brand-dark shadow-2xs ring-1 ring-brand-dark'
                          : 'bg-white/80 border-brand-dark/10 hover:border-brand-dark/30'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: ribbon.hex }}
                      />
                      <span className="text-xs font-sans text-brand-dark font-medium">
                        {ribbon.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 3. Handwritten Gift Card Message ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark">
                  3. Include a Handwritten Card Message
                </label>
                <span className="text-[11px] font-sans text-brand-light">
                  Complimentary calligraphed card
                </span>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={240}
                rows={3}
                placeholder="Write your personal message to accompany this gift..."
                className="w-full p-4 rounded-2xl bg-white border border-brand-dark/15 focus:border-brand-dark focus:outline-none font-sans text-xs sm:text-sm text-brand-dark placeholder-brand-light/60 transition-colors resize-none shadow-2xs"
              />
              <div className="text-right text-[10px] font-sans text-brand-light mt-1">
                {message.length} / 240 characters
              </div>
            </div>

            {/* ── 4. Optional Monogram / Engraved Tag ── */}
            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-sans text-xs font-semibold text-brand-dark block mb-0.5">
                  Optional Custom Monogram Initials (+₦3,000)
                </span>
                <span className="font-sans text-xs text-brand-medium/80">
                  Gold-foil stamped or embossed leather keepsake tag.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={hasMonogram}
                    onChange={(e) => setHasMonogram(e.target.checked)}
                    className="w-4 h-4 rounded accent-brand-dark cursor-pointer"
                  />
                  <span>Add Monogram</span>
                </label>

                {hasMonogram && (
                  <input
                    type="text"
                    maxLength={4}
                    value={monogramText}
                    onChange={(e) => setMonogramText(e.target.value.toUpperCase())}
                    placeholder="e.g. GTC"
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-brand-dark/20 text-center font-sans text-xs uppercase tracking-widest font-bold"
                  />
                )}
              </div>
            </div>

            {/* ── Total & Next Action ── */}
            <div className="pt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-sans text-brand-light uppercase tracking-wider block">
                  Gift Order Subtotal
                </span>
                <span className="font-serif text-2xl sm:text-3xl text-brand-dark font-medium">
                  {formattedTotal}
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 bg-brand-dark hover:bg-gold-600 text-brand-ivory font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-xl transition-all shadow-[0_4px_20px_rgba(28,20,14,0.15)] cursor-pointer"
              >
                <span>Proceed to Delivery & Checkout</span>
                <span className="ml-2 text-sm" aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonaliseModalStage2;
