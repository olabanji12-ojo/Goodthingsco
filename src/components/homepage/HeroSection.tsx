import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import HeroNav from './HeroNav';
import HeroContent from './HeroContent';
import HeroObject from './HeroObject';

/**
 * HeroSection — Section 1: Object-Led Editorial Hero with GSAP Entrance Animation
 *
 * Sequence:
 * 1. Background settles in (0.0s)
 * 2. Logo & navigation reveal (0.25s)
 * 3. Line-by-line editorial headline reveal (0.55s)
 * 4. Supporting text reveal (1.0s)
 * 5. Primary CTA arrival (1.25s)
 * 6. Hero gift-box object arrival & settling (1.1s -> 2.3s)
 *
 * Respects prefers-reduced-motion automatically.
 */
export const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion || !sectionRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      // Query target elements within scoped hero context
      const bgAmbient = sectionRef.current?.querySelector('[data-hero-element="bg-ambient"]');
      const bgLines = sectionRef.current?.querySelectorAll('[data-hero-element="bg-line"]');
      const logo = sectionRef.current?.querySelector('[data-hero-element="logo"]');
      const navItems = sectionRef.current?.querySelectorAll('[data-hero-element="nav-item"]');
      const mobileToggle = sectionRef.current?.querySelector('[data-hero-element="mobile-menu-toggle"]');
      const headlineLine1 = sectionRef.current?.querySelector('[data-hero-element="headline-line-1"]');
      const headlineLine2 = sectionRef.current?.querySelector('[data-hero-element="headline-line-2"]');
      const subtext = sectionRef.current?.querySelector('[data-hero-element="subtext"]');
      const cta = sectionRef.current?.querySelector('[data-hero-element="primary-cta"]');
      const heroObject = sectionRef.current?.querySelector('[data-hero-element="hero-object-container"]');

      // Set initial hidden states
      if (bgAmbient) gsap.set(bgAmbient, { opacity: 0, scale: 1.02 });
      if (bgLines && bgLines.length > 0) gsap.set(bgLines, { opacity: 0 });
      if (logo) gsap.set(logo, { opacity: 0, y: -10 });
      if (navItems && navItems.length > 0) gsap.set(navItems, { opacity: 0, y: -8 });
      if (mobileToggle) gsap.set(mobileToggle, { opacity: 0, y: -8 });
      if (headlineLine1) gsap.set(headlineLine1, { yPercent: 105, opacity: 0 });
      if (headlineLine2) gsap.set(headlineLine2, { yPercent: 105, opacity: 0 });
      if (subtext) gsap.set(subtext, { opacity: 0, y: 16 });
      if (cta) gsap.set(cta, { opacity: 0, y: 12 });
      if (heroObject) gsap.set(heroObject, { opacity: 0, y: 35, scale: 0.97 });

      // Create master coordinated timeline
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      // ── Stage 1: Background settles in (0.0s) ──
      if (bgAmbient) {
        tl.to(
          bgAmbient,
          {
            opacity: 0.8,
            scale: 1,
            duration: 1.0,
            ease: 'power2.out',
          },
          0
        );
      }

      if (bgLines && bgLines.length > 0) {
        tl.to(
          bgLines,
          {
            opacity: 0.4,
            duration: 0.8,
            stagger: 0.05,
            ease: 'power2.out',
          },
          0.1
        );
      }

      // ── Stage 2: Logo and Navigation (0.25s) ──
      if (logo) {
        tl.to(
          logo,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
          },
          0.25
        );
      }

      if (navItems && navItems.length > 0) {
        tl.to(
          navItems,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.06,
            ease: 'power2.out',
          },
          0.35
        );
      }

      if (mobileToggle) {
        tl.to(
          mobileToggle,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          0.35
        );
      }

      // ── Stage 3: Headline Line-by-Line Editorial Reveal (0.55s) ──
      if (headlineLine1) {
        tl.to(
          headlineLine1,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
          },
          0.55
        );
      }

      if (headlineLine2) {
        tl.to(
          headlineLine2,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
          },
          0.72
        );
      }

      // ── Stage 4: Supporting Copy (1.0s) ──
      if (subtext) {
        tl.to(
          subtext,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
          },
          1.0
        );
      }

      // ── Stage 5: Primary CTA Button (1.25s) ──
      if (cta) {
        tl.to(
          cta,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          1.25
        );
      }

      // ── Stage 6: Hero Gift-Box Object (1.1s -> ~2.25s) ──
      if (heroObject) {
        tl.to(
          heroObject,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.15,
            ease: 'power3.out',
          },
          1.1
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-section="hero"
      className="relative w-full min-h-screen bg-[#FAF8F5] flex flex-col justify-between overflow-hidden pt-2 pb-16 md:pb-24"
      aria-label="Good Things Co. — Thoughtful gifts for inspired living"
    >
      {/* ── Subtle Background Architectural Geometry & Ambient Lighting ── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden -z-0"
        aria-hidden="true"
      >
        {/* Soft Radial Ambient Glow */}
        <div
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] lg:w-[1100px] h-[500px] bg-gradient-to-b from-white/90 via-white/40 to-transparent blur-3xl opacity-80"
          data-hero-element="bg-ambient"
        />

        {/* Faint Architectural Panel Lines */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 pointer-events-none opacity-40">
          <div className="border-r border-brand-dark/[0.03] h-full" data-hero-element="bg-line" />
          <div className="hidden sm:block border-r border-brand-dark/[0.03] h-full sm:col-start-3" data-hero-element="bg-line" />
          <div className="hidden lg:block border-r border-brand-dark/[0.03] h-full lg:col-start-6" data-hero-element="bg-line" />
          <div className="hidden lg:block border-r border-brand-dark/[0.03] h-full lg:col-start-9" data-hero-element="bg-line" />
          <div className="border-r border-brand-dark/[0.03] h-full col-start-4 sm:col-start-6 lg:col-start-12" data-hero-element="bg-line" />
        </div>
      </div>

      {/* ── Top Area: Header & Navigation ── */}
      <HeroNav />

      {/* ── Main Area: Editorial Content & Focal Product Object ── */}
      <div className="flex-1 flex flex-col justify-center items-center w-full pt-4 md:pt-8 lg:pt-10 z-10">
        {/* Center Upper: Headline, Subtext & CTA */}
        <HeroContent />

        {/* Center Lower: Dominant Hero Object */}
        <HeroObject />
      </div>
    </section>
  );
};

export default HeroSection;
