import React from 'react';
import HeroNav from '../homepage/HeroNav';
import shopHeroImg from './shop-hero4.avif';

interface ShopHeroProps {
  className?: string;
}

/**
 * ShopHero — Everyday Living & Personal Shopping Hero
 *
 * Core Concept:
 * - Editorial, spacious, warm, and calm atmosphere tailored for personal living.
 * - Asymmetrical 2-column layout (Text left ~42%, Large Hero Image right ~58%).
 * - Generous whitespace with zero clutter.
 * - Pure static presentation (animations will be introduced in a future pass).
 */
export const ShopHero: React.FC<ShopHeroProps> = ({ className = '' }) => {
  return (
    <section
      className={`relative w-full min-h-[90vh] bg-[#FAF8F5] text-brand-dark flex flex-col justify-between overflow-hidden ${className}`}
      aria-label="Shop Good Things Co. Hero"
    >
      {/* ── Top Navigation ── */}
      <HeroNav activeItem="Shop" />

      {/* ── Main Editorial Hero Content ── */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20 py-8 sm:py-12 md:py-16 lg:py-20 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-14 lg:gap-16 items-center">
          
          {/* ── Left Column: Typography & Action (~42% on desktop) ── */}
          <div className="lg:col-span-5 flex flex-col items-start text-left z-10">
            {/* Editorial Eyebrow */}
            <span className="font-sans text-xs sm:text-[13px] font-semibold tracking-[0.24em] uppercase text-brand-light/90 mb-4 sm:mb-6 block">
              Curated Gift Shop
            </span>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.1rem] leading-[1.08] tracking-[-0.015em] text-brand-dark font-normal">
              Curated gifts for meaningful moments.
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 sm:mt-8 font-sans text-base sm:text-lg text-brand-medium/90 font-light leading-relaxed max-w-md">
              Thoughtful pieces and distinctive objects chosen for the people and occasions that matter.
            </p>

            {/* Single Call to Action */}
            <div className="mt-8 sm:mt-10">
              <a
                href="#categories"
                className="btn-primary inline-flex items-center gap-3 px-8 sm:px-10 py-4 shadow-soft hover:shadow-premium transition-all duration-300 cursor-pointer"
                aria-label="Shop All Gifts"
              >
                <span>Shop All Gifts</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>

          {/* ── Right Column: Large Hero Image (~58% on desktop) ── */}
          <div className="lg:col-span-7 relative w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl lg:max-w-none overflow-hidden rounded-none shadow-hero bg-[#F2EDE4]/50">
              {/* Warm Ambient Backlight Glow */}
              <div
                className="absolute -inset-4 opacity-40 blur-2xl pointer-events-none -z-10"
                style={{
                  background: 'radial-gradient(circle at 60% 40%, rgba(212, 175, 55, 0.18), transparent 70%)',
                }}
                aria-hidden="true"
              />

              <img
                src={shopHeroImg}
                alt="Good Things Co. Everyday Living Collection"
                className="w-full h-auto object-cover max-h-[640px] lg:max-h-[700px] block select-none"
                loading="eager"
                draggable={false}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Subtle Bottom Baseline Border ── */}
      <div className="w-full border-b border-brand-dark/5" />
    </section>
  );
};

export default ShopHero;
