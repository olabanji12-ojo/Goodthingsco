import React from 'react';
import { CreateStoryStep } from './types';

interface CreateStoryTriptychProps {
  steps: [CreateStoryStep, CreateStoryStep, CreateStoryStep];
}

/**
 * CreateStoryTriptych — Asymmetrical 3-Image Editorial Visual Story
 *
 * Hierarchy & Flow:
 * - 01 Before:   Compact image on the left (the unadorned foundation)
 * - 02 Crafted:  Taller vertical image in the center (hands actively tailoring)
 * - 03 Finished: Dominant largest image on the right (the final presentation payoff)
 *
 * Choreographed sequentially via GSAP ScrollTrigger: Before -> Crafted -> Finished
 */
export const CreateStoryTriptych: React.FC<CreateStoryTriptychProps> = ({ steps }) => {
  const [before, crafted, finished] = steps;

  return (
    <div
      className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-center gap-6 sm:gap-8 lg:gap-10 my-10 md:my-14 select-none"
      data-story-triptych
      aria-label="3-step bespoke creation process: Before, Crafted, Finished"
    >
      {/* ── Step 1: 01 — Before (Left / Compact) ── */}
      <div
        className={`flex flex-col items-start ${before.sizeClass} group`}
        data-story-step="before"
      >
        <div
          className={`relative w-full ${before.aspectClass} rounded-2xl overflow-hidden bg-brand-cream shadow-[0_10px_28px_rgba(28,20,14,0.07)] border border-white/70 transition-shadow duration-500 ease-premium group-hover:shadow-[0_16px_36px_rgba(28,20,14,0.12)] will-change-transform`}
          data-story-frame="before"
        >
          <img
            src={before.image}
            alt={before.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
            draggable={false}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
        </div>

        {/* Step Label & Caption */}
        <div
          className="mt-3.5 flex flex-col text-left will-change-transform"
          data-story-caption="before"
        >
          <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-light">
            {before.label}
          </span>
          <span className="font-serif text-sm text-brand-dark/90 mt-0.5">
            {before.title}
          </span>
        </div>
      </div>

      {/* ── Step 2: 02 — Crafted (Center / Taller Vertical) ── */}
      <div
        className={`flex flex-col items-start ${crafted.sizeClass} group md:-translate-y-6 lg:-translate-y-8`}
        data-story-step="crafted"
      >
        <div
          className={`relative w-full ${crafted.aspectClass} rounded-2xl overflow-hidden bg-brand-cream shadow-[0_14px_36px_rgba(28,20,14,0.10)] border border-white/80 transition-shadow duration-500 ease-premium group-hover:shadow-[0_20px_44px_rgba(28,20,14,0.15)] will-change-transform`}
          data-story-frame="crafted"
        >
          <img
            src={crafted.image}
            alt={crafted.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
            draggable={false}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
        </div>

        {/* Step Label & Caption */}
        <div
          className="mt-3.5 flex flex-col text-left will-change-transform"
          data-story-caption="crafted"
        >
          <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-light">
            {crafted.label}
          </span>
          <span className="font-serif text-sm text-brand-dark/90 mt-0.5">
            {crafted.title}
          </span>
        </div>
      </div>

      {/* ── Step 3: 03 — Finished (Right / Dominant Payoff) ── */}
      <div
        className={`flex flex-col items-start ${finished.sizeClass} group md:translate-y-2`}
        data-story-step="finished"
      >
        <div
          className={`relative w-full ${finished.aspectClass} rounded-2xl overflow-hidden bg-brand-cream shadow-[0_20px_48px_rgba(28,20,14,0.14)] border border-white/90 transition-shadow duration-500 ease-premium group-hover:shadow-[0_26px_56px_rgba(28,20,14,0.20)] ring-1 ring-gold-500/20 will-change-transform`}
          data-story-frame="finished"
        >
          <img
            src={finished.image}
            alt={finished.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
            draggable={false}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
        </div>

        {/* Step Label & Caption */}
        <div
          className="mt-3.5 flex flex-col text-left will-change-transform"
          data-story-caption="finished"
        >
          <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-gold-600">
            {finished.label}
          </span>
          <span className="font-serif text-base font-medium text-brand-dark mt-0.5">
            {finished.title}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryTriptych;
