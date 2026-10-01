import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// High-resolution image assets from existing repository
import shopImg from '../../assets/gift-hero.png';
import corporateImg from '../../assets/section4/coperate.png';
import createImg from '../../assets/section5/after.png';
import aboutImg from '../../assets/section6/section6.png';

export type GatewayTabId = 'shop' | 'corporate' | 'create' | 'about';

interface PrimaryEntryGatewayProps {
  activeTab?: GatewayTabId | null;
  onSelectTab?: (tab: GatewayTabId | null) => void;
  className?: string;
}

export const PrimaryEntryGateway: React.FC<PrimaryEntryGatewayProps> = ({
  activeTab: controlledTab,
  onSelectTab,
  className = '',
}) => {
  const [internalTab, setInternalTab] = useState<GatewayTabId | null>(null);
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;

  // Mobile expanded accordion state — defaults to null so no section is open on load
  const [mobileExpandedTab, setMobileExpandedTab] = useState<GatewayTabId | null>(null);

  const handleTabChange = (tab: GatewayTabId | null) => {
    setInternalTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  // Content configurations for each state
  const content = {
    shop: {
      id: 'shop' as GatewayTabId,
      label: 'Shop',
      targetAudience: 'For individuals',
      headline: 'Find a gift.',
      shortDesc: 'Curated gifts for life’s meaningful moments, delivered with hand-tied satin ribbons.',
      description:
        'Curated collections for life’s meaningful moments, delivered with hand-tied satin ribbons, keepsake packaging, and handwritten card messages.',
      journeySteps: ['Occasion', 'Recipient', 'Gift', 'Checkout'],
      ctaText: 'Enter Shop',
      ctaHref: '/shop',
      image: shopImg,
      imageAlt: 'Curated gift hamper and luxury keepsake',
      caption: 'Curated with intention · For individuals',
    },
    corporate: {
      id: 'corporate' as GatewayTabId,
      label: 'Corporate',
      targetAudience: 'For organisations',
      headline: 'Gift at scale.',
      shortDesc: 'Executive hampers, client appreciation suites, and team celebration gifts.',
      description:
        'Executive hampers, client appreciation suites, and team celebration gifts finished with metallic foil debossing of your corporate mark.',
      journeySteps: [
        'Build campaign',
        'Customise',
        'Upload recipients',
        'Approve',
        'Pay',
        'Track',
      ],
      ctaText: 'Explore Corporate',
      ctaHref: '/corporate',
      image: corporateImg,
      imageAlt: 'Corporate leather folio and debossed packaging',
      caption: 'Debossed with your mark · For organisations',
    },
    create: {
      id: 'create' as GatewayTabId,
      label: 'Create',
      targetAudience: 'Custom & bespoke',
      headline: 'Create something unique.',
      shortDesc: 'Commission bespoke packaging, custom keepsake engravings, and tailored concepts.',
      description:
        'Collaborate directly with our atelier to commission bespoke packaging, custom keepsake engravings, and tailored gift concepts for your event.',
      journeySteps: ['Ideate & Consult', 'Material Selection', 'Handcrafted Delivery'],
      ctaText: 'Start Custom Order',
      ctaHref: '/create',
      image: createImg,
      imageAlt: 'Custom unboxing design and bespoke packaging',
      caption: 'Bespoke Atelier · Tailored creations',
    },
    about: {
      id: 'about' as GatewayTabId,
      label: 'About',
      targetAudience: 'Our philosophy',
      headline: 'The art of thoughtful living.',
      shortDesc: 'Restoring care, craft, and emotional clarity to the art of giving.',
      description:
        'Good Things Co. exists to elevate everyday rituals into memorable moments through discerning craftsmanship, generous details, and sincere care.',
      journeySteps: ['Curated Intentionality', 'Artisanal Packaging', 'Lasting Memory'],
      ctaText: 'Discover Our Story',
      ctaHref: '/about',
      image: aboutImg,
      imageAlt: 'The art of thoughtful living lifestyle editorial',
      caption: 'Thoughtful gifts for inspired living',
    },
  };

  const activeContent = activeTab ? content[activeTab] : null;
  const tabKeys: GatewayTabId[] = ['shop', 'corporate', 'create', 'about'];

  return (
    <div
      className={`w-full max-w-5xl mx-auto bg-white rounded-3xl border border-brand-dark/10 shadow-[0_12px_40px_rgba(28,20,14,0.06)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* =========================================================
          DESKTOP VIEW: BALANCED GATEWAY OR FOCUSED SPLIT VIEW
          ========================================================= */}
      <div className="hidden md:block min-h-[460px]">
        {/* ── Top Pathway Switcher Tabs ── */}
        <div className="px-8 pt-7 pb-4 flex items-center justify-between border-b border-brand-dark/5 bg-[#FAF8F5]/60">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-brand-dark/10 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange(null)}
              className={`px-3.5 lg:px-4 py-1.5 rounded-xl font-sans text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ease-out cursor-pointer ${
                activeTab === null
                  ? 'bg-brand-dark text-brand-ivory shadow-xs font-bold'
                  : 'text-brand-dark/70 hover:text-brand-dark hover:bg-black/5'
              }`}
            >
              All Gateways
            </button>

            {tabKeys.map((tabKey) => {
              const isActive = activeTab === tabKey;
              const item = content[tabKey];
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => handleTabChange(tabKey)}
                  className={`px-3.5 lg:px-4 py-1.5 rounded-xl font-sans text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ease-out cursor-pointer ${
                    isActive
                      ? 'bg-brand-dark text-brand-ivory shadow-xs font-bold'
                      : 'text-brand-dark/70 hover:text-brand-dark hover:bg-black/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== null ? (
              <button
                type="button"
                onClick={() => handleTabChange(null)}
                className="font-sans text-xs text-brand-medium hover:text-brand-dark font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>←</span>
                <span>View All Pathways</span>
              </button>
            ) : (
              <span className="font-sans text-xs text-brand-medium/70 italic">
                Choose a pathway to explore or select below
              </span>
            )}
          </div>
        </div>

        {/* ── State A: Initial 4-Pathway Overview Grid (When NO tab is open) ── */}
        {activeTab === null && (
          <div className="p-8 lg:p-10 grid grid-cols-4 gap-5 bg-white animate-fade-in">
            {tabKeys.map((tabKey) => {
              const item = content[tabKey];
              return (
                <div
                  key={tabKey}
                  className="group rounded-2xl border border-brand-dark/10 p-6 bg-[#FAF8F5]/40 hover:bg-white hover:border-brand-dark/20 hover:shadow-[0_8px_24px_rgba(28,20,14,0.05)] transition-all duration-500 ease-out flex flex-col items-center justify-between text-center"
                >
                  <div className="flex flex-col items-center text-center w-full">
                    {/* Thumbnail Image with gentle luxury zoom */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleTabChange(tabKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleTabChange(tabKey);
                      }}
                      className="relative aspect-[4/3] w-full rounded-xl overflow-hidden mb-4 bg-brand-dark/5 cursor-pointer"
                    >
                      <img
                        src={item.image}
                        alt={item.imageAlt}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.025] transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Audience Eyebrow */}
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
                      {item.targetAudience}
                    </span>

                    {/* Pathway Title */}
                    <h3 className="font-serif text-xl text-brand-dark font-normal tracking-tight mb-1">
                      {item.label}
                    </h3>

                    {/* Subtitle Headline */}
                    <p className="font-sans text-xs font-medium text-brand-dark/90 mb-2">
                      {item.headline}
                    </p>

                    {/* Short Description */}
                    <p className="font-sans text-[11px] text-brand-medium/85 leading-relaxed line-clamp-2 max-w-xs mx-auto">
                      {item.shortDesc}
                    </p>
                  </div>

                  {/* Actions: Direct Link or Preview Journey */}
                  <div className="pt-4 mt-4 border-t border-brand-dark/10 w-full flex items-center justify-center gap-4">
                    <Link
                      to={item.ctaHref}
                      className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-700 transition-colors"
                    >
                      <span>{item.label === 'About' ? 'Our Story' : 'Enter'}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>

                    <span className="text-brand-dark/20 text-xs">•</span>

                    <button
                      type="button"
                      onClick={() => handleTabChange(tabKey)}
                      className="text-[10px] font-sans uppercase tracking-widest text-brand-light hover:text-brand-dark transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── State B: Focused Interactive Split State (When user clicks or hovers a tab) ── */}
        {activeTab !== null && activeContent && (
          <div className="grid grid-cols-12 min-h-[400px] animate-fade-in">
            {/* ── Left Column: Active Content Details (7 cols) ── */}
            <div className="col-span-7 p-8 lg:p-10 flex flex-col justify-between border-r border-brand-dark/5 bg-white">
              <div className="space-y-5">
                <div>
                  <span className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-gold-600 block mb-1">
                    {activeContent.targetAudience}
                  </span>
                  <h3 className="font-serif text-3xl lg:text-4xl text-brand-dark font-normal tracking-tight">
                    {activeContent.headline}
                  </h3>
                </div>

                <p className="font-sans text-xs lg:text-sm text-brand-medium/85 leading-relaxed max-w-md">
                  {activeContent.description}
                </p>

                {/* Journey Steps Preview */}
                <div className="pt-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-light block mb-2.5">
                    {activeTab === 'shop' || activeTab === 'corporate'
                      ? 'Guided Journey Preview'
                      : 'Process & Pillars'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
                    {activeContent.journeySteps.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark text-[11px] font-sans font-medium whitespace-nowrap">
                          {step}
                        </span>
                        {idx < activeContent.journeySteps.length - 1 && (
                          <span className="text-brand-dark/30 text-xs font-sans">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Action CTA */}
              <div className="pt-8 mt-6 border-t border-brand-dark/5 flex items-center justify-between">
                <Link
                  to={activeContent.ctaHref}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-none bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 shadow-sm cursor-pointer group"
                >
                  <span>{activeContent.ctaText}</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleTabChange(null)}
                  className="font-serif italic text-xs text-brand-medium hover:text-brand-dark transition-colors cursor-pointer"
                >
                  ← Return to all pathways
                </button>
              </div>
            </div>

            {/* ── Right Column: Dynamic Photographic Canvas (5 cols) ── */}
            <div className="col-span-5 relative overflow-hidden bg-[#FAF8F5] flex flex-col justify-between">
              <div className="relative w-full h-full min-h-[360px] overflow-hidden">
                <img
                  key={activeContent.id}
                  src={activeContent.image}
                  alt={activeContent.imageAlt}
                  className="w-full h-full object-cover object-center animate-fade-in transition-transform duration-1000 ease-out hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-xs">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gold-700 block">
                    {activeContent.caption}
                  </span>
                  <span className="font-serif text-xs text-brand-dark font-medium">
                    Good Things Co. Editorial Atelier
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          MOBILE VIEW: COMPACT TAP ROWS (CENTER ALIGNED FOR VISUAL APPEAL)
          ========================================================= */}
      <div className="md:hidden divide-y divide-brand-dark/10">
        {tabKeys.map((tabKey) => {
          const item = content[tabKey];
          const isExpanded = mobileExpandedTab === tabKey;

          return (
            <div key={tabKey} className="transition-colors">
              {/* Compact Tap Header — Center Aligned */}
              <button
                type="button"
                onClick={() => setMobileExpandedTab(isExpanded ? null : tabKey)}
                className="w-full py-5 px-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/2 transition-colors relative"
                aria-expanded={isExpanded}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="font-serif text-xl font-medium text-brand-dark">
                    {item.label}
                  </span>
                  <span className="font-sans text-xs text-brand-medium/80 block mt-1">
                    {item.headline}
                  </span>
                </div>
                <span className="mt-2.5 w-7 h-7 rounded-full border border-brand-dark/15 flex items-center justify-center text-[10px] text-brand-dark font-sans shrink-0 transition-transform duration-300">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Mobile Expanded Drawer inside same container */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 space-y-4 bg-[#FAF8F5]/60 text-center animate-fade-in flex flex-col items-center">
                  <p className="font-sans text-xs text-brand-medium/90 leading-relaxed max-w-sm mx-auto">
                    {item.description}
                  </p>

                  {/* Mobile Journey preview */}
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-light block mb-2">
                      Journey:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {item.journeySteps.map((step) => (
                        <span
                          key={step}
                          className="px-2.5 py-0.5 rounded bg-white border border-brand-dark/10 text-brand-dark text-[10px] font-sans"
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={item.ctaHref}
                    className="w-full max-w-xs inline-flex items-center justify-center py-3 px-6 bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    <span>{item.ctaText} →</span>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrimaryEntryGateway;
