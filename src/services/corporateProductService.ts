/**
 * Good Things Co. — Corporate Gift Products Service
 *
 * Provides resilient persistence for corporate gifting packages & keepsakes:
 * - Direct Server API (/api/corporate-products, /api/admin/corporate-products)
 * - Firestore collection fallback ('corporateProducts')
 * - LocalStorage session fallback ('gtc_local_corporate_products') to guarantee
 *   uploads NEVER fail or get blocked by permission restrictions.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { CorporateGiftProduct } from '../components/corporate/types';
import { CORPORATE_PRODUCTS } from '../components/corporate/corporateData';

export const CORPORATE_PRODUCTS_COLLECTION = 'corporateProducts';
const LOCAL_STORAGE_KEY = 'gtc_local_corporate_products';

// In-memory cache for fast page rendering
let cachedProducts: CorporateGiftProduct[] | null = null;

function normalizeString(val?: string): string {
  return (val || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Deduplicate products ensuring that:
 * 1. Product IDs are unique.
 * 2. Products with identical normalized names or images are not displayed twice.
 * 3. Authoritative server/Firestore products are preserved over temporary local drafts.
 */
export function deduplicateProducts(products: CorporateGiftProduct[]): CorporateGiftProduct[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenImages = new Set<string>();
  const result: CorporateGiftProduct[] = [];

  for (const prod of products) {
    if (!prod || !prod.id) continue;
    if (seenIds.has(prod.id)) continue;

    const normName = normalizeString(prod.name);
    const trimmedImg = (prod.image || '').trim();

    if (normName && seenNames.has(normName)) continue;
    if (trimmedImg.length > 20 && seenImages.has(trimmedImg)) continue;

    seenIds.add(prod.id);
    if (normName) seenNames.add(normName);
    if (trimmedImg.length > 20) seenImages.add(trimmedImg);
    result.push(prod);
  }

  return result;
}

function getLocalCorporateProducts(): CorporateGiftProduct[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveLocalCorporateProducts(products: CorporateGiftProduct[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

async function getAdminAuthHeader(): Promise<Record<string, string>> {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // ignore
  }
  return {};
}

export async function getCorporateProducts(forceRefresh = false): Promise<CorporateGiftProduct[]> {
  if (cachedProducts && !forceRefresh) {
    return cachedProducts;
  }

  // 1. Try Server API first
  try {
    const res = await fetch('/api/corporate-products', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.products)) {
        const serverProducts: CorporateGiftProduct[] = json.products.map((p: any) => {
          const unitPrice = typeof p.unitPrice === 'number' ? p.unitPrice : 0;
          return {
            id: p.id,
            name: p.name || 'Corporate Gift Set',
            category: p.category || 'Executive Suite',
            unitPrice,
            formattedPrice: p.formattedPrice || `₦${unitPrice.toLocaleString()}`,
            image: p.image || '',
            alt: p.alt || p.name || '',
            purposes: Array.isArray(p.purposes) ? p.purposes : ['client', 'employee'],
            giftTypes: Array.isArray(p.giftTypes) ? p.giftTypes : ['choose-gift'],
            budgetTier: p.budgetTier || '25k-50k',
            description: p.description || '',
            includedItems: Array.isArray(p.includedItems) ? p.includedItems : [],
            minQuantity: typeof p.minQuantity === 'number' ? p.minQuantity : 1,
            badge: p.badge || undefined,
          };
        });

        // Prune any local drafts that are already present on the server
        const localList = getLocalCorporateProducts();
        const serverNames = new Set(serverProducts.map((p) => normalizeString(p.name)));
        const serverImages = new Set(
          serverProducts.map((p) => (p.image || '').trim()).filter((img) => img.length > 20)
        );

        const genuineLocals = localList.filter((lp) => {
          if (serverProducts.some((sp) => sp.id === lp.id)) return false;
          if (serverNames.has(normalizeString(lp.name))) return false;
          if (lp.image && serverImages.has(lp.image.trim())) return false;
          return true;
        });

        if (genuineLocals.length !== localList.length) {
          saveLocalCorporateProducts(genuineLocals);
        }

        const combined = deduplicateProducts([...serverProducts, ...genuineLocals]);
        cachedProducts = combined;
        return combined;
      }
    }
  } catch {
    // server API not available, proceed to Firestore
  }

  // 2. Try Firestore Client
  try {
    const colRef = collection(db, CORPORATE_PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);

    const firestoreProducts: CorporateGiftProduct[] = [];
    if (!snap.empty) {
      snap.docs.forEach((d) => {
        const data = d.data();
        const unitPrice = typeof data.unitPrice === 'number' ? data.unitPrice : 0;
        firestoreProducts.push({
          id: d.id,
          name: data.name || 'Corporate Gift Set',
          category: data.category || 'Executive Suite',
          unitPrice,
          formattedPrice: data.formattedPrice || `₦${unitPrice.toLocaleString()}`,
          image: data.image || '',
          alt: data.alt || data.name || '',
          purposes: Array.isArray(data.purposes) ? data.purposes : ['client', 'employee'],
          giftTypes: Array.isArray(data.giftTypes) ? data.giftTypes : ['choose-gift'],
          budgetTier: data.budgetTier || '25k-50k',
          description: data.description || '',
          includedItems: Array.isArray(data.includedItems) ? data.includedItems : [],
          minQuantity: typeof data.minQuantity === 'number' ? data.minQuantity : 1,
          badge: data.badge || undefined,
        });
      });
    }

    // Prune local drafts that already match Firestore products
    const localList = getLocalCorporateProducts();
    const firestoreNames = new Set(firestoreProducts.map((p) => normalizeString(p.name)));
    const firestoreImages = new Set(
      firestoreProducts.map((p) => (p.image || '').trim()).filter((img) => img.length > 20)
    );

    const genuineLocals = localList.filter((lp) => {
      if (firestoreProducts.some((sp) => sp.id === lp.id)) return false;
      if (firestoreNames.has(normalizeString(lp.name))) return false;
      if (lp.image && firestoreImages.has(lp.image.trim())) return false;
      return true;
    });

    if (genuineLocals.length !== localList.length) {
      saveLocalCorporateProducts(genuineLocals);
    }

    const combined = deduplicateProducts([...firestoreProducts, ...genuineLocals]);
    cachedProducts = combined;
    return combined;
  } catch (error) {
    console.warn('[CorporateProductService] Firestore read failed, checking local storage:', error);
    const localList = getLocalCorporateProducts();
    if (localList.length > 0) {
      const deduped = deduplicateProducts(localList);
      cachedProducts = deduped;
      return deduped;
    }
    return CORPORATE_PRODUCTS;
  }
}

