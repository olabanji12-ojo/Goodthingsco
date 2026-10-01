import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import { DiscoveryItem } from './types';

interface GiftDiscoveryImageProps {
  item: DiscoveryItem;
}

/**
 * GiftDiscoveryImage — Editorial Crossfade Image Showcase
 *
 * Choreography:
 * - Outgoing image: softens and drifts subtly (opacity 1 -> 0, x: 0 -> -16px, scale: 1 -> 0.985)
 * - Incoming image: gently arrives with scale correction (opacity 0 -> 1, x: 16px -> 0, scale: 1.02 -> 1)
 * - Caption: soft upward fade (opacity 0 -> 1, y: 12px -> 0)
 * - Rapid clicking: cleanly handled with GSAP auto-overwrite (zero stuck queue)
 * - Accessibility: respects prefers-reduced-motion
 */
export const GiftDiscoveryImage: React.FC<GiftDiscoveryImageProps> = ({ item }) => {
  const [displayItem, setDisplayItem] = useState<DiscoveryItem>(item);
  const [prevItem, setPrevItem] = useState<DiscoveryItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentLayerRef = useRef<HTMLDivElement>(null);
  const prevLayerRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item.id === displayItem.id) return;

    if (prefersReducedMotion()) {
      setDisplayItem(item);
      setPrevItem(null);
      return;
    }

    setPrevItem(displayItem);
    setDisplayItem(item);
  }, [item, displayItem]);

  useLayoutEffect(() => {
    if (!prevItem) return;

    const isMobile = window.innerWidth < 1024;
    const shiftX = isMobile ? 10 : 16;

    // Incoming Image Layer Animation
    if (currentLayerRef.current) {
      gsap.fromTo(
        currentLayerRef.current,
        {
          opacity: 0,
          x: shiftX,
          scale: 1.02,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: 'auto',
        }
      );
    }

    // Outgoing Image Layer Animation
    if (prevLayerRef.current) {
      gsap.fromTo(
        prevLayerRef.current,
        {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        {
          opacity: 0,
          x: -shiftX,
          scale: 0.985,
          duration: 0.38,
          ease: 'power2.out',
          overwrite: 'auto',
          onComplete: () => {
            setPrevItem(null);
          },
        }
      );
    }

    // Floating Caption Text Animation
    if (captionRef.current) {
      gsap.fromTo(
        captionRef.current,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.48,
          ease: 'power3.out',
          overwrite: 'auto',
        }
      );
    }
  }, [displayItem, prevItem]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[540px] lg:max-w-[580px] xl:max-w-[620px] aspect-[4/5] rounded-3xl overflow-hidden bg-brand-cream shadow-[0_20px_48px_rgba(28,20,14,0.14)] border border-white/80 group select-none"
      data-discovery-element="image-container"
      data-discovery-active-id={displayItem.id}
    >
      {/* ── Previous Image Layer (Outgoing) ── */}
      {prevItem && (
        <div
          ref={prevLayerRef}
          className="absolute inset-0 w-full h-full z-0 pointer-events-none will-change-transform"
          aria-hidden="true"
        >
          <img
            src={prevItem.image}
            alt={prevItem.title}
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        </div>
      )}

      {/* ── Active Image Layer (Incoming / Current) ── */}
      <div
        ref={currentLayerRef}
        className="absolute inset-0 w-full h-full z-10 will-change-transform"
      >
        <img
          src={displayItem.image}
          alt={displayItem.title}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
          draggable={false}
        />
      </div>

      {/* ── Soft Bottom Gradient Scrim for Readability ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-brand-dark/85 via-brand-dark/30 to-transparent pointer-events-none z-20"
        aria-hidden="true"
      />

      {/* ── Floating Editorial Caption Card ── */}
      <div
        ref={captionRef}
        className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10 flex flex-col justify-end text-left z-30 pointer-events-none"
      >
        <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-gold-300 mb-2 block">
          {displayItem.groupName}
        </span>

        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-normal tracking-tight mb-2">
          {displayItem.title}
        </h3>

        <p className="font-sans text-xs sm:text-sm text-white/85 line-clamp-2 mb-6 max-w-md leading-relaxed">
          {displayItem.subtitle}
        </p>

        <div className="pointer-events-auto">
          <a
            href={displayItem.href}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/95 hover:bg-white text-brand-dark font-sans text-xs font-semibold tracking-[0.16em] uppercase rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group-hover:bg-gold-400 group-hover:text-brand-dark"
          >
            <span>{displayItem.ctaText || 'Explore Gifts'}</span>
            <span
              className="text-sm transition-transform duration-300 ease-premium group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        </div>
      </div>

      {/* ── Inset Ring Highlight ── */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/10 pointer-events-none z-40" />
    </div>
  );
};

export default GiftDiscoveryImage;
