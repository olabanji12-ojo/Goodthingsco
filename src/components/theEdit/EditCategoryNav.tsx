import React from 'react';
import { EDIT_CATEGORIES } from '../../data/editArticlesData';

interface EditCategoryNavProps {
  activeCategory: string; // 'all' or EditCategorySlug
  onSelectCategory: (category: string) => void;
  className?: string;
}

/**
 * EditCategoryNav — Section 3: Clean Editorial Category Filter
 *
 * Provides clean entry points for the 7 specified categories + All:
 * - Gift Guides
 * - Gifting Ideas
 * - Thoughtful Living
 * - Behind the Scenes
 * - Our Process
 * - Sourcing & Making
 * - GoodThings Stories
 *
 * Includes an editorial Category Meaning indicator to clearly communicate the category's purpose.
 */
export const EditCategoryNav: React.FC<EditCategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  const currentCategoryMeta = EDIT_CATEGORIES.find((c) => c.slug === activeCategory);

  return (
    <div className={`w-full max-w-6xl mx-auto mb-8 sm:mb-12 ${className}`}>
      {/* ── Category Filter Bar ── */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brand-dark/10">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-brand-dark">
          Explore by Category
        </span>
        <span className="font-sans text-xs text-brand-medium">
          {activeCategory === 'all'
            ? 'All Stories'
            : currentCategoryMeta?.label || 'Curated Selection'}
        </span>
      </div>

      {/* ── Category Pill Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 max-w-full">
        {/* 'All Stories' Tab */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-full font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
            activeCategory === 'all'
              ? 'bg-brand-dark text-brand-ivory shadow-xs font-bold'
              : 'bg-white border border-brand-dark/15 text-brand-dark/80 hover:text-brand-dark hover:border-brand-dark/40 hover:bg-black/5'
          }`}
        >
          All Stories
        </button>

        {/* 7 Content Categories */}
        {EDIT_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-4 py-2 rounded-full font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-brand-dark text-brand-ivory shadow-xs font-bold'
                  : 'bg-white border border-brand-dark/15 text-brand-dark/80 hover:text-brand-dark hover:border-brand-dark/40 hover:bg-black/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Editorial Category Meaning Callout ── */}
      <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white/70 border border-brand-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gold-600 shrink-0" />
          <p className="font-sans text-xs sm:text-sm text-brand-dark">
            <strong className="font-semibold text-brand-dark">
              {activeCategory === 'all' ? 'The Complete Edit:' : `${currentCategoryMeta?.label}:`}
            </strong>{' '}
            <span className="text-brand-medium">
              {activeCategory === 'all'
                ? 'Curated guides, studio chronicles, and thoughtful living essays from our Lagos atelier.'
                : currentCategoryMeta?.description}
            </span>
          </p>
        </div>

        {activeCategory !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="text-[11px] font-sans font-bold uppercase tracking-wider text-gold-700 hover:text-brand-dark underline underline-offset-4 self-start sm:self-auto cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};

export default EditCategoryNav;
