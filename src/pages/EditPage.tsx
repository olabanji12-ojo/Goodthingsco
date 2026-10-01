import React, { useState } from 'react';
import { GatewayNav } from '../components/gateway';
import {
  EditHero,
  EditFeaturedStory,
  EditCategoryNav,
  EditArticleGrid,
  EditNewsletterNote,
} from '../components/theEdit';
import {
  getFeaturedArticle,
  getArticlesByCategory,
  EDIT_CATEGORIES,
} from '../data/editArticlesData';
import { Footer } from '../components/homepage/footer/Footer';

/**
 * EditPage — The Edit (Editorial Journal of Good Things Co.)
 *
 * Page Structure:
 * 1. GatewayNav
 * 2. EditHero (Title: THE EDIT, concise supporting idea)
 * 3. EditFeaturedStory (One prominent magazine-style feature)
 * 4. EditCategoryNav (Clean entry points for 7 categories + category meaning)
 * 5. EditArticleGrid (Curated article grid)
 * 6. EditNewsletterNote (Discreet quarterly dispatch)
 * 7. Normal Full-Width Footer
 */
export const EditPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const featuredArticle = getFeaturedArticle();
  const filteredArticles = getArticlesByCategory(activeCategory);

  // If viewing 'all', we exclude the featured article from the latest grid to prevent duplicate display
  const gridArticles =
    activeCategory === 'all'
      ? filteredArticles.filter((a) => a.id !== featuredArticle.id)
      : filteredArticles;

  const currentCategoryMeta = EDIT_CATEGORIES.find((c) => c.slug === activeCategory);
  const gridTitle =
    activeCategory === 'all'
      ? 'Latest Stories & Guides'
      : currentCategoryMeta
      ? currentCategoryMeta.label
      : 'Stories & Curations';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent editorial margins */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── 1. Minimal Header Navigation ── */}
        <GatewayNav />

        {/* ── 2. The Edit Content Area ── */}
        <main className="w-full py-4 sm:py-6 md:py-8 flex flex-col items-center">
          {/* Section 1: Hero */}
          <EditHero />

          {/* Section 2: Prominent Featured Story (Shown prominently in All view or when relevant) */}
          {activeCategory === 'all' && (
            <EditFeaturedStory article={featuredArticle} />
          )}

          {/* Section 3: Clean Category Filter & Meaning */}
          <EditCategoryNav
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {/* Section 4: Curated Article Grid */}
          <EditArticleGrid
            articles={gridArticles}
            categoryTitle={gridTitle}
          />

          {/* Section 5: Editorial Dispatch Note */}
          <EditNewsletterNote />
        </main>
      </div>

      {/* ── 6. Normal Full-Width Footer ── */}
      <Footer />
    </div>
  );
};

export default EditPage;
