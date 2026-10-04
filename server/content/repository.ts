/**
 * Good Things Co. — Website Content Firestore Repository
 */

import { getAdminFirestore } from '../firebase.js';
import type { ContentPageId, StoredPageContent, PageContentMap } from '../../src/types/content.js';
import { DEFAULT_PAGE_CONTENTS, isValidPageId } from './domain.js';

export interface ContentRepository {
  getPageContent<T extends ContentPageId>(pageId: T): Promise<StoredPageContent<PageContentMap[T]>>;
  savePageContent<T extends ContentPageId>(
    pageId: T,
    content: PageContentMap[T],
    updatedBy?: string
  ): Promise<StoredPageContent<PageContentMap[T]>>;
}

export function createFirestoreContentRepository(): ContentRepository {
  return {
    async getPageContent<T extends ContentPageId>(pageId: T): Promise<StoredPageContent<PageContentMap[T]>> {
      if (!isValidPageId(pageId)) {
        throw new Error(`Invalid page ID: ${pageId}`);
      }

      const defaultContent = DEFAULT_PAGE_CONTENTS[pageId] as PageContentMap[T];

      try {
        const db = getAdminFirestore();
        const docRef = db.collection('siteContent').doc(pageId);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
          return {
            pageId,
            content: defaultContent,
            updatedAt: new Date().toISOString(),
          };
        }

        const data = snapshot.data();
        const mergedContent = { ...defaultContent, ...(data?.content || {}) };

        return {
          pageId,
          content: mergedContent as PageContentMap[T],
          updatedAt: data?.updatedAt || new Date().toISOString(),
          updatedBy: data?.updatedBy,
        };
      } catch (err) {
        console.warn(`[ContentRepo] Failed to read siteContent/${pageId} from Firestore, using default:`, err);
        return {
          pageId,
          content: defaultContent,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    async savePageContent<T extends ContentPageId>(
      pageId: T,
      content: PageContentMap[T],
      updatedBy = 'admin'
    ): Promise<StoredPageContent<PageContentMap[T]>> {
      if (!isValidPageId(pageId)) {
        throw new Error(`Invalid page ID: ${pageId}`);
      }

      const updatedAt = new Date().toISOString();
      const payload: StoredPageContent<PageContentMap[T]> = {
        pageId,
        content,
        updatedAt,
        updatedBy,
      };

      try {
        const db = getAdminFirestore();
        const docRef = db.collection('siteContent').doc(pageId);
        await docRef.set(payload, { merge: true });
      } catch (err) {
        console.warn(`[ContentRepo] Firestore save failed for siteContent/${pageId}:`, err);
      }

      return payload;
    },
  };
}

export const firestoreContentRepository = createFirestoreContentRepository();
