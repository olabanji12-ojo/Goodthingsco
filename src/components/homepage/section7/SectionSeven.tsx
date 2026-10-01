import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';

interface SectionSevenProps {
  className?: string;
}

/**
 * SectionSeven — Final Call to Action (Section 7)
 *
 * Visual Concept:
 * - A calm, confident, elegant concluding brand statement before the footer.
 * - Restrained typography with warm ivory background (#FAF8F5).
 * - Dual responsive action buttons with refined hover micro-interactions.
 *
 * Choreography:
 * 1. Eyebrow appears first (0.00s).
 * 2. Headline reveals with small line stagger (0.10s & 0.22s).
 * 3. Supporting copy follows (0.35s).
 * 4. CTA buttons appear last with gentle stagger (0.50s).
 *
 * Respects prefers-reduced-motion and responsive mobile viewports.
 */
export const SectionSeven: React.FC<SectionSevenProps> = ({ className = '' }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const section = sectionRef.current;
    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector('[data-final-element="eyebrow"]');
      const headline1 = section.querySelector('[data-final-element="headline-1"]');
      const headline2 = section.querySelector('[data-final-element="headline-2"]');
      const description = section.querySelector('[data-final-element="description"]');
      const ctaButtons = section.querySelectorAll('[data-final-element="cta-btn"]');
      const bgGlow = section.querySelector('[data-final-element="bg-glow"]');

      const isMobile = window.innerWidth < 768;
      const startY = isMobile ? 18 : 24;

      // Set initial hidden staging states
      if (bgGlow) gsap.set(bgGlow, { opacity: 0, scale: 0.96 });
      if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 14 });
      if (headline1) gsap.set(headline1, { opacity: 0, y: startY });
      if (headline2) gsap.set(headline2, { opacity: 0, y: startY });
      if (description) gsap.set(description, { opacity: 0, y: 14 });
      if (ctaButtons && ctaButtons.length > 0) gsap.set(ctaButtons, { opacity: 0, y: 12 });

      // Master entrance timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
        defaults: { ease: 'power3.out' },
      });

      // Background ambient glow
      if (bgGlow) {
        tl.to(bgGlow, { opacity: 0.7, scale: 1, duration: 1.2, ease: 'power2.out' }, 0);
      }

      // 1. Eyebrow
      if (eyebrow) {
        tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0);
      }

      // 2. Headline Line 1 & Line 2
      if (headline1) {
        tl.to(headline1, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0.10);
      }
      if (headline2) {
        tl.to(headline2, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0.22);
      }

      // 3. Supporting Description
      if (description) {
        tl.to(description, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 0.35);
      }

      // 4. CTA Buttons
      if (ctaButtons && ctaButtons.length > 0) {
        tl.to(
          ctaButtons,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
          },
          0.48
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      data-section="final-cta"
      className={`relative w-full bg-[#FAF8F5] py-28 md:py-36 lg:py-44 overflow-hidden border-t border-brand-dark/5 ${className}`}
      aria-label="Final Call to Action — Ready to find your good thing?"
    >
      {/* ── Subtle Ambient Background Lighting ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[850px] h-[380px] bg-gradient-to-b from-white/95 via-white/50 to-transparent blur-3xl pointer-events-none -z-0"
        data-final-element="bg-glow"
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-6 sm:px-10 md:px-16 text-center flex flex-col items-center z-10">
        {/* Section Eyebrow */}
        <span
          className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-brand-light mb-4 block"
          data-final-element="eyebrow"
        >
          The Art of Thoughtful Giving
        </span>

        {/* Main Headline */}
        <h2
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.3rem] text-brand-dark font-normal tracking-tight leading-[1.12] mb-6 max-w-2xl"
          data-final-element="headline"
        >
          <span className="block" data-final-element="headline-1">
            Ready to give
          </span>
          <span
            className="block italic font-light text-brand-medium/90 mt-1"
            data-final-element="headline-2"
          >
            something unforgettable?
          </span>
        </h2>

        {/* Supporting Copy */}
        <p
          className="font-sans text-sm sm:text-base md:text-lg text-brand-umber/85 font-normal leading-relaxed max-w-xl mx-auto mb-10"
          data-final-element="description"
        >
          Explore curated gift collections by recipient, occasion, and budget — or collaborate with our studio to create a custom bespoke gift.
        </p>

        {/* Dual Action CTA Buttons */}
        <div
          ref={contentRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto"
          data-final-element="cta-group"
        >
          {/* Primary CTA */}
          <a
            href="#shop-by-person"
            onClick={(e) => {
              const el = document.getElementById('shop-by-person');
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-brand-dark text-brand-ivory hover:bg-gold-600 hover:text-brand-ivory font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(28,20,14,0.12)] cursor-pointer"
            data-final-element="cta-btn"
          >
            <span>Find a Gift</span>
            <span
              className="ml-2 text-base transition-transform duration-300 ease-premium group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </a>

          {/* Secondary CTA */}
          <a
            href="/create"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/80 hover:bg-white text-brand-dark hover:text-brand-dark border border-brand-dark/15 hover:border-brand-dark/35 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 shadow-2xs hover:shadow-xs cursor-pointer"
            data-final-element="cta-btn"
          >
            <span>Start a Custom Order</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SectionSeven;
