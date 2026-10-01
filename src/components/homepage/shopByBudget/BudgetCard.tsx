import React from 'react';
import { BudgetTier } from './types';

interface BudgetCardProps {
  tier: BudgetTier;
  index: number;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ tier, index }) => {
  return (
    <a
      href={tier.href}
      className="group relative flex flex-col justify-between w-[80vw] sm:w-[300px] md:w-full shrink-0 md:shrink snap-start bg-white rounded-2xl p-6 sm:p-7 border border-brand-dark/10 shadow-[0_8px_24px_rgba(28,20,14,0.04)] hover:shadow-[0_20px_45px_rgba(28,20,14,0.12)] hover:border-gold-500/40 transition-all duration-500 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
      data-budget-card={tier.id}
      data-card-index={index}
      aria-label={`Shop gifts ${tier.range} — ${tier.title}`}
    >
      {/* ── Top Section: Tag & Price Range ── */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 bg-gold-50/80 px-2.5 py-1 rounded-full border border-gold-200/50">
            {tier.tag}
          </span>
          <span className="font-sans text-xs text-brand-light font-medium tracking-wider">
            Tier {index + 1}
          </span>
        </div>

        {/* Large Price Range Display */}
        <div className="font-serif text-2xl sm:text-[1.75rem] text-brand-dark font-normal tracking-tight mb-2 group-hover:text-gold-700 transition-colors">
          {tier.range}
        </div>

        <h3 className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider text-brand-medium/90 mb-3">
          {tier.title}
        </h3>

        <p className="font-sans text-xs sm:text-sm text-brand-medium/80 leading-relaxed mb-6 line-clamp-3">
          {tier.description}
        </p>

        {/* Example Gifts Bulleted List */}
        <div className="space-y-2 py-4 border-t border-b border-brand-dark/5">
          <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-brand-light block">
            Featured In This Range:
          </span>
          <ul className="space-y-1.5">
            {tier.examples.map((example) => (
              <li
                key={example}
                className="flex items-center gap-2 font-sans text-xs text-brand-dark/80"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                <span className="truncate">{example}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Bottom Call to Action ── */}
      <div className="mt-6 pt-2 flex items-center justify-between">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark group-hover:text-gold-600 transition-colors">
          Shop this Range
        </span>
        <div className="w-8 h-8 rounded-full bg-[#FAF8F5] group-hover:bg-brand-dark group-hover:text-brand-ivory text-brand-dark flex items-center justify-center transition-all duration-300">
          <span className="text-xs font-sans group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </div>
      </div>
    </a>
  );
};

export default BudgetCard;
