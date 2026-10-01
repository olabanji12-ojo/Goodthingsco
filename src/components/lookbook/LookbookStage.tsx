import React, { useEffect, useRef } from 'react';
import { LOOKBOOK_ROOMS } from './types';
import RoomWelcome from './RoomWelcome';
import RoomShop from './RoomShop';
import RoomGifts from './RoomGifts';
import RoomSouvenirs from './RoomSouvenirs';
import RoomCreate from './RoomCreate';
import RoomFinale from './RoomFinale';

interface LookbookStageProps {
  activeRoomIndex: number;
  onSelectRoom: (index: number) => void;
  className?: string;
}

/**
 * LookbookStage — The Discrete 100vh Multi-Room Viewport Stage
 *
 * Concept B: Screen-by-Screen Lookbook Experience.
 * Zero endless vertical page scrolling.
 *
 * Controls:
 * - Direct room selection from Top Sub-Header
 * - Keyboard Arrow Keys (Left ←, Right →)
 * - Subtle floating side arrows (‹ and ›)
 * - Touch swipe left/right
 */
export const LookbookStage: React.FC<LookbookStageProps> = ({
  activeRoomIndex,
  onSelectRoom,
  className = '',
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prevRoom = LOOKBOOK_ROOMS[activeRoomIndex - 1];
  const nextRoom = LOOKBOOK_ROOMS[activeRoomIndex + 1];

  // Keyboard navigation listener (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (activeRoomIndex < LOOKBOOK_ROOMS.length - 1) {
          e.preventDefault();
          onSelectRoom(activeRoomIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (activeRoomIndex > 0) {
          e.preventDefault();
          onSelectRoom(activeRoomIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRoomIndex, onSelectRoom]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    // Minimum swipe distance of 50px
    if (Math.abs(diffX) > 50) {
      if (diffX > 0 && activeRoomIndex < LOOKBOOK_ROOMS.length - 1) {
        // Swiped Left -> Go Next
        onSelectRoom(activeRoomIndex + 1);
      } else if (diffX < 0 && activeRoomIndex > 0) {
        // Swiped Right -> Go Prev
        onSelectRoom(activeRoomIndex - 1);
      }
    }
    touchStartX.current = null;
  };

  return (
    <div
      ref={stageRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-[calc(100vh-125px)] md:h-[calc(100vh-140px)] overflow-hidden bg-[#FAF8F5] select-none ${className}`}
      aria-label="Good Things Co. Lookbook Stage"
    >
      {/* ── Active Room Viewport ── */}
      <div className="w-full h-full relative overflow-hidden">
        {/* Room 01: Welcome */}
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out transform ${
            activeRoomIndex === 0
              ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
              : activeRoomIndex > 0
              ? 'opacity-0 -translate-x-12 pointer-events-none z-0'
              : 'opacity-0 translate-x-12 pointer-events-none z-0'
          }`}
        >
          <RoomWelcome onNavigateToRoom={onSelectRoom} />
        </div>

        {/* Room 02: Shop (For Me) */}
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out transform ${
            activeRoomIndex === 1
              ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
              : activeRoomIndex > 1
              ? 'opacity-0 -translate-x-12 pointer-events-none z-0'
              : 'opacity-0 translate-x-12 pointer-events-none z-0'
          }`}
        >
          <RoomShop onNavigateToRoom={onSelectRoom} />
        </div>

        {/* Room 03: Gifts (For Someone) */}
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out transform ${
            activeRoomIndex === 2
              ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
              : activeRoomIndex > 2
              ? 'opacity-0 -translate-x-12 pointer-events-none z-0'
              : 'opacity-0 translate-x-12 pointer-events-none z-0'
          }`}
        >
          <RoomGifts onNavigateToRoom={onSelectRoom} />
        </div>

        {/* Room 04: Souvenirs (Events) */}
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out transform ${
            activeRoomIndex === 3
              ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
              : activeRoomIndex > 3
              ? 'opacity-0 -translate-x-12 pointer-events-none z-0'
              : 'opacity-0 translate-x-12 pointer-events-none z-0'
          }`}
        >
          <RoomSouvenirs onNavigateToRoom={onSelectRoom} />
        </div>

        {/* Room 05: Create (Something Custom) */}
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out transform ${
            activeRoomIndex === 4
              ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
              : activeRoomIndex > 4
              ? 'opacity-0 -translate-x-12 pointer-events-none z-0'
              : 'opacity-0 translate-x-12 pointer-events-none z-0'
          }`}
        >
          <RoomCreate onNavigateToRoom={onSelectRoom} />
        </div>

        {/* Room 06: Finale (Closing CTA) */}
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out transform ${
            activeRoomIndex === 5
              ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
              : activeRoomIndex > 5
              ? 'opacity-0 -translate-x-12 pointer-events-none z-0'
              : 'opacity-0 translate-x-12 pointer-events-none z-0'
          }`}
        >
          <RoomFinale onNavigateToRoom={onSelectRoom} />
        </div>
      </div>

      {/* ── Left Floating Side Arrow (Desktop) ── */}
      {prevRoom && (
        <button
          type="button"
          onClick={() => onSelectRoom(activeRoomIndex - 1)}
          className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-brand-dark border border-brand-dark/15 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group"
          aria-label={`Previous: Room ${prevRoom.number} ${prevRoom.name}`}
          title={`Previous: Room ${prevRoom.number} ${prevRoom.name}`}
        >
          <span className="text-sm font-bold group-hover:-translate-x-0.5 transition-transform">‹</span>
        </button>
      )}

      {/* ── Right Floating Side Arrow (Desktop) ── */}
      {nextRoom && (
        <button
          type="button"
          onClick={() => onSelectRoom(activeRoomIndex + 1)}
          className="hidden lg:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-brand-dark border border-brand-dark/15 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group"
          aria-label={`Next: Room ${nextRoom.number} ${nextRoom.name}`}
          title={`Next: Room ${nextRoom.number} ${nextRoom.name}`}
        >
          <span className="text-sm font-bold group-hover:translate-x-0.5 transition-transform">›</span>
        </button>
      )}

      {/* ── Minimalist Keyboard Hint at bottom right ── */}
      <div className="hidden xl:flex items-center gap-2 fixed bottom-3 right-6 z-40 bg-white/70 backdrop-blur-xs px-3 py-1 border border-brand-dark/10 rounded-full text-[10px] font-sans text-brand-light pointer-events-none">
        <span>Use</span>
        <kbd className="px-1.5 py-0.5 bg-brand-dark/5 border border-brand-dark/15 rounded-xs font-mono text-[9px] text-brand-dark">
          ←
        </kbd>
        <kbd className="px-1.5 py-0.5 bg-brand-dark/5 border border-brand-dark/15 rounded-xs font-mono text-[9px] text-brand-dark">
          →
        </kbd>
        <span>keys to explore rooms</span>
      </div>
    </div>
  );
};

export default LookbookStage;
