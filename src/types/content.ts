/**
 * Good Things Co. — Website Content CMS Types & Schemas
 */

export type ContentPageId = 'home' | 'shop' | 'corporate' | 'create' | 'about' | 'footer';

export const CONTENT_PAGES: { id: ContentPageId; label: string; description: string }[] = [
  { id: 'home', label: 'Home Page', description: 'Hero banner, introductory narrative, and featured concierge messaging' },
  { id: 'shop', label: 'Shop & Discovery', description: 'Catalog header, announcement banner, and curation instructions' },
  { id: 'corporate', label: 'Corporate Gifting', description: 'Enterprise messaging, concierge headlines, and volume copy' },
  { id: 'create', label: 'Create / Bespoke', description: 'Bespoke box builder headlines, step guides, and artisan notes' },
  { id: 'about', label: 'About Atelier', description: 'Heritage story, brand values, and artisan craftsmanship narrative' },
  { id: 'footer', label: 'Global Footer', description: 'Brand tagline, newsletter invitation, concierge contacts, and copyright' },
];

export interface HomePageContent {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  curatedHeading: string;
  curatedDescription: string;
  conciergeHeading: string;
  conciergeText: string;
}

export interface ShopPageContent {
  headerTitle: string;
  headerSubtitle: string;
  announcementText: string;
  searchPlaceholder: string;
  emptyResultsMessage: string;
}

export interface CorporatePageContent {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  processHeading: string;
  processDescription: string;
  volumeHeading: string;
  volumeDescription: string;
}

export interface CreatePageContent {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  stepPrompt: string;
  completionNote: string;
}

export interface AboutPageContent {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  storyHeading: string;
  storyParagraph1: string;
  storyParagraph2: string;
  valuesHeading: string;
  valuesDescription: string;
}

export interface FooterContent {
  tagline: string;
  newsletterHeading: string;
  newsletterSubtext: string;
  newsletterButtonText: string;
  copyrightNotice: string;
  conciergePhone: string;
  conciergeEmail: string;
  atelierAddress: string;
}

export interface PageContentMap {
  home: HomePageContent;
  shop: ShopPageContent;
  corporate: CorporatePageContent;
  create: CreatePageContent;
  about: AboutPageContent;
  footer: FooterContent;
}

export interface StoredPageContent<T = Record<string, string>> {
  pageId: ContentPageId;
  content: T;
  updatedAt: string;
  updatedBy?: string;
}
