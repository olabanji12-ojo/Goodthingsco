/**
 * HeroBackground — Layer 1
 *
 * The warm interior scene that sits behind everything.
 * Will later support subtle parallax scrolling (background
 * moves slower than foreground).
 */

interface HeroBackgroundProps {
  className?: string;
}

export default function HeroBackground({ className = '' }: HeroBackgroundProps) {
  return (
    <div
      className={`hero-layer z-background ${className}`}
      aria-hidden="true"
      data-hero-layer="background"
    >
      <img
        src="/images/homepage/hero/background/hero-interior.png"
        alt=""
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover object-center"
        draggable={false}
      />
      {/* Subtle warm gradient overlay to unify the scene */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-ivory/10 via-transparent to-brand-dark/20 pointer-events-none" />
    </div>
  );
}
