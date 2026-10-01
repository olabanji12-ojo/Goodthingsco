import React, { useState, useRef, useEffect } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { JourneyCardItem } from './types';

interface CardStackProps {
  cards: [JourneyCardItem, JourneyCardItem, JourneyCardItem];
  journeyId: string;
}

/**
 * CardStack — Touch & Desktop Responsive 3-Card Editorial Product Stack
 *
 * Mobile/Touch Flow:
 * 1. Initial State: Neat stacked deck of 3 cards with visible edges.
 * 2. 1st Tap (on stack): Expands horizontally into all 3 pictures side-by-side so all items are fully visible.
 * 3. 2nd Tap (on any of the 3 pictures): Clicks through directly to the chosen product/collection.
 * 4. Tap outside: Smoothly collapses back into the resting stack.
 *
 * Desktop Mouse Flow:
 * - Hover over stack: Expands all 3 cards side-by-side.
 * - Hover over card: Spotlights that card.
 * - Click card: Direct navigation.
 */
export const CardStack: React.FC<CardStackProps> = ({ cards, journeyId }) => {
  const [card1, card2, card3] = cards;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLAnchorElement>(null);
  const card2Ref = useRef<HTMLAnchorElement>(null);
  const card3Ref = useRef<HTMLAnchorElement>(null);

  const targetHref = `/${journeyId.toLowerCase()}`;

  // Calculate responsive spread distance based on viewport width
  const getSpreadDistance = () => {
    if (typeof window === 'undefined') return 160;
    const width = window.innerWidth;
    if (width < 380) return 85;
    if (width < 480) return 100;
    if (width < 768) return 120;
    if (width < 1024) return 145;
    return 175;
  };

  // 1. Resting Stack Layout (Collapsed)
  const applyRestingState = (duration = 0.6) => {
    if (!card1Ref.current || !card2Ref.current || !card3Ref.current) return;

    gsap.to(card1Ref.current, {
      x: -32,
      y: -8,
      rotate: -8,
      scale: 0.95,
      opacity: 0.95,
      zIndex: 10,
      duration,
      ease: 'power3.out',
      overwrite: 'auto',
    });

    gsap.to(card2Ref.current, {
      x: 0,
      y: 0,
      rotate: 2,
      scale: 0.98,
      opacity: 1,
      zIndex: 20,
      duration,
      ease: 'power3.out',
      overwrite: 'auto',
    });

    gsap.to(card3Ref.current, {
      x: 32,
      y: 10,
      rotate: 10,
      scale: 1,
      opacity: 1,
      zIndex: 30,
      duration,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  // 2. Expanded 3-Picture Spread Layout (Reveals all 3 images)
  const applyExpandedState = (duration = 0.6) => {
    if (!card1Ref.current || !card2Ref.current || !card3Ref.current) return;

    const spreadDist = getSpreadDistance();

    // Card 1: Left
    gsap.to(card1Ref.current, {
      x: -spreadDist,
      y: -10,
      rotate: -3,
      scale: 1.0,
      opacity: 1,
      zIndex: 15,
      duration,
      ease: 'power3.out',
      overwrite: 'auto',
    });

    // Card 2: Center
    gsap.to(card2Ref.current, {
      x: 0,
      y: -22,
      rotate: 0,
      scale: 1.03,
      opacity: 1,
      zIndex: 25,
      duration,
      ease: 'power3.out',
      overwrite: 'auto',
    });

    // Card 3: Right
    gsap.to(card3Ref.current, {
      x: spreadDist,
      y: -10,
      rotate: 3,
      scale: 1.0,
      opacity: 1,
      zIndex: 35,
      duration,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  // Initial mount state
  useEffect(() => {
    applyRestingState(0);
  }, []);

  // Sync animation when isExpanded changes
  useEffect(() => {
    if (prefersReducedMotion()) return;

    if (isExpanded) {
      applyExpandedState(0.55);
    } else {
      applyRestingState(0.6);
    }
  }, [isExpanded]);

  // Click outside listener to collapse expanded stack on mobile
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isExpanded]);

  // Desktop Mouse Hover Handlers
  const handleContainerMouseEnter = () => {
    if (prefersReducedMotion() || window.innerWidth < 1024) return;
    setIsExpanded(true);
  };

  const handleContainerMouseLeave = () => {
    if (prefersReducedMotion() || window.innerWidth < 1024) return;
    setIsExpanded(false);
  };

  const handleCardMouseEnter = (cardIndex: 1 | 2 | 3) => {
    if (prefersReducedMotion() || window.innerWidth < 1024) return;
    if (!card1Ref.current || !card2Ref.current || !card3Ref.current) return;

    const refs = { 1: card1Ref.current, 2: card2Ref.current, 3: card3Ref.current };
    const target = refs[cardIndex];
    const siblings = [card1Ref.current, card2Ref.current, card3Ref.current].filter((c) => c !== target);

    gsap.to(target, {
      y: cardIndex === 2 ? -36 : -24,
      scale: 1.09,
      opacity: 1,
      zIndex: 50,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    gsap.to(siblings, {
      opacity: 0.85,
      scale: 0.97,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const handleCardMouseLeave = () => {
    if (prefersReducedMotion() || window.innerWidth < 1024) return;
    applyExpandedState(0.4);
  };

  // Mobile Tap Handler:
  // - If stack is collapsed: 1st tap expands all 3 pictures.
  // - If stack is already expanded: tap on a picture opens its link!
  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, _cardIndex: 1 | 2 | 3) => {
    const isMobileOrTouch = window.innerWidth < 1024;

    if (isMobileOrTouch && !isExpanded) {
      // 1st Tap: Expand and show all 3 pictures side-by-side
      e.preventDefault();
      setIsExpanded(true);
      return;
    }

    // 2nd Tap (or desktop click): Natural navigation proceeds to target link
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      <div
        ref={containerRef}
        onMouseEnter={handleContainerMouseEnter}
        onMouseLeave={handleContainerMouseLeave}
        className="relative w-full max-w-[420px] sm:max-w-[480px] md:max-w-[540px] lg:max-w-[620px] h-[340px] sm:h-[400px] md:h-[440px] lg:h-[480px] flex items-center justify-center p-2 sm:p-4 select-none cursor-pointer"
        data-card-stack={journeyId}
        aria-label={`${journeyId} collection visual cards`}
      >
        {/* ── Card 1: Left Picture ── */}
        <a
          href={targetHref}
          ref={card1Ref}
          onClick={(e) => handleCardClick(e, 1)}
          onMouseEnter={() => handleCardMouseEnter(1)}
          onMouseLeave={handleCardMouseLeave}
          className={`group/card absolute w-[130px] sm:w-[170px] md:w-[210px] lg:w-[245px] aspect-[3/4.2] rounded-2xl overflow-hidden bg-brand-cream/90 shadow-[0_12px_28px_rgba(28,20,14,0.14)] hover:shadow-[0_24px_50px_rgba(28,20,14,0.24)] border border-white/70 hover:border-white transition-shadow duration-500 ease-premium will-change-transform block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
            isExpanded ? 'shadow-[0_20px_45px_rgba(28,20,14,0.22)]' : ''
          }`}
          data-card-index="1"
          data-card-role="back"
          data-card-id={card1.id}
          aria-label={`${card1.title || card1.alt} — Explore ${journeyId}`}
        >
          <img
            src={card1.src}
            alt={card1.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 ease-premium group-hover/card:scale-105"
            draggable={false}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />

          {/* Product Title Pill */}
          <div
            className={`absolute bottom-2 inset-x-2 sm:bottom-2.5 sm:inset-x-2.5 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-black/5 flex items-center justify-between shadow-sm transition-all duration-300 ${
              isExpanded
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0'
            }`}
          >
            <span className="font-sans text-[10px] sm:text-[11px] font-medium text-brand-dark tracking-tight truncate max-w-[80px] sm:max-w-[110px]">
              {card1.title || 'Curated Piece'}
            </span>
            <span className="font-sans text-[9px] sm:text-[10px] uppercase font-bold text-gold-600 tracking-wider">
              Shop →
            </span>
          </div>
        </a>

        {/* ── Card 2: Center Picture ── */}
        <a
          href={targetHref}
          ref={card2Ref}
          onClick={(e) => handleCardClick(e, 2)}
          onMouseEnter={() => handleCardMouseEnter(2)}
          onMouseLeave={handleCardMouseLeave}
          className={`group/card absolute w-[130px] sm:w-[170px] md:w-[210px] lg:w-[245px] aspect-[3/4.2] rounded-2xl overflow-hidden bg-brand-cream/90 shadow-[0_16px_36px_rgba(28,20,14,0.16)] hover:shadow-[0_28px_55px_rgba(28,20,14,0.26)] border border-white/70 hover:border-white transition-shadow duration-500 ease-premium will-change-transform block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
            isExpanded ? 'shadow-[0_24px_50px_rgba(28,20,14,0.24)]' : ''
          }`}
          data-card-index="2"
          data-card-role="middle"
          data-card-id={card2.id}
          aria-label={`${card2.title || card2.alt} — Explore ${journeyId}`}
        >
          <img
            src={card2.src}
            alt={card2.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 ease-premium group-hover/card:scale-105"
            draggable={false}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />

          {/* Product Title Pill */}
          <div
            className={`absolute bottom-2 inset-x-2 sm:bottom-2.5 sm:inset-x-2.5 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-black/5 flex items-center justify-between shadow-sm transition-all duration-300 ${
              isExpanded
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0'
            }`}
          >
            <span className="font-sans text-[10px] sm:text-[11px] font-medium text-brand-dark tracking-tight truncate max-w-[80px] sm:max-w-[110px]">
              {card2.title || 'Curated Piece'}
            </span>
            <span className="font-sans text-[9px] sm:text-[10px] uppercase font-bold text-gold-600 tracking-wider">
              Shop →
            </span>
          </div>
        </a>

        {/* ── Card 3: Right Picture ── */}
        <a
          href={targetHref}
          ref={card3Ref}
          onClick={(e) => handleCardClick(e, 3)}
          onMouseEnter={() => handleCardMouseEnter(3)}
          onMouseLeave={handleCardMouseLeave}
          className={`group/card absolute w-[130px] sm:w-[170px] md:w-[210px] lg:w-[245px] aspect-[3/4.2] rounded-2xl overflow-hidden bg-brand-cream/90 shadow-[0_20px_44px_rgba(28,20,14,0.20)] hover:shadow-[0_32px_60px_rgba(28,20,14,0.30)] border border-white/80 hover:border-white transition-shadow duration-500 ease-premium will-change-transform block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
            isExpanded ? 'shadow-[0_24px_50px_rgba(28,20,14,0.24)]' : ''
          }`}
          data-card-index="3"
          data-card-role="front"
          data-card-id={card3.id}
          aria-label={`${card3.title || card3.alt} — Explore ${journeyId}`}
        >
          <img
            src={card3.src}
            alt={card3.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 ease-premium group-hover/card:scale-105"
            draggable={false}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />

          {/* Product Title Pill */}
          <div
            className={`absolute bottom-2 inset-x-2 sm:bottom-2.5 sm:inset-x-2.5 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-black/5 flex items-center justify-between shadow-sm transition-all duration-300 ${
              isExpanded
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0'
            }`}
          >
            <span className="font-sans text-[10px] sm:text-[11px] font-medium text-brand-dark tracking-tight truncate max-w-[80px] sm:max-w-[110px]">
              {card3.title || 'Curated Piece'}
            </span>
            <span className="font-sans text-[9px] sm:text-[10px] uppercase font-bold text-gold-600 tracking-wider">
              Shop →
            </span>
          </div>
        </a>
      </div>

      {/* Mobile Touch Guidance Indicator */}
      <div className="lg:hidden mt-2 text-center flex items-center justify-center gap-2">
        <span className="font-sans text-[11px] text-brand-light tracking-wide uppercase">
          {isExpanded ? 'Tap any piece to explore' : 'Tap to reveal pieces'}
        </span>
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-[10px] uppercase font-semibold text-brand-dark/60 hover:text-brand-dark px-2 py-0.5 rounded bg-black/5 cursor-pointer ml-1"
          >
            Close ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default CardStack;

