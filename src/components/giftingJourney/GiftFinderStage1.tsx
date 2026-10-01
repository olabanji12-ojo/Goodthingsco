import React, { useState, useMemo } from 'react';
import {
  OCCASIONS,
  RECIPIENTS,
  BUDGET_TIERS,
  GIFTS_CATALOG,
  GiftItem,
} from '../../data/giftsData';

interface GiftFinderStage1Props {
  onSelectGift: (gift: GiftItem) => void;
  className?: string;
}

export const GiftFinderStage1: React.FC<GiftFinderStage1Props> = ({
  onSelectGift,
  className = '',
}) => {
  // State for selections
  const [selectedOccasion, setSelectedOccasion] = useState<string>('birthday');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('her');
  const [selectedSubRecipient, setSelectedSubRecipient] = useState<string>('mum');
  const [selectedBudget, setSelectedBudget] = useState<string>('25k-50k');
  const [hasSearched, setHasSearched] = useState<boolean>(true);

  // Progressive disclosure config
  const currentRecipientGroup = useMemo(() => {
    return RECIPIENTS.find((r) => r.id === selectedRecipient);
  }, [selectedRecipient]);

  // When switching to family or business, set default sub-recipient
  const handleRecipientChange = (recId: string) => {
    setSelectedRecipient(recId);
    if (recId === 'family') {
      setSelectedSubRecipient('mum');
    } else if (recId === 'business') {
      setSelectedSubRecipient('colleague');
    } else {
      setSelectedSubRecipient('');
    }
  };

  // Filter gifts based on selections
  const filteredGifts = useMemo(() => {
    return GIFTS_CATALOG.filter((gift) => {
      // Occasion filter (soft matching for maximum variety)
      const matchesOccasion =
        !selectedOccasion || gift.occasions.includes(selectedOccasion as any);

      // Recipient filter
      let matchesRecipient = false;
      if (!selectedRecipient) {
        matchesRecipient = true;
      } else if (gift.primaryRecipient === selectedRecipient) {
        matchesRecipient = true;
      } else if (selectedRecipient === 'self') {
        matchesRecipient =
          gift.primaryRecipient === 'self' ||
          Boolean(gift.subRecipients && gift.subRecipients.includes('self'));
      } else if (
        selectedSubRecipient &&
        gift.subRecipients.includes(selectedSubRecipient)
      ) {
        matchesRecipient = true;
      } else if (gift.primaryRecipient === 'family' && selectedRecipient === 'her') {
        matchesRecipient = true;
      }

      // Budget filter
      let matchesBudget = true;
      if (selectedBudget) {
        matchesBudget = gift.budgetTier === selectedBudget;
      }

      return matchesOccasion && matchesRecipient && matchesBudget;
    });
  }, [selectedOccasion, selectedRecipient, selectedSubRecipient, selectedBudget]);

  // Fallback to show related gifts if strict filters yield zero
  const displayGifts = useMemo(() => {
    if (filteredGifts.length > 0) return filteredGifts;
    // Show gifts matching budget or occasion
    return GIFTS_CATALOG.filter(
      (g) =>
        g.budgetTier === selectedBudget ||
        g.primaryRecipient === selectedRecipient ||
        (selectedRecipient === 'self' && g.subRecipients?.includes('self')) ||
        (selectedOccasion && g.occasions.includes(selectedOccasion as any))
    ).slice(0, 4);
  }, [filteredGifts, selectedBudget, selectedRecipient, selectedOccasion]);

  const handleShowMeGifts = () => {
    setHasSearched(true);
    const resultsEl = document.getElementById('curated-gift-results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="find-a-gift"
      className={`relative w-full bg-[#FAF8F5] py-16 sm:py-20 md:py-24 border-t border-brand-dark/5 ${className}`}
      aria-label="Stage 1 — Find A Gift Concierge"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        {/* ── Section Title & Header ── */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-gold-600 block mb-2">
            Stage 1 · Guided Discovery
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight mb-3">
            Find the Right Gift
          </h2>
          <p className="font-sans text-sm sm:text-base text-brand-medium/90 font-light leading-relaxed">
            Select the occasion, recipient, and budget to immediately reveal curated, presentation-ready pieces.
          </p>
        </div>

        {/* ── Single Compact Discovery Console ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-brand-dark/10 shadow-[0_12px_40px_rgba(28,20,14,0.06)] max-w-4xl mx-auto">
          {/* ── 1. Occasion Selector ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-dark flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-dark text-brand-ivory text-[10px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select Occasion</span>
              </label>
              <span className="text-[11px] font-sans text-brand-light italic">
                {OCCASIONS.find((o) => o.id === selectedOccasion)?.tagline}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {OCCASIONS.map((occ) => {
                const isSelected = selectedOccasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setSelectedOccasion(occ.id)}
                    className={`py-3 px-3.5 rounded-xl font-sans text-xs font-medium tracking-wide transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-sm'
                        : 'bg-[#FAF8F5] text-brand-dark/80 hover:text-brand-dark border-brand-dark/10 hover:border-brand-dark/30'
                    }`}
                  >
                    {occ.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Recipient Selector with Progressive Disclosure ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-dark flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-dark text-brand-ivory text-[10px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>Who Is It For?</span>
              </label>
              {currentRecipientGroup?.hasSuboptions && selectedSubRecipient && (
                <span className="text-[11px] font-sans text-gold-600 font-medium">
                  Relationship: {selectedSubRecipient.charAt(0).toUpperCase() + selectedSubRecipient.slice(1)}
                </span>
              )}
            </div>

            {/* Top-Level Recipient Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-3">
              {RECIPIENTS.map((rec) => {
                const isSelected = selectedRecipient === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleRecipientChange(rec.id)}
                    className={`py-3 px-3 rounded-xl font-sans text-xs font-medium tracking-wide transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-sm'
                        : 'bg-[#FAF8F5] text-brand-dark/80 hover:text-brand-dark border-brand-dark/10 hover:border-brand-dark/30'
                    }`}
                  >
                    <span>{rec.label}</span>
                    {rec.hasSuboptions && <span className="ml-1 text-[10px] opacity-70">▾</span>}
                  </button>
                );
              })}
            </div>

            {/* Progressive Disclosure Sub-Pills (Family or Business) */}
            {currentRecipientGroup?.hasSuboptions && currentRecipientGroup.suboptions && (
              <div className="mt-3 p-4 bg-[#FAF8F5] rounded-2xl border border-brand-dark/10 animate-fade-in">
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-brand-light block mb-2.5">
                  Select specific {currentRecipientGroup.label.toLowerCase()} relationship:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentRecipientGroup.suboptions.map((sub) => {
                    const isSubSelected = selectedSubRecipient === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubRecipient(sub.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer border ${
                          isSubSelected
                            ? 'bg-gold-600 text-brand-ivory border-gold-600 font-semibold shadow-2xs'
                            : 'bg-white text-brand-dark/75 hover:text-brand-dark border-brand-dark/10 hover:border-brand-dark/30'
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

          {/* ── 3. Budget Selector ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-dark flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-dark text-brand-ivory text-[10px] flex items-center justify-center font-bold">
                  3
                </span>
                <span>Select Budget</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BUDGET_TIERS.map((tier) => {
                const isSelected = selectedBudget === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedBudget(tier.id)}
                    className={`py-3 px-3 rounded-xl font-sans text-xs font-medium tracking-wide transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark shadow-sm'
                        : 'bg-[#FAF8F5] text-brand-dark/80 hover:text-brand-dark border-brand-dark/10 hover:border-brand-dark/30'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Action Bar: "Show Me Gifts" Button ── */}
          <div className="pt-4 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-sans text-brand-medium text-center sm:text-left">
              Found <strong className="text-brand-dark font-semibold">{displayGifts.length} curated gifts</strong> matching your choices.
            </div>

            <button
              type="button"
              onClick={handleShowMeGifts}
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 bg-gold-600 hover:bg-gold-700 text-brand-ivory font-sans text-xs font-semibold tracking-[0.2em] uppercase rounded-xl transition-all shadow-[0_4px_20px_rgba(200,157,92,0.3)] hover:shadow-[0_6px_25px_rgba(200,157,92,0.4)] cursor-pointer"
            >
              <span>Show Me Gifts</span>
              <span className="ml-2 text-sm" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* ── Curated Results Display ── */}
        {hasSearched && (
          <div id="curated-gift-results" className="mt-16 sm:mt-20">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-dark/10">
              <div>
                <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-gold-600 block mb-1">
                  Hand-Picked Results
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                  Curated For You
                </h3>
              </div>
              <span className="font-sans text-xs text-brand-medium">
                {displayGifts.length} pieces available
              </span>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
              {displayGifts.map((gift) => (
                <div
                  key={gift.id}
                  className="group flex flex-col justify-between bg-white rounded-2xl overflow-hidden border border-brand-dark/10 shadow-[0_8px_25px_rgba(28,20,14,0.05)] hover:shadow-[0_20px_45px_rgba(28,20,14,0.12)] transition-all duration-500 ease-premium"
                >
                  {/* Media */}
                  <div className="relative aspect-[4/4.2] overflow-hidden bg-brand-cream/80">
                    <img
                      src={gift.image}
                      alt={gift.alt}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-105"
                    />
                    {gift.badge && (
                      <div className="absolute top-3.5 left-3.5 bg-brand-dark text-brand-ivory text-[9px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        {gift.badge}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5 flex flex-col justify-between flex-1 bg-[#FAF8F5]">
                    <div>
                      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-600 block mb-1">
                        {gift.subtitle}
                      </span>
                      <h4 className="font-serif text-xl text-brand-dark font-normal tracking-tight mb-2 line-clamp-1 group-hover:text-gold-700 transition-colors">
                        {gift.title}
                      </h4>
                      <p className="font-sans text-xs text-brand-medium/80 leading-relaxed line-clamp-2 mb-3">
                        {gift.description}
                      </p>
                      <div className="font-serif text-lg text-brand-dark font-medium mb-4">
                        {gift.formattedPrice}
                      </div>
                    </div>

                    {/* Stage 2 Trigger CTA */}
                    <button
                      type="button"
                      onClick={() => onSelectGift(gift)}
                      className="w-full py-3 px-4 rounded-xl bg-brand-dark hover:bg-gold-600 text-brand-ivory font-sans text-xs font-semibold tracking-[0.14em] uppercase transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Personalise & Order</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GiftFinderStage1;
