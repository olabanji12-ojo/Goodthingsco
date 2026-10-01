import React from 'react';
import { Link } from 'react-router-dom';
import { type EditArticle } from '../../data/editArticlesData';

interface EditArticleCardProps {
  article: EditArticle;
  className?: string;
}

/**
 * EditArticleCard — Reusable Editorial Article Card
 *
 * Designed with magazine journal elegance:
 * - Aspect-ratio controlled editorial image with subtle zoom
 * - Refined category & metadata badge
 * - Playfair Display serif title
 * - Thoughtful 2-3 line excerpt
 * - "Read Story →" CTA link
 */
export const EditArticleCard: React.FC<EditArticleCardProps> = ({
  article,
  className = '',
}) => {
  return (
    <article
      className={`group bg-white rounded-2xl border border-brand-dark/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* ── Article Thumbnail with Zoom Effect ── */}
        <Link
          to={`/edit/${article.slug}`}
          className="block relative aspect-[16/10] overflow-hidden bg-brand-dark/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
          aria-label={`Read ${article.title}`}
        >
          <img
            src={article.featuredImage}
            alt={article.featuredImageAlt}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category Chip */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-brand-dark/10 text-brand-dark font-sans text-[10px] font-bold uppercase tracking-wider">
              {article.categoryLabel}
            </span>
          </div>
        </Link>

        {/* ── Article Text Details ── */}
        <div className="p-5 sm:p-6">
          {/* Metadata: Date and Read Time */}
          <div className="flex items-center gap-2 text-[11px] font-sans text-brand-medium/70 uppercase tracking-wider mb-2.5">
            <span>{article.publishedDate}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg sm:text-xl text-brand-dark font-normal tracking-tight leading-snug mb-2.5 group-hover:text-gold-700 transition-colors duration-200">
            <Link to={`/edit/${article.slug}`}>
              {article.title}
            </Link>
          </h3>

          {/* Excerpt */}
          <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* ── Card Footer CTA ── */}
      <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-brand-dark/5 flex items-center justify-between">
        <span className="font-sans text-[11px] text-brand-medium/80">
          By {article.author.name}
        </span>

        <Link
          to={`/edit/${article.slug}`}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-700 transition-colors"
        >
          <span>Read Story</span>
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </article>
  );
};

export default EditArticleCard;
