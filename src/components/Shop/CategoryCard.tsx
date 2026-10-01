import React, { useEffect, useState } from 'react';
import { CategoryDefinition } from './categoriesData';
import { fetchCategoryPhoto, trackDownload, UnsplashPhotoData } from '../../lib/unsplash';

interface CategoryCardProps {
  category: CategoryDefinition;
}

/**
 * CategoryCard — Editorial Shop Category Card
 *
 * Displays Unsplash-driven imagery with:
 * - Session-cached retrieval
 * - Warm neutral shimmer skeleton during load
 * - Compliant attribution & download tracking
 * - High-fidelity fallback when API key is unconfigured or rate limited
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const [photo, setPhoto] = useState<UnsplashPhotoData | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPhoto() {
      try {
        const fetched = await fetchCategoryPhoto(category.id, category.searchQuery);
        if (isMounted) {
          if (fetched) {
            setPhoto(fetched);
          } else {
            // Use configured fallback
            setPhoto({
              id: category.id,
              imageUrl: category.fallbackImageUrl,
              thumbnailUrl: category.fallbackImageUrl,
              altText: category.fallbackAlt,
              photographerName: category.fallbackPhotographer.name,
              photographerUrl: category.fallbackPhotographer.url,
            });
          }
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      }
    }

    loadPhoto();

    return () => {
      isMounted = false;
    };
  }, [category]);

  const activeImageUrl = (!hasError && photo?.imageUrl) || category.fallbackImageUrl;
  const activeAlt = (!hasError && photo?.altText) || category.fallbackAlt;
  const photographerName = photo?.photographerName || category.fallbackPhotographer.name;
  const photographerUrl = photo?.photographerUrl || category.fallbackPhotographer.url;

  const handleCardClick = () => {
    if (photo?.downloadLocation) {
      trackDownload(photo.downloadLocation);
    }
  };

  return (
    <article className="group relative flex flex-col w-full text-left" data-category-card={category.id}>
      {/* ── Card Image Container ── */}
      <a
        href={category.link}
        onClick={handleCardClick}
        className="relative w-full aspect-[4/5] overflow-hidden bg-[#ECE6DC] block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
        aria-label={`Explore ${category.title} collection`}
      >
        {/* Shimmer Skeleton (visible until image loads) */}
        {!imageLoaded && (
          <div
            className="absolute inset-0 bg-gradient-to-tr from-[#E6DFD4] via-[#F2EDE4] to-[#E6DFD4] animate-pulse z-10"
            aria-hidden="true"
          />
        )}

        {/* Category Image */}
        <img
          src={activeImageUrl}
          alt={activeAlt}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setHasError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />

        {/* Soft Editorial Vignette Gradient on Hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-dark/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          aria-hidden="true"
        />

        {/* Unsplash Attribution Badge (Unobtrusive) */}
        <div className="absolute bottom-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-90 transition-opacity duration-300">
          <a
            href={photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] tracking-wider uppercase bg-brand-dark/70 text-brand-ivory/90 hover:text-white px-2 py-1 backdrop-blur-xs font-sans rounded-none transition-colors"
            title={`Photo by ${photographerName} on Unsplash`}
          >
            Photo by {photographerName}
          </a>
        </div>
      </a>

      {/* ── Card Content & Typography ── */}
      <div className="pt-5 pb-2 flex flex-col items-start justify-between flex-1">
        <div className="w-full">
          <h3 className="font-serif text-2xl sm:text-[1.65rem] text-brand-dark tracking-[-0.01em] group-hover:text-brand-umber transition-colors duration-300">
            <a
              href={category.link}
              onClick={handleCardClick}
              className="focus:outline-none focus-visible:underline"
            >
              {category.title}
            </a>
          </h3>

          <p className="mt-2 font-sans text-xs sm:text-sm text-brand-medium/85 font-light leading-relaxed line-clamp-2">
            {category.description}
          </p>
        </div>

        {/* Subtle Action Link */}
        <div className="mt-4 pt-1">
          <a
            href={category.link}
            onClick={handleCardClick}
            className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.14em] uppercase text-brand-dark group-hover:text-gold-600 transition-colors duration-300 relative py-0.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 group-hover:after:w-full after:h-[1px] after:bg-gold-600 after:transition-all after:duration-300"
          >
            <span>Explore Collection</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};

export default CategoryCard;
