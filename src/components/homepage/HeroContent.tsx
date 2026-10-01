import React from 'react';

interface HeroContentProps {
  className?: string;
}

/**
 * HeroContent — Center Upper Editorial Typography & Primary CTA
 *
 * Content:
 * - Headline: "Thoughtful gifts for inspired living." (split lines with mask container)
 * - Supporting copy: "Beautiful things for giving, living and celebrating."
 * - Single Primary CTA: "Explore the Collection"
 *
 * Scoped data attributes for GSAP timeline animation:
 * - data-hero-element="content-block"
 * - data-hero-element="headline"
 * - data-hero-element="headline-line-1"
 * - data-hero-element="headline-line-2"
 * - data-hero-element="subtext"
 * - data-hero-element="cta-container"
 * - data-hero-element="primary-cta"
 */
export const HeroContent: React.FC<HeroContentProps> = ({ className = '' }) => {
  return (
    <div
      className={`text-center px-6 md:px-12 max-w-4xl mx-auto flex flex-col items-center z-20 ${className}`}
      data-hero-element="content-block"
    >
      {/* ── Main Headline as Single Unbroken Straight Line ── */}
      <h1
        className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[3.2rem] xl:text-[3.65rem] text-brand-dark font-normal tracking-tight leading-tight mb-5 md:mb-6 max-w-5xl mx-auto"
        data-hero-element="headline"
      >
        <div className="overflow-hidden py-1" aria-hidden="false">
          <span
            className="block will-change-transform whitespace-normal md:whitespace-nowrap"
            data-hero-element="headline-line-1"
          >
            Thoughtful gifts <span className="italic font-light text-brand-dark/95">for inspired living.</span>
          </span>
        </div>
      </h1>

      {/* ── Supporting Subtitle ── */}
      <p
        className="font-sans text-sm sm:text-base md:text-lg text-brand-medium/90 font-normal max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed tracking-wide will-change-transform"
        data-hero-element="subtext"
      >
        Curated gifts and thoughtful objects chosen for the people, occasions, and moments that matter.
      </p>

      {/* ── Primary & Secondary Gift CTAs ── */}
      <div
        data-hero-element="cta-container"
        className="will-change-transform flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
      >
        <a
          href="#find-a-gift"
          onClick={(e) => {
            const el = document.getElementById('find-a-gift');
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="btn-primary inline-flex items-center justify-center px-9 py-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase bg-brand-dark text-brand-ivory hover:bg-gold-600 hover:text-brand-ivory transition-all duration-300 shadow-[0_4px_20px_rgba(28,20,14,0.12)] cursor-pointer"
          data-hero-element="primary-cta"
        >
          Find a Gift
        </a>
        <a
          href="#create-special"
          onClick={(e) => {
            const el = document.getElementById('create-special');
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center justify-center px-8 py-4 font-sans text-xs font-semibold tracking-[0.18em] uppercase bg-white/70 hover:bg-white text-brand-dark border border-brand-dark/15 hover:border-brand-dark/30 transition-all duration-300 shadow-2xs hover:shadow-xs cursor-pointer"
        >
          Custom Gifting →
        </a>
      </div>
    </div>
  );
};

export default HeroContent;
