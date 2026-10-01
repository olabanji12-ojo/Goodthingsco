import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { souvenirItems } from './souvenirsData';

interface SouvenirsSectionProps {
  className?: string;
}

export const SouvenirsSection: React.FC<SouvenirsSectionProps> = ({ className = '' }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const intro = sectionRef.current?.querySelector('[data-souvenir-intro]');
      const cards = sectionRef.current?.querySelectorAll('[data-souvenir-card]');

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
        gsap.set(cards, { opacity: 0, y: 30 });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
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

  return (
    <section
      ref={sectionRef}
      id="souvenirs"
      data-section="souvenirs"
      className={`relative w-full bg-[#FAF8F5] py-20 sm:py-24 md:py-32 lg:py-36 overflow-hidden border-t border-brand-dark/5 ${className}`}
      aria-label="Souvenirs and Event Gifting — Tokens of Unforgettable Moments"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        {/* ── Section Header ── */}
        <div
          data-souvenir-intro
          className="text-center px-4 max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20"
        >
          <span className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-brand-light mb-3 block">
            Event Favors & Keepsakes
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight mb-4">
            Souvenirs & Event Gifting
          </h2>
          <p className="font-sans text-sm sm:text-base text-brand-medium/90 leading-relaxed max-w-xl mx-auto">
            Tangible, artfully presented keepsakes designed to honor weddings, milestones, and corporate gatherings.
          </p>
          <div className="w-12 h-[1px] bg-brand-dark/15 mx-auto mt-6" />
        </div>

        {/* ── 3-Column Editorial Grid / Mobile Swipe Carousel ── */}
        <div
          ref={carouselRef}
          className="flex lg:grid lg:grid-cols-3 gap-6 sm:gap-8 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none no-scrollbar pb-4 lg:pb-0 -mx-6 px-6 sm:-mx-10 sm:px-10 lg:mx-0 lg:px-0"
          tabIndex={0}
          role="region"
          aria-label="Event souvenir options carousel"
        >
          {souvenirItems.map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              className="group flex flex-col justify-between w-[82vw] sm:w-[340px] lg:w-full shrink-0 lg:shrink snap-start bg-white rounded-2xl overflow-hidden border border-brand-dark/10 shadow-[0_10px_30px_rgba(28,20,14,0.05)] hover:shadow-[0_22px_45px_rgba(28,20,14,0.14)] transition-all duration-500 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
              data-souvenir-card={item.id}
              data-card-index={index}
            >
              {/* Media Container */}
              <div className="relative w-full aspect-[4/3.6] sm:aspect-[4/3.4] overflow-hidden bg-brand-cream/90">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-105 will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                {/* Floating Tag */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 shadow-2xs">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Text Details */}
              <div className="p-6 flex flex-col justify-between flex-1 bg-[#FAF8F5]">
                <div>
                  <span className="font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-600 block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="font-serif text-2xl text-brand-dark font-normal tracking-tight mb-2 group-hover:text-gold-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-brand-dark/10 flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark group-hover:text-gold-600 transition-colors">
                    Inquire for Events
                  </span>
                  <span
                    className="text-brand-dark group-hover:text-gold-600 group-hover:translate-x-1.5 transition-all duration-300 font-sans"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Mobile Swipe Cue */}
        <div className="flex lg:hidden items-center justify-center gap-2 mt-4 text-center">
          <span className="font-sans text-[11px] text-brand-light uppercase tracking-widest">
            ← Swipe to explore souvenir options →
          </span>
        </div>
      </div>
    </section>
  );
};

export default SouvenirsSection;
