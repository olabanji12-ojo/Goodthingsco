import React from 'react';
import { GatewayNav } from '../components/gateway';
import {
  AboutHero,
  AboutStory,
  AboutBeliefs,
  AboutProcess,
  AboutOfferings,
  AboutFinalCta,
} from '../components/about';
import { Footer } from '../components/homepage/footer/Footer';

/**
 * AboutPage — Good Things Co.
 *
 * An editorial About page explaining who Good Things Co. is,
 * why the brand exists, and what makes its approach to gifting different.
 *
 * Page Structure:
 * 1. HERO ("Thoughtful gifts for inspired living")
 * 2. OUR STORY (Editorial explanation of purpose)
 * 3. WHAT WE BELIEVE (5 core brand principles)
 * 4. HOW WE WORK (Curate → Personalise → Package → Deliver)
 * 5. WHAT WE OFFER (Shop, Corporate, Create, The Edit)
 * 6. FINAL CTA ("Find something thoughtful")
 */
export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent editorial margins */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── 1. Minimal Header Navigation (Shop | Corporate | Create | About) ── */}
        <GatewayNav activePath="about" />

        {/* ── 2. About Main Content ── */}
        <main className="w-full py-4 sm:py-6 md:py-8 flex flex-col items-center">
          {/* Section 1: Hero */}
          <AboutHero />

          {/* Section 2: Our Story */}
          <AboutStory />

          {/* Section 3: What We Believe */}
          <AboutBeliefs />

          {/* Section 4: How We Work */}
          <AboutProcess />

          {/* Section 5: What We Offer */}
          <AboutOfferings />

          {/* Section 6: Final CTA */}
          <AboutFinalCta />
        </main>
      </div>

      {/* ── 3. Normal Full-Width Footer ── */}
      <Footer />
    </div>
  );
};

export default AboutPage;
