import React from 'react';
import { Link } from 'react-router-dom';
import { type EditArticle } from '../../data/editArticlesData';

interface EditFeaturedStoryProps {
  article: EditArticle;
  className?: string;
}

/**
 * EditFeaturedStory — Section 2: Prominent Magazine-Style Feature
 *
 * Distinctive editorial layout:
 * - Large focal editorial image
 * - Category badge & publication metadata
 * - Striking serif headline
 * - Thoughtful excerpt
 * - "Read Story" CTA
 * - Avoids standard ecommerce blog-card styling
 */
export const EditFeaturedStory: React.FC<EditFeaturedStoryProps> = ({
  article,
  className = '',
}) => {
  return (
    <section
      aria-label="Featured Story"
      className={`w-full max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20 ${className}`}
    >
      <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-[0_16px_50px_rgba(28,20,14,0.06)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(28,20,14,0.09)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[440px] md:min-h-[500px]">
          {/* ── Left Column: Prominent Editorial Image (7 cols) ── */}
          <div className="lg:col-span-7 relative overflow-hidden bg-brand-dark/5 min-h-[280px] sm:min-h-[380px] lg:min-h-full">
            <Link
              to={`/edit/${article.slug}`}
              className="block w-full h-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
              aria-label={`Read featured story: ${article.title}`}
            >
              <img
                src={article.featuredImage}
                alt={article.featuredImageAlt}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating "Featured Story" Tag */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-brand-dark/10 text-brand-dark font-sans text-[10px] font-bold uppercase tracking-[0.2em] shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" />
                  Featured Story
                </span>
              </div>
            </Link>
          </div>

          {/* ── Right Column: Editorial Typography & Story Context (5 cols) ── */}
          <div className="lg:col-span-5 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Category, Date & Read Time */}
              <div className="flex items-center gap-2.5 text-[11px] font-sans text-brand-medium/80 uppercase tracking-[0.16em] mb-4">
                <span className="font-bold text-gold-700">{article.categoryLabel}</span>
                <span className="text-brand-dark/30">·</span>
                <span>{article.publishedDate}</span>
                <span className="text-brand-dark/30">·</span>
                <span>{article.readTime}</span>
              </div>

              {/* Headline */}
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] text-brand-dark font-normal tracking-tight leading-snug mb-3 sm:mb-4">
                <Link
                  to={`/edit/${article.slug}`}
                  className="hover:text-gold-700 transition-colors duration-300"
                >
                  {article.title}
                </Link>
              </h2>

              {/* Excerpt */}
              <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed line-clamp-4 mb-6">
                {article.excerpt}
              </p>
            </div>

            {/* Author Byline & CTA */}
            <div className="pt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-sans text-[10px] uppercase tracking-wider text-brand-light block">
                  Words by
                </span>
                <span className="font-serif text-xs sm:text-sm font-medium text-brand-dark">
                  {article.author.name}
                </span>
                <span className="font-sans text-[11px] text-brand-medium block">
                  {article.author.role}
                </span>
              </div>

              <Link
                to={`/edit/${article.slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-none bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-300 shadow-sm group shrink-0"
              >
                <span>Read Story</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditFeaturedStory;
