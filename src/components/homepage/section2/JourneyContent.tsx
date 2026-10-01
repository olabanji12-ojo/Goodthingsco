import React from 'react';
import { JourneyData } from './types';

type JourneyContentProps = Pick<
  JourneyData,
  'id' | 'number' | 'title' | 'subtitle' | 'description' | 'ctaText' | 'ctaHref'
>;

/**
 * JourneyContent — Editorial Typography Block for Customer Journeys
 *
 * Prepared for GSAP split-text / line reveal animations via data attributes:
 * - data-journey-element="content-block"
 * - data-journey-element="eyebrow"
 * - data-journey-element="heading"
 * - data-journey-element="subtitle"
 * - data-journey-element="description"
 * - data-journey-element="cta"
 */
export const JourneyContent: React.FC<JourneyContentProps> = ({
  id,
  number,
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
}) => {
  return (
    <div
      className="flex flex-col items-start max-w-xl text-left"
      data-journey-element="content-block"
      data-journey-id={id}
    >
      {/* ── Eyebrow / Number ── */}
      <span
        className="font-sans text-xs md:text-sm font-semibold tracking-[0.22em] uppercase text-brand-light mb-3 block"
        data-journey-element="eyebrow"
      >
        {number} — {title.toUpperCase()}
      </span>

      {/* ── Section Title ── */}
      <h2
        className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight leading-[1.12] mb-3"
        data-journey-element="heading"
      >
        {title}
      </h2>

      {/* ── Editorial Supporting Subtitle ── */}
      <p
        className="font-serif italic text-lg sm:text-xl md:text-2xl text-brand-medium/95 font-normal mb-5 leading-snug"
        data-journey-element="subtitle"
      >
        {subtitle}
      </p>

      {/* ── Body Copy ── */}
      <p
        className="font-sans text-sm md:text-base text-brand-umber/85 leading-relaxed mb-8 max-w-md"
        data-journey-element="description"
      >
        {description}
      </p>

      {/* ── Editorial CTA Link ── */}
      <a
        href={ctaHref}
        className="group inline-flex items-center gap-3 text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-brand-dark hover:text-brand-dark/70 transition-all duration-300"
        data-journey-element="cta"
      >
        <span className="relative pb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-brand-dark group-hover:after:bg-brand-dark/70 after:transition-colors duration-300">
          {ctaText}
        </span>
        <span
          className="text-base transition-transform duration-300 ease-premium group-hover:translate-x-1.5"
          aria-hidden="true"
        >
          →
        </span>
      </a>
    </div>
  );
};

export default JourneyContent;
