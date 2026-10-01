import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import SectionFour from './section4/SectionFour';
import SectionFive from './section5/SectionFive';
import SectionSix from './section6/SectionSix';
import SectionSeven from './section7/SectionSeven';

/**
 * DiscoveryStorySuite — Pinned Storytelling Journey (Sections 4, 5, 6, 7)
 *
 * Visual & Interaction Concept:
 * - When the user scrolls to this section, the viewport pins in place.
 * - As the user continues scrolling naturally with mouse wheel / touchpad:
 *   1. Gift Discovery ("Find the right gift")
 *   2. Bespoke Atelier ("Create something special")
 *   3. Brand Philosophy ("Thoughtful things. Beautifully lived.")
 *   4. Finale CTA ("Ready to find your good thing?")
 * - Clean editorial styling with zero artificial headers or numbered badges.
 * - Unpins cleanly at the end into the Site Footer.
 * - Mobile (<1024px): Seamless, touch-friendly vertical stack.
 */
export const DiscoveryStorySuite: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const scene1Ref = useRef<HTMLDivElement>(null);
  const scene2Ref = useRef<HTMLDivElement>(null);
  const scene3Ref = useRef<HTMLDivElement>(null);
  const scene4Ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !pinStageRef.current) return;

    const container = containerRef.current;
    const pinStage = pinStageRef.current;
    const s1 = scene1Ref.current;
    const s2 = scene2Ref.current;
    const s3 = scene3Ref.current;
    const s4 = scene4Ref.current;

    const scenes = [s1, s2, s3, s4].filter(Boolean) as HTMLDivElement[];

    const ctx = gsap.context(() => {
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

          if (reduceMotion || !isDesktop) {
            scenes.forEach((s) => {
              gsap.set(s, { opacity: 1, y: 0, scale: 1, visibility: 'visible' });
            });
            return;
          }

          // Initial state: Scene 1 visible, Scenes 2, 3, 4 hidden
          scenes.forEach((s, idx) => {
            if (idx === 0) {
              gsap.set(s, { opacity: 1, y: 0, scale: 1, visibility: 'visible' });
            } else {
              gsap.set(s, { opacity: 0, y: 40, scale: 0.97, visibility: 'hidden' });
            }
          });

          // Master ScrollTrigger timeline for the 4 scenes
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: 'top top',
              end: '+=3200', // Pinned scroll distance
              pin: pinStage,
              scrub: 1.1,
              invalidateOnRefresh: true,
            },
          });

          // Transition 1 -> 2 (Gift Guide -> Bespoke Atelier)
          tl.to(
            s1,
            {
              opacity: 0,
              y: -30,
              scale: 0.97,
              visibility: 'hidden',
              duration: 1,
              ease: 'power2.inOut',
            },
            1
          ).to(
            s2,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              visibility: 'visible',
              duration: 1,
              ease: 'power2.inOut',
            },
            1.2
          );

          // Transition 2 -> 3 (Bespoke Atelier -> Philosophy)
          tl.to(
            s2,
            {
              opacity: 0,
              y: -30,
              scale: 0.97,
              visibility: 'hidden',
              duration: 1,
              ease: 'power2.inOut',
            },
            2.4
          ).to(
            s3,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              visibility: 'visible',
              duration: 1,
              ease: 'power2.inOut',
            },
            2.6
          );

          // Transition 3 -> 4 (Philosophy -> Final CTA)
          tl.to(
            s3,
            {
              opacity: 0,
              y: -30,
              scale: 0.97,
              visibility: 'hidden',
              duration: 1,
              ease: 'power2.inOut',
            },
            3.8
          ).to(
            s4,
            {
              opacity: 1,
              y: 0,
              scale: 1,
              visibility: 'visible',
              duration: 1,
              ease: 'power2.inOut',
            },
            4.0
          );

          // Hold last scene briefly before unpinning
          tl.to({}, { duration: 0.6 });
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="story-suite"
      className="relative w-full bg-[#FAF8F5] overflow-hidden"
      aria-label="Discovery & Bespoke Storytelling Suite"
    >
      {/* ── Pinned Stage Container ── */}
      <div
        ref={pinStageRef}
        className="relative w-full min-h-screen flex flex-col justify-center py-6 md:py-10 px-6 sm:px-10 md:px-16 lg:px-20 max-w-7xl mx-auto"
      >
        {/* ── Layered Story Stage ── */}
        <div className="relative w-full flex-1 flex items-center justify-center my-auto min-h-[560px]">
          {/* Scene 01: Gift Guide */}
          <div
            ref={scene1Ref}
            className="lg:absolute lg:inset-0 flex items-center justify-center w-full py-10 lg:py-0 border-b lg:border-b-0 border-brand-dark/10"
            data-story-scene="discovery"
          >
            <div className="w-full">
              <SectionFour className="!py-0 !border-t-0" />
            </div>
          </div>

          {/* Scene 02: Bespoke Atelier */}
          <div
            ref={scene2Ref}
            className="lg:absolute lg:inset-0 flex items-center justify-center w-full py-10 lg:py-0 border-b lg:border-b-0 border-brand-dark/10"
            data-story-scene="bespoke"
          >
            <div className="w-full">
              <SectionFive className="!py-0 !border-t-0" />
            </div>
          </div>

          {/* Scene 03: Brand Philosophy */}
          <div
            ref={scene3Ref}
            className="lg:absolute lg:inset-0 flex items-center justify-center w-full py-10 lg:py-0 border-b lg:border-b-0 border-brand-dark/10"
            data-story-scene="philosophy"
          >
            <div className="w-full">
              <SectionSix className="!py-0 !border-t-0" />
            </div>
          </div>

          {/* Scene 04: Final CTA */}
          <div
            ref={scene4Ref}
            className="lg:absolute lg:inset-0 flex items-center justify-center w-full py-10 lg:py-0"
            data-story-scene="finale"
          >
            <div className="w-full">
              <SectionSeven className="!py-0 !border-t-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscoveryStorySuite;
