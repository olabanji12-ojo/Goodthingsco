import React from 'react';
import { Link } from 'react-router-dom';

interface GatewayFooterProps {
  className?: string;
}

export const GatewayFooter: React.FC<GatewayFooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`w-full py-6 md:py-8 border-t border-brand-dark/10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-brand-medium/80 ${className}`}
    >
      <div>
        <p className="tracking-wide">
          © {new Date().getFullYear()} <strong className="text-brand-dark">Good Things Co.</strong> · Thoughtful gifts for inspired living.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/shop" className="hover:text-brand-dark transition-colors">
          Shop
        </Link>
        <Link to="/corporate" className="hover:text-brand-dark transition-colors">
          Corporate
        </Link>
        <Link to="/create" className="hover:text-brand-dark transition-colors">
          Create
        </Link>
        <Link to="/edit" className="hover:text-brand-dark transition-colors">
          The Edit
        </Link>
        <Link to="/about" className="hover:text-brand-dark transition-colors">
          About
        </Link>
        <Link to="/lookbook" className="hover:text-brand-dark transition-colors">
          Lookbook
        </Link>
        <a
          href="mailto:concierge@goodthingsco.ng"
          className="hover:text-brand-dark transition-colors"
        >
          concierge@goodthingsco.ng
        </a>
      </div>
    </footer>
  );
};

export default GatewayFooter;
