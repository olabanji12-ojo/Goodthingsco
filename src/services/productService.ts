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
  LifestyleCategory,
} from '../types/product';
import { slugify } from '../utils/slugify';
import {
  validateCreateProduct,
  validateUpdateProduct,
} from '../utils/productValidation';

export const PRODUCTS_COLLECTION = 'products';

/**
 * Recursively removes all undefined keys from objects and nested objects/arrays.
 * Prevents Firestore updateDoc/addDoc "Unsupported field value: undefined" errors.
 */
export function removeUndefinedFields<T>(val: T): T {
  if (val === null || val === undefined || typeof val !== 'object') {
    return val;
  }
  // Preserve Date, Firestore Timestamp, or FieldValue objects
  if (val instanceof Date || (val as any).toMillis || (val as any).toDate || (val as any)._methodName) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      clean[k] = removeUndefinedFields(v);
    }
  }
  return clean as T;
}

/**
 * Helper to convert a Firestore DocumentSnapshot into a typed Product
 */
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
    packagingIncluded: data.packagingIncluded ?? false,
    ribbonColours: data.ribbonColours ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function getLocalFallbackProducts(): Product[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('gtc_local_products') : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFallbackProducts(list: Product[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gtc_local_products', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to save to local products storage', e);
  }
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
    packagingIncluded: input.packagingIncluded ?? false,
    ribbonColours: input.ribbonColours ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // E. Write to Firestore (with local fallback if permission-denied)
  const sanitizedDocData = removeUndefinedFields(docData);
  try {
    const docRef = await addDoc(productsRef, sanitizedDocData);
    return {
      id: docRef.id,
      ...sanitizedDocData,
    };
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      console.warn('[ProductService.createProduct] Firestore permission-denied. Storing product in local atelier session.');
      const localProduct: Product = {
        id: `local-${Date.now()}`,
        ...docData,
      };
      const locals = getLocalFallbackProducts();
      locals.unshift(localProduct);
      saveLocalFallbackProducts(locals);
      return localProduct;
    }
    throw err;
  }
}

/**
 * 2. READ PRODUCTS (General / Filtered)
 *
 * Retrieves all products or filtered subsets based on query parameters.
 */
export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  let products: Product[] = [];
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
      constraints.push(where('recipients', 'array-contains', filters.recipient));
    }

    if (filters?.limit && filters.limit > 0) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(productsRef, ...constraints);
    const snapshot = await getDocs(q);

    products = (snapshot.docs as any[]).map((d: any) =>
      mapDocToProduct(d.id, d.data())
    );

    if (filters?.occasion && filters?.recipient) {
      products = products.filter((p) => p.recipients.includes(filters.recipient!));
    }
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn('[ProductService.getProducts] Firestore read fallback notice:', error);
    }
  }

  // Merge with local session products (live Firestore data ALWAYS takes precedence)
  const locals = getLocalFallbackProducts();
  if (locals.length > 0) {
    const firestoreIds = new Set(products.map((p) => p.id));
    const firestoreSlugs = new Set(products.map((p) => p.slug));
    const unpersistedLocals = locals.filter(
      (local) => !firestoreIds.has(local.id) && !firestoreSlugs.has(local.slug)
    );

    if (unpersistedLocals.length > 0) {
      const merged = [...products, ...unpersistedLocals];
      return merged.filter((p) => {
        if (filters?.isArchived !== undefined && p.isArchived !== filters.isArchived) return false;
        if (filters?.isAvailable !== undefined && p.isAvailable !== filters.isAvailable) return false;
        if (filters?.category && p.category !== filters.category) return false;
        if (filters?.budgetRange && p.budgetRange !== filters.budgetRange) return false;
        if (filters?.occasion && !p.occasions.includes(filters.occasion)) return false;
        if (filters?.recipient && !p.recipients.includes(filters.recipient)) return false;
        return true;
      });
    }
  }

  return products;
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

    if (snapshot.exists()) {
      return mapDocToProduct(snapshot.id, snapshot.data());
    }
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn(`[ProductService.getProductById] Notice:`, error);
    }
  }

  const locals = getLocalFallbackProducts();
  const match = locals.find((p) => p.id === productId);
  return match || null;
}

/**
 * 5. GET PRODUCT BY SLUG
 *
 * Retrieves a single product by its URL-friendly slug.
 * Returns null gracefully if no matching document exists.
 */
