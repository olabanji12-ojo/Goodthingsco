/**
 * Types for Section 2 — Customer Journey Showcase
 */

export interface JourneyCardItem {
  id: string;
  src: string;
  alt: string;
  title?: string;
}

export interface JourneyData {
  id: 'shop' | 'gifts' | 'create';
  number: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  side: 'left' | 'right'; // 'right' = text left / cards right; 'left' = cards left / text right
  cards: [JourneyCardItem, JourneyCardItem, JourneyCardItem]; // Strictly 3 cards per journey
}
