import React, { useState } from 'react';
import { SOUVENIR_PACKAGES } from './lookbookData';
import { SouvenirPackage } from './types';

interface RoomSouvenirsProps {
  onNavigateToRoom: (index: number) => void;
}

/**
 * RoomSouvenirs — Room 04: SOUVENIRS ("For an Occasion/Event")
 *
 * Dedicated section for souvenirs organised around:
 * 1. Weddings
 * 2. Birthdays
 * 3. Funerals
 * 4. Celebrations / Events
 */
export const RoomSouvenirs: React.FC<RoomSouvenirsProps> = ({ onNavigateToRoom }) => {
  const [activeEvent, setActiveEvent] = useState<string>('weddings');
  const [inquirySent, setInquirySent] = useState<boolean>(false);

  const activePackage =
    SOUVENIR_PACKAGES.find((pkg: SouvenirPackage) => pkg.event === activeEvent) ||
    SOUVENIR_PACKAGES[0];

  const handleInquiry = () => {
    setInquirySent(true);
    setTimeout(() => setInquirySent(false), 3000);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto bg-[#FAF8F5]">
      {/* ── Top Header ── */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-dark/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">
                04 · Milestone Keepsakes
              </span>
              <span className="text-brand-dark/20">•</span>
              <span className="font-sans text-xs uppercase tracking-wider text-brand-medium">
                For An Occasion / Event
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
              Event souvenirs that guests cherish.
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm text-brand-medium/90 max-w-sm leading-relaxed">
            Move past disposable trinkets. Discover bespoke event tokens, wedding favors, and memorial keepsakes made with enduring materials.
          </p>
        </div>

        {/* ── 4 Event Category Selector Tabs ── */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {SOUVENIR_PACKAGES.map((pkg: SouvenirPackage) => {
            const isActive = pkg.event === activeEvent;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setActiveEvent(pkg.event)}
                className={`px-5 py-2 text-xs font-sans uppercase tracking-[0.16em] transition-all rounded-none cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs'
                    : 'bg-white/80 hover:bg-white text-brand-dark/70 hover:text-brand-dark border border-brand-dark/15 font-medium'
                }`}
              >
                {pkg.event === 'celebrations' ? 'Celebrations & Events' : pkg.event}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center Stage: Active Souvenir Package Card ── */}
      <div className="max-w-6xl mx-auto w-full my-auto py-2">
        <div className="bg-white border border-brand-dark/15 grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xs">
          {/* Visual Showcase */}
          <div className="lg:col-span-5 bg-[#F4F0EA] p-8 sm:p-10 flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="absolute top-4 left-4 bg-brand-dark text-brand-ivory px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wider">
              {activePackage.event.toUpperCase()}
            </div>
            <img
              src={activePackage.image}
              alt={activePackage.title}
              className="max-h-[260px] sm:max-h-[300px] w-auto object-contain drop-shadow-[0_15px_25px_rgba(28,20,14,0.12)]"
            />
            <span className="font-sans text-xs font-semibold text-brand-dark mt-4 bg-white/90 px-3 py-1 border border-brand-dark/10">
              {activePackage.startingPrice}
            </span>
          </div>

          {/* Details & Features */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold-600 font-semibold">
                  Event Curation
                </span>
                <span className="text-brand-dark/30">|</span>
                <span className="font-sans text-xs text-brand-medium">
                  {activePackage.subtitle}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-3">
                {activePackage.title}
              </h3>

              <p className="font-sans text-sm text-brand-medium leading-relaxed mb-6">
                {activePackage.description}
              </p>

              {/* Service Features */}
              <div className="bg-[#FAF8F5] p-4 sm:p-5 border border-brand-dark/10 mb-6">
                <h4 className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-dark mb-3">
                  Included In Every Event Order:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-sans text-brand-dark/80">
                  {activePackage.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-gold-600 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-brand-dark/10">
              <button
                type="button"
                onClick={handleInquiry}
                className="w-full sm:w-auto flex-1 py-3 px-6 bg-brand-dark hover:bg-gold-600 text-brand-ivory text-center font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer"
              >
                {inquirySent ? '✓ Request Sent To Studio' : 'Request Event Proposal'}
              </button>
              <button
                type="button"
                onClick={() => onNavigateToRoom(4)}
                className="w-full sm:w-auto py-3 px-5 border border-brand-dark/20 hover:border-brand-dark text-brand-dark text-center font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer"
              >
                Need Custom Packaging? →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Link ── */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-brand-dark/10 flex items-center justify-between text-xs text-brand-medium">
        <span>Order turnaround: typically 2–3 weeks with rush options available.</span>
        <button
          type="button"
          onClick={() => onNavigateToRoom(4)}
          className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark hover:text-gold-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Next: Create Custom & Bespoke (Room 05)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default RoomSouvenirs;
