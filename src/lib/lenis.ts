/**
 * Lenis Smooth Scroll Setup — Good Things Co. Refinement
 *
 * Provides a React hook that initialises Lenis, syncs it with
 * GSAP's ScrollTrigger, and cleans up on unmount.
 *
 * Design principles:
 * - Lenis improves smoothness, does NOT hijack scroll
 * - Native accessibility and keyboard navigation preserved
 * - Respects prefers-reduced-motion
 */
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Don't initialise smooth scrolling if user prefers reduced motion
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.2,            // Smooth but not sluggish
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
      touchMultiplier: 2,       // Good mobile feel
      infinite: false,          // No infinite scroll
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP's ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP's ticker to drive Lenis (single rAF loop)
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000); // GSAP time is in seconds, Lenis expects ms
    };
    gsap.ticker.add(tickerCallback);

    // Disable Lenis's own rAF since GSAP is driving it
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
