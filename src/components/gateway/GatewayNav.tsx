import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import logoImg from '../../assets/branding/logo.png';
import { useCart } from '../../contexts/CartContext';

interface GatewayNavProps {
  activePath?: 'shop' | 'corporate' | 'create' | 'about';
  onSelectTab?: (tab: 'shop' | 'corporate' | 'create' | 'about') => void;
  className?: string;
}

export const GatewayNav: React.FC<GatewayNavProps> = ({
  activePath,
  onSelectTab,
  className = '',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalQuantity } = useCart();

  const navLinks: { id: 'shop' | 'corporate' | 'create' | 'about'; label: string; href: string }[] = [
    { id: 'shop', label: 'Shop', href: '/shop' },
    { id: 'corporate', label: 'Corporate', href: '/corporate' },
    { id: 'create', label: 'Create', href: '/create' },
    { id: 'about', label: 'About', href: '/about' },
  ];

  const handleNavClick = (id: 'shop' | 'corporate' | 'create' | 'about') => {
    if (onSelectTab && id !== 'about') {
      onSelectTab(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className={`w-full py-5 md:py-7 flex items-center justify-between z-40 relative ${className}`}>
      {/* ── Brand Logo / Title ── */}
      <Link
        to="/"
        className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark rounded-sm"
        aria-label="Good Things Co. — Home"
      >
        <img
          src={logoImg}
          alt="Good Things Co."
          className="h-6 sm:h-7 md:h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-85"
        />
      </Link>

      {/* ── Desktop Navigation: Shop | Corporate | Create | About ── */}
      <nav aria-label="Main navigation" className="hidden md:block">
        <ul className="flex items-center gap-8 lg:gap-11">
          {navLinks.map((link) => {
            const isActive = activePath === link.id;
            return (
              <li key={link.id}>
                <Link
                  to={link.href}
                  onClick={() => handleNavClick(link.id)}
                  className={`font-sans text-xs lg:text-[13px] font-semibold tracking-[0.2em] uppercase transition-colors duration-300 relative py-2 ${
                    isActive
                      ? 'text-brand-dark after:w-full'
                      : 'text-brand-dark/70 hover:text-brand-dark after:w-0 hover:after:w-full'
                  } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-brand-dark after:transition-all after:duration-300 after:ease-out`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Cart Action & Mobile Toggle ── */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Cart Link with Live Count Badge */}
        <Link
          to="/cart"
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-brand-dark/15 hover:border-brand-dark/40 bg-white/70 hover:bg-white text-brand-dark font-sans text-xs font-semibold tracking-wider transition-all shadow-2xs group"
          aria-label={`View shopping cart containing ${totalQuantity} items`}
        >
          <ShoppingBag size={15} className="text-gold-700 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Cart</span>
          {totalQuantity > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-dark text-white text-[10px] font-bold flex items-center justify-center">
              {totalQuantity}
            </span>
          )}
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-brand-dark hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="8" x2="21" y2="8" />
                <line x1="3" y1="16" x2="21" y2="16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-5 bg-[#FAF8F5]/98 backdrop-blur-md rounded-2xl border border-brand-dark/10 shadow-xl z-50 md:hidden animate-fade-in space-y-4">
          <ul className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <li key={link.id}>
                <Link
                  to={link.href}
                  onClick={() => handleNavClick(link.id)}
                  className="flex items-center justify-between font-serif text-xl text-brand-dark hover:text-gold-600 transition-colors py-1.5"
                >
                  <span>{link.label}</span>
                  <span className="text-sm font-sans text-brand-light">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-brand-dark/10">
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider"
            >
              <ShoppingBag size={15} className="text-gold-400" />
              <span>View Cart ({totalQuantity})</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default GatewayNav;
