import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { journeysData } from './journeysData';
import JourneyContent from './JourneyContent';
import CardStack from './CardStack';

/**
 * SectionTwo — Customer Journeys (Shop · Gifts · Create)
 *
 * Clean vertical arrangement:
 * 1. Journey 01 (Shop)   — "Find something for yourself" + spreading product deck
 * 2. Journey 02 (Gifts)  — "Find something thoughtful" + spreading gift bundle deck
 * 3. Journey 03 (Create) — "Make something uniquely yours" + spreading bespoke atelier deck
 */
export const SectionTwo: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      rowsRef.current.forEach((row) => {
        if (!row) return;

        const textCol = row.querySelector('[data-journey-col="text"]');
        const cardsCol = row.querySelector('[data-journey-col="cards"]');

        if (textCol && cardsCol) {
          gsap.set(textCol, { opacity: 0, y: 30 });
          gsap.set(cardsCol, { opacity: 0, y: 40, scale: 0.96 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
            defaults: { ease: 'power3.out' },
          });

          tl.to(textCol, { opacity: 1, y: 0, duration: 0.8 }, 0).to(
            cardsCol,
            { opacity: 1, y: 0, scale: 1, duration: 0.9 },
            0.15
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="journeys"
      data-section="journeys"
      className="relative w-full bg-[#FAF8F5] py-20 md:py-28 lg:py-36 overflow-hidden border-t border-brand-dark/5"
      aria-label="Customer Journeys — Shop, Gifts, and Create"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20 flex flex-col gap-24 md:gap-32 lg:gap-40">
        {journeysData.map((journey, index) => {
          const isCardsLeft = journey.side === 'left';
          return (
            <div
              key={journey.id}
              ref={(el) => (rowsRef.current[index] = el)}
              className="w-full"
              data-journey-row={journey.id}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 lg:gap-20 items-center">
                {/* Text Column */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-center ${
                    isCardsLeft
                      ? 'lg:order-2 lg:pl-6 xl:pl-10'
                      : 'lg:order-1 lg:pr-6 xl:pr-10'
                  }`}
                  data-journey-col="text"
                >
                  <JourneyContent {...journey} />
                </div>

                {/* Card Stack Column with Wide Product Spread */}
                <div
                  className={`lg:col-span-7 flex items-center justify-center ${
                    isCardsLeft ? 'lg:order-1' : 'lg:order-2'
                  }`}
                  data-journey-col="cards"
                >
                  <CardStack cards={journey.cards} journeyId={journey.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SectionTwo;
