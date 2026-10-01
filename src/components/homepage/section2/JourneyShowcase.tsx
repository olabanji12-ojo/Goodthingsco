import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../../lib/gsap';
import { JourneyData } from './types';
import JourneyContent from './JourneyContent';
import CardStack from './CardStack';

interface JourneyShowcaseProps {
  journey: JourneyData;
  isLast?: boolean;
}

/**
 * JourneyShowcase — Single Customer Journey Row (Alternating Layout)
 *
 * Core Animation Concept (GSAP ScrollTrigger):
 * 1. Text elements stagger reveal (eyebrow -> heading -> subtitle -> description -> cta).
 * 2. Card 1 enters first with subtle tilt and scales into position.
 * 3. Card 2 enters and smoothly layers over Card 1.
 * 4. Card 3 enters last and completes the stack into final composition.
 *
 * Symmetrical variation:
 * - Shop & Create (cards right): entrance from right side (+x offset)
 * - Gifts (cards left): entrance from left side (-x offset, mirrored tilt)
 *
 * Mobile & Accessibility:
 * - Reduced motion: immediately staged in approved resting positions.
 * - Mobile (<1024px): vertical translation with mild rotation, zero horizontal overflow.
 */
export const JourneyShowcase: React.FC<JourneyShowcaseProps> = ({
  journey,
  isLast = false,
}) => {
  const isCardsLeft = journey.side === 'left';
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rowRef.current) return;

    const row = rowRef.current;
    const ctx = gsap.context(() => {
      const card1 = row.querySelector('[data-card-index="1"]');
      const card2 = row.querySelector('[data-card-index="2"]');
      const card3 = row.querySelector('[data-card-index="3"]');

      const eyebrow = row.querySelector('[data-journey-element="eyebrow"]');
      const heading = row.querySelector('[data-journey-element="heading"]');
      const subtitle = row.querySelector('[data-journey-element="subtitle"]');
      const description = row.querySelector('[data-journey-element="description"]');
      const cta = row.querySelector('[data-journey-element="cta"]');

      const textElements = [eyebrow, heading, subtitle, description, cta].filter(Boolean);

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          isMobile: '(max-width: 1023px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, reduceMotion } = (context.conditions as {
            isDesktop?: boolean;
            isMobile?: boolean;
            reduceMotion?: boolean;
          }) || {};

          // Reduced motion branch: show resting static composition
          if (reduceMotion) {
            if (card1) gsap.set(card1, { x: -28, y: -18, rotate: -7, scale: 1, opacity: 1 });
            if (card2) gsap.set(card2, { x: 0, y: 0, rotate: 2, scale: 1, opacity: 1 });
            if (card3) gsap.set(card3, { x: 28, y: 18, rotate: 8, scale: 1, opacity: 1 });
            if (textElements.length > 0) gsap.set(textElements, { opacity: 1, y: 0 });
            return;
          }

          if (isDesktop) {
            // Desktop Staging: directional offset based on layout side
            const card1StartX = isCardsLeft ? -70 : 70;
            const card1StartRot = isCardsLeft ? 1 : -15;

            const card2StartX = isCardsLeft ? -85 : 85;
            const card2StartRot = isCardsLeft ? 10 : -6;

            const card3StartX = isCardsLeft ? -100 : 100;
            const card3StartRot = isCardsLeft ? -1 : 16;

            if (card1) gsap.set(card1, { opacity: 0, x: card1StartX, y: 35, rotate: card1StartRot, scale: 0.95 });
            if (card2) gsap.set(card2, { opacity: 0, x: card2StartX, y: 45, rotate: card2StartRot, scale: 0.95 });
            if (card3) gsap.set(card3, { opacity: 0, x: card3StartX, y: 55, rotate: card3StartRot, scale: 0.95 });
            if (textElements.length > 0) gsap.set(textElements, { opacity: 0, y: 22 });

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: row,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
              defaults: { ease: 'power3.out' },
            });

            // 1. Text reveals sequentially
            if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0);
            if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0.08);
            if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0.18);
            if (description) tl.to(description, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0.28);
            if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 0.38);

            // 2. Card 1 enters first
            if (card1) {
              tl.to(
                card1,
                {
                  opacity: 1,
                  x: -28,
                  y: -18,
                  rotate: -7,
                  scale: 1,
                  duration: 0.85,
                  ease: 'power3.out',
                },
                0.15
              );
            }

            // 3. Card 2 enters and layers over Card 1
            if (card2) {
              tl.to(
                card2,
                {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 2,
                  scale: 1,
                  duration: 0.85,
                  ease: 'power3.out',
                },
                0.40
              );
            }

            // 4. Card 3 enters and completes the stack
            if (card3) {
              tl.to(
                card3,
                {
                  opacity: 1,
                  x: 28,
                  y: 18,
                  rotate: 8,
                  scale: 1,
                  duration: 0.9,
                  ease: 'power3.out',
                },
                0.66
              );
            }
          } else {
            // Mobile Staging: vertical motion with subtle tilt
            if (card1) gsap.set(card1, { opacity: 0, y: 40, rotate: -4, scale: 0.96 });
            if (card2) gsap.set(card2, { opacity: 0, y: 50, rotate: 0, scale: 0.96 });
            if (card3) gsap.set(card3, { opacity: 0, y: 60, rotate: 5, scale: 0.96 });
            if (textElements.length > 0) gsap.set(textElements, { opacity: 0, y: 18 });

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: row,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
              defaults: { ease: 'power3.out' },
            });

            if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, 0);
            if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.6 }, 0.08);
            if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.6 }, 0.16);
            if (description) tl.to(description, { opacity: 1, y: 0, duration: 0.6 }, 0.24);
            if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.5 }, 0.32);

            if (card1) tl.to(card1, { opacity: 1, x: -28, y: -18, rotate: -7, scale: 1, duration: 0.75 }, 0.15);
            if (card2) tl.to(card2, { opacity: 1, x: 0, y: 0, rotate: 2, scale: 1, duration: 0.75 }, 0.36);
            if (card3) tl.to(card3, { opacity: 1, x: 28, y: 18, rotate: 8, scale: 1, duration: 0.8 }, 0.58);
          }
        }
      );
    }, rowRef);

    return () => ctx.revert();
  }, [isCardsLeft]);

  return (
    <div
      ref={rowRef}
      className={`relative w-full min-h-[70vh] lg:min-h-[82vh] flex items-center justify-center py-20 md:py-28 lg:py-32 px-6 sm:px-10 md:px-14 lg:px-20 max-w-7xl mx-auto ${
        !isLast ? 'border-b border-brand-dark/5' : ''
      }`}
      data-journey-row
      data-journey={journey.id}
      data-journey-side={journey.side}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-14 lg:gap-16 items-center w-full">
        {/* ── Text Column ── */}
        <div
          className={`lg:col-span-5 flex flex-col justify-center ${
            isCardsLeft
              ? 'lg:order-2 lg:pl-6 xl:pl-10'
              : 'lg:order-1 lg:pr-6 xl:pr-10'
          }`}
          data-journey-element="text-container"
        >
          <JourneyContent {...journey} />
        </div>

        {/* ── Card Stack Column ── */}
        <div
          className={`lg:col-span-7 flex items-center justify-center ${
            isCardsLeft ? 'lg:order-1' : 'lg:order-2'
          }`}
          data-journey-element="stack-container"
        >
          <CardStack cards={journey.cards} journeyId={journey.id} />
        </div>
      </div>
    </div>
  );
};

export default JourneyShowcase;
