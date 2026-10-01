import React from 'react';

interface RoomFinaleProps {
  onNavigateToRoom: (index: number) => void;
}

/**
 * RoomFinale — Room 06: FINALE & Closing CTA
 *
 * Required closing CTA:
 * "Ready to find your good thing?"
 *
 * Plus final customer paths and compact luxury brand footer.
 */
export const RoomFinale: React.FC<RoomFinaleProps> = ({ onNavigateToRoom }) => {
  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto bg-[#FAF8F5]">
      {/* ── Background Ambient Light ── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/95 via-gold-100/30 to-transparent blur-3xl pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* ── Center Stage: Closing CTA ── */}
      <div className="relative z-10 max-w-3xl mx-auto w-full text-center my-auto py-8">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-gold-600 block mb-3">
          06 · The Good Things Conclusion
        </span>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-brand-dark font-normal tracking-tight leading-[1.12] mb-5">
          Ready to find{' '}
          <span className="block sm:inline italic font-light text-brand-dark/90">
            your good thing?
          </span>
        </h2>

        <p className="font-sans text-sm sm:text-base text-brand-medium/90 max-w-xl mx-auto mb-8 leading-relaxed">
          Explore our curated shop collections, discover thoughtful gifts for loved ones, or begin creating a custom bespoke order.
        </p>

        {/* 3 Main Customer Action Paths */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-10">
          <button
            type="button"
            onClick={() => onNavigateToRoom(1)}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-colors shadow-xs cursor-pointer"
          >
            Explore The Shop
          </button>
          <button
            type="button"
            onClick={() => onNavigateToRoom(2)}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-colors cursor-pointer"
          >
            Find a Gift
          </button>
          <button
            type="button"
            onClick={() => onNavigateToRoom(4)}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-colors cursor-pointer"
          >
            Create Custom
          </button>
        </div>
      </div>

      {/* ── Compact Luxury Brand Footer ── */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full pt-6 border-t border-brand-dark/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 text-xs font-sans text-brand-medium">
          {/* Col 1: Brand Info */}
          <div>
            <h5 className="font-serif text-sm font-semibold text-brand-dark mb-1">
              Good Things Co.
            </h5>
            <p className="text-[11px] leading-relaxed text-brand-medium/80 mb-2">
              Thoughtful gifts for inspired living.
            </p>
            <p className="text-[10px] text-brand-light">
              London · Lagos · New York
            </p>
          </div>

          {/* Col 2: Journeys */}
          <div>
            <h6 className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark mb-2">
              Journeys
            </h6>
            <ul className="space-y-1 text-[11px]">
              <li><button onClick={() => onNavigateToRoom(1)} className="hover:text-brand-dark cursor-pointer">Shop (For Me)</button></li>
              <li><button onClick={() => onNavigateToRoom(2)} className="hover:text-brand-dark cursor-pointer">Gifts (For Someone)</button></li>
              <li><button onClick={() => onNavigateToRoom(3)} className="hover:text-brand-dark cursor-pointer">Souvenirs (Events)</button></li>
              <li><button onClick={() => onNavigateToRoom(4)} className="hover:text-brand-dark cursor-pointer">Create (Custom)</button></li>
            </ul>
          </div>

          {/* Col 3: Assistance */}
          <div>
            <h6 className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark mb-2">
              Customer Care
            </h6>
            <ul className="space-y-1 text-[11px]">
              <li><a href="#shipping" className="hover:text-brand-dark">Shipping & Delivery</a></li>
              <li><a href="#bespoke" className="hover:text-brand-dark">Bespoke Inquiries</a></li>
              <li><a href="#care" className="hover:text-brand-dark">Gift Concierge</a></li>
              <li><a href="#faq" className="hover:text-brand-dark">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h6 className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark mb-2">
              Stay Inspired
            </h6>
            <p className="text-[11px] mb-2 leading-relaxed">
              Curated stories, early editions, and seasonal private previews.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                className="bg-white border border-brand-dark/20 px-2.5 py-1.5 text-[11px] flex-1 focus:outline-none"
              />
              <button
                type="button"
                className="bg-brand-dark text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="pt-4 border-t border-brand-dark/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-brand-light">
          <span>© {new Date().getFullYear()} Good Things Co. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigateToRoom(0)} className="hover:text-brand-dark underline cursor-pointer">
              Return to 01 Welcome ↑
            </button>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoomFinale;
