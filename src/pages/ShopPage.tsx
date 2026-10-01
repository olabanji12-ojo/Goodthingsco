import React from 'react';
import { GatewayNav } from '../components/gateway';
import { ShopFlowContainer } from '../components/shopJourney';
import { Footer } from '../components/homepage/footer/Footer';

/**
 * ShopPage — Good Things Co.
 *
 * Dedicated Shop Journey following the client's 10-step sequence:
 * 1. Shop Intro
 * 2. Choose an Occasion
 * 3. Choose Recipient (with progressive disclosure)
 * 4. Choose Budget
 * 5. Browse Curated Gifts
 * 6. Select Gift
 * 7. Personalise Your Gift (Packaging, Ribbon, Message, Engraving)
 * 8. Add Recipient & Delivery Details
 * 9. Checkout
 * 10. Order Confirmation & Tracking
 *
 * Rendered inside ONE guided multi-step container to eliminate excessive scrolling.
 */
export const ShopPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent margins */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── 1. Minimal Header Navigation ── */}
        <GatewayNav activePath="shop" />

        {/* ── 2. Focused Shop Flow Section ── */}
        <main className="w-full py-4 sm:py-6 md:py-8 flex flex-col items-center justify-center">
          {/* Small Shop Eyebrow & Intro */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50/80 border border-gold-200/50 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
              <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700">
                Personal Gifting Atelier
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight mb-2">
              Find a Thoughtful Gift
            </h1>
            <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed">
              Answer a few simple questions to discover hand-curated gifts, beautifully packaged and delivered with personal care.
            </p>
          </div>

          {/* ── 3. Central 10-Step Gifting Flow Container ── */}
          <div className="w-full flex justify-center pb-6 sm:pb-10">
            <ShopFlowContainer />
          </div>
        </main>
      </div>

      {/* ── 4. Normal Full-Width Footer ── */}
      <Footer />
    </div>
  );
};

export default ShopPage;
