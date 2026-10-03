/**
 * In-memory Content Repository for testing
 */

import type { ContentRepository } from '../../server/content/repository';
import type { ContentPageId, StoredPageContent, PageContentMap } from '../../src/types/content';
import { DEFAULT_PAGE_CONTENTS, isValidPageId } from '../../server/content/domain';

export function createMemoryContentRepository(
  initialData: Partial<Record<ContentPageId, any>> = {}
): ContentRepository & { storage: Map<string, any> } {
  const storage = new Map<string, any>();

  for (const [pageId, content] of Object.entries(initialData)) {
    storage.set(pageId, {
      pageId,
      content,
      updatedAt: new Date().toISOString(),
      updatedBy: 'seed',
    });
  }

  return {
    storage,

    async getPageContent<T extends ContentPageId>(pageId: T): Promise<StoredPageContent<PageContentMap[T]>> {
      if (!isValidPageId(pageId)) {
        throw new Error(`Invalid page ID: ${pageId}`);
      }

      const defaultContent = DEFAULT_PAGE_CONTENTS[pageId] as PageContentMap[T];
      const existing = storage.get(pageId);

      if (!existing) {
        return {
          pageId,
          content: defaultContent,
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        pageId,
        content: { ...defaultContent, ...existing.content },
        updatedAt: existing.updatedAt,
        updatedBy: existing.updatedBy,
      };
    },

    async savePageContent<T extends ContentPageId>(
      pageId: T,
      content: PageContentMap[T],
      updatedBy = 'admin'
    ): Promise<StoredPageContent<PageContentMap[T]>> {
      if (!isValidPageId(pageId)) {
        throw new Error(`Invalid page ID: ${pageId}`);
      }

      const payload: StoredPageContent<PageContentMap[T]> = {
        pageId,
        content,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };

      storage.set(pageId, payload);
      return payload;
    },
  };
}
