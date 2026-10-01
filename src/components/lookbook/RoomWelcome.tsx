import React, { useState } from 'react';
import giftHeroImg from '../../assets/gift-hero.png';
import { TEASER_PRODUCTS } from './lookbookData';
import { TeaserProduct } from './types';

interface RoomWelcomeProps {
  onNavigateToRoom: (index: number) => void;
}

/**
 * RoomWelcome — Room 01: Welcome & First Look
 *
 * Core positioning: "Thoughtful gifts for inspired living."
 * Customer choices:
 * - Buy something for yourself → Shop (Room 02)
 * - Find a thoughtful gift → Gifts (Room 03)
 * - Create something special → Create (Room 05)
 *
 * Early product sneak-peek shelf docked at bottom.
 */
export const RoomWelcome: React.FC<RoomWelcomeProps> = ({ onNavigateToRoom }) => {
  const [selectedTeaser, setSelectedTeaser] = useState<TeaserProduct | null>(null);

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto lg:overflow-hidden bg-[#FAF8F5]">
      {/* ── Background Ambient Light ── */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-b from-white/95 via-gold-100/20 to-transparent blur-3xl pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* ── Center Stage: Editorial Headline & Hero Object ── */}
      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto pt-4 pb-6">
        {/* Left Column: Positioning & Clear Customer Pathways */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-dark/5 border border-brand-dark/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-medium">
              Curated World of Gifting
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[3.85rem] text-brand-dark font-normal tracking-tight leading-[1.08] mb-5">
            Thoughtful gifts{' '}
            <span className="italic font-light text-brand-dark/90 block sm:inline">
              for inspired living.
            </span>
          </h1>

          <p className="font-sans text-sm sm:text-base text-brand-medium/90 max-w-lg mb-8 leading-relaxed">
            Beautiful objects crafted for giving, living and celebrating. Move through our curated rooms to discover the collection or craft something bespoke.
          </p>

          {/* 3 Clear Customer Choices */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateToRoom(1)}
              className="inline-flex items-center justify-between sm:justify-center gap-3 px-5 py-3 rounded-none bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-[0.16em] uppercase transition-all duration-300 shadow-xs cursor-pointer group"
            >
              <span>Shop for Yourself</span>
              <span className="text-gold-300 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToRoom(2)}
              className="inline-flex items-center justify-between sm:justify-center gap-3 px-5 py-3 rounded-none bg-white hover:bg-brand-dark/5 text-brand-dark border border-brand-dark/20 hover:border-brand-dark/40 font-sans text-xs font-semibold tracking-[0.16em] uppercase transition-all duration-300 cursor-pointer group"
            >
              <span>Find a Gift</span>
              <span className="text-brand-dark/50 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToRoom(4)}
              className="inline-flex items-center justify-between sm:justify-center gap-3 px-5 py-3 rounded-none bg-white hover:bg-brand-dark/5 text-brand-dark border border-brand-dark/20 hover:border-brand-dark/40 font-sans text-xs font-semibold tracking-[0.16em] uppercase transition-all duration-300 cursor-pointer group"
            >
              <span>Create Something Special</span>
              <span className="text-brand-dark/50 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Right Column: Hero Visual Focal Point */}
        <div className="lg:col-span-6 flex justify-center items-center relative">
          <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] aspect-4/3 flex items-center justify-center">
            {/* Ambient halo behind box */}
            <div className="absolute inset-0 bg-gradient-to-tr from-gold-100/40 via-white/80 to-transparent rounded-full blur-2xl pointer-events-none" />
            <img
              src={giftHeroImg}
              alt="Curated Good Things Co. signature gift box"
              className="relative z-10 w-full h-auto max-h-[360px] sm:max-h-[420px] object-contain drop-shadow-[0_20px_35px_rgba(28,20,14,0.12)] transform hover:scale-[1.02] transition-transform duration-500 pointer-events-none select-none"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Fold: Sneak-Peek Product Teaser Shelf ── */}
      <div className="relative z-20 w-full max-w-6xl mx-auto pt-4 border-t border-brand-dark/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-brand-dark">
              First Look Teaser
            </span>
            <span className="text-brand-dark/30">|</span>
            <span className="font-sans text-xs text-brand-medium/80">
              Selected pieces from our 7 shop categories
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToRoom(1)}
            className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark hover:text-gold-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore All 24+ Pieces in Room 02</span>
            <span>→</span>
          </button>
        </div>

        {/* Horizontal Mini Cards Shelf */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TEASER_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setSelectedTeaser(prod)}
              className="group bg-white/70 hover:bg-white border border-brand-dark/10 hover:border-brand-dark/25 p-3 rounded-none transition-all duration-300 flex items-center gap-3 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-[#F4F0EA] flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-brand-light font-medium truncate">
                    {prod.category}
                  </span>
                  {prod.badge && (
                    <span className="text-[9px] px-1 py-0.2 bg-gold-50 text-gold-700 font-semibold uppercase tracking-wider rounded-xs">
                      {prod.badge}
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-xs text-brand-dark font-medium truncate group-hover:text-gold-700 transition-colors">
                  {prod.name}
                </h4>
                <p className="font-sans text-xs font-semibold text-brand-dark mt-0.5">
                  {prod.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal for Teaser Item Quick View ── */}
      {selectedTeaser && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTeaser(null)}
        >
          <div
            className="bg-white max-w-md w-full p-6 shadow-2xl border border-brand-dark/15 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTeaser(null)}
              className="absolute top-4 right-4 text-brand-dark/60 hover:text-brand-dark p-1"
              aria-label="Close Preview"
            >
              ✕
            </button>

            <div className="w-full h-48 bg-[#F4F0EA] flex items-center justify-center p-4 mb-4">
              <img
                src={selectedTeaser.image}
                alt={selectedTeaser.name}
                className="max-h-full object-contain"
              />
            </div>

            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-gold-600 block mb-1">
              {selectedTeaser.category} · {selectedTeaser.badge || 'Curated'}
            </span>
            <h3 className="font-serif text-2xl text-brand-dark font-normal mb-2">
              {selectedTeaser.name}
            </h3>
            <p className="font-sans text-sm text-brand-medium/90 mb-4 leading-relaxed">
              {selectedTeaser.description}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-brand-dark/10">
              <span className="font-sans text-lg font-bold text-brand-dark">
                {selectedTeaser.price}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeaser(null);
                  onNavigateToRoom(1);
                }}
                className="px-5 py-2.5 bg-brand-dark text-brand-ivory font-sans text-xs font-semibold tracking-wider uppercase hover:bg-gold-600 transition-colors"
              >
                Go to Shop (Room 02) →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomWelcome;
