import React, { useState } from 'react';
import { GIFT_FILTERS } from './lookbookData';
import { GiftFilterItem } from './types';

interface RoomGiftsProps {
  onNavigateToRoom: (index: number) => void;
}

type GiftLens = 'occasion' | 'recipient' | 'corporate';

/**
 * RoomGifts — Room 03: GIFTS ("For Someone")
 *
 * 3 intuitive gifting lenses:
 * 1. By Occasion: Birthday · Congratulations · Appreciation · Celebrations · Just Because
 * 2. By Recipient: Her · Him · Family · Friends · Colleagues · Clients
 * 3. Corporate: Corporate Gifts · Client Gifts · Staff Gifts · Events
 */
export const RoomGifts: React.FC<RoomGiftsProps> = ({ onNavigateToRoom }) => {
  const [activeLens, setActiveLens] = useState<GiftLens>('occasion');
  const [selectedItemId, setSelectedItemId] = useState<string>('occ-birthday');

  // Filter items matching active lens
  const currentLensItems = GIFT_FILTERS.filter((item: GiftFilterItem) => item.lens === activeLens);

  // Active selected item
  const activeItem =
    currentLensItems.find((item: GiftFilterItem) => item.id === selectedItemId) ||
    currentLensItems[0] ||
    GIFT_FILTERS[0];

  const handleLensChange = (lens: GiftLens) => {
    setActiveLens(lens);
    const firstOfLens = GIFT_FILTERS.find((item: GiftFilterItem) => item.lens === lens);
    if (firstOfLens) {
      setSelectedItemId(firstOfLens.id);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto bg-[#FAF8F5]">
      {/* ── Top Header ── */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-dark/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">
                03 · The Gifting Suite
              </span>
              <span className="text-brand-dark/20">•</span>
              <span className="font-sans text-xs uppercase tracking-wider text-brand-medium">
                Shopping For Someone
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
              Find the right gift with intention.
            </h2>
          </div>

          {/* 3 Master Lenses (Occasion · Recipient · Corporate) */}
          <div className="flex items-center bg-white border border-brand-dark/15 p-1">
            <button
              type="button"
              onClick={() => handleLensChange('occasion')}
              className={`px-3.5 py-1.5 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                activeLens === 'occasion'
                  ? 'bg-brand-dark text-brand-ivory font-semibold'
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              By Occasion
            </button>
            <button
              type="button"
              onClick={() => handleLensChange('recipient')}
              className={`px-3.5 py-1.5 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                activeLens === 'recipient'
                  ? 'bg-brand-dark text-brand-ivory font-semibold'
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              By Recipient
            </button>
            <button
              type="button"
              onClick={() => handleLensChange('corporate')}
              className={`px-3.5 py-1.5 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                activeLens === 'corporate'
                  ? 'bg-brand-dark text-brand-ivory font-semibold'
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              Corporate & Teams
            </button>
          </div>
        </div>

        {/* ── Sub-Filter Pills for Selected Lens ── */}
        <div className="mt-4 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2">
            {currentLensItems.map((item: GiftFilterItem) => {
              const isSelected = item.id === activeItem.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`px-3.5 py-1.5 text-xs font-sans tracking-wide transition-all rounded-full cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-gold-100 text-brand-dark font-semibold border border-gold-300'
                      : 'bg-white/70 hover:bg-white text-brand-dark/70 hover:text-brand-dark border border-brand-dark/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Center Stage: Focused Gift Showcase Card ── */}
      <div className="max-w-6xl mx-auto w-full my-auto py-2">
        <div className="bg-white border border-brand-dark/15 grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xs">
          {/* Visual Showcase (Left/Top) */}
          <div className="lg:col-span-6 bg-[#F4F0EA] p-8 sm:p-12 flex items-center justify-center relative min-h-[300px] lg:min-h-[420px]">
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-brand-dark border border-brand-dark/10">
              Curated Gift Set
            </div>
            <img
              src={activeItem.image}
              alt={activeItem.title}
              className="max-h-[300px] sm:max-h-[360px] w-auto object-contain drop-shadow-[0_15px_25px_rgba(28,20,14,0.12)] transform hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Details & Customization (Right) */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold-600 font-semibold">
                  {activeItem.label}
                </span>
                <span className="font-sans text-sm font-bold text-brand-dark bg-brand-dark/5 px-2.5 py-0.5 rounded-full">
                  {activeItem.priceRange}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-2">
                {activeItem.title}
              </h3>
              <p className="font-sans text-xs text-brand-light italic mb-4">
                {activeItem.subtitle}
              </p>

              <p className="font-sans text-sm text-brand-medium leading-relaxed mb-6">
                {activeItem.description}
              </p>

              {/* What's Included */}
              <div className="border-t border-brand-dark/10 pt-4 mb-6">
                <h4 className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-dark mb-2.5">
                  Curated Inclusions:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-brand-medium">
                  {activeItem.items.map((included, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-gold-600">✦</span>
                      <span>{included}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-brand-dark/70 font-medium">
                    <span className="text-gold-600">✦</span>
                    <span>Handwritten wax-sealed note</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-brand-dark/10">
              <a
                href="/gifts"
                className="w-full sm:w-auto flex-1 py-3 px-6 bg-brand-dark hover:bg-gold-600 text-brand-ivory text-center font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer"
              >
                Explore & Customize This Set
              </a>
              <button
                type="button"
                onClick={() => onNavigateToRoom(4)}
                className="w-full sm:w-auto py-3 px-5 border border-brand-dark/20 hover:border-brand-dark text-brand-dark text-center font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer"
              >
                Bespoke Option →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Link ── */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-brand-dark/10 flex items-center justify-between text-xs text-brand-medium">
        <span>Worldwide shipping & personalized gift messaging included at checkout.</span>
        <button
          type="button"
          onClick={() => onNavigateToRoom(3)}
          className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark hover:text-gold-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Next: Explore Event Souvenirs (Room 04)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default RoomGifts;
