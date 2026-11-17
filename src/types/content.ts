/**
 * Good Things Co. — Website Content CMS Types & Schemas
 */

export type ContentPageId = 'home' | 'gateways' | 'shop' | 'corporate' | 'create' | 'about' | 'footer';

export const CONTENT_PAGES: { id: ContentPageId; label: string; description: string }[] = [
  { id: 'home', label: 'Home Page', description: 'Hero banner, brand title, and introductory narrative' },
  { id: 'gateways', label: 'Homepage Gateway Cards', description: 'Titles, target audience badges, preview text, and expanded details for Shop, Corporate, Create, and About cards' },
  { id: 'shop', label: 'Shop & Discovery', description: 'Catalog header, announcement banner, and curation instructions' },
  { id: 'corporate', label: 'Corporate Gifting', description: 'Enterprise messaging, concierge headlines, and volume copy' },
  { id: 'create', label: 'Create / Bespoke', description: 'Bespoke box builder headlines, step guides, and artisan notes' },
  { id: 'about', label: 'About Atelier', description: 'Heritage story, brand values, and artisan craftsmanship narrative' },
  { id: 'footer', label: 'Global Footer', description: 'Brand tagline, newsletter invitation, concierge contacts, and copyright' },
];

export interface HomePageContent {
  // Hero Focal Image (Custom Signature Gift Box / Festive Box)
  heroImageUrl?: string;
  heroImageAlt?: string;

  announcementEnabled?: boolean;
  announcementBadge?: string;
  announcementText?: string;
  announcementCtaText?: string;
  announcementLink?: string;

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

export interface GatewaysPageContent {
  shopTargetAudience: string;
  shopHeadline: string;
  shopShortDesc: string;
  shopDescription: string;
  shopJourneySteps: string;
  shopCtaText: string;

  corporateTargetAudience: string;
  corporateHeadline: string;
  corporateShortDesc: string;
  corporateDescription: string;
  corporateJourneySteps: string;
  corporateCtaText: string;

  createTargetAudience: string;
  createHeadline: string;
  createShortDesc: string;
  createDescription: string;
  createJourneySteps: string;
  createCtaText: string;

  aboutTargetAudience: string;
  aboutHeadline: string;
  aboutShortDesc: string;
  aboutDescription: string;
  aboutJourneySteps: string;
  aboutCtaText: string;
}

export interface PageContentMap {
  home: HomePageContent;
  gateways: GatewaysPageContent;
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