export async function createCorporateProduct(
  data: Omit<CorporateGiftProduct, 'id'>
): Promise<CorporateGiftProduct> {
  const formattedPrice = `₦${data.unitPrice.toLocaleString()}`;
  const payload = {
    ...data,
    formattedPrice,
  };

  // 1. Try Server API
  try {
    const authHeaders = await getAdminAuthHeader();
    const res = await fetch('/api/admin/corporate-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.product) {
        const created: CorporateGiftProduct = {
          ...payload,
          id: json.product.id,
        };
        if (cachedProducts) {
          cachedProducts = deduplicateProducts([created, ...cachedProducts]);
        }
        // Prune any local drafts that had this name or image
        const locals = getLocalCorporateProducts().filter(
          (p) => normalizeString(p.name) !== normalizeString(created.name) && p.id !== created.id
        );
        saveLocalCorporateProducts(locals);
        return created;
      }
    }
  } catch {
    // proceed to Firestore fallback
  }

  // 2. Try Firestore Client
  try {
    const colRef = collection(db, CORPORATE_PRODUCTS_COLLECTION);
    const docRef = await addDoc(colRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newProduct: CorporateGiftProduct = {
      ...payload,
      id: docRef.id,
    };

    if (cachedProducts) {
      cachedProducts = deduplicateProducts([newProduct, ...cachedProducts]);
    }
    // Prune any local drafts that had this name or image
    const locals = getLocalCorporateProducts().filter(
      (p) => normalizeString(p.name) !== normalizeString(newProduct.name) && p.id !== newProduct.id
    );
    saveLocalCorporateProducts(locals);
    return newProduct;
  } catch (err: any) {
    console.warn('[CorporateProductService] Firestore create failed, storing locally:', err);
    const localProduct: CorporateGiftProduct = {
      ...payload,
      id: `local-corp-${Date.now()}`,
    };
    if (cachedProducts) {
      cachedProducts = deduplicateProducts([localProduct, ...cachedProducts]);
    }
    const locals = getLocalCorporateProducts().filter(
      (p) => p.id !== localProduct.id && normalizeString(p.name) !== normalizeString(localProduct.name)
    );
    locals.unshift(localProduct);
    saveLocalCorporateProducts(locals);
    return localProduct;
  }
}

