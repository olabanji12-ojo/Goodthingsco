import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GatewayNav } from '../components/gateway';
import { ShopFlowContainer } from '../components/shopJourney';
import { Footer } from '../components/homepage/footer/Footer';
import { fetchPageContent } from '../services/contentService';
import { DEFAULT_PAGE_CONTENTS } from '../data/defaultContent';

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
  const [shopContent, setShopContent] = useState(DEFAULT_PAGE_CONTENTS.shop);

  useEffect(() => {
    let isMounted = true;
    fetchPageContent('shop')
      .then((res) => {
        if (isMounted && res?.content) {
          setShopContent(res.content);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight mb-2">
              {shopContent.headerTitle || 'Find a Thoughtful Gift'}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed">
              {shopContent.headerSubtitle || 'Answer a few simple questions to discover hand-curated gifts, beautifully packaged and delivered with personal care.'}
            </p>
          </div>

          {/* ── Direct Christmas Shortcut Banner ── */}
          <div className="w-full max-w-5xl mx-auto mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-emerald-800 animate-fade-in">
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl shrink-0">🎄</span>
              <div>
                <h3 className="font-serif text-sm sm:text-base font-semibold text-gold-300">
                  Season for Good Things.
                </h3>
                <p className="font-sans text-xs text-white/80">
                  Gift sets curated with joy for the people you cherish.
                </p>
              </div>
            </div>
            <Link
              to="/christmas"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-brand-dark font-sans text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
            >
              <span>BE MERRY. EXPLORE OUR GIFT SETS →</span>
            </Link>
          </div>

          {/* ── 3. Central 10-Step Gifting Flow Container (Completely Untouched) ── */}
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
