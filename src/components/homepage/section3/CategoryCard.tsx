import React from 'react';
import { CategoryItem } from './types';

interface CategoryCardProps {
  category: CategoryItem;
  isDuplicate?: boolean;
}

/**
 * CategoryCard — Editorial Image-Led Category Tile
 *
 * Design:
 * - Rounded corners & subtle shadow
 * - Full-bleed photographic visual presentation
 * - Editorial typography overlay with soft bottom gradient
 * - Restrained micro-interactions on hover (slight image scale & arrow movement)
 * - Accessible keyboard focus rings & duplicate handling for infinite marquee
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isDuplicate = false,
}) => {
  return (
    <a
      href={category.href}
      tabIndex={isDuplicate ? -1 : 0}
      aria-hidden={isDuplicate ? true : undefined}
      className="group relative block w-[260px] sm:w-[280px] md:w-[300px] lg:w-[320px] aspect-[3/3.9] rounded-2xl overflow-hidden bg-brand-cream flex-shrink-0 shadow-[0_8px_24px_rgba(28,20,14,0.06)] hover:shadow-[0_18px_40px_rgba(28,20,14,0.15)] hover:scale-[1.02] transition-all duration-500 ease-premium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/90"
      data-category-card={category.id}
      data-category-element="card"
    >
      {/* ── Category Image ── */}
      <img
        src={category.image}
        alt={category.title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-[1.06]"
        draggable={false}
      />

      {/* ── Soft Scrim Gradient Overlay for Text Readability ── */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/25 to-transparent transition-opacity duration-500 pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Category Details & Explore CTA ── */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end text-left z-10 pointer-events-none">
        {category.subtitle && (
          <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-white/75 mb-1 block">
            {category.subtitle}
          </span>
        )}

        <h3 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-tight mb-3">
          {category.title}
        </h3>

        <div className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.16em] uppercase text-gold-300 group-hover:text-white transition-colors duration-300">
          <span>Explore</span>
          <span
            className="text-sm transition-transform duration-300 ease-premium group-hover:translate-x-1.5"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </div>

      {/* ── Subtle Fine Ring Border ── */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 pointer-events-none" />
    </a>
  );
};

export default CategoryCard;
