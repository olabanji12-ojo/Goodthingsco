import React, { useEffect, useState } from 'react';
import { GatewayNav } from '../components/gateway';
import { CorporateFlowContainer } from '../components/corporate';
import { Footer } from '../components/homepage/footer/Footer';
import { fetchPageContent } from '../services/contentService';
import { DEFAULT_PAGE_CONTENTS } from '../data/defaultContent';
import type { CorporatePageContent } from '../types/content';

/**
 * CorporatePage — Good Things Co.
 *
 * Dedicated Corporate Gifting Concierge page.
 * Content headlines, subtitles, and messaging are dynamically managed from the Admin CMS.
 */
export const CorporatePage: React.FC = () => {
  const [content, setContent] = useState<CorporatePageContent>(DEFAULT_PAGE_CONTENTS.corporate);

  useEffect(() => {
    fetchPageContent('corporate')
      .then((res) => {
        if (res && res.content) {
          setContent(res.content);
        }
      })
      .catch((err) => {
        console.warn('[CorporatePage] Failed to fetch CMS content, using default:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent editorial margins */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── Top Header Navigation ── */}
        <GatewayNav activePath="corporate" />

        {/* ── Main Page Content ── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
          {/* 1. Small Corporate Hero / Introduction */}
          <section className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            {content.heroTagline && (
              <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-gold-700 block mb-2">
                {content.heroTagline}
              </span>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight mb-3">
              {content.heroTitle || 'Corporate Gifting Concierge'}
            </h1>

            <p className="font-sans text-xs sm:text-sm md:text-base text-brand-medium/90 max-w-xl mx-auto leading-relaxed mb-6">
              {content.heroSubtitle || 'Thoughtful curations and branded gifts crafted to honor your teams, elevate client relationships, and celebrate organizational milestones.'}
            </p>

            {/* Luxury Atelier Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-sans text-brand-dark/80">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gold-600 font-bold">✓</span> Direct Doorstep Dispatch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gold-600 font-bold">✓</span> Custom Foil Stamping & Deboss
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gold-600 font-bold">✓</span> Instant Pro-Forma Quotes Preserved
              </span>
            </div>
          </section>

          {/* 2. Main Corporate Gifting Flow Container (Guided Concierge Flow) */}
          <section className="w-full flex justify-center pb-8 sm:pb-12">
            <CorporateFlowContainer />
          </section>
        </main>
      </div>

      {/* ── 3. Normal Full-Width Footer ── */}
      <Footer />
    </div>
  );
};

export default CorporatePage;
