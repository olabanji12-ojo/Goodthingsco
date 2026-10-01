import React from 'react';
import { GatewayNav } from '../components/gateway';
import { CreateFlowContainer } from '../components/createJourney';
import { Footer } from '../components/homepage/footer/Footer';

/**
 * CreatePage — Good Things Co.
 *
 * Dedicated Bespoke / Custom creation concierge following the client's 9-step flow:
 * 1. What would you like to create? (Custom Apparel, Gift, Packaging, Product, Merchandise)
 * 2. Tell us what you need (Item, Quantity, Budget, Purpose, Delivery Date)
 * 3. Upload your design (Logo, Artwork, Reference, Brief)
 * 4. Add details (Material, Colour, Size, Packaging, Branding, Personalisation)
 * 5. Review your request (Comprehensive overview with edit shortcuts)
 * 6. Submit request (Request a Quote)
 * 7. Approve & Pay (Quotation review, client approval, authorization)
 * 8. Production (Design → Sample → Approval → Production → Packaging)
 * 9. Delivery (White-glove handover & dispatch)
 *
 * Built as ONE main container with ONE active step at a time to eliminate scrolling.
 */
export const CreatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent editorial margins */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── 1. Minimal Header Navigation (Shop | Corporate | Create | About) ── */}
        <GatewayNav activePath="create" />

        {/* ── 2. Focused Bespoke Atelier Intro Section ── */}
        <main className="w-full py-4 sm:py-6 md:py-8 flex flex-col items-center justify-center">
          {/* Small Create Intro */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50/80 border border-gold-200/50 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
              <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700">
                Bespoke Atelier Commission
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight mb-2">
              Bring Your Idea to Life
            </h1>
            <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed">
              Custom products, packaging, apparel and gifting engineered to your exact brand specifications.
            </p>
          </div>

          {/* ── 3. Central 9-Step Custom Gifting Flow Container ── */}
          <div className="w-full flex justify-center pb-6 sm:pb-10">
            <CreateFlowContainer />
          </div>
        </main>
      </div>

      {/* ── 4. Normal Full-Width Footer ── */}
      <Footer />
    </div>
  );
};

export default CreatePage;
