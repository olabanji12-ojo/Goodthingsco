import React from 'react';
import { Link } from 'react-router-dom';

interface AboutOfferingsProps {
  className?: string;
}

interface OfferingItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  ctaText: string;
  href: string;
}

const OFFERINGS: OfferingItem[] = [
  {
    id: 'shop',
    name: 'Shop',
    subtitle: 'Individual gifting',
    description:
      'Curated gift boxes and personal gestures for birthdays, gratitude, celebrations, and thoughtful moments.',
    ctaText: 'Enter Shop',
    href: '/shop',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    subtitle: 'Gifting at scale',
    description:
      'Executive hampers, client appreciation suites, and team celebration gifts finished with metallic foil debossing.',
    ctaText: 'Explore Corporate',
    href: '/corporate',
  },
  {
    id: 'create',
    name: 'Create',
    subtitle: 'Custom & bespoke gifting',
    description:
      'Collaborate directly with our atelier to commission bespoke packaging, custom products, apparel, and event concepts.',
    ctaText: 'Start Custom Order',
    href: '/create',
  },
  {
    id: 'edit',
    name: 'The Edit',
    subtitle: 'Guides, ideas and stories',
    description:
      'Our editorial journal featuring considered gift guides, maker profiles, studio chronicles, and mindful living essays.',
    ctaText: 'Read The Edit',
    href: '/edit',
  },
];

/**
 * AboutOfferings — Section 5: What We Offer
 *
 * Briefly introduces the 4 pillars with direct links:
 * - Shop (Individual gifting)
 * - Corporate (Gifting at scale)
 * - Create (Custom & bespoke gifting)
 * - The Edit (Guides, ideas and stories)
 */
export const AboutOfferings: React.FC<AboutOfferingsProps> = ({ className = '' }) => {
  return (
    <section
      aria-label="What We Offer"
      className={`w-full max-w-6xl mx-auto mb-16 sm:mb-20 md:mb-24 ${className}`}
    >
      {/* ── Section Header ── */}
      <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-2">
          Gifting Pillars
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-dark font-normal tracking-tight mb-3">
          What We Offer
        </h2>
        <p className="font-sans text-xs sm:text-sm text-brand-medium leading-relaxed">
          Four distinct doorways into thoughtful giving, designed for individuals, brands, and organisations.
        </p>
      </div>

      {/* ── 4-Pillar Grid (Desktop 4-cols / 2x2, Mobile 1-col) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {OFFERINGS.map((offering) => (
          <div
            key={offering.id}
            className="bg-white rounded-2xl border border-brand-dark/10 p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 group"
          >
            <div>
              {/* Pillar Title & Subtitle */}
              <div className="mb-4">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
                  {offering.subtitle}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight group-hover:text-gold-700 transition-colors">
                  {offering.name}
                </h3>
              </div>

              {/* Description */}
              <p className="font-sans text-xs text-brand-medium/90 leading-relaxed mb-6">
                {offering.description}
              </p>
            </div>

            {/* Link CTA */}
            <div className="pt-4 border-t border-brand-dark/5">
              <Link
                to={offering.href}
                className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-700 transition-colors"
              >
                <span>{offering.ctaText}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutOfferings;
