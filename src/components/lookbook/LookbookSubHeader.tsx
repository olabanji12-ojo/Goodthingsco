import React from 'react';
import { LOOKBOOK_ROOMS, RoomMeta } from './types';

interface LookbookSubHeaderProps {
  activeRoomIndex: number;
  onSelectRoom: (index: number) => void;
  className?: string;
}

/**
 * LookbookSubHeader — The Architectural Room Index Navigation
 *
 * Integrated right below the main header:
 * 01 WELCOME · 02 SHOP · 03 GIFTS · 04 SOUVENIRS · 05 CREATE · 06 FINALE
 *
 * Provides:
 * - Direct 1-click room jumping
 * - Smooth active indicator underline
 * - Active room counter ("Room 02 of 06")
 * - Left/Right quick navigation triggers
 */
export const LookbookSubHeader: React.FC<LookbookSubHeaderProps> = ({
  activeRoomIndex,
  onSelectRoom,
  className = '',
}) => {
  const currentRoom = LOOKBOOK_ROOMS[activeRoomIndex] || LOOKBOOK_ROOMS[0];

  const handlePrev = () => {
    if (activeRoomIndex > 0) {
      onSelectRoom(activeRoomIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeRoomIndex < LOOKBOOK_ROOMS.length - 1) {
      onSelectRoom(activeRoomIndex + 1);
    }
  };

  return (
    <nav
      aria-label="Lookbook Room Navigation"
      className={`w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-brand-dark/10 sticky top-0 z-30 transition-all duration-300 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between h-14 md:h-16">
        {/* ── Left: Room Counter & Mobile Indicator ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-brand-dark/5 px-2.5 py-1 rounded-full text-brand-dark font-sans text-[11px] font-semibold tracking-wider">
            <span className="text-gold-600 font-bold">{currentRoom.number}</span>
            <span className="text-brand-dark/40">/</span>
            <span className="text-brand-dark/60">{`0${LOOKBOOK_ROOMS.length}`}</span>
          </div>
          <span className="hidden sm:inline-block font-sans text-xs uppercase tracking-widest text-brand-medium/80 font-medium truncate max-w-[140px] md:max-w-none">
            {currentRoom.name} <span className="text-brand-dark/40 font-normal">· {currentRoom.subtitle}</span>
          </span>
        </div>

        {/* ── Center: Numbered Room Index Links (Desktop / Tablet) ── */}
        <div className="overflow-x-auto no-scrollbar py-1">
          <ul className="flex items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6">
            {LOOKBOOK_ROOMS.map((room: RoomMeta) => {
              const isActive = activeRoomIndex === room.index;
              return (
                <li key={room.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room.index)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-sans tracking-wider transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs'
                        : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-dark/5 font-medium'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold ${
                        isActive ? 'text-gold-300' : 'text-brand-dark/40 group-hover:text-gold-600'
                      }`}
                    >
                      {room.number}
                    </span>
                    <span className="uppercase text-[11px] tracking-[0.14em] whitespace-nowrap">
                      {room.name}
                    </span>
                    <span className="hidden xl:inline text-[9px] uppercase tracking-wider opacity-60">
                      ({room.subtitle})
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── Right: Previous / Next Room Buttons ── */}
        <div className="flex items-center gap-1 shrink-0 pl-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeRoomIndex === 0}
            className={`p-1.5 sm:p-2 rounded-full border transition-all duration-200 cursor-pointer ${
              activeRoomIndex === 0
                ? 'opacity-30 border-brand-dark/10 cursor-not-allowed text-brand-dark/40'
                : 'border-brand-dark/20 text-brand-dark hover:border-brand-dark hover:bg-brand-dark hover:text-white'
            }`}
            aria-label="Previous Room"
            title="Previous Room (or Left Arrow key)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={activeRoomIndex === LOOKBOOK_ROOMS.length - 1}
            className={`p-1.5 sm:p-2 rounded-full border transition-all duration-200 cursor-pointer ${
              activeRoomIndex === LOOKBOOK_ROOMS.length - 1
                ? 'opacity-30 border-brand-dark/10 cursor-not-allowed text-brand-dark/40'
                : 'border-brand-dark/20 text-brand-dark hover:border-brand-dark hover:bg-brand-dark hover:text-white'
            }`}
            aria-label="Next Room"
            title="Next Room (or Right Arrow key)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LookbookSubHeader;