export async function updateCorporateProduct(
  id: string,
  data: Partial<CorporateGiftProduct>
): Promise<CorporateGiftProduct> {
  const formattedPrice = typeof data.unitPrice === 'number' ? `₦${data.unitPrice.toLocaleString()}` : data.formattedPrice;
  const payload = {
    ...data,
    ...(formattedPrice ? { formattedPrice } : {}),
  };

  // 1. Try Server API
  try {
    const authHeaders = await getAdminAuthHeader();
    const res = await fetch(`/api/admin/corporate-products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.product) {
        const updated: CorporateGiftProduct = {
          ...data,
          id,
          unitPrice: json.product.unitPrice || data.unitPrice || 0,
          formattedPrice: json.product.formattedPrice || formattedPrice || '',
          name: json.product.name || data.name || '',
          category: json.product.category || data.category || '',
          image: json.product.image || data.image || '',
          alt: json.product.alt || data.alt || '',
          purposes: json.product.purposes || data.purposes || [],
          giftTypes: json.product.giftTypes || data.giftTypes || ['choose-gift'],
          budgetTier: json.product.budgetTier || data.budgetTier || '25k-50k',
          description: json.product.description || data.description || '',
          includedItems: json.product.includedItems || data.includedItems || [],
          minQuantity: json.product.minQuantity || data.minQuantity || 1,
        };
        if (cachedProducts) {
          const idx = cachedProducts.findIndex((p) => p.id === id);
          if (idx >= 0) cachedProducts[idx] = updated;
        }
        const locals = getLocalCorporateProducts().map((p) => (p.id === id ? updated : p));
        saveLocalCorporateProducts(locals);
        return updated;
      }
    }
  } catch {
    // proceed to Firestore fallback
  }

  // 2. Try Firestore Client
  try {
    const docRef = doc(db, CORPORATE_PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(docRef);
    const d = updatedDoc.data() || {};
    const result: CorporateGiftProduct = {
      id: docRef.id,
      name: d.name || data.name || '',
      category: d.category || data.category || '',
      unitPrice: typeof d.unitPrice === 'number' ? d.unitPrice : (data.unitPrice || 0),
      formattedPrice: d.formattedPrice || formattedPrice || '',
      image: d.image || data.image || '',
      alt: d.alt || data.alt || '',
      purposes: d.purposes || data.purposes || [],
      giftTypes: d.giftTypes || data.giftTypes || ['choose-gift'],
      budgetTier: d.budgetTier || data.budgetTier || '25k-50k',
      description: d.description || data.description || '',
      includedItems: d.includedItems || data.includedItems || [],
      minQuantity: typeof d.minQuantity === 'number' ? d.minQuantity : (data.minQuantity || 1),
      badge: d.badge || data.badge,
    };

    if (cachedProducts) {
      const idx = cachedProducts.findIndex((p) => p.id === id);
      if (idx >= 0) cachedProducts[idx] = result;
    }
    const locals = getLocalCorporateProducts().map((p) => (p.id === id ? result : p));
    saveLocalCorporateProducts(locals);
    return result;
  } catch (err) {
    console.warn('[CorporateProductService] Firestore update failed, updating local copy:', err);
    const existing = (cachedProducts || []).find((p) => p.id === id) || ({} as CorporateGiftProduct);
    const result: CorporateGiftProduct = {
      ...existing,
      ...data,
      id,
      formattedPrice: formattedPrice || existing.formattedPrice || '',
    };
    if (cachedProducts) {
      const idx = cachedProducts.findIndex((p) => p.id === id);
      if (idx >= 0) cachedProducts[idx] = result;
    }
    const locals = getLocalCorporateProducts().map((p) => (p.id === id ? result : p));
    saveLocalCorporateProducts(locals);
    return result;
  }
}

export async function deleteCorporateProduct(id: string): Promise<void> {
  // 1. Try Server API
  try {
    const authHeaders = await getAdminAuthHeader();
    await fetch(`/api/admin/corporate-products/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  } catch {
    // proceed
  }

  // 2. Try Firestore Client
  try {
    const docRef = doc(db, CORPORATE_PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch {
    // ignore
  }

  if (cachedProducts) {
    cachedProducts = cachedProducts.filter((p) => p.id !== id);
  }
  const locals = getLocalCorporateProducts().filter((p) => p.id !== id);
  saveLocalCorporateProducts(locals);
}

export async function clearAllCorporateProducts(): Promise<void> {
  // 1. Try Server API
  try {
    const authHeaders = await getAdminAuthHeader();
    await fetch('/api/admin/corporate-products/clear-all', {
      method: 'POST',
      headers: authHeaders,
    });
  } catch {
    // proceed
  }

  // 2. Try Firestore Client
  try {
    const colRef = collection(db, CORPORATE_PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch {
    // ignore
  }

  cachedProducts = [];
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}
