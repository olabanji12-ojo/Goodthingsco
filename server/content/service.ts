/**
 * Good Things Co. — Website Content CMS Service
 */

import { getAdminAuth } from '../firebase';
import {
  firestoreContentRepository,
  type ContentRepository,
} from './repository';
import {
  ContentHttpError,
  isValidPageId,
  validateAndSanitizePageContent,
} from './domain';
import type {
  ContentPageId,
  StoredPageContent,
  PageContentMap,
} from '../../src/types/content';

type AdminIdentity = { uid: string; admin?: unknown; email?: string };

interface ServiceDependencies {
  repository?: ContentRepository;
  verify?: (token: string) => Promise<AdminIdentity>;
}

export function createContentManagement(dependencies: ServiceDependencies = {}) {
  const repo = dependencies.repository || firestoreContentRepository;
  const verify = dependencies.verify || ((token) => getAdminAuth().verifyIdToken(token, true));

  async function requireAdmin(authorization?: string): Promise<AdminIdentity> {
    if (!authorization || !/^Bearer \S{1,8192}$/.test(authorization)) {
      throw new ContentHttpError(401, 'Administrator authentication required.');
    }
    const token = authorization.slice(7);
    let identity: AdminIdentity;
    try {
      identity = await verify(token);
    } catch {
      throw new ContentHttpError(401, 'Invalid, revoked, or expired admin token.');
    }

    if (identity.admin !== true) {
      throw new ContentHttpError(403, 'Administrator privilege required.');
    }
    return identity;
  }

  return {
    /**
     * 1. Public: Get page content (safe sanitized text with fallback defaults)
     */
    async getPublicPageContent<T extends ContentPageId>(pageId: T): Promise<StoredPageContent<PageContentMap[T]>> {
      if (!isValidPageId(pageId)) {
        throw new ContentHttpError(404, `Page "${pageId}" not found.`);
      }
      return repo.getPageContent(pageId);
    },

    /**
     * 2. Admin: Get page content with admin metadata
     */
    async getPageContentAsAdmin<T extends ContentPageId>(
      authorization: string | undefined,
      pageId: T
    ): Promise<StoredPageContent<PageContentMap[T]>> {
      await requireAdmin(authorization);
      if (!isValidPageId(pageId)) {
        throw new ContentHttpError(404, `Page "${pageId}" not found.`);
      }
      return repo.getPageContent(pageId);
    },

    /**
     * 3. Admin: Update page content
     */
    async updatePageContent<T extends ContentPageId>(
      authorization: string | undefined,
      pageId: T,
      rawPayload: unknown
    ): Promise<StoredPageContent<PageContentMap[T]>> {
      const admin = await requireAdmin(authorization);
      if (!isValidPageId(pageId)) {
        throw new ContentHttpError(404, `Page "${pageId}" not found.`);
      }

      // Validates and strictly strips all HTML
      const sanitized = validateAndSanitizePageContent(pageId, rawPayload);
      const saved = await repo.savePageContent(pageId, sanitized, admin.email || admin.uid);

      return saved;
    },
  };
}

export const contentService = createContentManagement();
