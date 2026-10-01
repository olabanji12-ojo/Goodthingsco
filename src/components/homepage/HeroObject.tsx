import React from 'react';
import giftHeroImg from '../../assets/gift-hero.png';

interface HeroObjectProps {
  className?: string;
  imgClassName?: string;
}

/**
 * HeroObject — Dominant Centered Product Focal Point
 *
 * Renders the hero gift box object with data-hero-element="hero-object-container"
 * for GSAP timeline entrance animation.
 */
export const HeroObject: React.FC<HeroObjectProps> = ({
  className = '',
  imgClassName = '',
}) => {
  return (
    <div
      className={`relative w-full mx-auto px-4 sm:px-6 flex items-center justify-center z-20 select-none will-change-transform ${
        className || 'max-w-4xl lg:max-w-5xl xl:max-w-[1020px] mt-6 sm:mt-8 md:mt-10'
      }`}
      data-hero-element="hero-object-container"
    >
      {/* ── Subtle Ambient Backdrop Arch/Glow ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] sm:w-[65%] aspect-square rounded-full bg-gradient-to-b from-white/80 via-gold-100/25 to-transparent blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* ── Main Hero Gift Box Image ── */}
      <div
        className="relative w-full overflow-visible flex items-center justify-center"
        data-hero-element="hero-image-wrapper"
      >
        <img
          src={giftHeroImg}
          alt="Curated Good Things Co. signature gift box with golden silk ribbon and botanical accents"
          loading="eager"
          decoding="async"
          className={`w-full h-auto object-contain object-center drop-shadow-[0_20px_35px_rgba(28,20,14,0.08)] pointer-events-none ${
            imgClassName || 'max-h-[480px] sm:max-h-[540px] md:max-h-[620px] lg:max-h-[680px]'
          }`}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default HeroObject;
