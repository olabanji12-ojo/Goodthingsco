import React from 'react';
import { DiscoveryGroup, DiscoveryItem } from './types';

interface GiftDiscoveryControlsProps {
  groups: DiscoveryGroup[];
  selectedItem: DiscoveryItem;
  onSelect: (item: DiscoveryItem) => void;
}

/**
 * GiftDiscoveryControls — Minimalist Selector Controls for Gift Discovery
 *
 * Renders 3 curated groups: By Occasion, By Recipient, and Corporate.
 * Uses refined typography, subtle active indicators, and high contrast.
 */
export const GiftDiscoveryControls: React.FC<GiftDiscoveryControlsProps> = ({
  groups,
  selectedItem,
  onSelect,
}) => {
  return (
    <div
      className="flex flex-col gap-6 sm:gap-7 my-6"
      role="tablist"
      aria-label="Gift discovery categories"
      data-discovery-element="controls"
    >
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2.5">
          {/* ── Group Label ── */}
          <span className="font-sans text-[11px] font-semibold tracking-[0.22em] uppercase text-brand-light">
            {group.name}
          </span>

          {/* ── Options in Group ── */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {group.items.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => onSelect(item)}
                  className={`group relative px-4 py-2 text-left rounded-lg transition-all duration-300 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark cursor-pointer ${
                    isSelected
                      ? 'bg-brand-dark text-brand-ivory shadow-[0_6px_20px_rgba(28,20,14,0.18)]'
                      : 'bg-white/70 hover:bg-white text-brand-medium hover:text-brand-dark border border-brand-dark/10 hover:border-brand-dark/30 hover:shadow-sm'
                  }`}
                  data-discovery-control={item.id}
                  data-active={isSelected}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Active Accent Dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isSelected
                          ? 'bg-gold-400 scale-100'
                          : 'bg-transparent scale-50 group-hover:bg-brand-dark/20 group-hover:scale-75'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="font-serif text-base sm:text-lg tracking-tight font-normal transition-transform duration-300 group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GiftDiscoveryControls;
