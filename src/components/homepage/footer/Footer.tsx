import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';
import logoWhiteImg from '../../../assets/branding/logo-white.png';

/**
 * Footer — Good Things Co.
 *
 * Visual Direction:
 * - Deep muted olive-brown background (#3F4634)
 * - Warm ivory text (#F5F0E8) and muted secondary text (#CFC7B8)
 * - Navigation contains ONLY the links that the navbar has:
 *   1. Shop
 *   2. Corporate
 *   3. Create
 *   4. About
 */
export const Footer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Corporate', href: '/corporate' },
    { label: 'Create', href: '/create' },
    { label: 'About', href: '/about' },
  ];

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !footerRef.current) return;

    const footer = footerRef.current;
    const ctx = gsap.context(() => {
      const elements = footer.querySelectorAll('[data-footer-animate]');

      if (elements && elements.length > 0) {
        gsap.set(elements, { opacity: 0, y: 14 });

        gsap.to(elements, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="site-footer"
      data-section="footer"
      className={`bg-[#3F4634] text-[#F5F0E8] pt-14 pb-10 sm:pt-16 sm:pb-12 md:pt-20 md:pb-14 border-t border-brand-dark/10 overflow-hidden select-none w-full ${className}`}
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-10 pb-10 sm:pb-12 border-b border-[#F5F0E8]/15">
          {/* ── Brand & Tagline ── */}
          <div className="flex flex-col items-start max-w-md" data-footer-animate>
            <Link
              to="/"
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 mb-4"
              aria-label="Good Things Co. Home"
            >
              <img
                src={logoWhiteImg}
                alt="Good Things Co."
                className="h-8 sm:h-9 md:h-10 w-auto object-contain opacity-95"
                loading="eager"
                draggable={false}
              />
            </Link>

            <p className="font-serif text-xl sm:text-2xl text-[#F5F0E8] font-normal tracking-tight mb-2 leading-snug">
              Thoughtful gifts for inspired living.
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#CFC7B8] leading-relaxed">
              Curated gifts crafted with intention for individuals and organisations.
            </p>
          </div>

          {/* ── Navigation Links (Strictly the navbar links: Shop | Corporate | Create | About) ── */}
          <nav aria-label="Footer Navigation" data-footer-animate>
            <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-[#CFC7B8] mb-3.5 block">
              Navigation
            </span>
            <ul className="flex flex-wrap items-center gap-5 sm:gap-8 md:gap-10">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-sans text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-[#F5F0E8]/85 hover:text-[#F5F0E8] transition-colors py-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Sub-Footer: Copyright Only ── */}
        <div
          className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#CFC7B8]"
          data-footer-animate
        >
          <p>© {currentYear} Good Things Co. All rights reserved.</p>
          <p className="text-xs text-[#CFC7B8]/70">Curated Gift Atelier</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
