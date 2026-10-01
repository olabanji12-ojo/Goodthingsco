/**
 * Good Things Co. — Temporary Development Seed Script
 *
 * Safe utility to seed initial sample products into the NEW Firestore "products" collection.
 * Uses placeholder image URLs (Cloudinary will be integrated in the next phase).
 *
 * Checks if products already exist before adding to prevent duplicate records.
 */

import { CreateProductInput } from '../types/product';
import { createProduct, getProductBySlug } from '../services/productService';

export const SAMPLE_PRODUCTS: CreateProductInput[] = [
  {
    name: 'Birthday Gift Box',
    slug: 'birthday-gift-box',
    description:
      'A curated celebratory gift box brimming with hand-poured botanical candles, artisan confectionery, and celebratory keepsakes.',
    price: 35000,
    compareAtPrice: 42000,
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Gift Box',
    occasions: ['birthday', 'congratulations'],
    recipients: ['her', 'mum', 'family', 'friend'],
    budgetRange: '25000-50000',
    stock: 10,
    isAvailable: true,
    featured: true,
    packagingOptions: ['Gift Box', 'Gift Bag'],
    ribbonColours: ['Gold', 'White'],
    personalisation: {
      enabled: true,
      messageAllowed: true,
      customTextAllowed: false,
    },
    variants: [
      {
        name: 'Size',
        options: ['Standard', 'Deluxe'],
      },
    ],
  },
  {
    name: 'Heritage Writing & Leather Journal Set',
    slug: 'heritage-writing-and-leather-journal-set',
    description:
      'Fine Smyth-sewn archival notebook bound in raw linen, paired with a weighted brass rollerball pen and vegetable-tanned leather bookmark.',
    price: 24000,
    compareAtPrice: 28000,
    images: [
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Desk & Executive',
    occasions: ['congratulations', 'thank-you', 'fathers-day', 'new-year'],
    recipients: ['him', 'dad', 'colleague', 'self'],
    budgetRange: 'under-25000',
    stock: 15,
    isAvailable: true,
    featured: true,
    packagingOptions: ['Signature Gift Box', 'Silk Keepsake Pouch'],
    ribbonColours: ['Midnight Navy', 'Champagne Gold'],
    personalisation: {
      enabled: true,
      messageAllowed: true,
      customTextAllowed: true,
      maxTextLength: 24,
    },
  },
];

/**
 * Seeds sample products into the Firestore database if they do not already exist.
 */
export async function seedInitialProducts(): Promise<{
  created: string[];
  skipped: string[];
}> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const sample of SAMPLE_PRODUCTS) {
    const existing = await getProductBySlug(sample.slug || '');
    if (existing) {
      skipped.push(sample.name);
    } else {
      const result = await createProduct(sample);
      created.push(result.name);
    }
  }

  return { created, skipped };
}

export const seedSampleProducts = seedInitialProducts;
