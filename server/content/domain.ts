/**
 * Good Things Co. — Website Content CMS Domain & Sanitization Logic
 */

import type {
  ContentPageId,
  PageContentMap,
} from '../../src/types/content';

export class ContentHttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ContentHttpError';
  }
}

export const VALID_PAGE_IDS: ContentPageId[] = ['home', 'shop', 'corporate', 'create', 'about', 'footer'];

export function isValidPageId(page: unknown): page is ContentPageId {
  return typeof page === 'string' && VALID_PAGE_IDS.includes(page as ContentPageId);
}

/**
 * Strict sanitization: Strips all HTML tags, removes unsafe control characters,
 * collapses excessive whitespace, and caps length to prevent database abuse or injection.
 */
export function sanitizeContentText(text?: unknown, maxLength = 2000): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags completely
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF]/g, '')
    .trim()
    .slice(0, maxLength);
}

export const DEFAULT_PAGE_CONTENTS: PageContentMap = {
  home: {
    heroTagline: 'Considered Curation & Bespoke Gifting',
    heroTitle: 'Thoughtfully Curated, Distinctly Yours',
    heroSubtitle: 'Luxury gift boxes, artisanal souvenirs, and corporate presentations crafted with intention in Lagos, Nigeria.',
    heroCtaText: 'Explore Curated Gifts',
    curatedHeading: 'The Art of Considered Giving',
    curatedDescription: 'Every box is meticulously assembled using premium keepsakes, rich ribbons, and handwritten calligraphed cards.',
    conciergeHeading: 'Private Client & Corporate Concierge',
    conciergeText: 'Partner with our atelier for tailored celebrations, milestone achievements, and bespoke volume shipments.',
  },
  shop: {
    headerTitle: 'The Gift Discovery Studio',
    headerSubtitle: 'Select your occasion, recipient, and budget to view perfectly matched bespoke presentations.',
    announcementText: 'Complimentary handwriting on all signature wax-sealed note cards.',
    searchPlaceholder: 'Search gift boxes, artisanal elements, occasions...',
    emptyResultsMessage: 'No gift boxes match your specific filter selection. Adjust your parameters or contact our concierge for a bespoke curation.',
  },
  corporate: {
    heroTagline: 'Enterprise & Institutional Relations',
    heroTitle: 'Elevated Corporate & Executive Gifting',
    heroSubtitle: 'Tailored client appreciation suites, branded executive presentations, and nationwide individual doorstep logistics.',
    processHeading: 'Seamless End-to-End Fulfilment',
    processDescription: 'From foil-stamped corporate debossing to multi-recipient spreadsheet dispatch across Nigeria and internationally.',
    volumeHeading: 'Authoritative Volume Advantage',
    volumeDescription: 'Tiered volume pricing automatically applied for commissions of 25, 50, and 100+ units.',
  },
  create: {
    heroTagline: 'Bespoke Atelier Experience',
    heroTitle: 'Build Your Custom Presentation',
    heroSubtitle: 'Handpick each artisanal keepsake, confectionery, and signature packaging to compose your personalized gift.',
    stepPrompt: 'Choose your packaging box, select internal contents, and draft your personalized card message.',
    completionNote: 'Our team hand-packs each creation with tissue paper, wax seals, and double-satin ribbon.',
  },
  about: {
    heroTagline: 'Our Philosophy & Provenance',
    heroTitle: 'A Considered Approach to Modern Gifting',
    heroSubtitle: 'Good Things Co. exists to elevate gratitude into an enduring tactile experience.',
    storyHeading: 'The Good Things Story',
    storyParagraph1: 'Founded on the belief that true luxury lies in thoughtfulness, we curate bespoke gift presentations celebrating Nigeria’s rich cultural tapestry and finest independent makers.',
    storyParagraph2: 'From artisan chocolatiers to master leatherworkers and heritage botanicals, every element is chosen with uncompromising devotion to beauty and purpose.',
    valuesHeading: 'The Atelier Standard',
    valuesDescription: 'Unwavering aesthetic rigor, authentic local sourcing, and seamless doorstep delivery that feels effortlessly elevated.',
  },
  footer: {
    tagline: 'Thoughtfully curated luxury gifts and bespoke presentations across Nigeria.',
    newsletterHeading: 'Join the Curation Society',
    newsletterSubtext: 'Receive seasonal edits, new collection previews, and private concierge invitations.',
    newsletterButtonText: 'Subscribe',
    copyrightNotice: '© 2026 Good Things Co. All rights reserved.',
    conciergePhone: '+234 803 555 0192',
    conciergeEmail: 'concierge@goodthingsco.ng',
    atelierAddress: 'Victoria Island, Lagos, Nigeria',
  },
};

export function validateAndSanitizePageContent<T extends ContentPageId>(
  pageId: T,
  payload: unknown
): PageContentMap[T] {
  if (!payload || typeof payload !== 'object') {
    throw new ContentHttpError(400, `Payload for page "${pageId}" must be an object.`);
  }

  const raw = payload as Record<string, unknown>;
  const defaults = DEFAULT_PAGE_CONTENTS[pageId] as unknown as Record<string, string>;
  const sanitized: Record<string, string> = {};

  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (key in raw && typeof raw[key] === 'string') {
      const cleaned = sanitizeContentText(raw[key], 3000);
      sanitized[key] = cleaned || defaultVal;
    } else {
      sanitized[key] = defaultVal;
    }
  }

  return sanitized as unknown as PageContentMap[T];
}
