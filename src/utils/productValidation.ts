/**
 * Good Things Co. — Product Validation Utility
 *
 * Validates product payloads before any write operation to Firestore.
 * Prevents malformed, incomplete, or negative-priced documents from polluting the database.
 */

import { CreateProductInput, BudgetRangeTier, UpdateProductInput } from '../types/product';
import { isValidSlug } from './slugify';

export const VALID_BUDGET_RANGES: BudgetRangeTier[] = [
  'under-25000',
  '25000-50000',
  '50000-100000',
  '100000-plus',
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a product payload for creation.
 */
export function validateCreateProduct(input: Partial<CreateProductInput>): ValidationResult {
  const errors: string[] = [];

  // 1. Name
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length < 2) {
    errors.push('Product name is required and must be at least 2 characters.');
  }

  // 2. Slug (if provided explicitly)
  if (input.slug !== undefined && !isValidSlug(input.slug)) {
    errors.push('Product slug must be lowercase alphanumeric characters separated by hyphens.');
  }

  // 3. Description
  if (
    !input.description ||
    typeof input.description !== 'string' ||
    input.description.trim().length < 5
  ) {
    errors.push('Product description is required and must be at least 5 characters.');
  }

  // 4. Price
  if (typeof input.price !== 'number' || isNaN(input.price)) {
    errors.push('Price must be a valid number.');
  } else if (input.price < 0) {
    errors.push('Price cannot be negative.');
  }

  // 5. Compare at price (optional)
  if (input.compareAtPrice !== undefined) {
    if (typeof input.compareAtPrice !== 'number' || isNaN(input.compareAtPrice)) {
      errors.push('Compare at price must be a valid number.');
    } else if (input.compareAtPrice < 0) {
      errors.push('Compare at price cannot be negative.');
    }
  }

  // 6. Category
  if (!input.category || typeof input.category !== 'string' || input.category.trim().length === 0) {
    errors.push('Product category is required.');
  }

  // 7. Budget Range
  if (!input.budgetRange || !VALID_BUDGET_RANGES.includes(input.budgetRange as BudgetRangeTier)) {
    errors.push(
      `Budget range must be one of: ${VALID_BUDGET_RANGES.join(', ')}.`
    );
  }

  // 8. Stock
  if (input.stock !== undefined) {
    if (typeof input.stock !== 'number' || isNaN(input.stock)) {
      errors.push('Stock must be a valid number.');
    } else if (input.stock < 0) {
      errors.push('Stock cannot be negative.');
    } else if (!Number.isInteger(input.stock)) {
      errors.push('Stock must be an integer.');
    }
  }

  // 9. Occasions
  if (!Array.isArray(input.occasions)) {
    errors.push('Occasions must be an array of strings.');
  } else if (input.occasions.some((occ) => typeof occ !== 'string' || occ.trim().length === 0)) {
    errors.push('Every occasion item must be a non-empty string.');
  }

  // 10. Recipients
  if (!Array.isArray(input.recipients)) {
    errors.push('Recipients must be an array of strings.');
  } else if (input.recipients.some((rec) => typeof rec !== 'string' || rec.trim().length === 0)) {
    errors.push('Every recipient item must be a non-empty string.');
  }

  // 11. Images (optional array)
  if (input.images !== undefined) {
    if (!Array.isArray(input.images)) {
      errors.push('Images must be an array of image URLs or ProductImage objects.');
    } else {
      for (const img of input.images) {
        if (typeof img === 'string') {
          if (!img.trim()) errors.push('Image URL cannot be an empty string.');
        } else if (typeof img === 'object' && img !== null) {
          if (!img.url || typeof img.url !== 'string') {
            errors.push('Every product image object must have a valid url.');
          }
          if (!img.publicId || typeof img.publicId !== 'string') {
            errors.push('Every product image object must have a valid publicId.');
          }
        } else {
          errors.push('Image items must be valid strings or ProductImage objects.');
        }
      }
    }
  }

  // 12. Variants (optional)
  if (input.variants !== undefined) {
    if (!Array.isArray(input.variants)) {
      errors.push('Variants must be an array.');
    } else {
      input.variants.forEach((v, idx) => {
        if (!v || typeof v.name !== 'string' || !Array.isArray(v.options)) {
          errors.push(`Variant at index ${idx} must have a name string and options array.`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates partial updates for an existing product.
 */
export function validateUpdateProduct(updates: UpdateProductInput): ValidationResult {
  const errors: string[] = [];

  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters.');
    }
  }

  if (updates.slug !== undefined && !isValidSlug(updates.slug)) {
    errors.push('Product slug must be lowercase alphanumeric characters separated by hyphens.');
  }

  if (updates.description !== undefined) {
    if (typeof updates.description !== 'string' || updates.description.trim().length < 5) {
      errors.push('Product description must be at least 5 characters.');
    }
  }

  if (updates.price !== undefined) {
    if (typeof updates.price !== 'number' || isNaN(updates.price) || updates.price < 0) {
      errors.push('Price must be a non-negative number.');
    }
  }

  if (updates.compareAtPrice !== undefined) {
    if (typeof updates.compareAtPrice !== 'number' || isNaN(updates.compareAtPrice) || updates.compareAtPrice < 0) {
      errors.push('Compare at price must be a non-negative number.');
    }
  }

  if (updates.stock !== undefined) {
    if (typeof updates.stock !== 'number' || isNaN(updates.stock) || updates.stock < 0) {
      errors.push('Stock must be a non-negative integer.');
    }
  }

  if (updates.budgetRange !== undefined && !VALID_BUDGET_RANGES.includes(updates.budgetRange)) {
    errors.push(`Budget range must be one of: ${VALID_BUDGET_RANGES.join(', ')}.`);
  }

  if (updates.occasions !== undefined && !Array.isArray(updates.occasions)) {
    errors.push('Occasions must be an array of strings.');
  }

  if (updates.recipients !== undefined && !Array.isArray(updates.recipients)) {
    errors.push('Recipients must be an array of strings.');
  }

  if (updates.images !== undefined) {
    if (!Array.isArray(updates.images)) {
      errors.push('Images must be an array of image URLs or ProductImage objects.');
    } else {
      for (const img of updates.images) {
        if (typeof img === 'string') {
          if (!img.trim()) errors.push('Image URL cannot be an empty string.');
        } else if (typeof img === 'object' && img !== null) {
          if (!img.url || typeof img.url !== 'string') {
            errors.push('Every product image object must have a valid url.');
          }
          if (!img.publicId || typeof img.publicId !== 'string') {
            errors.push('Every product image object must have a valid publicId.');
          }
        } else {
          errors.push('Image items must be valid strings or ProductImage objects.');
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
