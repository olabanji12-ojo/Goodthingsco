import React from 'react';
import { SHOP_CATEGORIES } from './categoriesData';
import CategoryCard from './CategoryCard';

interface ShopCategoriesProps {
  className?: string;
}

/**
 * ShopCategories — Shop by Category Section
 *
 * Displays the 6 core shop categories with editorial Unsplash integration:
 * 1. Home & Living
 * 2. Candles
 * 3. Stationery
 * 4. Accessories
 * 5. Keepsakes
 * 6. Self Care
 */
export const ShopCategories: React.FC<ShopCategoriesProps> = ({ className = '' }) => {
  return (
    <section
      id="categories"
      className={`w-full bg-[#FAF8F5] text-brand-dark py-20 sm:py-24 md:py-28 lg:py-32 overflow-hidden ${className}`}
      aria-labelledby="shop-categories-heading"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        
        {/* ── Section Header ── */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16 sm:mb-20 md:mb-24">
          <span className="font-sans text-xs sm:text-[13px] font-semibold tracking-[0.22em] uppercase text-brand-light/90 mb-3 sm:mb-4 block">
            Collections
          </span>

          <h2
            id="shop-categories-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-brand-dark font-normal tracking-[-0.015em] leading-tight"
          >
            Shop by Category
          </h2>

          <p className="mt-4 sm:mt-5 font-sans text-sm sm:text-base text-brand-medium/85 font-light leading-relaxed max-w-lg">
            Thoughtful gift collections and inspired living pieces, curated for intuitive discovery and cherished moments.
          </p>
        </div>

        {/* ── 6-Category Responsive Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-x-10 sm:gap-y-14 lg:gap-x-12 lg:gap-y-16">
          {SHOP_CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default ShopCategories;
