import React, { useState, useEffect } from 'react';
import logoImg from '../../assets/branding/logo.png';

interface HeroNavProps {
  className?: string;
  activeItem?: string;
}

/**
 * HeroNav — Editorial Header & Responsive Navigation
 *
 * Top-left: Good Things Co. logo
 * Top-right: Shop, Gifts, Souvenirs, Create
 * Mobile: Interactive luxury slide-out drawer menu
 */
export const HeroNav: React.FC<HeroNavProps> = ({ className = '', activeItem }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Shop', href: '/shop' },
    { label: 'Corporate', href: '/corporate' },
    { label: 'Create', href: '/create' },
    { label: 'About', href: '/about' },
  ];

  const shopCategories = [
    { name: 'Shop Gifts', href: '/shop' },
    { name: 'Corporate Gifting', href: '/corporate' },
    { name: 'Custom Atelier', href: '/create' },
    { name: 'Our Story', href: '/about' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
      }
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`w-full px-6 sm:px-10 md:px-16 lg:px-20 py-8 md:py-10 max-w-7xl mx-auto flex items-center justify-between z-40 relative ${className}`}
        data-hero-element="header"
      >
        {/* ── Brand Logo ── */}
        <a
          href="/"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark rounded-sm"
          aria-label="Good Things Co. — Home"
          data-hero-element="logo"
        >
          <img
            src={logoImg}
            alt="Good Things Co."
            className="h-7 sm:h-8 md:h-9 w-auto object-contain"
            loading="eager"
            draggable={false}
          />
        </a>

        {/* ── Desktop Navigation with Subtle Hover Dropdowns ── */}
        <nav aria-label="Main navigation" data-hero-element="nav">
          <ul className="hidden md:flex items-center gap-7 lg:gap-10">
            {navItems.map((item) => {
              const isActive = activeItem?.toLowerCase() === item.label.toLowerCase();

              return (
                <li
                  key={item.label}
                  data-hero-element="nav-item"
                  className="relative group"
                >
                  <a
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`font-sans text-xs lg:text-sm font-semibold tracking-[0.16em] uppercase transition-colors duration-300 relative py-2 inline-flex items-center gap-1 ${
                      isActive
                        ? 'text-brand-dark after:w-full'
                        : 'text-brand-dark/75 hover:text-brand-dark after:w-0 hover:after:w-full'
                    } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-brand-dark after:transition-all after:duration-300`}
                  >
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* ── Mobile Hamburger Button ── */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-brand-dark p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark rounded-md hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
            data-hero-element="mobile-menu-toggle"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          </button>
        </nav>
      </header>

      {/* ── Mobile Slide-Out Drawer Menu ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-[380px] bg-[#FAF8F5] z-50 shadow-2xl flex flex-col justify-between p-7 sm:p-8 transition-transform duration-300 ease-premium md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-brand-dark/10">
            <a href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <img
                src="/images/branding/logo.png"
                alt="Good Things Co."
                className="h-8 w-auto object-contain"
              />
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-brand-dark/70 hover:text-brand-dark rounded-full hover:bg-black/5 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="mt-8 flex flex-col gap-5">
            {navItems.map((item) => {
              const isActive = activeItem?.toLowerCase() === item.label.toLowerCase();
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`font-serif text-2xl sm:text-3xl tracking-tight transition-colors duration-200 flex items-center justify-between ${
                    isActive
                      ? 'text-gold-600 font-medium'
                      : 'text-brand-dark hover:text-gold-600'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-base text-brand-light font-sans font-normal">→</span>
                </a>
              );
            })}
          </nav>

          {/* Curated Categories Taxonomy */}
          <div className="mt-8 pt-6 border-t border-brand-dark/10">
            <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-light block mb-3">
              Quick Gift Jumps
            </span>
            <div className="flex flex-wrap gap-2">
              {shopCategories.map((cat) => (
                <a
                  key={cat.name}
                  href={cat.href}
                  onClick={(e) => handleLinkClick(e, cat.href)}
                  className="px-3 py-1.5 rounded-full bg-white text-brand-dark/80 hover:text-brand-dark border border-brand-dark/10 text-xs font-sans font-medium transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer CTA */}
        <div className="pt-6 border-t border-brand-dark/10 mt-6">
          <a
            href="/create"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-md bg-brand-dark text-brand-ivory font-sans text-xs font-semibold tracking-[0.16em] uppercase hover:bg-gold-600 transition-colors shadow-sm"
          >
            Start Custom Order →
          </a>
          <p className="font-serif italic text-xs text-brand-medium/70 text-center mt-3">
            Thoughtful gifts for inspired living.
          </p>
        </div>
      </aside>
    </>
  );
};

export default HeroNav;
