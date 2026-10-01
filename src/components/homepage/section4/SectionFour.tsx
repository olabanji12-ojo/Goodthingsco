import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { discoveryGroups, discoveryItems } from './discoveryData';
import { DiscoveryItem } from './types';
import GiftDiscoveryControls from './GiftDiscoveryControls';
import GiftDiscoveryImage from './GiftDiscoveryImage';

/**
 * SectionFour — Gift Discovery Experience (Section 4)
 *
 * Split Layout:
 * - Left: Editorial guidance, 3-group selector controls, and "Browse all gifts →" CTA.
 * - Right: Large featured showcase image that updates on selection with smooth crossfade.
 *
 * Performance:
 * - Preloads all 6 category images on mount for instant zero-lag tab transitions.
 * - ScrollTrigger coordinates entrance when scrolling into the viewport.
 */
interface SectionFourProps {
  className?: string;
}

export const SectionFour: React.FC<SectionFourProps> = ({ className = '' }) => {
  // Default to first discovery item (Birthday)
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem>(discoveryItems[0]);

  const sectionRef = useRef<HTMLElement>(null);
  const textColRef = useRef<HTMLDivElement>(null);
  const imageColRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  // Preload all 6 images immediately on mount so first click transitions are instantaneous
  useEffect(() => {
    discoveryItems.forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, []);

  // Section Entrance Reveal via ScrollTrigger
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const entranceItems = sectionRef.current?.querySelectorAll(
        '[data-discovery-entrance]'
      );

      if (entranceItems && entranceItems.length > 0) {
        gsap.set(entranceItems, { opacity: 0, y: 22 });
        gsap.to(entranceItems, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      if (imageColRef.current) {
        gsap.set(imageColRef.current, { opacity: 0, y: 30, scale: 0.98 });
        gsap.to(imageColRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Active description transition on selection change
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !descRef.current) return;

    gsap.fromTo(
      descRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' }
    );
  }, [selectedItem.id]);

  return (
    <section
      ref={sectionRef}
      id="gift-discovery"
      data-section="gift-discovery"
      className={`relative w-full bg-[#FAF8F5] py-24 md:py-32 lg:py-40 overflow-hidden border-t border-brand-dark/5 ${className}`}
      aria-label="Gift Discovery — Find the right gift"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── Left Column: Editorial Copy & Discovery Controls ── */}
          <div
            ref={textColRef}
            className="lg:col-span-6 flex flex-col justify-center text-left"
            data-discovery-element="text-column"
          >
            {/* Section Eyebrow */}
            <span
              className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-brand-light mb-3 block"
              data-discovery-entrance
            >
              Curated Gift Guide
            </span>

            {/* Section Heading */}
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight leading-[1.12] mb-4"
              data-discovery-entrance
            >
              Find the right gift
            </h2>

            {/* Supporting Sentence */}
            <p
              className="font-sans text-sm sm:text-base text-brand-medium/90 max-w-lg leading-relaxed mb-4"
              data-discovery-entrance
            >
              Beautiful gifts for meaningful moments, personal gestures, and thoughtful celebrations.
            </p>

            {/* Interactive Category Controls */}
            <div data-discovery-entrance>
              <GiftDiscoveryControls
                groups={discoveryGroups}
                selectedItem={selectedItem}
                onSelect={setSelectedItem}
              />
            </div>

            {/* Active Item Description Snippet */}
            <p
              ref={descRef}
              className="font-sans text-xs sm:text-sm text-brand-umber/80 leading-relaxed max-w-md my-4 min-h-[44px]"
              data-discovery-element="active-description"
              data-discovery-entrance
            >
              {selectedItem.description}
            </p>

            {/* Secondary CTA */}
            <div
              className="mt-4 pt-4 border-t border-brand-dark/10"
              data-discovery-entrance
            >
              <a
                href="/gifts"
                className="group inline-flex items-center gap-3 font-sans text-xs md:text-sm font-semibold tracking-[0.16em] uppercase text-brand-dark hover:text-gold-600 transition-colors duration-300"
                data-discovery-element="all-gifts-cta"
              >
                <span className="relative pb-0.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-brand-dark group-hover:after:bg-gold-600 after:transition-colors duration-300">
                  Browse all gifts
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

          {/* ── Right Column: Dynamic Featured Image Showcase ── */}
          <div
            ref={imageColRef}
            className="lg:col-span-6 flex items-center justify-center lg:justify-end"
            data-discovery-element="image-column"
          >
            <GiftDiscoveryImage item={selectedItem} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionFour;
