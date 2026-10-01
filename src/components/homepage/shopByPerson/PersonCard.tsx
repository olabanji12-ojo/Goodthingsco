import React from 'react';
import { PersonCategory } from './types';

interface PersonCardProps {
  category: PersonCategory;
  index: number;
}

export const PersonCard: React.FC<PersonCardProps> = ({ category, index }) => {
  return (
    <a
      href={category.href}
      className="group relative flex flex-col justify-between w-[80vw] sm:w-[320px] md:w-full shrink-0 md:shrink snap-start bg-white rounded-2xl overflow-hidden border border-brand-dark/10 shadow-[0_10px_30px_rgba(28,20,14,0.06)] hover:shadow-[0_22px_45px_rgba(28,20,14,0.14)] transition-all duration-500 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
      data-person-card={category.id}
      data-card-index={index}
      aria-label={`Explore gifts ${category.title} — ${category.tagline}`}
    >
      {/* ── Visual Media Container ── */}
      <div className="relative w-full aspect-[4/4.2] sm:aspect-[4/4] md:aspect-[4/4.3] overflow-hidden bg-brand-cream/80">
        <img
          src={category.image}
          alt={category.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-105 will-change-transform"
        />

        {/* Ambient Top Shadow Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Floating Category Tag Badge */}
        <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 shadow-2xs">
          <span className="font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-brand-dark">
            {category.tag}
          </span>
        </div>

        {/* Floating Subtle Shop Icon Button */}
        <div className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 w-9 h-9 rounded-full bg-brand-dark text-brand-ivory flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 shadow-md">
          <span className="text-sm font-sans">→</span>
        </div>
      </div>

      {/* ── Editorial Card Details ── */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 bg-[#FAF8F5]">
        <div>
          <span className="font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-600 block mb-1.5">
            {category.tagline}
          </span>
          <h3 className="font-serif text-2xl sm:text-2xl md:text-[1.65rem] text-brand-dark font-normal tracking-tight mb-2 group-hover:text-gold-700 transition-colors">
            {category.title}
          </h3>
          <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed line-clamp-2">
            {category.description}
          </p>
        </div>

        {/* Bottom Editorial Link */}
        <div className="mt-4 pt-3.5 border-t border-brand-dark/10 flex items-center justify-between">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark group-hover:text-gold-600 transition-colors">
            Explore Gifts
          </span>
          <span
            className="text-brand-dark group-hover:text-gold-600 group-hover:translate-x-1.5 transition-all duration-300 font-sans"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </div>
    </a>
  );
};

export default PersonCard;
