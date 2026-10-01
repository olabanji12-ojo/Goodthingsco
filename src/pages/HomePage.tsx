import { useState } from 'react';
import {
  GatewayNav,
  PrimaryEntryGateway,
  type GatewayTabId,
} from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';

/**
 * HomePage — Good Things Co.
 *
 * Gateway Homepage:
 * 1. HEADER / NAVIGATION (Good Things Co. | Shop | Corporate | Create | The Edit | About)
 * 2. HERO / BRAND STATEMENT ("Thoughtful gifts for inspired living")
 * 3. PRIMARY ENTRY EXPERIENCE (One container, multiple states: Shop, Corporate, Create, About)
 * 4. NORMAL FULL-WIDTH FOOTER
 */
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<GatewayTabId | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent editorial margins */}
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── 1. Minimal Editorial Header & Navigation ── */}
        <GatewayNav activePath={activeTab ?? undefined} onSelectTab={setActiveTab} />

        {/* ── 2. Hero & Brand Positioning Statement ── */}
        <main className="w-full py-4 sm:py-6 md:py-8 flex flex-col items-center justify-center text-center">
          {/* Section Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50/80 border border-gold-200/50 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700">
              Good Things Co. · Gift Atelier
            </span>
          </div>

          {/* Main Brand Statement (Single unbroken line on desktop) */}
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[3.15rem] xl:text-[3.45rem] font-normal text-brand-dark tracking-tight leading-tight whitespace-normal md:whitespace-nowrap mb-2.5">
            Thoughtful gifts for inspired living
          </h1>

          {/* Short, focused supporting copy */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-brand-medium/85 max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8">
            Curated gifts crafted with intention. Find an inspired gesture for someone special, or coordinate distinguished gifts at scale.
          </p>

          {/* ── 3. Primary Entry Experience: One Container, Multiple States ── */}
          <div className="w-full">
            <PrimaryEntryGateway activeTab={activeTab} onSelectTab={setActiveTab} />
          </div>
        </main>
      </div>

      {/* ── 4. Normal Footer Section ── */}
      <Footer />
    </div>
  );
}
