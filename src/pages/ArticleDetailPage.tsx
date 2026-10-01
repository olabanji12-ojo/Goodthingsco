import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GatewayNav } from '../components/gateway';
import { getArticleBySlug, getRelatedArticles } from '../data/editArticlesData';
import { EditArticleCard } from '../components/theEdit/EditArticleCard';
import { Footer } from '../components/homepage/footer/Footer';

/**
 * ArticleDetailPage — Reusable Editorial Article Reading View
 *
 * Suggested structure:
 * - Category badge & metadata
 * - Article Title (Playfair Display)
 * - Short intro / lead paragraph
 * - Author byline & role
 * - Hero image with caption
 * - Article body (clean, spacious typography, pull-quotes, supporting images, lists)
 * - Related stories
 * - Back to The Edit
 */
export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
          <GatewayNav />
          <main className="w-full py-24 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark mb-4">
              Article Not Found
            </h1>
            <p className="font-sans text-sm text-brand-medium mb-8">
              The editorial piece you are seeking does not exist or has been archived.
            </p>
            <Link
              to="/edit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-dark text-brand-ivory font-sans text-xs uppercase tracking-wider hover:bg-gold-600 transition-colors"
            >
              ← Back to The Edit
            </Link>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(article, 3);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* Container wrapper for consistent editorial margins */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-10 sm:pb-16">
        {/* ── 1. Minimal Header Navigation ── */}
        <GatewayNav />

        {/* ── 2. Editorial Reading Section ── */}
        <main className="w-full py-6 sm:py-10 flex flex-col items-center">
          {/* Back Navigation Breadcrumb */}
          <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/edit')}
              className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark/70 hover:text-brand-dark transition-colors cursor-pointer group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to The Edit</span>
            </button>

            <span className="font-sans text-xs text-brand-medium/70 uppercase tracking-widest">
              Issue Nº 04 · {article.publishedDate}
            </span>
          </div>

          {/* ── Article Header (Spacious, Editorial) ── */}
          <header className="w-full max-w-3xl text-center mb-8 sm:mb-12">
            {/* Category Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200/60 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700">
                {article.categoryLabel}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-brand-dark font-normal tracking-tight leading-tight mb-6">
              {article.title}
            </h1>

            {/* Short Intro / Subtitle */}
            <p className="font-sans text-base sm:text-lg text-brand-medium/90 max-w-2xl mx-auto leading-relaxed mb-8">
              {article.subtitle}
            </p>

            {/* Author Byline & Reading Time */}
            <div className="flex items-center justify-center gap-3 text-xs font-sans text-brand-medium pb-6 border-b border-brand-dark/10">
              <span className="font-semibold text-brand-dark">{article.author.name}</span>
              <span>·</span>
              <span>{article.author.role}</span>
              <span>·</span>
              <span>{article.readTime}</span>
            </div>
          </header>

          {/* ── Prominent Hero Image ── */}
          <div className="w-full max-w-4xl mb-12 sm:mb-16">
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-brand-dark/10 bg-brand-dark/5 aspect-[16/10] sm:aspect-[21/10]">
              <img
                src={article.featuredImage}
                alt={article.featuredImageAlt}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <p className="font-sans text-xs text-brand-medium/70 italic text-center mt-3">
              {article.featuredImageAlt}
            </p>
          </div>

          {/* ── Article Body (Optimal Reading Width: max-w-2xl sm:max-w-3xl) ── */}
          <article className="w-full max-w-2xl sm:max-w-3xl mx-auto text-brand-dark font-sans leading-relaxed">
            {/* Lead Paragraph */}
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-brand-dark/95 leading-relaxed font-normal mb-8 first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-gold-700">
              {article.leadParagraph}
            </p>

            {/* Content Blocks */}
            <div className="space-y-6 sm:space-y-8 text-sm sm:text-base text-brand-dark/85">
              {article.content.map((block, index) => {
                switch (block.type) {
                  case 'heading':
                    return (
                      <h2
                        key={index}
                        className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight pt-6 mb-2"
                      >
                        {block.text}
                      </h2>
                    );

                  case 'paragraph':
                    return (
                      <p key={index} className="leading-relaxed">
                        {block.text}
                      </p>
                    );

                  case 'quote':
                    return (
                      <blockquote
                        key={index}
                        className="my-8 sm:my-10 pl-6 sm:pl-8 border-l-2 border-gold-600 bg-white/60 p-6 rounded-r-2xl"
                      >
                        <p className="font-serif italic text-xl sm:text-2xl text-brand-dark leading-snug mb-3">
                          "{block.text}"
                        </p>
                        {block.attribution && (
                          <cite className="font-sans text-xs uppercase tracking-widest text-brand-medium/80 not-italic block">
                            — {block.attribution}
                          </cite>
                        )}
                      </blockquote>
                    );

                  case 'image':
                    return (
                      <figure key={index} className="my-8 sm:my-10">
                        <div className="rounded-2xl overflow-hidden border border-brand-dark/10 shadow-xs bg-white">
                          <img
                            src={block.imageUrl}
                            alt={block.imageCaption || 'Editorial supporting photo'}
                            className="w-full h-auto object-cover max-h-[440px]"
                          />
                        </div>
                        {block.imageCaption && (
                          <figcaption className="font-sans text-xs text-brand-medium/70 italic text-center mt-2.5">
                            {block.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    );

                  case 'callout':
                    return (
                      <div
                        key={index}
                        className="my-8 p-6 rounded-2xl bg-white border border-gold-300/60 shadow-xs"
                      >
                        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-gold-700 block mb-2">
                          Editorial Note
                        </span>
                        <p className="font-sans text-sm text-brand-dark font-medium leading-relaxed">
                          {block.text}
                        </p>
                      </div>
                    );

                  case 'list':
                    return (
                      <ul key={index} className="space-y-3 pl-4 sm:pl-6 my-6">
                        {block.items?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-brand-dark/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-600 mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            {/* ── Share / Footnote ── */}
            <div className="mt-12 pt-8 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-sans text-xs text-brand-medium">
                Published in <strong className="text-brand-dark">{article.categoryLabel}</strong> · Good Things Co. Editorial
              </span>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: article.title,
                      text: article.excerpt,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Article link copied to clipboard.');
                  }
                }}
                className="px-4 py-2 rounded-full border border-brand-dark/20 hover:border-brand-dark text-xs font-sans uppercase tracking-wider text-brand-dark hover:bg-black/5 transition-colors cursor-pointer"
              >
                Share Article
              </button>
            </div>
          </article>

          {/* ── 3. Related Stories Section ── */}
          <section
            aria-label="Related Stories"
            className="w-full max-w-6xl mx-auto mt-20 sm:mt-24 pt-12 border-t border-brand-dark/10"
          >
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-brand-dark/10">
              <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                Related Stories & Guides
              </h2>
              <Link
                to="/edit"
                className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-700 transition-colors"
              >
                View The Edit →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {relatedArticles.map((rel) => (
                <EditArticleCard key={rel.id} article={rel} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* ── 4. Normal Full-Width Footer ── */}
      <Footer />
    </div>
  );
};

export default ArticleDetailPage;
