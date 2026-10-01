import React, { useState, useEffect } from 'react';
import { HeroNav } from '../components/homepage/HeroNav';
import { LookbookSubHeader, LookbookStage } from '../components/lookbook';

/**
 * LookbookPage — Screen-by-Screen Editorial Lookbook Experience
 *
 * Implements Concept B:
 * - 01 WELCOME
 * - 02 SHOP (For Me)
 * - 03 GIFTS (For Someone)
 * - 04 SOUVENIRS (For Events)
 * - 05 CREATE (Something Custom)
 * - 06 FINALE (Closing CTA)
 *
 * Zero endless vertical scroll fatigue.
 * Completely isolated from original HomePage.
 */
export const LookbookPage: React.FC = () => {
  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);

  useEffect(() => {
    document.title = 'Good Things Co. — Curated Editorial Lookbook';
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-brand-dark flex flex-col justify-between overflow-x-hidden">
      {/* ── 1. Main Brand Navigation Header ── */}
      <HeroNav className="bg-[#FAF8F5]/90 border-b border-brand-dark/5" />

      {/* ── 2. Top Integrated Sub-Header (The Numbered Room Index) ── */}
      <LookbookSubHeader
        activeRoomIndex={activeRoomIndex}
        onSelectRoom={setActiveRoomIndex}
      />

      {/* ── 3. Screen-by-Screen Lookbook Stage ── */}
      <main className="flex-1 w-full relative">
        <LookbookStage
          activeRoomIndex={activeRoomIndex}
          onSelectRoom={setActiveRoomIndex}
        />
      </main>

      {/* ── Side-by-Side Comparison Switcher Badge (Bottom-Left) ── */}
      <div className="fixed bottom-4 left-4 z-50">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-dark/90 hover:bg-brand-dark text-brand-ivory text-[11px] font-sans font-medium uppercase tracking-wider rounded-full shadow-lg backdrop-blur-xs transition-all hover:scale-105"
          title="Switch to original vertical homepage"
        >
          <span>↺ Switch to Vertical View</span>
        </a>
      </div>
    </div>
  );
};

export default LookbookPage;
