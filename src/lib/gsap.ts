/**
 * GSAP Setup — Good Things Co. Refinement
 *
 * Registers ScrollTrigger and provides a helper to check
 * prefers-reduced-motion before running animations.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Default GSAP easing for the editorial, premium feel.
 * - 'power3.out' for entrances (smooth deceleration)
 * - 'power2.inOut' for transitions (balanced)
 * - Custom cubic-bezier via CustomEase if needed later
 */
export const EASE = {
  entrance: 'power3.out',
  transition: 'power2.inOut',
  curtain: 'power4.inOut',
  subtle: 'power1.out',
} as const;

/**
 * Check whether the user prefers reduced motion.
 * GSAP animations should call this before running.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Refresh ScrollTrigger — call after layout changes or images load.
 */
export function refreshScrollTrigger(): void {
  ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger };
