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
  | '100000-plus';

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

export interface Product {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
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
  images?: string[];
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
  category?: string;
  featured?: boolean;
  isAvailable?: boolean;
  isArchived?: boolean; // Defaults to false in getActiveProducts()
  limit?: number;
}
