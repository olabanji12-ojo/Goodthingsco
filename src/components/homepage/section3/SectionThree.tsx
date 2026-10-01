import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { row1Categories, row2Categories } from './categoriesData';
import CollectionRow from './CollectionRow';

/**
 * SectionThree — Shop the Collection Showcase (Section 3)
 *
 * Visual Concept:
 * - Editorial Category Wall with 10 image-led cards across two continuous marquee tracks.
 * - Row 1 (5 cards): Moves continuously to the LEFT (seamless loop).
 * - Row 2 (5 cards): Moves continuously to the RIGHT (seamless loop).
 * - Calming linear motion with hover deceleration, fully interactive and accessible.
 */
export const SectionThree: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current || !introRef.current) return;

    const ctx = gsap.context(() => {
      const introChildren = introRef.current?.children;
      if (introChildren && introChildren.length > 0) {
        gsap.set(introChildren, { opacity: 0, y: 22 });
        gsap.to(introChildren, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: introRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      if (rowsRef.current) {
        gsap.set(rowsRef.current, { opacity: 0, y: 28 });
        gsap.to(rowsRef.current, {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: rowsRef.current,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="shop-collection"
      data-section="shop-collection"
      className="relative w-full bg-[#FAF8F5] py-24 md:py-32 lg:py-40 overflow-hidden border-t border-brand-dark/5"
      aria-label="Shop the Collection — Curated Categories"
    >
      {/* ── Section Intro (Clean & Editorial) ── */}
      <div
        ref={introRef}
        className="text-center px-6 md:px-12 max-w-2xl mx-auto mb-16 md:mb-20 lg:mb-24"
        data-section-element="intro"
      >
        <span className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-brand-light mb-3 block">
          Curated Gift Collections
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark tracking-tight font-normal mb-4">
          Thoughtful Pieces by Category
        </h2>
        <p className="font-sans text-sm md:text-base text-brand-medium/90 max-w-lg mx-auto leading-relaxed">
          Hand-picked objects for giving and inspired living — from fine leather and jewelry to sensory fragrances.
        </p>
        <div className="w-12 h-[1px] bg-brand-dark/15 mx-auto mt-8" />
      </div>

      {/* ── Two Horizontal Category Marquee Tracks ── */}
      <div
        ref={rowsRef}
        className="w-full flex flex-col gap-6 sm:gap-8 md:gap-10"
        data-section-element="rows-container"
      >
        {/* Row 1: Continuous Leftward Marquee */}
        <CollectionRow
          id="collection-row-1"
          categories={row1Categories}
          rowNumber={1}
        />

        {/* Row 2: Continuous Rightward Marquee */}
        <CollectionRow
          id="collection-row-2"
          categories={row2Categories}
          rowNumber={2}
          offsetClass="md:pl-16 lg:pl-28 xl:pl-36"
        />
      </div>
    </section>
  );
};

export default SectionThree;
