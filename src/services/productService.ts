/**
 * Good Things Co. — Product Service
 *
 * Dedicated Firestore CRUD and query service for product catalog.
 * Manages the "products" collection automatically via code.
 *
 * All operations enforce validation, slug integrity, and server timestamps.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterParams,
  BudgetRangeTier,
} from '../types/product';
import { slugify } from '../utils/slugify';
import {
  validateCreateProduct,
  validateUpdateProduct,
} from '../utils/productValidation';

export const PRODUCTS_COLLECTION = 'products';

/**
 * Helper to convert a Firestore DocumentSnapshot into a typed Product
 */
function mapDocToProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: data.name ?? '',
    slug: data.slug ?? '',
    description: data.description ?? '',
    price: data.price ?? 0,
    compareAtPrice: data.compareAtPrice,
    images: data.images ?? [],
    category: data.category ?? '',
    occasions: data.occasions ?? [],
    recipients: data.recipients ?? [],
    budgetRange: data.budgetRange ?? 'under-25000',
    stock: data.stock ?? 0,
    isAvailable: data.isAvailable ?? true,
    isArchived: data.isArchived ?? false,
    featured: data.featured ?? false,
    variants: data.variants ?? [],
    personalisation: data.personalisation,
    packagingOptions: data.packagingOptions ?? [],
    ribbonColours: data.ribbonColours ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * 1. CREATE PRODUCT
 *
 * - Validates input data
 * - Generates URL-friendly slug if not provided, ensuring uniqueness
 * - Applies sensible defaults (isArchived: false, isAvailable: true, stock: 0)
 * - Sets authoritative Firestore server timestamps
 * - Writes to the "products" collection (creating the collection automatically on first write)
 * - Returns the newly created Product with document ID
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  // A. Generate slug if omitted
  const candidateSlug = input.slug ? slugify(input.slug) : slugify(input.name);

  const payloadToValidate: Partial<CreateProductInput> = {
    ...input,
    slug: candidateSlug,
  };

  // B. Validate payload
  const validation = validateCreateProduct(payloadToValidate);
  if (!validation.isValid) {
    throw new Error(
      `[ProductService.createProduct] Validation failed: ${validation.errors.join('; ')}`
    );
  }

  // C. Ensure slug uniqueness
  const existingProductWithSlug = await getProductBySlug(candidateSlug);
  if (existingProductWithSlug) {
    throw new Error(
      `[ProductService.createProduct] A product with the slug "${candidateSlug}" already exists. Slugs must be unique.`
    );
  }

  // D. Prepare clean document data for Firestore
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const docData: Omit<Product, 'id'> = {
    name: input.name.trim(),
    slug: candidateSlug,
    description: input.description.trim(),
    price: input.price,
    compareAtPrice: input.compareAtPrice !== undefined ? input.compareAtPrice : undefined,
    images: input.images ?? [],
    category: input.category.trim(),
    occasions: input.occasions ?? [],
    recipients: input.recipients ?? [],
    budgetRange: input.budgetRange,
    stock: input.stock !== undefined ? input.stock : 0,
    isAvailable: input.isAvailable !== undefined ? input.isAvailable : true,
    isArchived: false,
    featured: input.featured ?? false,
    variants: input.variants ?? [],
    personalisation: input.personalisation,
    packagingOptions: input.packagingOptions ?? [],
    ribbonColours: input.ribbonColours ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // E. Write to Firestore
  const docRef = await addDoc(productsRef, docData);

  return {
    id: docRef.id,
    ...docData,
  };
}

/**
 * 2. READ PRODUCTS (General / Filtered)
 *
 * Retrieves all products or filtered subsets based on query parameters.
 */
export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const constraints: QueryConstraint[] = [];

    if (filters?.isArchived !== undefined) {
      constraints.push(where('isArchived', '==', filters.isArchived));
    }

    if (filters?.isAvailable !== undefined) {
      constraints.push(where('isAvailable', '==', filters.isAvailable));
    }

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.featured !== undefined) {
      constraints.push(where('featured', '==', filters.featured));
    }

    if (filters?.budgetRange) {
      constraints.push(where('budgetRange', '==', filters.budgetRange));
    }

    if (filters?.occasion) {
      constraints.push(where('occasions', 'array-contains', filters.occasion));
    }

    if (filters?.recipient && !filters.occasion) {
      // Single array-contains is supported per query in Firestore
      constraints.push(where('recipients', 'array-contains', filters.recipient));
    }

    if (filters?.limit && filters.limit > 0) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);

    let products: Product[] = (snapshot.docs as any[]).map((d: any) =>
      mapDocToProduct(d.id, d.data())
    );

    // If both occasion and recipient were supplied, filter recipient in-memory
    // to accommodate Firestore's single array-contains limitation cleanly
    if (filters?.occasion && filters?.recipient) {
      products = products.filter((p) => p.recipients.includes(filters.recipient!));
    }

    return products;
  } catch (error) {
    console.error('[ProductService.getProducts] Failed to query products:', error);
    throw new Error('Failed to retrieve products from database.');
  }
}

/**
 * 3. GET ACTIVE PRODUCTS
 *
 * Standard customer-facing query: returns only unarchived, active products.
 */
export async function getActiveProducts(onlyAvailable = true): Promise<Product[]> {
  return getProducts({
    isArchived: false,
    ...(onlyAvailable ? { isAvailable: true } : {}),
  });
}

