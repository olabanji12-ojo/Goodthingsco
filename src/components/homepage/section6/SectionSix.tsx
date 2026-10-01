import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import lifestyleImg from '../../../assets/section6/section6.png';

interface SectionSixProps {
  className?: string;
}

/**
 * SectionSix — Brand / Lifestyle Moment (Section 6)
 *
 * Visual Concept:
 * - A calm editorial interlude / magazine spread reinforcing everyday living.
 * - Slower, emotionally resonant, spacious, minimal.
 * - Single dominant lifestyle image with refined brand typography.
 *
 * Choreography:
 * 1. Large focal lifestyle image reveals first with soft settling scale (1.04 -> 1, opacity 0 -> 1).
 * 2. Eyebrow arrives smoothly.
 * 3. Line-by-line editorial headline reveal ("Thoughtful things." -> "Beautifully lived.").
 * 4. Supporting copy arrives calmly.
 * 5. Understated "About Good Things Co. →" CTA arrives last.
 *
 * Respects prefers-reduced-motion and responsive viewports.
 */
export const SectionSix: React.FC<SectionSixProps> = ({ className = '' }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const section = sectionRef.current;
    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector('[data-brand-element="eyebrow"]');
      const headlineLine1 = section.querySelector('[data-brand-element="headline-1"]');
      const headlineLine2 = section.querySelector('[data-brand-element="headline-2"]');
      const description = section.querySelector('[data-brand-element="description"]');
      const cta = section.querySelector('[data-brand-element="cta"]');
      const imageWrapper = imageWrapperRef.current;
      const imgElement = imgElementRef.current;

      const isMobile = window.innerWidth < 1024;
      const startScale = isMobile ? 1.02 : 1.04;
      const startImgY = isMobile ? 14 : 20;

      // Set initial hidden states
      if (imageWrapper) gsap.set(imageWrapper, { opacity: 0, y: startImgY });
      if (imgElement) gsap.set(imgElement, { scale: startScale });
      if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 16 });
      if (headlineLine1) gsap.set(headlineLine1, { opacity: 0, y: 20 });
      if (headlineLine2) gsap.set(headlineLine2, { opacity: 0, y: 20 });
      if (description) gsap.set(description, { opacity: 0, y: 14 });
      if (cta) gsap.set(cta, { opacity: 0, y: 12 });

      // Master calm entrance timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        defaults: { ease: 'power3.out' },
      });

      // 1. Lifestyle Image reveals first (0.00s)
      if (imageWrapper) {
        tl.to(
          imageWrapper,
          {
            opacity: 1,
            y: 0,
            duration: 1.25,
            ease: 'power3.out',
          },
          0
        );
      }
      if (imgElement) {
        tl.to(
          imgElement,
          {
            scale: 1,
            duration: 1.4,
            ease: 'power3.out',
          },
          0
        );
      }

      // 2. Eyebrow (0.25s)
      if (eyebrow) {
        tl.to(
          eyebrow,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
          },
          0.25
        );
      }

      // 3. Headline Line 1 & Line 2 (0.35s & 0.48s)
      if (headlineLine1) {
        tl.to(
          headlineLine1,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
          },
          0.35
        );
      }
      if (headlineLine2) {
        tl.to(
          headlineLine2,
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
          },
          0.48
        );
      }

      // 4. Supporting Description (0.65s)
      if (description) {
        tl.to(
          description,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
          },
          0.65
        );
      }

      // 5. About CTA (0.85s)
      if (cta) {
        tl.to(
          cta,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          0.85
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="brand-moment"
      data-section="brand-moment"
      className={`relative w-full bg-[#FAF8F5] py-28 md:py-36 lg:py-48 overflow-hidden border-t border-brand-dark/5 ${className}`}
      aria-label="Brand Philosophy — Thoughtful things. Beautifully lived."
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 lg:gap-20 items-center">
          {/* ── Left Column: Brand Statement & Editorial Copy ── */}
          <div
            className="lg:col-span-5 flex flex-col items-start text-left"
            data-brand-element="text-container"
          >
            {/* Section Eyebrow */}
            <span
              className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-brand-light mb-4 block"
              data-brand-element="eyebrow"
            >
              The Philosophy
            </span>

            {/* Main Brand Headline */}
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] text-brand-dark font-normal tracking-tight leading-[1.12] mb-6"
              data-brand-element="headline"
            >
              <span className="block" data-brand-element="headline-1">
                Thoughtful things.
              </span>
              <span
                className="block italic font-light text-brand-medium/90"
                data-brand-element="headline-2"
              >
                Beautifully lived.
              </span>
            </h2>

            {/* Supporting Copy */}
            <p
              className="font-sans text-sm sm:text-base md:text-lg text-brand-umber/85 font-normal leading-relaxed max-w-md mb-8"
              data-brand-element="description"
            >
              We believe the most meaningful gifts are those chosen with intention — objects that outlast the occasion and bring beauty to everyday rituals.
            </p>

            {/* Subtle Editorial CTA */}
            <div className="pt-2">
              <a
                href="/about"
                className="group inline-flex items-center gap-3 font-sans text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-brand-dark hover:text-gold-600 transition-colors duration-300"
                data-brand-element="cta"
              >
                <span className="relative pb-0.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-brand-dark group-hover:after:bg-gold-600 after:transition-colors duration-300">
                  About Good Things Co.
                </span>
                <span
                  className="text-base transition-transform duration-300 ease-premium group-hover:translate-x-1.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            </div>
          </div>

          {/* ── Right Column: Large Lifestyle Focal Image ── */}
          <div
            className="lg:col-span-7 flex items-center justify-center lg:justify-end"
            data-brand-element="image-container"
          >
            <div
              ref={imageWrapperRef}
              className="relative w-full max-w-lg lg:max-w-xl aspect-[4/4.8] sm:aspect-[4/4.5] lg:aspect-[4/4.9] rounded-3xl overflow-hidden bg-brand-cream shadow-[0_20px_50px_rgba(28,20,14,0.10)] border border-white/80 group select-none will-change-transform"
            >
              <img
                ref={imgElementRef}
                src={lifestyleImg}
                alt="Thoughtful everyday living moment with warm morning sunlight and refined artisanal objects"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-[1.02] will-change-transform"
                draggable={false}
              />

              {/* Subtle ambient inset border */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionSix;
