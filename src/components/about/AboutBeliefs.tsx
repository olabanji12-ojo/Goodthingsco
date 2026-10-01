import React from 'react';

interface AboutBeliefsProps {
  className?: string;
}

interface BeliefItem {
  number: string;
  headline: string;
  description: string;
}

const BELIEFS: BeliefItem[] = [
  {
    number: '01',
    headline: 'Thoughtful over generic',
    description:
      'Every gift should reflect genuine human consideration—never convenient shortcuts or generic afterthoughts.',
  },
  {
    number: '02',
    headline: 'Curated over crowded',
    description:
      'We rigorously edit our collections so that only objects of sensory beauty, utility, and permanence remain.',
  },
  {
    number: '03',
    headline: 'Meaningful over mass-produced',
    description:
      'We champion natural materials, vegetable-tanned leathers, turned brass, and small-batch craftsmanship that endures.',
  },
  {
    number: '04',
    headline: 'Beautifully presented',
    description:
      'The unboxing ceremony matters. Archival papers, rigid keepsake boxes, and hand-tied ribbons turn receipt into celebration.',
  },
  {
    number: '05',
    headline: 'Made for real moments',
    description:
      'Gifting is not about excess. It is about honoring relationships, milestone accomplishments, and spontaneous gratitude.',
  },
];

/**
 * AboutBeliefs — Section 3: What We Believe
 *
 * Visually clean presentation of the 5 brand principles.
 * Avoids a cluttered corporate values grid.
 */
export const AboutBeliefs: React.FC<AboutBeliefsProps> = ({ className = '' }) => {
  return (
    <section
      aria-label="What We Believe"
      className={`w-full max-w-5xl mx-auto mb-16 sm:mb-20 md:mb-24 ${className}`}
    >
      {/* ── Section Header ── */}
      <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-2">
          Brand Principles
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-dark font-normal tracking-tight mb-3">
          What We Believe
        </h2>
        <p className="font-sans text-xs sm:text-sm text-brand-medium leading-relaxed">
          The guiding convictions that shape every curation, partnership, and presentation box we craft.
        </p>
      </div>

      {/* ── Editorial Beliefs List ── */}
      <div className="divide-y divide-brand-dark/10 bg-white rounded-3xl border border-brand-dark/10 shadow-[0_8px_30px_rgba(28,20,14,0.04)] overflow-hidden">
        {BELIEFS.map((belief) => (
          <div
            key={belief.number}
            className="p-6 sm:p-8 md:p-9 flex flex-col md:flex-row md:items-baseline justify-between gap-4 md:gap-8 hover:bg-[#FAF8F5]/50 transition-colors duration-200"
          >
            {/* Number & Headline */}
            <div className="flex items-baseline gap-4 md:w-5/12 shrink-0">
              <span className="font-serif text-lg sm:text-xl font-normal text-gold-700/80">
                {belief.number}
              </span>
              <h3 className="font-serif text-lg sm:text-xl md:text-2xl text-brand-dark font-normal tracking-tight">
                {belief.headline}
              </h3>
            </div>

            {/* Description */}
            <div className="md:w-7/12">
              <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed">
                {belief.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutBeliefs;