/**
 * 4. GET PRODUCT BY ID
 *
 * Retrieves a single product document by Firestore document ID.
 * Returns null gracefully if not found.
 */
export async function getProductById(productId: string): Promise<Product | null> {
  if (!productId || typeof productId !== 'string') return null;

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapDocToProduct(snapshot.id, snapshot.data());
  } catch (error) {
    console.error(`[ProductService.getProductById] Failed to fetch product ${productId}:`, error);
    throw new Error(`Failed to retrieve product by ID.`);
  }
}

/**
 * 5. GET PRODUCT BY SLUG
 *
 * Retrieves a single product by its URL-friendly slug.
 * Returns null gracefully if no matching document exists.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug || typeof slug !== 'string') return null;

  try {
    const normalizedSlug = slugify(slug);
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('slug', '==', normalizedSlug), firestoreLimit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return mapDocToProduct(docSnap.id, docSnap.data());
  } catch (error) {
    console.error(`[ProductService.getProductBySlug] Failed to fetch slug "${slug}":`, error);
    throw new Error(`Failed to retrieve product by slug.`);
  }
}

/**
 * 6. UPDATE PRODUCT
 *
 * Accepts partial fields, validates values, preserves createdAt,
 * and sets an authoritative server timestamp for updatedAt.
 */
export async function updateProduct(
  productId: string,
  updates: UpdateProductInput
): Promise<Product> {
  if (!productId || typeof productId !== 'string') {
    throw new Error('[ProductService.updateProduct] Product ID is required.');
  }

  // A. Check product exists
  const existingProduct = await getProductById(productId);
  if (!existingProduct) {
    throw new Error(`[ProductService.updateProduct] Product with ID "${productId}" not found.`);
  }

  // B. Validate updates
  const validation = validateUpdateProduct(updates);
  if (!validation.isValid) {
    throw new Error(
      `[ProductService.updateProduct] Validation failed: ${validation.errors.join('; ')}`
    );
  }

  // C. If slug is being updated, verify uniqueness
  if (updates.slug && updates.slug !== existingProduct.slug) {
    const slugProduct = await getProductBySlug(updates.slug);
    if (slugProduct && slugProduct.id !== productId) {
      throw new Error(
        `[ProductService.updateProduct] The slug "${updates.slug}" is already in use by another product.`
      );
    }
  }

  // D. Build clean update payload
  const cleanUpdates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  const allowedKeys: (keyof UpdateProductInput)[] = [
    'name',
    'slug',
    'description',
    'price',
    'compareAtPrice',
    'images',
    'category',
    'occasions',
    'recipients',
    'budgetRange',
    'stock',
    'isAvailable',
    'isArchived',
    'featured',
    'variants',
    'personalisation',
    'packagingOptions',
    'ribbonColours',
  ];

  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      cleanUpdates[key] = updates[key];
    }
  }

  // E. Execute update
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, cleanUpdates);

  // F. Return updated product
  return {
    ...existingProduct,
    ...cleanUpdates,
    id: productId,
  } as Product;
}

/**
 * 7. SOFT DELETE / ARCHIVE PRODUCT
 *
 * Default administrative deletion: sets isArchived: true, isAvailable: false.
 * Preserves the document for historical order tracking and future restoration.
 */
export async function archiveProduct(productId: string): Promise<void> {
  if (!productId) {
    throw new Error('[ProductService.archiveProduct] Product ID is required.');
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    isArchived: true,
    isAvailable: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 8. RESTORE ARCHIVED PRODUCT
 *
 * Restores a previously archived product back to active status.
 * Leaves availability to be set explicitly by admin.
 */
export async function restoreProduct(productId: string): Promise<void> {
  if (!productId) {
    throw new Error('[ProductService.restoreProduct] Product ID is required.');
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    isArchived: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 9. PERMANENT DELETE (Hard Delete)
 *
 * CAUTION: Permanently purges the document from Firestore.
 * This should ONLY be used for explicit administrative data cleanses.
 * Normal deletion MUST always use archiveProduct() to preserve historical order integrity.
 */
export async function deleteProductPermanently(productId: string): Promise<void> {
  if (!productId) {
    throw new Error('[ProductService.deleteProductPermanently] Product ID is required.');
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

/**
 * 10. GET PRODUCTS BY OCCASION
 *
 * Discovery query helper for the Shop experience:
 * Finds all active products that match an occasion tag.
 */
export async function getProductsByOccasion(occasion: string): Promise<Product[]> {
  if (!occasion) return [];
  return getProducts({
    occasion,
    isArchived: false,
    isAvailable: true,
  });
}

/**
 * 11. GET PRODUCTS BY RECIPIENT
 *
 * Discovery query helper for the Shop experience:
 * Finds all active products that match a recipient tag.
 */
export async function getProductsByRecipient(recipient: string): Promise<Product[]> {
  if (!recipient) return [];
  return getProducts({
    recipient,
    isArchived: false,
    isAvailable: true,
  });
}

/**
 * 12. GET PRODUCTS BY BUDGET
 *
 * Discovery query helper for the Shop experience:
 * Finds all active products that fall into a specific budget range.
 */
export async function getProductsByBudget(budgetRange: BudgetRangeTier): Promise<Product[]> {
  if (!budgetRange) return [];
  return getProducts({
    budgetRange,
    isArchived: false,
    isAvailable: true,
  });
}
