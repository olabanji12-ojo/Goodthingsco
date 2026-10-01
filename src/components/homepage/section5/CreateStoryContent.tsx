import React from 'react';
import { BespokeCategoryTag } from './types';
import { bespokePillars } from './createData';

interface CreateStoryContentProps {
  tags?: BespokeCategoryTag[];
}

/**
 * CreateStoryContent — Editorial Header, 4 Custom Offering Pillars & Primary CTA for Section 5
 */
export const CreateStoryContent: React.FC<CreateStoryContentProps> = () => {
  return (
    <div
      className="text-center px-6 md:px-12 max-w-4xl mx-auto flex flex-col items-center mb-12 sm:mb-16"
      data-story-element="content"
    >
      {/* ── Section Eyebrow ── */}
      <span
        className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-brand-light mb-3 block"
        data-story-element="eyebrow"
      >
        Bespoke & Custom Atelier
      </span>

      {/* ── Main Heading ── */}
      <h2
        className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-brand-dark tracking-tight font-normal mb-4"
        data-story-element="heading"
      >
        Create Something Special
      </h2>

      {/* ── Supporting Description ── */}
      <p
        className="font-sans text-sm sm:text-base md:text-lg text-brand-medium/90 max-w-2xl mx-auto leading-relaxed mb-10"
        data-story-element="description"
      >
        From personalised gifts to corporate and event gifting, we can help create something thoughtful for the moment.
      </p>

      {/* ── 4 Bespoke Offering Pillars Grid ── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-10 text-left"
        data-story-element="pillars-grid"
      >
        {bespokePillars.map((pillar) => (
          <a
            key={pillar.id}
            href={pillar.href}
            className="group p-4 sm:p-5 rounded-xl bg-white/80 hover:bg-white border border-brand-dark/10 hover:border-gold-500/50 transition-all duration-300 shadow-2xs hover:shadow-sm flex flex-col justify-between"
            data-story-element="tag-pill"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                  {pillar.tag}
                </span>
                <span className="text-xs text-brand-light group-hover:text-gold-600 group-hover:translate-x-0.5 transition-transform font-sans">
                  →
                </span>
              </div>
              <h3 className="font-serif text-lg text-brand-dark font-medium tracking-tight mb-1 group-hover:text-gold-700 transition-colors">
                {pillar.title}
              </h3>
              <p className="font-sans text-xs text-brand-medium/80 leading-relaxed line-clamp-2">
                {pillar.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* ── Primary Action CTAs ── */}
      <div
        data-story-element="cta-wrapper"
        className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
      >
        <a
          href="/create"
          className="btn-primary inline-flex items-center justify-center px-9 py-4 font-sans text-xs font-semibold tracking-[0.18em] uppercase bg-brand-dark text-brand-ivory hover:bg-gold-600 hover:text-brand-ivory transition-all duration-300 shadow-[0_4px_20px_rgba(28,20,14,0.12)] cursor-pointer"
          data-story-element="cta"
        >
          <span>Start a Custom Order</span>
          <span className="ml-2 text-base" aria-hidden="true">
            →
          </span>
        </a>
        <a
          href="/create"
          className="inline-flex items-center justify-center px-8 py-4 font-sans text-xs font-semibold tracking-[0.18em] uppercase bg-white/70 hover:bg-white text-brand-dark border border-brand-dark/15 hover:border-brand-dark/30 transition-all duration-300 shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <span>Explore Bespoke Gifting</span>
        </a>
      </div>
    </div>
  );
};

export default CreateStoryContent;
