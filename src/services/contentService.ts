/**
 * Good Things Co. — Website Content Client Service
 *
 * Provides instant fallback to code defaults, in-memory caching,
 * and seamless synchronization with /api/content and /api/admin/content.
 */

import type {
  ContentPageId,
  StoredPageContent,
  PageContentMap,
} from '../types/content';
import { DEFAULT_PAGE_CONTENTS } from '../data/defaultContent';

// In-memory cache to eliminate duplicate network fetches during user navigation
const contentCache: Partial<Record<ContentPageId, StoredPageContent<any>>> = {};

export async function fetchPageContent<T extends ContentPageId>(
  pageId: T
): Promise<StoredPageContent<PageContentMap[T]>> {
  // Return cached copy if available
  if (contentCache[pageId]) {
    return contentCache[pageId] as StoredPageContent<PageContentMap[T]>;
  }

  const defaultResult: StoredPageContent<PageContentMap[T]> = {
    pageId,
    content: DEFAULT_PAGE_CONTENTS[pageId],
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`/api/content/${pageId}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[ContentService] Server returned ${res.status} for page "${pageId}", using fallback copy.`);
      return defaultResult;
    }

    const json = await res.json();
    if (json.success && json.content) {
      const merged: StoredPageContent<PageContentMap[T]> = {
        pageId,
        content: { ...DEFAULT_PAGE_CONTENTS[pageId], ...json.content },
        updatedAt: json.updatedAt || new Date().toISOString(),
        updatedBy: json.updatedBy,
      };
      contentCache[pageId] = merged;
      return merged;
    }
    return defaultResult;
  } catch (err) {
    console.warn(`[ContentService] Network error fetching page "${pageId}", using fallback copy:`, err);
    return defaultResult;
  }
}

export async function fetchAdminPageContent<T extends ContentPageId>(
  pageId: T,
  token: string
): Promise<StoredPageContent<PageContentMap[T]>> {
  const defaultResult: StoredPageContent<PageContentMap[T]> = {
    pageId,
    content: DEFAULT_PAGE_CONTENTS[pageId],
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`/api/admin/content/${pageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch admin content (${res.status})`);
    }

    const json = await res.json();
    if (json.success && json.content) {
      const merged: StoredPageContent<PageContentMap[T]> = {
        pageId,
        content: { ...DEFAULT_PAGE_CONTENTS[pageId], ...json.content },
        updatedAt: json.updatedAt || new Date().toISOString(),
        updatedBy: json.updatedBy,
      };
      contentCache[pageId] = merged;
      return merged;
    }
    return defaultResult;
  } catch (err: any) {
    console.warn(`[ContentService] Admin fetch error for "${pageId}":`, err);
    throw err;
  }
}

export async function updateAdminPageContent<T extends ContentPageId>(
  pageId: T,
  contentPayload: Partial<PageContentMap[T]>,
  token: string
): Promise<StoredPageContent<PageContentMap[T]>> {
  const res = await fetch(`/api/admin/content/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ content: contentPayload }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || `Failed to save content changes (${res.status})`);
  }

  const json = await res.json();
  const saved: StoredPageContent<PageContentMap[T]> = {
    pageId,
    content: { ...DEFAULT_PAGE_CONTENTS[pageId], ...(json.content || contentPayload) },
    updatedAt: json.updatedAt || new Date().toISOString(),
    updatedBy: json.updatedBy,
  };

  // Invalidate cache with fresh data
  contentCache[pageId] = saved;
  return saved;
}

export { DEFAULT_PAGE_CONTENTS };
