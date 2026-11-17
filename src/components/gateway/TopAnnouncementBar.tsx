import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export interface TopAnnouncementBarProps {
  enabled?: boolean;
  badge?: string;
  text?: string;
  ctaText?: string;
  link?: string;
  className?: string;
}

export const TopAnnouncementBar: React.FC<TopAnnouncementBarProps> = ({
  enabled = true,
  badge = '2026 FESTIVE COLLECTION',
  text = '’Tis the Season to Be Merry',
  ctaText = 'Explore Gift Sets →',
  link = '/christmas',
  className = '',
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('gtc_announcement_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (!enabled || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try {
      sessionStorage.setItem('gtc_announcement_dismissed', 'true');
    } catch {}
  };

  const isChristmas =
    (link && link.toLowerCase().includes('christmas')) ||
    (badge && badge.toLowerCase().includes('festive'));

  return (
    <aside
      role="banner"
      aria-label="Seasonal announcement"
      className={`w-full bg-gradient-to-r from-emerald-950 via-neutral-900 to-emerald-950 text-white border-b border-gold-500/25 py-2 sm:py-2.5 px-4 transition-all duration-300 relative z-50 shadow-xs ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        {/* Clickable Banner Body */}
        <Link
          to={link || '/christmas'}
          className="flex-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center hover:opacity-95 transition-opacity py-0.5 cursor-pointer group"
        >
          {badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-sans font-bold uppercase tracking-widest border border-gold-500/35">
              <span>{isChristmas ? '🎄' : '✨'}</span>
              <span>{badge}</span>
            </span>
          )}

          {text && (
            <span className="font-serif text-xs sm:text-sm text-white/95 font-normal tracking-wide">
              {text}
            </span>
          )}

          {ctaText && (
            <span className="inline-flex items-center gap-1 font-sans text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gold-400 group-hover:text-gold-300 group-hover:underline underline-offset-4 transition-colors">
              <span>{ctaText}</span>
            </span>
          )}
        </Link>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 rounded-md hover:bg-white/10"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
};

export default TopAnnouncementBar;
