import { BudgetTier } from './types';

export const budgetTiers: BudgetTier[] = [
  {
    id: 'under-25k',
    range: 'Under ₦25,000',
    title: 'Thoughtful Tokens',
    tag: 'Daily Pleasures',
    description: 'Delightful gifts chosen with care — perfect for spontaneous gestures and thoughtful thank-yous.',
    examples: ['Scented Travel Tins', 'Linen Journal Notebooks', 'Artisan Loose Teas', 'Leather Key Tags'],
    href: '/shop?budget=under-25000',
  },
  {
    id: '25k-50k',
    range: '₦25,000 – ₦50,000',
    title: 'Curated Gestures',
    tag: 'Signature Touches',
    description: 'Elevated lifestyle pieces that make everyday moments at home and work feel more considered.',
    examples: ['Ceramic Mug & Saucers', 'Woven Silk Scarves', 'Brass Desk Trinkets', 'Gourmet Gift Boxes'],
    href: '/shop?budget=25000-50000',
  },
  {
    id: '50k-100k',
    range: '₦50,000 – ₦100,000',
    title: 'Distinctive Keepsakes',
    tag: 'Elevated Gifting',
    description: 'Distinguished artisanal creations, handcrafted accessories, and celebration bundles.',
    examples: ['Handcrafted Leather Bags', 'Silver Jewelry Accents', 'Luxury Bath Rituals', 'Celebration Hampers'],
    href: '/shop?budget=50000-100000',
  },
  {
    id: 'premium',
    range: '₦100,000+',
    title: 'Luxury & Bespoke',
    tag: 'Bespoke Prestige',
    description: 'Our most prestigious offerings, custom-engraved collector pieces, and grand bespoke trunks.',
    examples: ['Custom Bespoke Trunks', 'Collector Timepieces', 'Fine Gold Jewelry Sets', 'Executive Packages'],
    href: '/shop?budget=premium',
  },
];
