/**
 * HeroCurtains — Layers 2 & 3
 *
 * Left and right curtain panels. Each is an independent element
 * so they can be animated to "open" from the centre outwards.
 *
 * Initial state (before animation): curtains closed, covering the scene.
 * Animated state: curtains slide apart to reveal the background.
 *
 * For the structural setup, curtains are positioned but visible —
 * animations will be layered in later.
 */

interface HeroCurtainsProps {
  className?: string;
}

export default function HeroCurtains({ className = '' }: HeroCurtainsProps) {
  return (
    <>
      {/* Left curtain — positioned slightly outward for an open, spacious framing */}
      <div
        className={`hero-layer z-curtain -translate-x-[12%] md:-translate-x-[16%] transition-transform duration-700 ${className}`}
        aria-hidden="true"
        data-hero-layer="curtain-left"
      >
        <img
          src="/images/homepage/hero/curtains/curtain-left.png"
          alt=""
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-left"
          draggable={false}
        />
      </div>

      {/* Right curtain — positioned slightly outward for an open, spacious framing */}
      <div
        className={`hero-layer z-curtain translate-x-[12%] md:translate-x-[16%] transition-transform duration-700 ${className}`}
        aria-hidden="true"
        data-hero-layer="curtain-right"
      >
        <img
          src="/images/homepage/hero/curtains/curtain-right.png"
          alt=""
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-right"
          draggable={false}
        />
      </div>
    </>
  );
}
