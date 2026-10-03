/**
 * Good Things Co. — Website Content CMS Unit Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createContentManagement } from '../../server/content/service';
import { createMemoryContentRepository } from './memory';
import {
  ContentHttpError,
  sanitizeContentText,
  validateAndSanitizePageContent,
  DEFAULT_PAGE_CONTENTS,
} from '../../server/content/domain';

describe('Website Content CMS Phase Test Suite', () => {
  const adminToken = 'Bearer valid-admin-token';
  const userToken = 'Bearer normal-user-token';

  const mockVerify = async (token: string) => {
    if (token === 'valid-admin-token') return { uid: 'adm-1', admin: true, email: 'admin@goodthingsco.ng' };
    if (token === 'normal-user-token') return { uid: 'usr-1', admin: false, email: 'customer@example.com' };
    throw new Error('Invalid or revoked token');
  };

  let repo: ReturnType<typeof createMemoryContentRepository>;
  let service: ReturnType<typeof createContentManagement>;

  beforeEach(() => {
    repo = createMemoryContentRepository();
    service = createContentManagement({
      repository: repo,
      verify: mockVerify,
    });
  });

  // 1–3: Public Content Retrieval & Fallback
  it('1. Public user loads home page content and gets authoritative defaults when unseeded', async () => {
    const res = await service.getPublicPageContent('home');
    assert.equal(res.pageId, 'home');
    assert.equal(res.content.heroTitle, DEFAULT_PAGE_CONTENTS.home.heroTitle);
    assert.equal(res.content.heroTagline, 'Considered Curation & Bespoke Gifting');
    assert.ok(res.updatedAt);
  });

  it('2. All 6 supported content pages return valid default structures', async () => {
    const pages = ['home', 'shop', 'corporate', 'create', 'about', 'footer'] as const;
    for (const page of pages) {
      const res = await service.getPublicPageContent(page);
      assert.equal(res.pageId, page);
      assert.ok(res.content);
      assert.deepEqual(res.content, DEFAULT_PAGE_CONTENTS[page]);
    }
  });

  it('3. Public user receives 404 for invalid page ID', async () => {
    await assert.rejects(
      async () => {
        // @ts-expect-error test invalid ID
        await service.getPublicPageContent('nonexistent-page');
      },
      (err: any) => {
        assert.ok(err instanceof ContentHttpError);
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });

  // 4–6: Admin Authentication & Privileges
  it('4. Admin getPageContentAsAdmin rejects requests with no token', async () => {
    await assert.rejects(
      async () => {
        await service.getPageContentAsAdmin(undefined, 'home');
      },
      (err: any) => {
        assert.ok(err instanceof ContentHttpError);
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  it('5. Admin getPageContentAsAdmin rejects normal users without admin claim', async () => {
    await assert.rejects(
      async () => {
        await service.getPageContentAsAdmin(userToken, 'home');
      },
      (err: any) => {
        assert.ok(err instanceof ContentHttpError);
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  it('6. Admin with valid token successfully loads page content', async () => {
    const res = await service.getPageContentAsAdmin(adminToken, 'corporate');
    assert.equal(res.pageId, 'corporate');
    assert.equal(res.content.heroTitle, DEFAULT_PAGE_CONTENTS.corporate.heroTitle);
  });

  // 7–10: Admin Update, HTML Stripping & Persistence
  it('7. Admin updates shop page content and changes persist', async () => {
    const updated = await service.updatePageContent(adminToken, 'shop', {
      headerTitle: 'The Autumn Luxury Curation',
      announcementText: 'Complimentary handwritten gift card with wax seal on all October orders.',
    });

    assert.equal(updated.content.headerTitle, 'The Autumn Luxury Curation');
    assert.equal(updated.content.announcementText, 'Complimentary handwritten gift card with wax seal on all October orders.');
    // Unprovided fields safely preserve default
    assert.equal(updated.content.searchPlaceholder, DEFAULT_PAGE_CONTENTS.shop.searchPlaceholder);

    // Read back via public endpoint
    const publicRead = await service.getPublicPageContent('shop');
    assert.equal(publicRead.content.headerTitle, 'The Autumn Luxury Curation');
  });

  it('8. HTML tags and script injections are strictly stripped from updated copy', async () => {
    const maliciousInput = {
      heroTitle: 'Curated Gifts <script>alert("xss")</script> & <b>Luxury</b>',
      heroSubtitle: '<iframe src="evil.com"></iframe>Thoughtfully assembled in Lagos.',
    };

    const sanitized = validateAndSanitizePageContent('home', maliciousInput);
    assert.equal(sanitized.heroTitle, 'Curated Gifts alert("xss") & Luxury');
    assert.equal(sanitized.heroSubtitle, 'Thoughtfully assembled in Lagos.');
    assert.ok(!sanitized.heroTitle.includes('<script>'));
    assert.ok(!sanitized.heroSubtitle.includes('<iframe'));
  });

  it('9. Direct sanitizeContentText handles length capping and control characters', () => {
    const dirty = 'Hello\u0000World <div style="color:red">Test</div>   ';
    const clean = sanitizeContentText(dirty, 50);
    assert.equal(clean, 'HelloWorld Test');
  });

  it('10. Admin update rejects non-object payload with 400', async () => {
    await assert.rejects(
      async () => {
        await service.updatePageContent(adminToken, 'about', 'just a string');
      },
      (err: any) => {
        assert.ok(err instanceof ContentHttpError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });
});
