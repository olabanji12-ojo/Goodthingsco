import React from 'react';
import { Link } from 'react-router-dom';

interface AboutFinalCtaProps {
  className?: string;
}

/**
 * AboutFinalCta — Section 6: Final CTA
 *
 * Simple gifting-focused conclusion:
 * Headline: "Find something thoughtful."
 * Clear buttons: Shop Gifts | Explore Corporate
 */
export const AboutFinalCta: React.FC<AboutFinalCtaProps> = ({ className = '' }) => {
  return (
    <section
      aria-label="Find Something Thoughtful"
      className={`w-full max-w-4xl mx-auto mb-16 sm:mb-20 md:mb-24 p-8 sm:p-12 md:p-16 bg-white rounded-3xl border border-brand-dark/10 shadow-xs text-center ${className}`}
    >
      <div className="max-w-xl mx-auto">
        {/* Subtle Eyebrow */}
        <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700 block mb-3">
          Begin Your Gifting Journey
        </span>

        {/* Main Headline */}
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight mb-4">
          Find something thoughtful.
        </h2>

        {/* Supporting Copy */}
        <p className="font-sans text-xs sm:text-sm md:text-base text-brand-medium/90 leading-relaxed mb-8 sm:mb-10">
          Whether celebrating an intimate personal moment or coordinating memorable gifts across your organisation, we are here to help you give with intention.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 shadow-sm cursor-pointer"
          >
            Shop Gifts
          </Link>

          <Link
            to="/corporate"
            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-brand-dark/20 text-brand-dark hover:border-brand-dark hover:bg-black/5 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer"
          >
            Explore Corporate
          </Link>
        </div>

        {/* Brand Tagline */}
        <span className="font-serif italic text-xs text-brand-light block mt-8">
          Thoughtful gifts for inspired living.
        </span>
      </div>
    </section>
  );
};

export default AboutFinalCta;
