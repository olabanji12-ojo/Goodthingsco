import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import HeroSection from './HeroSection';
import SectionTwo from './section2/SectionTwo';
import SectionThree from './section3/SectionThree';
import SectionFour from './section4/SectionFour';
import SectionFive from './section5/SectionFive';
import SectionSix from './section6/SectionSix';
import SectionSeven from './section7/SectionSeven';

interface RoomMeta {
  id: string;
  number: string;
  name: string;
}

const ROOMS: RoomMeta[] = [
  { id: 'room-hero', number: '01', name: 'Welcome' },
  { id: 'room-journeys', number: '02', name: 'Journeys' },
  { id: 'room-collection', number: '03', name: 'Collection' },
  { id: 'room-discovery', number: '04', name: 'Gift Finder' },
  { id: 'room-atelier', number: '05', name: 'Bespoke Atelier' },
  { id: 'room-lifestyle', number: '06', name: 'Lifestyle' },
  { id: 'room-finale', number: '07', name: 'Finale' },
];

/**
 * HorizontalExhibition — Good Things Co. Pinned Spatial Experience
 *
 * Implements a world-class horizontal gallery exhibition:
 * - Desktop: Pinned GSAP ScrollTrigger canvas that moves smoothly across 7 curated rooms
 * - Ambient Exhibition HUD with real-time active room indicator & interactive room jumping
 * - Mobile: Seamless, touch-friendly vertical stack with zero clipping
 * - Strict reduced-motion compliance
 */
export const HorizontalExhibition: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  useLayoutEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    const container = containerRef.current;
    const track = trackRef.current;
    const totalPanels = ROOMS.length;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          isMobile: '(max-width: 1023px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop: desktopMode, reduceMotion } = (context.conditions as {
            isDesktop?: boolean;
            isMobile?: boolean;
            reduceMotion?: boolean;
          }) || {};

          setIsDesktop(!!desktopMode && !reduceMotion);

          if (!desktopMode || reduceMotion) {
            gsap.set(track, { clearProps: 'all' });
            return;
          }

          // Desktop Pinned Horizontal Scroll
          const totalDistance = window.innerWidth * (totalPanels - 0.7);

          const tween = gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              pin: true,
              scrub: 1.1,
              start: 'top top',
              end: () => `+=${totalDistance}`,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const index = Math.min(
                  totalPanels - 1,
                  Math.floor(self.progress * totalPanels + 0.05)
                );
                setActiveRoomIndex(index);
              },
            },
          });

          return () => {
            tween.kill();
          };
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollToRoom = (index: number) => {
    if (!containerRef.current || !isDesktop) return;

    const st = ScrollTrigger.getById('horizontal-stage-trigger') || ScrollTrigger.getAll()[0];
    if (st && st.start && st.end) {
      const targetProgress = index / (ROOMS.length - 1);
      const targetScroll = st.start + targetProgress * (st.end - st.start);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      ref={containerRef}
      id="horizontal-stage"
      className="relative w-full overflow-hidden bg-[#FAF8F5]"
      aria-label="Good Things Co. Curated World Exhibition"
    >
      {/* ── Horizontal Track (Desktop: flex-row nowrap / Mobile: flex-col) ── */}
      <div
        ref={trackRef}
        className="flex flex-col lg:flex-row flex-nowrap w-full lg:w-max min-h-screen will-change-transform"
      >
        {/* ── Room 01: Welcome (Hero & Parallax Reveal) ── */}
        <section
          id="room-hero"
          className="w-full lg:w-screen min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-dark/5"
          data-exhibition-room="01"
        >
          <HeroSection />
        </section>

        {/* ── Room 02: Customer Journeys (Spreading Product Decks) ── */}
        <section
          id="room-journeys"
          className="w-full lg:w-[130vw] min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-dark/5 py-16 lg:py-0"
          data-exhibition-room="02"
        >
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <SectionTwo />
          </div>
        </section>

        {/* ── Room 03: Shop the Collection (Continuous Infinite Marquee) ── */}
        <section
          id="room-collection"
          className="w-full lg:w-[120vw] min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-dark/5 py-16 lg:py-0"
          data-exhibition-room="03"
        >
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <SectionThree />
          </div>
        </section>

        {/* ── Room 04: Find the Right Gift (3-Pillar Discovery Experience) ── */}
        <section
          id="room-discovery"
          className="w-full lg:w-screen min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-dark/5 py-16 lg:py-0"
          data-exhibition-room="04"
        >
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <SectionFour />
          </div>
        </section>

        {/* ── Room 05: Bespoke Creation Atelier (Transformation Story) ── */}
        <section
          id="room-atelier"
          className="w-full lg:w-screen min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-dark/5 py-16 lg:py-0"
          data-exhibition-room="05"
        >
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <SectionFive />
          </div>
        </section>

        {/* ── Room 06: Brand Lifestyle Moment ── */}
        <section
          id="room-lifestyle"
          className="w-full lg:w-screen min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-brand-dark/5 py-16 lg:py-0"
          data-exhibition-room="06"
        >
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <SectionSix />
          </div>
        </section>

        {/* ── Room 07: Final CTA & Conclusion ── */}
        <section
          id="room-finale"
          className="w-full lg:w-screen min-h-screen shrink-0 relative flex items-center justify-center overflow-hidden py-16 lg:py-0"
          data-exhibition-room="07"
        >
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <SectionSeven />
          </div>
        </section>
      </div>

      {/* ── Floating Minimal Exhibition Navigation HUD (Desktop Only) ── */}
      {isDesktop && (
        <div
          className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-6 hidden lg:flex items-center justify-between pointer-events-none"
          data-exhibition-hud
        >
          <div className="bg-white/85 backdrop-blur-md border border-brand-dark/10 shadow-[0_10px_30px_rgba(28,20,14,0.08)] px-5 py-2.5 rounded-full flex items-center gap-4 pointer-events-auto mx-auto transition-all duration-300">
            {/* Active Room Indicator */}
            <div className="flex items-center gap-2 pr-2 border-r border-brand-dark/10">
              <span className="font-sans text-[10px] font-bold tracking-widest text-gold-600 uppercase">
                {ROOMS[activeRoomIndex]?.number}
              </span>
              <span className="font-sans text-xs font-semibold text-brand-dark tracking-wide uppercase">
                {ROOMS[activeRoomIndex]?.name}
              </span>
            </div>

            {/* Room Jump Pills */}
            <div className="flex items-center gap-1.5">
              {ROOMS.map((room, idx) => {
                const isActive = activeRoomIndex === idx;
                return (
                  <button
                    key={room.id}
                    onClick={() => scrollToRoom(idx)}
                    className={`h-2 transition-all duration-300 rounded-full cursor-pointer focus:outline-none ${
                      isActive
                        ? 'w-6 bg-brand-dark'
                        : 'w-2 bg-brand-dark/20 hover:bg-brand-dark/50'
                    }`}
                    aria-label={`Jump to Room ${room.number}: ${room.name}`}
                    title={`Room ${room.number}: ${room.name}`}
                  />
                );
              })}
            </div>

            {/* Scroll Hint */}
            <span className="pl-2 font-sans text-[10px] tracking-widest uppercase text-brand-light font-medium">
              Scroll to explore →
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalExhibition;
