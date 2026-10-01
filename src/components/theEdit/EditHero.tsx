import React from 'react';

interface EditHeroProps {
  className?: string;
}

/**
 * EditHero — Section 1: The Edit Hero
 *
 * Concise title and supporting statement:
 * "THE EDIT"
 * "Stories, guides and ideas around thoughtful gifting, making, and meaningful living."
 */
export const EditHero: React.FC<EditHeroProps> = ({ className = '' }) => {
  return (
    <header className={`w-full text-center max-w-3xl mx-auto pt-2 pb-8 sm:pb-12 ${className}`}>
      {/* Subtle Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50/80 border border-gold-200/50 mb-3 sm:mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
        <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700">
          Good Things Co. · Editorial Journal
        </span>
      </div>

      {/* Main Title */}
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-brand-dark font-normal tracking-tight mb-3 sm:mb-4">
        THE EDIT
      </h1>

      {/* Supporting Idea: Concise, Thoughtful */}
      <p className="font-sans text-xs sm:text-sm md:text-base text-brand-medium/90 max-w-xl mx-auto leading-relaxed">
        Stories, guides and ideas around thoughtful gifting, making, and meaningful living.
      </p>

      {/* Subtle Divider Line */}
      <div className="w-12 h-px bg-brand-dark/20 mx-auto mt-6 sm:mt-8" />
    </header>
  );
};

export default EditHero;
