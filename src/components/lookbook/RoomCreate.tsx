import React, { useState } from 'react';
import { CREATE_SERVICES, CREATE_ATELIER_STEPS } from './lookbookData';
import { CreateService } from './types';

interface RoomCreateProps {
  onNavigateToRoom: (index: number) => void;
}

/**
 * RoomCreate — Room 05: CREATE ("Something Custom")
 *
 * Clearly showcases the 5 client services:
 * 1. Custom Gifts
 * 2. Custom Souvenirs
 * 3. Custom Packaging
 * 4. Corporate Orders
 * 5. Event Orders
 *
 * Plus the 3-step visual transformation triptych.
 */
export const RoomCreate: React.FC<RoomCreateProps> = ({ onNavigateToRoom }) => {
  const [activeServiceId, setActiveServiceId] = useState<string>('srv-custom-gifts');
  const [showConsultModal, setShowConsultModal] = useState<boolean>(false);

  const activeService =
    CREATE_SERVICES.find((srv: CreateService) => srv.id === activeServiceId) || CREATE_SERVICES[0];

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto bg-[#FAF8F5]">
      {/* ── Top Header ── */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-dark/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">
                05 · The Bespoke Atelier
              </span>
              <span className="text-brand-dark/20">•</span>
              <span className="font-sans text-xs uppercase tracking-wider text-brand-medium">
                Something Custom
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal tracking-tight">
              Bespoke objects & tailored packaging.
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm text-brand-medium/90 max-w-sm leading-relaxed">
            Collaborate directly with our studio to tailor bespoke pieces, monogrammed packaging, and volume corporate orders.
          </p>
        </div>

        {/* ── 5 Service Selector Tabs (Corporate, Events, Souvenirs, Custom Gifts, Packaging) ── */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CREATE_SERVICES.map((srv: CreateService) => {
            const isActive = srv.id === activeServiceId;
            return (
              <button
                key={srv.id}
                type="button"
                onClick={() => setActiveServiceId(srv.id)}
                className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.16em] transition-all rounded-none cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs'
                    : 'bg-white/80 hover:bg-white text-brand-dark/70 hover:text-brand-dark border border-brand-dark/15 font-medium'
                }`}
              >
                {srv.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center Stage: Transformation Story Triptych + Active Service ── */}
      <div className="max-w-6xl mx-auto w-full my-auto py-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 3-Step Visual Transformation (Before -> Crafted -> Finished) */}
        <div className="lg:col-span-7 bg-white border border-brand-dark/10 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-dark/10">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-brand-dark">
              The Bespoke Transformation
            </span>
            <span className="font-sans text-[11px] text-gold-700 font-semibold">
              From Concept to Keepsake
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {CREATE_ATELIER_STEPS.map((step) => (
              <div key={step.step} className="flex flex-col group">
                <div className="relative aspect-3/4 bg-[#F4F0EA] flex items-center justify-center p-3 overflow-hidden border border-brand-dark/10 mb-2.5">
                  <span className="absolute top-2 left-2 font-sans text-[10px] font-bold text-brand-dark/70 bg-white/90 px-1.5 py-0.2">
                    {step.step}
                  </span>
                  <img
                    src={step.image}
                    alt={step.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="font-serif text-xs sm:text-sm text-brand-dark font-medium leading-snug">
                  {step.name}
                </h4>
                <p className="font-sans text-[11px] text-brand-light mt-0.5 leading-tight line-clamp-2">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Service Details Card */}
        <div className="lg:col-span-5 bg-white border border-brand-dark/15 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold-600 font-semibold">
                {activeService.badge}
              </span>
              <span className="font-sans text-[11px] bg-brand-dark/5 px-2.5 py-0.5 text-brand-dark font-medium">
                {activeService.turnaround}
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-2">
              {activeService.title}
            </h3>
            <p className="font-sans text-xs text-brand-light italic mb-4">
              {activeService.subtitle}
            </p>

            <p className="font-sans text-sm text-brand-medium leading-relaxed mb-6">
              {activeService.description}
            </p>

            {/* Service Pillars List */}
            <div className="border-t border-brand-dark/10 pt-4 mb-6">
              <h4 className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-dark mb-2">
                Available Customizations:
              </h4>
              <ul className="space-y-1.5 text-xs font-sans text-brand-medium">
                <li className="flex items-center gap-2">
                  <span className="text-gold-600">✦</span>
                  <span>Hot-foil debossing & custom metallic dies</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-600">✦</span>
                  <span>Pantone-matched organic cotton & silk ribbons</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold-600">✦</span>
                  <span>Curated artisanal object sourcing</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConsultModal(true)}
            className="w-full py-3.5 px-6 bg-brand-dark hover:bg-gold-600 text-brand-ivory text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] transition-colors cursor-pointer"
          >
            Start Bespoke Consultation
          </button>
        </div>
      </div>

      {/* ── Consultation Modal ── */}
      {showConsultModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowConsultModal(false)}
        >
          <div
            className="bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-dark/15 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowConsultModal(false)}
              className="absolute top-4 right-4 text-brand-dark/60 hover:text-brand-dark p-1"
            >
              ✕
            </button>
            <span className="font-sans text-[11px] uppercase tracking-widest text-gold-600 font-semibold block mb-1">
              Atelier Consultation
            </span>
            <h3 className="font-serif text-2xl text-brand-dark font-normal mb-2">
              Begin your custom commission
            </h3>
            <p className="font-sans text-xs text-brand-medium mb-5">
              Let us know what you have in mind for your gifts, event souvenirs, or corporate orders.
            </p>
            <div className="space-y-3 font-sans text-xs">
              <input
                type="text"
                placeholder="Your Name / Organization"
                className="w-full p-3 border border-brand-dark/20 focus:outline-none focus:border-brand-dark"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full p-3 border border-brand-dark/20 focus:outline-none focus:border-brand-dark"
              />
              <textarea
                rows={3}
                placeholder="Briefly describe your project (quantities, dates, motif)..."
                className="w-full p-3 border border-brand-dark/20 focus:outline-none focus:border-brand-dark resize-none"
              />
              <button
                type="button"
                onClick={() => {
                  alert('Thank you! Our studio team will reach out within 24 hours.');
                  setShowConsultModal(false);
                }}
                className="w-full py-3 bg-brand-dark text-brand-ivory font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
              >
                Send Commission Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Link ── */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-brand-dark/10 flex items-center justify-between text-xs text-brand-medium">
        <span>No project too small or corporate scale too grand.</span>
        <button
          type="button"
          onClick={() => onNavigateToRoom(5)}
          className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark hover:text-gold-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Next: Ready to find your good thing? (Room 06)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default RoomCreate;
