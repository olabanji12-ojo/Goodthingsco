/**
 * HeroOverlay — Layer 5
 *
 * Optional decorative foreground overlay (floral/botanical elements).
 * Sits above the foreground but below the text content.
 *
 * Positioned in the bottom-left corner to frame the scene
 * without obstructing the headline or CTAs.
 */

interface HeroOverlayProps {
  className?: string;
}

export default function HeroOverlay({ className = '' }: HeroOverlayProps) {
  return (
    <div
      className={`hero-layer z-overlay pointer-events-none ${className}`}
      aria-hidden="true"
      data-hero-layer="overlay"
    >
      <img
        src="/images/homepage/hero/overlays/floral-overlay.png"
        alt=""
        loading="eager"
        decoding="async"
        className="absolute bottom-0 left-0 w-full h-auto object-contain object-bottom-left opacity-80"
        style={{ maxHeight: '45vh' }}
        draggable={false}
      />
    </div>
  );
}
