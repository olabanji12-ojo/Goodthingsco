import React from 'react';

interface AboutHeroProps {
  className?: string;
}

/**
 * AboutHero — Section 1: Hero
 *
 * Core brand positioning:
 * "Thoughtful gifts for inspired living."
 *
 * Supporting introduction:
 * "Good Things Co. is a curated gifting brand focused on helping people and organisations give more thoughtfully."
 */
export const AboutHero: React.FC<AboutHeroProps> = ({ className = '' }) => {
  return (
    <header className={`w-full text-center max-w-3xl mx-auto pt-4 pb-10 sm:pb-14 ${className}`}>
      {/* Editorial Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50/80 border border-gold-200/50 mb-3 sm:mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
        <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700">
          About Good Things Co.
        </span>
      </div>

      {/* Main Brand Statement Headline */}
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-brand-dark font-normal tracking-tight leading-tight mb-4 sm:mb-5">
        Thoughtful gifts for inspired living
      </h1>

      {/* Supporting Copy */}
      <p className="font-sans text-xs sm:text-sm md:text-base text-brand-medium/90 max-w-xl mx-auto leading-relaxed">
        Good Things Co. is a curated gifting brand focused on helping people and organisations give more thoughtfully.
      </p>

      {/* Understated Divider Line */}
      <div className="w-12 h-px bg-brand-dark/20 mx-auto mt-6 sm:mt-8" />
    </header>
  );
};

export default AboutHero;
