import React from 'react';
import { type EditArticle } from '../../data/editArticlesData';
import { EditArticleCard } from './EditArticleCard';

interface EditArticleGridProps {
  articles: EditArticle[];
  categoryTitle?: string;
  className?: string;
}

/**
 * EditArticleGrid — Section 4: Latest Stories / Curated Articles Grid
 *
 * Reusable editorial article grid:
 * - 3-column desktop layout, 2-column tablet, 1-column mobile
 * - Magazine journal spacing and typography
 * - Clean empty state handling
 */
export const EditArticleGrid: React.FC<EditArticleGridProps> = ({
  articles,
  categoryTitle = 'Latest Stories & Guides',
  className = '',
}) => {
  if (articles.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto py-16 text-center bg-white rounded-3xl border border-brand-dark/10 p-8 my-8">
        <h3 className="font-serif text-2xl text-brand-dark mb-2">No Stories in this Category Yet</h3>
        <p className="font-sans text-xs sm:text-sm text-brand-medium max-w-md mx-auto">
          Our editorial team is crafting new essays and guides for this section. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Stories and Guides"
      className={`w-full max-w-6xl mx-auto mb-16 sm:mb-20 md:mb-24 ${className}`}
    >
      {/* ── Section Title & Article Count ── */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 pb-3 border-b border-brand-dark/10">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            {categoryTitle}
          </h2>
          <span className="font-sans text-xs text-brand-medium">
            Chronicles of mindful living, craft, and considered gestures
          </span>
        </div>

        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark/60 bg-[#FAF8F5] px-3 py-1 rounded-full border border-brand-dark/10">
          {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
        </span>
      </div>

      {/* ── Responsive Editorial Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {articles.map((article) => (
          <EditArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default EditArticleGrid;
