import React, { useState } from 'react';
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from './lookbookData';
import { ShopCategory, ShopProduct } from './types';

interface RoomShopProps {
  onNavigateToRoom: (index: number) => void;
}

/**
 * RoomShop — Room 02: SHOP ("For Me")
 *
 * Designed for customers shopping for themselves.
 * 7 categories requested by client:
 * Gifts · Souvenirs · Home · Fashion · Stationery · Accessories · Treats
 *
 * Products appear front and center with instant category filtering.
 */
export const RoomShop: React.FC<RoomShopProps> = ({ onNavigateToRoom }) => {
  const [activeCategory, setActiveCategory] = useState<string>('gifts');
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  const selectedCategoryMeta =
    SHOP_CATEGORIES.find((cat: ShopCategory) => cat.id === activeCategory) || SHOP_CATEGORIES[0];

  const filteredProducts = SHOP_PRODUCTS.filter(
    (prod: ShopProduct) => prod.categoryId === activeCategory
  );

  const handleQuickAdd = (productName: string) => {
    setAddedItemName(productName);
    setTimeout(() => {
      setAddedItemName(null);
    }, 2200);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto bg-[#FAF8F5]">
      {/* ── Top Header & Context ── */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-dark/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">
                02 · The Collection
              </span>
              <span className="text-brand-dark/20">•</span>
              <span className="font-sans text-xs uppercase tracking-wider text-brand-medium">
                Shopping For Yourself
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
              Curated everyday craft & objects.
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm text-brand-medium/90 max-w-sm leading-relaxed">
            Organised by category. Select any department below to discover crafted pieces tailored for inspired living.
          </p>
        </div>

        {/* ── Category Filter Tabs (All 7 required categories) ── */}
        <div className="mt-5 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {SHOP_CATEGORIES.map((category: ShopCategory) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.16em] transition-all duration-300 rounded-none cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs'
                      : 'bg-white/80 hover:bg-white text-brand-dark/80 hover:text-brand-dark border border-brand-dark/15 font-medium'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Category Meta Bar */}
        <div className="flex items-center justify-between mt-3 px-1 text-xs text-brand-medium">
          <span>
            <strong className="text-brand-dark font-semibold">{selectedCategoryMeta.name}:</strong>{' '}
            {selectedCategoryMeta.description}
          </span>
          <span className="text-gold-700 font-semibold">{selectedCategoryMeta.itemCount}</span>
        </div>
      </div>

      {/* ── Center Stage: Product Showcase Grid ── */}
      <div className="max-w-6xl mx-auto w-full my-auto py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod: ShopProduct) => (
            <div
              key={prod.id}
              className="group bg-white border border-brand-dark/10 hover:border-brand-dark/30 p-5 flex flex-col justify-between transition-all duration-300 shadow-2xs hover:shadow-md"
            >
              {/* Product Visual Container */}
              <div className="relative w-full aspect-4/3 bg-[#F4F0EA] flex items-center justify-center p-6 overflow-hidden mb-4">
                {prod.tag && (
                  <span className="absolute top-3 left-3 bg-brand-dark text-brand-ivory font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 z-10">
                    {prod.tag}
                  </span>
                )}
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out select-none"
                  loading="lazy"
                />
              </div>

              {/* Product Metadata */}
              <div>
                <span className="font-sans text-[10px] uppercase tracking-widest text-brand-light font-medium block mb-1">
                  {prod.subtitle}
                </span>
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h3 className="font-serif text-lg text-brand-dark font-normal group-hover:text-gold-700 transition-colors">
                    {prod.name}
                  </h3>
                  <span className="font-sans text-sm font-bold text-brand-dark shrink-0">
                    {prod.price}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-brand-dark/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdd(prod.name)}
                  className="w-full py-2.5 bg-brand-dark hover:bg-gold-600 text-brand-ivory font-sans text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer text-center"
                >
                  Add to Bag
                </button>
                <a
                  href="/shop"
                  className="p-2.5 border border-brand-dark/20 hover:border-brand-dark text-brand-dark text-center font-sans text-[11px] transition-colors"
                  title="View full specs"
                >
                  ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Feedback Toast / Next Prompt ── */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          {addedItemName ? (
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5 animate-in fade-in">
              ✓ Added "{addedItemName}" to your bag.
            </span>
          ) : (
            <span className="text-brand-medium">
              Complimentary gift wrapping on all orders over £50.
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigateToRoom(2)}
            className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark hover:text-gold-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Next: Discover Gifts for Someone (Room 03)</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomShop;
