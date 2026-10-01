import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';

/**
 * Footer — Good Things Co.
 *
 * Visual Direction:
 * - Deep muted olive-brown background (#3F4634)
 * - Warm ivory text (#F5F0E8) and muted secondary text (#CFC7B8)
 * - Clean, functional 4-column responsive layout on desktop
 * - Restrained typography, subtle hover states, and smooth entrance animation
 */
export const Footer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !footerRef.current) return;

    const footer = footerRef.current;
    const ctx = gsap.context(() => {
      const columns = footer.querySelectorAll('[data-footer-column]');
      const subfooter = footer.querySelector('[data-footer-element="subfooter"]');

      if (columns && columns.length > 0) {
        gsap.set(columns, { opacity: 0, y: 12 });
      }
      if (subfooter) {
        gsap.set(subfooter, { opacity: 0, y: 8 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        defaults: { ease: 'power2.out' },
      });

      if (columns && columns.length > 0) {
        tl.to(
          columns,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: 'power2.out',
          },
          0
        );
      }

      if (subfooter) {
        tl.to(
          subfooter,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
          },
          0.32
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="site-footer"
      data-section="footer"
      className={`bg-[#3F4634] text-[#F5F0E8] pt-20 pb-12 md:pt-24 md:pb-16 border-t border-brand-dark/10 overflow-hidden select-none w-full ${className}`}
      aria-label="Site Footer"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        {/* ── Main 4-Column Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 sm:gap-10 lg:gap-12">
          {/* ── Column 1: Brand & Ethos (lg:col-span-4) ── */}
          <div
            className="sm:col-span-2 lg:col-span-4 flex flex-col items-start text-left will-change-transform"
            data-footer-column="brand"
          >
            <Link
              to="/"
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Good Things Co. Home"
            >
              <img
                src="/images/branding/logo.png"
                alt="Good Things Co."
                className="h-9 md:h-10 w-auto object-contain brightness-0 invert opacity-95"
                loading="lazy"
                draggable={false}
              />
            </Link>

            <p className="font-serif text-lg sm:text-xl text-[#F5F0E8] font-normal tracking-tight mt-5 mb-2 leading-snug">
              Thoughtful gifts for inspired living.
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#CFC7B8] leading-relaxed max-w-sm">
              Beautiful things for giving, living and celebrating.
            </p>
          </div>

          {/* ── Column 2: Gifting (lg:col-span-2) ── */}
          <div
            className="lg:col-span-2 flex flex-col items-start text-left will-change-transform"
            data-footer-column="shop"
          >
            <span className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#CFC7B8] mb-5 block">
              Gifting
            </span>
            <ul className="space-y-3">
              {[
                { label: 'Shop Gifts', href: '/shop' },
                { label: 'Corporate Gifting', href: '/corporate' },
                { label: 'Create Bespoke', href: '/create' },
                { label: 'The Edit', href: '/edit' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-sans text-xs sm:text-sm text-[#F5F0E8]/85 hover:text-[#F5F0E8] hover:translate-x-1 transition-all duration-300 inline-block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Discover (lg:col-span-2) ── */}
          <div
            className="lg:col-span-2 flex flex-col items-start text-left will-change-transform"
            data-footer-column="discover"
          >
            <span className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#CFC7B8] mb-5 block">
              Discover
            </span>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'The Edit', href: '/edit' },
                { label: 'Lookbook', href: '/lookbook' },
                { label: 'Concierge Inquiry', href: 'mailto:concierge@goodthingsco.ng', isExternal: true },
              ].map((link) => (
                <li key={link.label}>
                  {link.isExternal ? (
                    <a
                      href={link.href}
                      className="font-sans text-xs sm:text-sm text-[#F5F0E8]/85 hover:text-[#F5F0E8] hover:translate-x-1 transition-all duration-300 inline-block py-0.5"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="font-sans text-xs sm:text-sm text-[#F5F0E8]/85 hover:text-[#F5F0E8] hover:translate-x-1 transition-all duration-300 inline-block py-0.5"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Connect & Newsletter (lg:col-span-4) ── */}
          <div
            className="sm:col-span-2 lg:col-span-4 flex flex-col items-start text-left will-change-transform"
            data-footer-column="connect"
          >
            <span className="font-sans text-xs font-semibold tracking-[0.22em] uppercase text-[#CFC7B8] mb-5 block">
              Stay Connected
            </span>

            <p className="font-sans text-xs text-[#CFC7B8] leading-relaxed mb-4">
              Receive quiet updates on seasonal releases and bespoke gifting stories.
            </p>

            {/* Newsletter Subscription Field */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="w-full flex items-center gap-2 mb-6"
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full bg-white/10 text-xs px-3.5 py-3 rounded-none border border-[#F5F0E8]/20 focus:outline-none focus:border-[#F5F0E8] text-[#F5F0E8] placeholder-[#CFC7B8]/60 transition-colors"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#F5F0E8] hover:bg-white text-[#3F4634] font-sans text-xs font-semibold tracking-[0.14em] uppercase transition-colors shrink-0 cursor-pointer"
              >
                Join
              </button>
            </form>

            {/* Social / Direct Contacts */}
            <div className="flex items-center gap-6 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs tracking-wider uppercase text-[#F5F0E8]/85 hover:text-[#F5F0E8] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs tracking-wider uppercase text-[#F5F0E8]/85 hover:text-[#F5F0E8] transition-colors"
              >
                WhatsApp
              </a>
              <a
                href="mailto:hello@goodthingsco.com"
                className="font-sans text-xs tracking-wider uppercase text-[#F5F0E8]/85 hover:text-[#F5F0E8] transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom Sub-Footer Row ── */}
        <div
          className="border-t border-[#F5F0E8]/15 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CFC7B8] will-change-transform"
          data-footer-element="subfooter"
        >
          <p>© {currentYear} Good Things Co. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              className="hover:text-[#F5F0E8] transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <span className="text-[#F5F0E8]/20">•</span>
            <a
              href="/terms"
              className="hover:text-[#F5F0E8] transition-colors duration-200"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
