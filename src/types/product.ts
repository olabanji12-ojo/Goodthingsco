/**
 * Good Things Co. — Product Model & Taxonomy
 *
 * Core Data Foundation supporting the customer gifting discovery journey:
 * Occasion → Recipient → Budget → Curated Gifts
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';

export type BudgetRangeTier =
  | 'under-25000'
  | '25000-50000'
  | '50000-100000'
  | '100000-250000'
  | '250000-plus';

/**
 * Lifestyle category taxonomy — used for gift discovery filtering.
 * A product may belong to multiple lifestyle categories.
 */
export type LifestyleCategory =
  | 'food-drink'
  | 'fashion-style'
  | 'home-hosting'
  | 'books-writing'
  | 'art-creativity'
  | 'travel'
  | 'beauty-personal-care'
  | 'work-productivity'
  | 'culture-heritage'
  | 'wellness'
  | 'sports-fitness'
  | 'kids-family'
  | 'music-entertainment'
  | 'technology'
  | 'nature-outdoors';

export interface ProductVariant {
  name: string; // e.g. "Size", "Colour", "Style"
  options: string[]; // e.g. ["Small", "Medium", "Large"]
}

export interface ProductPersonalisation {
  enabled: boolean;
  messageAllowed?: boolean;
  customTextAllowed?: boolean;
  maxTextLength?: number;
}

/**
 * Cloudinary-backed Product Image object
 * Preserves secure URL, publicId for asset lifecycle management, and dimensional metadata.
 */
export interface ProductImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  alt?: string;
}

export type ProductImageItem = ProductImage | string;

export interface Product {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: (ProductImage | string)[];
  category: string;
  occasions: string[]; // Array to allow matching multiple occasions (e.g. ['birthday', 'thank-you'])
  recipients: string[]; // Array to allow matching multiple recipients (e.g. ['her', 'mum', 'family'])
  budgetRange: BudgetRangeTier;
  stock: number;
  isAvailable: boolean;
  isArchived: boolean;
  featured?: boolean;
  variants?: ProductVariant[];
  personalisation?: ProductPersonalisation;
  packagingOptions?: string[]; // e.g. ['Gift Box', 'Gift Bag', 'Wooden Box', 'Pouch']
  ribbonColours?: string[]; // e.g. ['Gold', 'White', 'Midnight Navy', 'Olive']
  /** Lifestyle categories for shop discovery filtering. Safe default: [] */
  lifestyles?: LifestyleCategory[];
  createdAt?: Timestamp | FieldValue | Date | string;
  updatedAt?: Timestamp | FieldValue | Date | string;
}

/**
 * Data payload accepted when creating a new product.
 * Auto-managed fields (id, createdAt, updatedAt, isArchived) are optional/handled by service.
 */
export interface CreateProductInput {
  name: string;
  slug?: string; // Optional — generated automatically if omitted
  description: string;
  price: number;
  compareAtPrice?: number;
  images?: (ProductImage | string)[];
  category: string;
  occasions: string[];
  recipients: string[];
  budgetRange: BudgetRangeTier;
  stock?: number;
  isAvailable?: boolean;
  featured?: boolean;
  variants?: ProductVariant[];
  personalisation?: ProductPersonalisation;
  packagingOptions?: string[];
  ribbonColours?: string[];
  lifestyles?: LifestyleCategory[];
}

/**
 * Editable fields for product update.
 */
export type UpdateProductInput = Partial<
  Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
>;

/**
 * Query filter parameters supported by the product service.
 */
export interface ProductFilterParams {
  occasion?: string;
  recipient?: string;
  budgetRange?: BudgetRangeTier;
  lifestyle?: LifestyleCategory | string;
  category?: string;
  featured?: boolean;
  isAvailable?: boolean;
  isArchived?: boolean; // Defaults to false in getActiveProducts()
  limit?: number;
}
