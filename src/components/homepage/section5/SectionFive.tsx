import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { createStorySteps, bespokeCategoryTags } from './createData';
import CreateStoryContent from './CreateStoryContent';
import CreateStoryTriptych from './CreateStoryTriptych';

/**
 * SectionFive — Create Something Special (Section 5)
 *
 * Choreography (ScrollTrigger Storytelling Transformation):
 * 1. Editorial Header (Eyebrow -> Heading -> Description -> Tag Pills) reveals smoothly.
 * 2. Step 1 (Before): Image arrives as the unadorned foundation canvas (opacity 0 -> 1, y: 30px -> 0, scale: 0.98 -> 1).
 * 3. Step 2 (Crafted): Image arrives as the active tailoring process (opacity 0 -> 1, y: 40px -> 0, scale: 0.97 -> 1).
 * 4. Step 3 (Finished): Dominant payoff image arrives with grand presence (opacity 0 -> 1, y: 50px -> 0, scale: 0.95 -> 1).
 * 5. Primary CTA arrives once the visual story is established.
 *
 * Respects prefers-reduced-motion and responsive mobile viewports.
 */
interface SectionFiveProps {
  className?: string;
}

export const SectionFive: React.FC<SectionFiveProps> = ({ className = '' }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const section = sectionRef.current;
    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector('[data-story-element="eyebrow"]');
      const heading = section.querySelector('[data-story-element="heading"]');
      const desc = section.querySelector('[data-story-element="description"]');
      const tags = section.querySelectorAll('[data-story-element="tag-pill"]');
      const cta = section.querySelector('[data-story-element="cta"]');

      const beforeFrame = section.querySelector('[data-story-frame="before"]');
      const beforeCaption = section.querySelector('[data-story-caption="before"]');

      const craftedFrame = section.querySelector('[data-story-frame="crafted"]');
      const craftedCaption = section.querySelector('[data-story-caption="crafted"]');

      const finishedFrame = section.querySelector('[data-story-frame="finished"]');
      const finishedCaption = section.querySelector('[data-story-caption="finished"]');

      // Set initial hidden staging states
      if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 16 });
      if (heading) gsap.set(heading, { opacity: 0, y: 22 });
      if (desc) gsap.set(desc, { opacity: 0, y: 18 });
      if (tags && tags.length > 0) gsap.set(tags, { opacity: 0, y: 14 });
      if (cta) gsap.set(cta, { opacity: 0, y: 14, scale: 0.98 });

      if (beforeFrame) gsap.set(beforeFrame, { opacity: 0, y: 30, scale: 0.98 });
      if (beforeCaption) gsap.set(beforeCaption, { opacity: 0, y: 10 });

      if (craftedFrame) gsap.set(craftedFrame, { opacity: 0, y: 40, scale: 0.97 });
      if (craftedCaption) gsap.set(craftedCaption, { opacity: 0, y: 10 });

      if (finishedFrame) gsap.set(finishedFrame, { opacity: 0, y: 50, scale: 0.95 });
      if (finishedCaption) gsap.set(finishedCaption, { opacity: 0, y: 10 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        defaults: { ease: 'power3.out' },
      });

      // ── 1. Section Header Sequence ──
      if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0);
      if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, 0.08);
      if (desc) tl.to(desc, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.18);
      if (tags && tags.length > 0) {
        tl.to(tags, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'power2.out' }, 0.26);
      }

      // ── 2. Step 1 — Before (0.35s) ──
      if (beforeFrame) {
        tl.to(
          beforeFrame,
          { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out' },
          0.35
        );
      }
      if (beforeCaption) {
        tl.to(beforeCaption, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.55);
      }

      // ── 3. Step 2 — Crafted (0.60s) ──
      if (craftedFrame) {
        tl.to(
          craftedFrame,
          { opacity: 1, y: 0, scale: 1, duration: 0.90, ease: 'power3.out' },
          0.60
        );
      }
      if (craftedCaption) {
        tl.to(craftedCaption, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.80);
      }

      // ── 4. Step 3 — Finished (0.88s) — The Grand Payoff ──
      if (finishedFrame) {
        tl.to(
          finishedFrame,
          { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power3.out' },
          0.88
        );
      }
      if (finishedCaption) {
        tl.to(finishedCaption, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 1.10);
      }

      // ── 5. Primary CTA Arrival (1.25s) ──
      if (cta) {
        tl.to(
          cta,
          { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power2.out' },
          1.25
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="create-special"
      data-section="create-special"
      className={`relative w-full bg-[#FAF8F5] py-24 md:py-32 lg:py-40 overflow-hidden border-t border-brand-dark/5 ${className}`}
      aria-label="Create Something Special — Custom and Bespoke Gifting"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20 flex flex-col items-center">
        {/* ── Editorial Header Content ── */}
        <CreateStoryContent tags={bespokeCategoryTags} />

        {/* ── Asymmetrical 3-Image Story Triptych: Before → Crafted → Finished ── */}
        <CreateStoryTriptych steps={createStorySteps} />
      </div>
    </section>
  );
};

export default SectionFive;
