import React from 'react';
import storyImg from '../../assets/section6/section6.png';

interface AboutStoryProps {
  className?: string;
}

/**
 * AboutStory — Section 2: Our Story
 *
 * Communicates why Good Things Co. exists:
 * To make gifting feel easier, more personal, and more meaningful.
 */
export const AboutStory: React.FC<AboutStoryProps> = ({ className = '' }) => {
  return (
    <section
      aria-label="Our Story"
      className={`w-full max-w-6xl mx-auto mb-16 sm:mb-20 md:mb-24 ${className}`}
    >
      <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-[0_12px_40px_rgba(28,20,14,0.05)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* ── Left Column: Editorial Lifestyle Imagery (5 cols) ── */}
          <div className="lg:col-span-5 relative overflow-hidden bg-brand-dark/5 min-h-[300px] sm:min-h-[380px] lg:min-h-full">
            <img
              src={storyImg}
              alt="Thoughtful morning ritual with journal, ceramic tea cup, and natural morning light"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/30 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-xs">
              <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gold-700 block">
                The GTC Philosophy
              </span>
              <span className="font-serif italic text-xs text-brand-dark block mt-0.5">
                Elevating everyday rituals into lasting memories.
              </span>
            </div>
          </div>

          {/* ── Right Column: Editorial Narrative (7 cols) ── */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-white">
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-2">
              Our Story
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-dark font-normal tracking-tight leading-snug mb-5">
              Restoring Intention to the Art of Giving
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-brand-medium/90 font-sans leading-relaxed mb-8">
              <p>
                Gifting is one of the oldest human expressions of affection and respect. Yet in recent years, the experience has become increasingly rushed, transactional, and generic—caught between impersonal marketplace algorithms and mass-produced novelty hampers.
              </p>
              <p>
                Good Things Co. was created to change that. We set out to build a calmer, more considered gifting sanctuary where every object has purpose, every scent tells a story, and every detail—from the weight of the paper to the fold of the ribbon—is finished by hand with genuine care.
              </p>
              <p>
                Whether you are celebrating a quiet birthday, expressing profound gratitude to a client, or commissioning bespoke keepsakes for an enterprise milestone, our mission is simple: to make gifting feel effortless for you, and unforgettable for the recipient.
              </p>
            </div>

            {/* Pull Quote */}
            <div className="pt-6 border-t border-brand-dark/10">
              <p className="font-serif italic text-base sm:text-lg text-brand-dark leading-snug">
                “A gift is never just an object. It is tangible proof that someone paused their world to think of you.”
              </p>
              <span className="font-sans text-[10px] uppercase tracking-widest text-brand-light block mt-2">
                Good Things Co. Founding Ethos
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
