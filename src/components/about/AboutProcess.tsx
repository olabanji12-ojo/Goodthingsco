import React from 'react';

interface AboutProcessProps {
  className?: string;
}

interface ProcessStep {
  step: string;
  name: string;
  subtitle: string;
  description: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    name: 'Curate',
    subtitle: 'Thoughtful selection',
    description:
      'We scour independent ateliers to source pieces of enduring beauty, utility, and sensory calm.',
  },
  {
    step: '02',
    name: 'Personalise',
    subtitle: 'Tailored sentiment',
    description:
      'Every order is customised with handwritten messages, custom ribbon choices, or bespoke monogramming.',
  },
  {
    step: '03',
    name: 'Package',
    subtitle: 'Artisanal finishing',
    description:
      'Hand-assembled in rigid keepsake boxes with archival tissue and hand-tied French satin ribbons.',
  },
  {
    step: '04',
    name: 'Deliver',
    subtitle: 'White-glove arrival',
    description:
      'Dispatched with temperature-controlled care to guarantee pristine unboxing for the recipient.',
  },
];

/**
 * AboutProcess — Section 4: How We Work
 *
 * Shows the simple 4-step sequence:
 * Curate → Personalise → Package → Deliver
 */
export const AboutProcess: React.FC<AboutProcessProps> = ({ className = '' }) => {
  return (
    <section
      aria-label="How We Work"
      className={`w-full max-w-6xl mx-auto mb-16 sm:mb-20 md:mb-24 ${className}`}
    >
      {/* ── Section Header ── */}
      <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-2">
          Our Process
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-dark font-normal tracking-tight mb-3">
          How We Work
        </h2>
        <p className="font-sans text-xs sm:text-sm text-brand-medium leading-relaxed">
          From initial curation to the moment of unboxing, every step is guided by quiet intentionality.
        </p>
      </div>

      {/* ── 4-Step Process Sequence (Desktop 4-cols, Mobile 1-col) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {PROCESS_STEPS.map((step, idx) => (
          <div
            key={step.step}
            className="bg-white rounded-2xl border border-brand-dark/10 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-300 relative group"
          >
            <div>
              {/* Step Counter & Connector Arrow */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-sm font-semibold text-gold-700">
                  Step {step.step}
                </span>
                {idx < PROCESS_STEPS.length - 1 && (
                  <span className="hidden lg:inline text-brand-dark/30 font-sans text-sm font-medium">
                    →
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal tracking-tight mb-1">
                {step.name}
              </h3>
              <span className="font-sans text-[11px] uppercase tracking-wider text-brand-light block mb-3">
                {step.subtitle}
              </span>

              {/* Description */}
              <p className="font-sans text-xs text-brand-medium/90 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Bottom accent indicator */}
            <div className="mt-6 pt-3 border-t border-brand-dark/5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-600/70" />
              <span className="font-sans text-[10px] text-brand-medium uppercase tracking-widest">
                GTC Standard
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutProcess;