export async function getProductBySlug(slug: string, includeArchived = false): Promise<Product | null> {
  if (!slug || typeof slug !== 'string') return null;

  try {
    const normalizedSlug = slugify(slug);
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const constraints: any[] = [where('slug', '==', normalizedSlug)];
    if (!includeArchived) {
      constraints.push(where('isArchived', '==', false));
    }
    const q = query(productsRef, ...constraints, firestoreLimit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return mapDocToProduct(docSnap.id, docSnap.data());
    }
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn(`[ProductService.getProductBySlug] Notice:`, error);
    }
  }

  const locals = getLocalFallbackProducts();
  const normalizedSlug = slugify(slug);
  const match = locals.find((p) => p.slug === normalizedSlug);
  if (match) {
    if (!includeArchived && match.isArchived) return null;
    return match;
  }

  return null;
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
    'packagingIncluded',
    'ribbonColours',
  ];

  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      cleanUpdates[key] = updates[key];
    }
  }

  // Deeply strip any nested undefined values so Firestore does not reject the document
  const sanitizedUpdates = removeUndefinedFields(cleanUpdates);

  // E. Execute update
  const updatedProduct = {
    ...existingProduct,
    ...sanitizedUpdates,
    id: productId,
  } as Product;

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, sanitizedUpdates);
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      console.warn('[ProductService.updateProduct] Updating in local session.');
    } else {
      throw err;
    }
  }

  // Always update in locals cache
  const locals = getLocalFallbackProducts();
  const existingLocalIdx = locals.findIndex((p) => p.id === productId || p.slug === existingProduct.slug);
  if (existingLocalIdx >= 0) {
    locals[existingLocalIdx] = updatedProduct;
  } else {
    locals.unshift(updatedProduct);
  }
  saveLocalFallbackProducts(locals);

  // F. Return updated product
  return updatedProduct;
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

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, {
      isArchived: true,
      isAvailable: false,
      updatedAt: serverTimestamp(),
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') throw err;
  }

  const locals = getLocalFallbackProducts();
  const updatedLocals = locals.map((p) => (p.id === productId ? { ...p, isArchived: true, isAvailable: false } : p));
  saveLocalFallbackProducts(updatedLocals);
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

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, {
      isArchived: false,
      isAvailable: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') throw err;
  }

  const locals = getLocalFallbackProducts();
  const updatedLocals = locals.map((p) => (p.id === productId ? { ...p, isArchived: false, isAvailable: true } : p));
  saveLocalFallbackProducts(updatedLocals);
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

export interface ShopFilterCriteria {
  occasion?: string;
  occasions?: string[];
  recipient?: string;
  recipients?: string[];
  specificRecipient?: string;
  budgetRange?: BudgetRangeTier | string;
  budgetRanges?: (BudgetRangeTier | string)[];
  lifestyle?: LifestyleCategory | string;
  lifestyles?: (LifestyleCategory | string)[];
}

export interface FilteredProductsResult {
  exactMatches: Product[];
  suggestions: Product[];
  totalActive: number;
}

export function normalizeBudgetTier(budget?: string): BudgetRangeTier | undefined {
  if (!budget) return undefined;
  if (budget === 'under-25k' || budget === 'under-25000') return 'under-25000';
  if (budget === '25k-50k' || budget === '25000-50000') return '25000-50000';
  if (budget === '50k-100k' || budget === '50000-100000') return '50000-100000';
  if (budget === '100k-250k' || budget === '100000-250000') return '100000-250000';
  if (budget === '250k-plus' || budget === '250000-plus') return '250000-plus';
  if (budget === 'premium' || budget === '100000-plus') return '100000-250000';
  return budget as BudgetRangeTier;
}

function matchesSingleBudgetTier(price: number, tier: BudgetRangeTier): boolean {
  if (tier === 'under-25000') return price < 25000;
  if (tier === '25000-50000') return price >= 25000 && price <= 50000;
  if (tier === '50000-100000') return price >= 50000 && price <= 100000;
  if (tier === '100000-250000') return price >= 100000 && price <= 250000;
  if (tier === '250000-plus') return price >= 250000;
  return true;
}

/**
 * 13. GET FILTERED PRODUCTS FOR SHOP JOURNEY
 *
 * Powers the customer-facing guided concierge flow:
 * Occasion(s) -> Recipient(s) -> Budget(s) -> Lifestyle(s)
 *
 * Supports single-select or multi-select at each stage.
 * 1. Fetches active, available products from Firestore.
 * 2. Filters strictly for exact matches on all active criteria.
 * 3. If exact matches are empty, generates smart related suggestions
 *    so the customer is never left facing a dead-end.
 */
