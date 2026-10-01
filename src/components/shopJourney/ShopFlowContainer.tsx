import React, { useState, useMemo, useRef } from 'react';
import {
  GIFTS_CATALOG,
  OCCASIONS,
  RECIPIENTS,
  BUDGET_TIERS,
  PACKAGING_OPTIONS,
  RIBBON_COLORS,
  GiftItem,
} from '../../data/giftsData';

export interface ShopFlowContainerProps {
  className?: string;
  onComplete?: (orderRef: string) => void;
}

export const ShopFlowContainer: React.FC<ShopFlowContainerProps> = ({
  className = '',
  onComplete,
}) => {
  // Current active step (1 to 10 strictly in order)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ── Step 2: Occasion ──
  const [selectedOccasion, setSelectedOccasion] = useState<
    'birthday' | 'thank-you' | 'congratulations' | 'just-because'
  >('birthday');

  // ── Step 3: Recipient ──
  const [selectedRecipientGroup, setSelectedRecipientGroup] = useState<
    'him' | 'her' | 'family' | 'friend' | 'business'
  >('her');
  const [specificRecipient, setSpecificRecipient] = useState<string>('mum');

  // ── Step 4: Budget ──
  const [selectedBudget, setSelectedBudget] = useState<
    'under-25k' | '25k-50k' | '50k-100k' | 'premium'
  >('25k-50k');

  // ── Step 5 & 6: Selected Product ──
  const [selectedProduct, setSelectedProduct] = useState<GiftItem>(GIFTS_CATALOG[0]);

  // ── Step 7: Personalisation ──
  const [selectedPackaging, setSelectedPackaging] = useState(PACKAGING_OPTIONS[0]);
  const [selectedRibbon, setSelectedRibbon] = useState(RIBBON_COLORS[0]);
  const [giftMessage, setGiftMessage] = useState(
    'Wishing you a season filled with warmth, inspiring moments, and wonderful joy.'
  );
  const [hasMonogram, setHasMonogram] = useState<boolean>(false);
  const [monogramText, setMonogramText] = useState<string>('M.A.B.');
  const [openPersonaliseSection, setOpenPersonaliseSection] = useState<'packaging' | 'ribbon' | 'message' | 'engraving'>('packaging');

  // ── Step 8: Recipient & Delivery Details ──
  const [recipientName, setRecipientName] = useState<string>('Amara Adeyemi');
  const [recipientPhone, setRecipientPhone] = useState<string>('+234 802 987 6543');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    'Plot 28 Admiralty Way, Lekki Phase 1, Lagos'
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    () => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Kindly call before dispatch.');

  // ── Step 9 & 10: Checkout & Confirmation ──
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [orderRefNumber, setOrderRefNumber] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── Step 5 Filtered Gifts Logic ──
  const filteredGifts = useMemo(() => {
    const list = GIFTS_CATALOG.filter((gift) => {
      const matchOccasion = gift.occasions.includes(selectedOccasion);
      const matchRecipientGroup = gift.primaryRecipient === selectedRecipientGroup;
      const matchSub =
        gift.subRecipients &&
        specificRecipient &&
        gift.subRecipients.includes(specificRecipient);
      const matchBudget = gift.budgetTier === selectedBudget;

      return (matchRecipientGroup || matchSub) && (matchOccasion || matchBudget);
    });

    if (list.length > 0) return list;

    // Fallback: Gifts in same budget or recipient group so user is never empty
    const fallbackList = GIFTS_CATALOG.filter(
      (gift) =>
        gift.primaryRecipient === selectedRecipientGroup ||
        gift.budgetTier === selectedBudget
    );
    return fallbackList.length > 0 ? fallbackList : GIFTS_CATALOG.slice(0, 6);
  }, [selectedOccasion, selectedRecipientGroup, specificRecipient, selectedBudget]);

  // Pricing calculations
  const packagingPrice = selectedPackaging.price;
  const monogramPrice = hasMonogram ? 2500 : 0;
  const grandTotal = selectedProduct.price + packagingPrice + monogramPrice;

  // Process checkout
  const handleProceedCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const randDigits = Math.floor(10000 + Math.random() * 90000);
      const ref = `GTC-ORD-${randDigits}`;
      setOrderRefNumber(ref);
      goToStep(10);
      if (onComplete) onComplete(ref);
    }, 750);
  };

  // Step Meta Titles
  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: { title: 'Find a Thoughtful Gift', subtitle: 'Curated gifting concierge for your special occasions' },
    2: { title: 'What’s the occasion?', subtitle: 'Select an occasion to reveal fitting gift curations' },
    3: { title: 'Who is the gift for?', subtitle: 'Select a recipient to find a gift tailored to them' },
    4: { title: 'What’s your budget?', subtitle: 'Select the anticipated investment for this gift' },
    5: { title: 'Browse Curated Gifts', subtitle: 'Gifts selected based on your occasion, recipient, and budget' },
    6: { title: 'Selected Gift Details', subtitle: 'Review the details of your chosen curation' },
    7: { title: 'Personalise Your Gift', subtitle: 'Choose presentation packaging, ribbon finish, and card message' },
    8: { title: 'Add Recipient & Delivery Details', subtitle: 'Specify where and when this gift should be delivered' },
    9: { title: 'Review & Checkout', subtitle: 'Review your complete gift summary before placing your order' },
    10: { title: 'Order Confirmed', subtitle: 'Your thoughtful gift is registered and being handcrafted' },
  };

  // Find recipient group definition
  const currentRecipientGroupDef = RECIPIENTS.find((r) => r.id === selectedRecipientGroup);

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-4xl mx-auto bg-white rounded-3xl border border-brand-dark/10 shadow-[0_12px_40px_rgba(28,20,14,0.06)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* ── Top Header & Subtle Progress Line ── */}
      <div className="bg-[#FAF8F5] border-b border-brand-dark/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600">
              Good Things Co. · Gifting Concierge
            </span>
          </div>

          <div className="flex items-center gap-2 font-sans text-xs">
            <span className="font-bold text-brand-dark">Step {currentStep} of 10</span>
            <span className="text-brand-light">({Math.round((currentStep / 10) * 100)}%)</span>
          </div>
        </div>

        {/* Thin progress line */}
        <div className="w-full bg-brand-dark/10 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-brand-dark h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Step Title & Subtitle */}
        <div className="text-left">
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            {stepMeta[currentStep]?.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-medium/85 mt-1">
            {stepMeta[currentStep]?.subtitle}
          </p>
        </div>
      </div>

      {/* ── Main Dynamic Flow Body: Only Active Step Rendered ── */}
      <div className="p-6 sm:p-8 md:p-10 min-h-[380px] flex flex-col justify-between">
        {/* =========================================================
            STEP 1 — SHOP INTRO
            ========================================================= */}
        {currentStep === 1 && (
          <div key="step-1" className="space-y-6 animate-fade-in text-center sm:text-left py-4">
            <div className="max-w-xl">
              <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold-600 block mb-2">
                Personal Gifting Made Effortless
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-3">
                Find a thoughtful gift.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed mb-6">
                Choose the occasion, who it is for, and your budget, and we’ll help you find suitable gifts.
              </p>
            </div>

            {/* 3 Quick Step Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">🎯</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  1. Guided Discovery
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  Select occasion, recipient, and budget for bespoke suggestions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">✨</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  2. Personalise
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  Pick your packaging, silk ribbon, and handwritten card note.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">📦</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  3. Doorstep Delivery
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  White-glove doorstep delivery direct to recipient or yourself.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto px-9 py-4 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Start Shopping →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2 — CHOOSE AN OCCASION
            ========================================================= */}
        {currentStep === 2 && (
          <div key="step-2" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OCCASIONS.map((occ) => {
                const isSelected = selectedOccasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setSelectedOccasion(occ.id)}
                    className={`p-6 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark ring-1 ring-brand-dark shadow-md'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-1">{occ.label}</h3>
                      <p
                        className={`font-sans text-xs ${
                          isSelected ? 'text-brand-ivory/80' : 'text-brand-medium/70'
                        }`}
                      >
                        {occ.tagline}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500 text-white font-bold'
                          : 'border-brand-dark/20 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3 — CHOOSE RECIPIENT (Progressive Disclosure)
            ========================================================= */}
        {currentStep === 3 && (
          <div key="step-3" className="space-y-6 animate-fade-in">
            {/* Top-Level Choices */}
            <div>
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block mb-3">
                Recipient Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {RECIPIENTS.map((rec) => {
                  const isSelected = selectedRecipientGroup === rec.id;
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipientGroup(rec.id);
                        if (rec.id === 'family') setSpecificRecipient('mum');
                        else if (rec.id === 'business') setSpecificRecipient('colleague');
                        else setSpecificRecipient(rec.id);
                      }}
                      className={`py-3.5 px-3 rounded-2xl text-center border font-sans text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-dark text-brand-ivory border-brand-dark font-bold shadow-2xs ring-1 ring-brand-dark'
                          : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                      }`}
                    >
                      {rec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progressive Disclosure Sub-options */}
            {currentRecipientGroupDef?.hasSuboptions && currentRecipientGroupDef.suboptions && (
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark">
                    Specific {currentRecipientGroupDef.label} Recipient
                  </label>
                  <span className="font-sans text-xs text-gold-700 font-semibold capitalize">
                    {specificRecipient}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentRecipientGroupDef.suboptions.map((sub) => {
                    const isSubSelected = specificRecipient === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSpecificRecipient(sub.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer border ${
                          isSubSelected
                            ? 'bg-brand-dark text-brand-ivory border-brand-dark font-semibold shadow-2xs'
                            : 'bg-white text-brand-dark/80 hover:text-brand-dark border-brand-dark/15 hover:border-brand-dark/30'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STEP 4 — CHOOSE BUDGET
            ========================================================= */}
        {currentStep === 4 && (
          <div key="step-4" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUDGET_TIERS.map((tier) => {
                const isSelected = selectedBudget === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedBudget(tier.id)}
                    className={`p-6 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark ring-1 ring-brand-dark shadow-md'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-1">{tier.label}</h3>
                      <p
                        className={`font-sans text-xs ${
                          isSelected ? 'text-brand-ivory/80' : 'text-brand-medium/70'
                        }`}
                      >
                        {tier.id === 'under-25k' && 'Thoughtful daily rituals & stationery'}
                        {tier.id === '25k-50k' && 'Signature homeware, scents & wellness'}
                        {tier.id === '50k-100k' && 'Timepieces & fine handcrafted leather'}
                        {tier.id === 'premium' && 'Collector hampers & bespoke trunks'}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500 text-white font-bold'
                          : 'border-brand-dark/20 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5 — BROWSE CURATED GIFTS
            ========================================================= */}
        {currentStep === 5 && (
          <div key="step-5" className="space-y-5 animate-fade-in">
            {/* Active Filters Bar with quick edit capability */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-light">
                  Active Filters:
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-brand-dark/10 font-sans text-xs text-brand-dark capitalize">
                  Occasion: {selectedOccasion}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-brand-dark/10 font-sans text-xs text-brand-dark capitalize">
                  Recipient: {specificRecipient || selectedRecipientGroup}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-brand-dark/10 font-sans text-xs text-brand-dark">
                  Budget: {BUDGET_TIERS.find((b) => b.id === selectedBudget)?.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="text-xs font-sans font-semibold text-gold-700 underline hover:text-gold-900 cursor-pointer"
                >
                  Edit Filters
                </button>
              </div>
            </div>

            {/* Controlled Internal Scroll Grid */}
            <div className="max-h-[480px] overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGifts.map((gift) => {
                  const isSelected = selectedProduct.id === gift.id;
                  return (
                    <div
                      key={gift.id}
                      onClick={() => {
                        setSelectedProduct(gift);
                        goToStep(6);
                      }}
                      className={`group rounded-2xl overflow-hidden cursor-pointer transition-all border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-brand-dark ring-2 ring-brand-dark shadow-md'
                          : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream/80">
                        <img
                          src={gift.image}
                          alt={gift.alt}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        {gift.badge && (
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-brand-dark text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                            {gift.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-gold-600 text-white text-[10px] font-sans font-bold shadow-xs">
                            ✓ Selected
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-sans font-semibold uppercase text-gold-600 block mb-0.5">
                            {gift.subtitle}
                          </span>
                          <h4 className="font-serif text-base font-medium text-brand-dark mb-1 line-clamp-1">
                            {gift.title}
                          </h4>
                          <p className="font-sans text-xs text-brand-medium leading-relaxed mb-3 line-clamp-2">
                            {gift.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-brand-dark/10 flex items-center justify-between">
                          <span className="font-serif text-base font-bold text-brand-dark">
                            {gift.formattedPrice}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
                          >
                            Select Gift →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 6 — SELECT GIFT (DETAILS)
            ========================================================= */}
        {currentStep === 6 && (
          <div key="step-6" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Product Image (5 cols) */}
              <div className="md:col-span-5 rounded-2xl overflow-hidden border border-brand-dark/10 bg-[#FAF8F5] aspect-[4/3] sm:aspect-square">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.alt}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Product Editorial Details (7 cols) */}
              <div className="md:col-span-7 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
                    {selectedProduct.subtitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(5)}
                    className="text-xs font-sans text-brand-dark underline font-semibold cursor-pointer"
                  >
                    Change Gift
                  </button>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                  {selectedProduct.title}
                </h3>

                <div className="font-serif text-2xl text-brand-dark font-bold">
                  {selectedProduct.formattedPrice}
                </div>

                <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* What's Included */}
                <div className="pt-2">
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block mb-2">
                    Included in this gift:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.included.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark text-xs font-sans font-medium"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preserved Criteria Summary */}
                <div className="pt-4 border-t border-brand-dark/10 flex flex-wrap gap-2 text-[11px] font-sans text-brand-medium">
                  <span>Occasion: <strong className="text-brand-dark capitalize">{selectedOccasion}</strong></span>
                  <span>·</span>
                  <span>Recipient: <strong className="text-brand-dark capitalize">{specificRecipient || selectedRecipientGroup}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 7 — PERSONALISE YOUR GIFT
            ========================================================= */}
        {currentStep === 7 && (
          <div key="step-7" className="space-y-4 animate-fade-in text-left">
            {/* 1. Packaging Finish */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'packaging' ? 'ribbon' : 'packaging')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Packaging Type</h4>
                    <span className="font-sans text-xs text-brand-medium">
                      {selectedPackaging.name} (+₦{selectedPackaging.price.toLocaleString()})
                    </span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'packaging' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'packaging' && (
                <div className="p-5 border-t border-brand-dark/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                  {PACKAGING_OPTIONS.map((pkg) => {
                    const isSelected = selectedPackaging.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackaging(pkg)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-white border-gold-600 ring-1 ring-gold-600 shadow-2xs'
                            : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif text-xs font-bold text-brand-dark">{pkg.name}</span>
                          <span className="font-sans text-xs text-gold-700 font-semibold">+₦{pkg.price.toLocaleString()}</span>
                        </div>
                        <p className="font-sans text-[11px] text-brand-medium/80 leading-snug">{pkg.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Ribbon Colour */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'ribbon' ? 'message' : 'ribbon')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Ribbon Colour</h4>
                    <span className="font-sans text-xs text-brand-medium">{selectedRibbon.name}</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'ribbon' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'ribbon' && (
                <div className="p-5 border-t border-brand-dark/10 flex flex-wrap gap-2.5 bg-white">
                  {RIBBON_COLORS.map((ribbon) => {
                    const isSelected = selectedRibbon.id === ribbon.id;
                    return (
                      <button
                        key={ribbon.id}
                        type="button"
                        onClick={() => setSelectedRibbon(ribbon)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-brand-dark ring-1 ring-brand-dark shadow-2xs font-semibold'
                            : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: ribbon.hex }}
                        />
                        <span className="text-xs font-sans text-brand-dark">{ribbon.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Add a Message */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'message' ? 'engraving' : 'message')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Handwritten Card Message</h4>
                    <span className="font-sans text-xs text-brand-medium">Calligraphed on archival letterpress card</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'message' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'message' && (
                <div className="p-5 border-t border-brand-dark/10 bg-white">
                  <textarea
                    rows={3}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Write your personal message..."
                    className="w-full p-3.5 rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] font-sans text-brand-light">
                    <span>Complimentary calligraphy card included with every gift</span>
                    <span>{giftMessage.length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Add Personalisation (Engraving) */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'engraving' ? 'packaging' : 'engraving')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Personalisation / Monogram</h4>
                    <span className="font-sans text-xs text-brand-medium">
                      {hasMonogram ? `Engraved: "${monogramText}" (+₦2,500)` : 'Optional custom name or monogram initials'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'engraving' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'engraving' && (
                <div className="p-5 border-t border-brand-dark/10 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-sans text-xs font-bold text-brand-dark">
                        Enable Laser Monogram or Name (+₦2,500)
                      </h5>
                      <p className="font-sans text-xs text-brand-medium">
                        Custom laser-engraved initials or name onto item or gift box plaque.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasMonogram}
                      onChange={(e) => setHasMonogram(e.target.checked)}
                      className="w-5 h-5 rounded accent-brand-dark cursor-pointer"
                    />
                  </div>

                  {hasMonogram && (
                    <div className="pt-2 animate-fade-in">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                        Initials or Full Name
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={monogramText}
                        onChange={(e) => setMonogramText(e.target.value)}
                        placeholder="e.g. M.A.B. or Olabisi"
                        className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-brand-dark/15 text-xs font-sans uppercase tracking-widest font-semibold"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 8 — RECIPIENT & DELIVERY DETAILS
            ========================================================= */}
        {currentStep === 8 && (
          <div key="step-8" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark block">
                Direct Recipient & Delivery Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Amara Adeyemi"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. +234 802 987 6543"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street, Apartment/Suite, City, State"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Preferred Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Call upon arrival, leave with concierge"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 9 — CHECKOUT
            ========================================================= */}
        {currentStep === 9 && (
          <div key="step-9" className="space-y-6 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Order Summary */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Complete Gift Summary
                </span>

                <div className="flex items-center gap-4 pb-3 border-b border-brand-dark/10">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.alt}
                    className="w-16 h-16 object-cover rounded-xl border border-brand-dark/10 bg-white"
                  />
                  <div>
                    <h4 className="font-serif text-base text-brand-dark font-medium">
                      {selectedProduct.title}
                    </h4>
                    <span className="text-xs font-sans text-brand-medium">
                      {selectedProduct.formattedPrice}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-sans text-brand-medium">
                  <div className="flex justify-between">
                    <span>Packaging:</span>
                    <strong className="text-brand-dark">{selectedPackaging.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ribbon Colour:</span>
                    <strong className="text-brand-dark">{selectedRibbon.name}</strong>
                  </div>
                  {hasMonogram && (
                    <div className="flex justify-between">
                      <span>Monogram Engraving:</span>
                      <strong className="text-brand-dark">"{monogramText}"</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <strong className="text-brand-dark">{recipientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Date:</span>
                    <strong className="text-brand-dark">{deliveryDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <strong className="text-brand-dark line-clamp-1">{deliveryAddress}</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Breakdown & Payment Method */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Payment & Total
                </span>

                <div className="space-y-2 text-xs font-sans text-brand-medium pb-4 border-b border-brand-dark/10">
                  <div className="flex justify-between">
                    <span>Base Gift:</span>
                    <span>{selectedProduct.formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{selectedPackaging.name}:</span>
                    <span>+₦{packagingPrice.toLocaleString()}</span>
                  </div>
                  {hasMonogram && (
                    <div className="flex justify-between">
                      <span>Laser Personalisation:</span>
                      <span>+₦{monogramPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>White-Glove Doorstep Delivery:</span>
                    <span className="text-green-700 font-semibold">Complimentary</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-sans text-xs uppercase font-bold text-brand-dark">Grand Total</span>
                  <span className="font-serif text-2xl text-brand-dark font-bold">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* Payment Options Selection */}
                <div className="pt-2 space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-sans text-center transition-all ${
                        paymentMethod === 'card'
                          ? 'border-brand-dark bg-brand-dark text-white font-bold'
                          : 'border-brand-dark/15 bg-[#FAF8F5] text-brand-dark hover:border-brand-dark/30'
                      }`}
                    >
                      Debit / Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 rounded-xl border text-xs font-sans text-center transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-brand-dark bg-brand-dark text-white font-bold'
                          : 'border-brand-dark/15 bg-[#FAF8F5] text-brand-dark hover:border-brand-dark/30'
                      }`}
                    >
                      Bank Transfer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 10 — ORDER CONFIRMATION & TRACKING
            ========================================================= */}
        {currentStep === 10 && (
          <div key="step-10" className="space-y-6 animate-fade-in text-left">
            {/* Confirmation Banner */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Order Confirmed & Processing</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-dark font-normal">
                  Order Reference: #{orderRefNumber}
                </h3>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  Thank you! Your gift for <strong className="text-brand-dark">{recipientName}</strong> is registered.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-sans text-brand-light block">Amount Paid</span>
                <span className="font-serif text-2xl text-gold-700 font-bold">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── 4-Stage Fulfillment Order Tracking ── */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                  Delivery Status Tracker
                </span>
                <span className="text-xs font-sans text-green-700 font-semibold">
                  Status: Preparing Gift
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'conf', label: '1. Confirmed', desc: 'Order verified & queued', done: true, active: false },
                  { id: 'prep', label: '2. Preparing', desc: 'Handcrafted & ribbon tied', done: false, active: true },
                  { id: 'out', label: '3. Out for Delivery', desc: 'Dispatched with courier', done: false, active: false },
                  { id: 'deliv', label: '4. Delivered', desc: 'Signed & gifted', done: false, active: false },
                ].map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-brand-dark/10 bg-[#FAF8F5]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold ${
                          st.done
                            ? 'bg-gold-600 text-white'
                            : st.active
                            ? 'bg-brand-dark text-white ring-2 ring-brand-dark/20 animate-pulse'
                            : 'bg-brand-dark/10 text-brand-dark/40'
                        }`}
                      >
                        {st.done ? '✓' : ''}
                      </div>
                      <span className="font-sans text-xs font-bold text-brand-dark">{st.label}</span>
                    </div>
                    <p className="font-sans text-[11px] text-brand-medium/70 leading-snug">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient & Dispatch Snapshot */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row justify-between gap-4 text-xs font-sans text-brand-medium">
              <div>
                <span className="font-bold text-brand-dark block mb-1">Delivering To:</span>
                <p>{recipientName} · {recipientPhone}</p>
                <p>{deliveryAddress}</p>
              </div>
              <div>
                <span className="font-bold text-brand-dark block mb-1">Target Date:</span>
                <p className="text-gold-700 font-semibold">{deliveryDate}</p>
              </div>
            </div>

            {/* Step 10 Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-dark/10">
              <button
                type="button"
                onClick={() => alert(`Downloading official receipt for order #${orderRefNumber}...`)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-brand-dark/20 text-brand-dark hover:border-brand-dark font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
              >
                📥 Download Order Receipt
              </button>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Start Another Gift Order →
              </button>
            </div>
          </div>
        )}

        {/* ── Persistent Bottom Navigation Controls (Steps 2 to 9) ── */}
        {currentStep > 1 && currentStep < 10 && (
          <div className="pt-6 mt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>← Back</span>
            </button>

            {/* Step Status Pill */}
            <div className="text-xs font-sans text-brand-light hidden sm:block">
              {currentStep === 2 && <span>Occasion: <strong className="text-brand-dark capitalize">{selectedOccasion}</strong></span>}
              {currentStep === 3 && <span>Recipient: <strong className="text-brand-dark capitalize">{specificRecipient || selectedRecipientGroup}</strong></span>}
              {currentStep === 4 && <span>Budget: <strong className="text-brand-dark">{BUDGET_TIERS.find(b => b.id === selectedBudget)?.label}</strong></span>}
              {currentStep === 5 && <span>Selecting Gift</span>}
              {currentStep === 6 && <span>Gift: <strong className="text-brand-dark">{selectedProduct.title}</strong></span>}
              {currentStep === 7 && <span>Total: <strong className="text-brand-dark">₦{grandTotal.toLocaleString()}</strong></span>}
              {currentStep === 8 && <span>Direct Delivery: <strong className="text-brand-dark">{recipientName}</strong></span>}
              {currentStep === 9 && <span>Total to pay: <strong className="text-brand-dark">₦{grandTotal.toLocaleString()}</strong></span>}
            </div>

            {/* Continue Button or Checkout Button */}
            {currentStep === 9 ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProceedCheckout}
                className="w-full sm:w-auto px-10 py-3.5 bg-brand-dark hover:bg-gold-600 text-white font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isProcessing ? 'Processing...' : 'Complete Order & Pay →'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopFlowContainer;
