import React, { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { CollectionRowProps } from './types';
import CategoryCard from './CategoryCard';

/**
 * CollectionRow — Continuous Infinite Marquee Track
 *
 * Choreography:
 * - Row 1 (rowNumber === 1): moves continuously to the LEFT (xPercent: 0 -> -50)
 * - Row 2 (rowNumber === 2): moves continuously to the RIGHT (xPercent: -50 -> 0)
 * - Continuous, calm, linear loop with zero snapping.
 * - On hover: smoothly decelerates to 25% speed for effortless reading & clicking.
 * - Respects prefers-reduced-motion.
 */
export const CollectionRow: React.FC<CollectionRowProps> = ({
  id,
  categories,
  rowNumber,
  offsetClass = '',
}) => {
  const isRow1 = rowNumber === 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    if (!trackRef.current || !containerRef.current) return;

    if (prefersReducedMotion()) {
      return;
    }

    const track = trackRef.current;
    const startX = isRow1 ? 0 : -50;
    const targetX = isRow1 ? -50 : 0;
    const duration = isRow1 ? 40 : 44;

    gsap.set(track, { xPercent: startX });

    const tween = gsap.to(track, {
      xPercent: targetX,
      duration: duration,
      ease: 'none',
      repeat: -1,
    });

    tweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, [isRow1]);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale: 0.25,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale: 1.0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  };

  // 4 identical sets: Sets 1+2 form 50%, Sets 3+4 form 50% for flawless 4K/5K infinite coverage
  const set1 = categories;
  const set2 = categories;
  const set3 = categories;
  const set4 = categories;

  return (
    <div
      ref={containerRef}
      id={id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full overflow-hidden py-3 select-none ${offsetClass}`}
      data-collection-row={rowNumber}
      data-row-id={id}
    >
      <div
        ref={trackRef}
        className="flex items-center gap-6 sm:gap-7 md:gap-8 w-max will-change-transform"
        data-row-track={`track-${rowNumber}`}
      >
        {/* Set 1: Primary Accessible Cards */}
        {set1.map((category) => (
          <CategoryCard
            key={`s1-${category.id}`}
            category={category}
            isDuplicate={false}
          />
        ))}

        {/* Set 2: Half 1 Duplicates */}
        {set2.map((category, idx) => (
          <CategoryCard
            key={`s2-${category.id}-${idx}`}
            category={category}
            isDuplicate={true}
          />
        ))}

        {/* Set 3: Half 2 Duplicates */}
        {set3.map((category, idx) => (
          <CategoryCard
            key={`s3-${category.id}-${idx}`}
            category={category}
            isDuplicate={true}
          />
        ))}

        {/* Set 4: Half 2 Duplicates */}
        {set4.map((category, idx) => (
          <CategoryCard
            key={`s4-${category.id}-${idx}`}
            category={category}
            isDuplicate={true}
          />
        ))}
      </div>
    </div>
  );
};

export default CollectionRow;
