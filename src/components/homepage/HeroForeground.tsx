/**
 * HeroForeground — Layer 4
 *
 * The gift/table composition that sits in the foreground.
 * Positioned at the bottom of the viewport to ground the scene.
 *
 * This layer will later support:
 * - Subtle parallax (moves faster than background on scroll)
 * - Entrance animation (rises into view)
 */

interface HeroForegroundProps {
  className?: string;
  /** Which foreground variant to use */
  variant?: 'a' | 'b';
}

export default function HeroForeground({ className = '', variant = 'a' }: HeroForegroundProps) {
  const src = variant === 'a'
    ? '/images/homepage/hero/foreground/gift-table-a.png'
    : '/images/homepage/hero/foreground/gift-table-b.png';

  return (
    <div
      className={`hero-layer z-foreground flex items-end justify-center ${className}`}
      aria-hidden="true"
      data-hero-layer="foreground"
    >
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        className="w-full max-w-[1400px] h-auto object-contain object-bottom"
        style={{ maxHeight: '55vh' }}
        draggable={false}
      />
    </div>
  );
}
