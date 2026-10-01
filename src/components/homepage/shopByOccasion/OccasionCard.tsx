import React from 'react';
import { OccasionCategory } from './types';

interface OccasionCardProps {
  category: OccasionCategory;
  index: number;
}

export const OccasionCard: React.FC<OccasionCardProps> = ({ category, index }) => {
  return (
    <a
      href={category.href}
      className="group relative flex flex-col justify-between w-[78vw] sm:w-[280px] md:w-full shrink-0 md:shrink snap-start bg-white rounded-2xl overflow-hidden border border-brand-dark/10 shadow-[0_8px_24px_rgba(28,20,14,0.05)] hover:shadow-[0_20px_40px_rgba(28,20,14,0.12)] transition-all duration-500 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
      data-occasion-card={category.id}
      data-card-index={index}
      aria-label={`Explore ${category.title} gifts — ${category.tagline}`}
    >
      {/* ── Image Media Frame ── */}
      <div className="relative w-full aspect-[4/3.8] sm:aspect-[4/3.6] overflow-hidden bg-brand-cream/90">
        <img
          src={category.image}
          alt={category.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-105 will-change-transform"
        />

        {/* Ambient Top & Bottom Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

        {/* Floating Tag Pill */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-black/5 shadow-2xs">
          <span className="font-sans text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-dark">
            {category.tag}
          </span>
        </div>
      </div>

      {/* ── Text Details ── */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 bg-[#FAF8F5]">
        <div>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-600 block mb-1">
            {category.tagline}
          </span>
          <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal tracking-tight mb-1.5 group-hover:text-gold-700 transition-colors">
            {category.title}
          </h3>
          <p className="font-sans text-xs text-brand-medium/85 leading-relaxed line-clamp-2">
            {category.description}
          </p>
        </div>

        {/* Link Arrow */}
        <div className="mt-3.5 pt-2.5 border-t border-brand-dark/10 flex items-center justify-between">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-dark group-hover:text-gold-600 transition-colors">
            Shop Occasion
          </span>
          <span
            className="text-brand-dark group-hover:text-gold-600 group-hover:translate-x-1 transition-transform duration-300 font-sans text-xs"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </div>
    </a>
  );
};

export default OccasionCard;
