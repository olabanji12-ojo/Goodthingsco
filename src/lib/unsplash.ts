/**
 * Unsplash Client & Editorial Category Image Service — Good Things Co.
 *
 * Uses the official unsplash-js (v8+ openapi-fetch) client with:
 * - Direct environment variable retrieval (VITE_UNSPLASH_ACCESS_KEY)
 * - Session and in-memory caching to eliminate redundant API requests
 * - Unsplash API-compliant attribution and download tracking
 * - Safe fallback handling
 */
import { createApi } from 'unsplash-js';

export interface UnsplashPhotoData {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  altText: string;
  photographerName: string;
  photographerUrl: string;
  downloadLocation?: string;
}

// In-memory cache for the current session
const memoryCache = new Map<string, UnsplashPhotoData>();

// Access key from Vite environment variables
const accessKey = (import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '').trim();

// Initialize official unsplash client
export const unsplashClient = accessKey
  ? createApi({
      accessKey,
    })
  : null;

/**
 * Trigger Unsplash download tracking per API guidelines
 */
export async function trackDownload(downloadLocation?: string) {
  if (!downloadLocation || !accessKey) return;
  try {
    // Unsplash requires appending client_id or authorization header
    const url = new URL(downloadLocation);
    if (!url.searchParams.has('client_id')) {
      url.searchParams.set('client_id', accessKey);
    }
    await fetch(url.toString(), { method: 'GET', mode: 'cors' });
  } catch {
    // Silent fail on non-critical analytics tracking
  }
}

/**
 * Fetch a curated editorial photo for a specific category search query
 */
export async function fetchCategoryPhoto(
  categoryId: string,
  searchQuery: string
): Promise<UnsplashPhotoData | null> {
  const cacheKey = `gtc_unsplash_cat_${categoryId}`;

  // 1. Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Check browser sessionStorage
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as UnsplashPhotoData;
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // SessionStorage unavailable / blocked
  }

  // 3. Fallback if no API key is available
  if (!accessKey) {
    return null;
  }

  // 4. Fetch from Unsplash Search API using official client or direct fetch
  try {
    if (unsplashClient) {
      const { data, error } = await unsplashClient.GET('/search/photos', {
        params: {
          query: {
            query: searchQuery,
            per_page: 8,
            orientation: 'portrait',
            order_by: 'relevant',
          },
        },
      });

      if (!error && data && data.results && data.results.length > 0) {
        const photo = data.results[0];

        const photoData: UnsplashPhotoData = {
          id: photo.id,
          // Use high-performance regular size or raw with explicit query params
          imageUrl: `${photo.urls.raw}&w=900&auto=format&fit=crop&q=82`,
          thumbnailUrl: photo.urls.small,
          altText: photo.description || searchQuery,
          photographerName: photo.user.name || 'Unsplash Creator',
          photographerUrl: `${photo.user.links.html}?utm_source=good_things_co&utm_medium=referral`,
          downloadLocation: photo.links.download_location,
        };

        // Cache result
        memoryCache.set(cacheKey, photoData);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(photoData));
        } catch {
          // Ignore storage quota
        }

        return photoData;
      }
    }
  } catch (error) {
    console.warn(`[Good Things Co.] Unsplash fetch for "${searchQuery}" fallback engaged:`, error);
  }

  return null;
}
