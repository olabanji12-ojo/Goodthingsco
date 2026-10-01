import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { personCategories } from './personData';
import PersonCard from './PersonCard';

interface ShopByPersonProps {
  className?: string;
}

export const ShopByPerson: React.FC<ShopByPersonProps> = ({ className = '' }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const intro = sectionRef.current?.querySelector('[data-person-intro]');
      const cards = sectionRef.current?.querySelectorAll('[data-person-card]');

      if (intro) {
        gsap.set(intro, { opacity: 0, y: 24 });
        gsap.to(intro, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      if (cards && cards.length > 0) {
        gsap.set(cards, { opacity: 0, y: 32 });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.firstElementChild?.clientWidth || 320;
    const scrollAmount = direction === 'left' ? -cardWidth * 1.1 : cardWidth * 1.1;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      id="shop-by-person"
      data-section="shop-by-person"
      className={`relative w-full bg-[#FAF8F5] py-20 sm:py-24 md:py-32 lg:py-36 overflow-hidden border-t border-brand-dark/5 ${className}`}
      aria-label="Shop by Person — Discover gifts by recipient"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        {/* ── Section Header ── */}
        <div
          data-person-intro
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 md:mb-16 gap-6"
        >
          <div className="max-w-xl">
            <span className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-brand-light mb-3 block">
              Gift by Recipient
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight mb-3">
              Shop by Person
            </h2>
            <p className="font-sans text-sm sm:text-base text-brand-medium/90 leading-relaxed">
              Thoughtful curations tailored for the special relationships and cherished people in your life.
            </p>
          </div>

          {/* Desktop & Tablet Carousel Arrows / All Gifts Link */}
          <div className="flex items-center gap-4">
            <a
              href="/shop"
              className="hidden sm:inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.16em] uppercase text-brand-dark hover:text-gold-600 transition-colors"
            >
              <span>View All Gifts</span>
              <span aria-hidden="true">→</span>
            </a>

            {/* Desktop Navigation Arrows */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-10 h-10 rounded-full border border-brand-dark/15 hover:border-brand-dark flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-brand-ivory transition-all cursor-pointer"
                aria-label="Previous recipient cards"
              >
                ←
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-10 h-10 rounded-full border border-brand-dark/15 hover:border-brand-dark flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-brand-ivory transition-all cursor-pointer"
                aria-label="Next recipient cards"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Horizontal Swipe Carousel / Desktop 3-Column Grid ── */}
        <div
          ref={carouselRef}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none no-scrollbar pb-4 md:pb-0 -mx-6 px-6 sm:-mx-10 sm:px-10 md:mx-0 md:px-0"
          tabIndex={0}
          role="region"
          aria-label="Recipient gift cards carousel"
        >
          {personCategories.map((category, index) => (
            <PersonCard key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* Mobile Swipe Guidance Cue */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-4 text-center">
          <span className="font-sans text-[11px] text-brand-light uppercase tracking-widest">
            ← Swipe to explore recipients →
          </span>
        </div>
      </div>
    </section>
  );
};

export default ShopByPerson;