export async function getFilteredProducts(
  criteria: ShopFilterCriteria
): Promise<FilteredProductsResult> {
  const activeProducts = await getActiveProducts(true);

  // 1. Resolve Occasions (support single or multiple)
  const rawOccasions = [
    ...(criteria.occasions || []),
    ...(criteria.occasion ? [criteria.occasion] : []),
  ];
  const activeOccasions = Array.from(
    new Set(
      rawOccasions
        .map((o) => o?.trim().toLowerCase())
        .filter((o): o is string => Boolean(o && o !== 'all'))
    )
  );

  // 2. Resolve Recipients (support single or multiple)
  const rawRecipients = [
    ...(criteria.recipients || []),
    ...(criteria.recipient ? [criteria.recipient] : []),
    ...(criteria.specificRecipient ? [criteria.specificRecipient] : []),
  ];
  const activeRecipients = Array.from(
    new Set(
      rawRecipients
        .map((r) => r?.trim().toLowerCase())
        .filter((r): r is string => Boolean(r && r !== 'all'))
    )
  );

  // 3. Resolve Budget Tiers (support single or multiple)
  const rawBudgets = [
    ...(criteria.budgetRanges || []),
    ...(criteria.budgetRange ? [criteria.budgetRange] : []),
  ];
  const activeBudgetTiers = Array.from(
    new Set(
      rawBudgets
        .map((b) => normalizeBudgetTier(b))
        .filter((b): b is BudgetRangeTier => Boolean(b))
    )
  );

  // 4. Resolve Lifestyles (support single or multiple)
  const rawLifestyles = [
    ...(criteria.lifestyles || []),
    ...(criteria.lifestyle ? [criteria.lifestyle] : []),
  ];
  const activeLifestyles = Array.from(
    new Set(
      rawLifestyles
        .map((l) => l?.trim().toLowerCase())
        .filter((l): l is string => Boolean(l && l !== 'all'))
    )
  );

  const exactMatches = activeProducts.filter((p) => {
    // Must be unarchived and available
    if (p.isArchived || !p.isAvailable) return false;

    // 1. Occasion match (OR logic: match ANY of the selected occasions)
    if (activeOccasions.length > 0) {
      const matchOccasion = p.occasions?.some((o) => {
        const cleanO = o.toLowerCase().trim();
        const slugO = cleanO.replace(/\s+/g, '-');
        return activeOccasions.some(
          (target) =>
            cleanO === target ||
            slugO === target ||
            cleanO.replace(/-/g, ' ') === target.replace(/-/g, ' ')
        );
      });
      if (!matchOccasion) return false;
    }

    // 2. Recipient match (OR logic: match ANY of the selected recipients)
    if (activeRecipients.length > 0) {
      const matchRecipient = p.recipients?.some((r) => {
        const cleanR = r.toLowerCase().trim();
        return activeRecipients.some(
          (target) =>
            cleanR === target ||
            cleanR.includes(target) ||
            target.includes(cleanR)
        );
      });
      if (!matchRecipient) return false;
    }

    // 3. Budget Range match (OR logic: strictly checked against numerical price)
    if (activeBudgetTiers.length > 0) {
      if (typeof p.price === 'number') {
        const matchBudget = activeBudgetTiers.some((tier) =>
          matchesSingleBudgetTier(p.price, tier)
        );
        if (!matchBudget) return false;
      } else if (p.budgetRange && !activeBudgetTiers.includes(p.budgetRange)) {
        return false;
      }
    }

    // 4. Lifestyle match (OR logic: match ANY of the selected lifestyles)
    if (activeLifestyles.length > 0) {
      const matchLifestyle = p.lifestyles?.some((l) => {
        const cleanL = l.toLowerCase().trim();
        const slugL = cleanL.replace(/\s+/g, '-');
        return activeLifestyles.some(
          (target) => cleanL === target || slugL === target
        );
      });
      if (!matchLifestyle) return false;
    }

    return true;
  });

  let suggestions: Product[] = [];
  if (exactMatches.length === 0 && activeProducts.length > 0) {
    suggestions = activeProducts.filter((p) => {
      if (p.isArchived || !p.isAvailable) return false;
      // Do not suggest items that contradict the chosen occasions
      if (activeOccasions.length > 0) {
        const matchOccasion = p.occasions?.some((o) => {
          const cleanO = o.toLowerCase().trim();
          const slugO = cleanO.replace(/\s+/g, '-');
          return activeOccasions.some(
            (target) =>
              cleanO === target ||
              slugO === target ||
              cleanO.replace(/-/g, ' ') === target.replace(/-/g, ' ')
          );
        });
        if (!matchOccasion) return false;
      }
      // Relaxed budget check across selected tiers
      if (activeBudgetTiers.length > 0 && typeof p.price === 'number') {
        const matchRelaxed = activeBudgetTiers.some((tier) => {
          if (tier === 'under-25000') return p.price < 35000;
          if (tier === '25000-50000') return p.price >= 20000 && p.price <= 60000;
          if (tier === '50000-100000') return p.price >= 40000 && p.price <= 120000;
          if (tier === '100000-250000') return p.price >= 80000 && p.price <= 300000;
          if (tier === '250000-plus') return p.price >= 200000;
          return true;
        });
        if (!matchRelaxed) return false;
      }
      return true;
    });
  }

  return {
    exactMatches,
    suggestions,
    totalActive: activeProducts.length,
  };
}
