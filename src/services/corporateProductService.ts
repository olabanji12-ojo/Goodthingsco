/**
 * Good Things Co. — Corporate Gift Products Service
 *
 * Provides Firestore persistence for corporate gifting packages & keepsakes:
 * - Reads from 'corporateProducts' collection in Firestore
 * - Pre-seeds initial atelier corporate packages if collection is empty
 * - Add, Edit, Delete, and Reset capabilities for Admin
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
import { db } from '../lib/firebase';
import type { CorporateGiftProduct } from '../components/corporate/types';
import { CORPORATE_PRODUCTS } from '../components/corporate/corporateData';

export const CORPORATE_PRODUCTS_COLLECTION = 'corporateProducts';

// In-memory cache for fast page rendering
let cachedProducts: CorporateGiftProduct[] | null = null;

export async function getCorporateProducts(forceRefresh = false): Promise<CorporateGiftProduct[]> {
  if (cachedProducts && !forceRefresh) {
    return cachedProducts;
  }

  try {
    const colRef = collection(db, CORPORATE_PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      cachedProducts = [];
      return [];
    }

    const products: CorporateGiftProduct[] = snap.docs.map((d) => {
      const data = d.data();
      const unitPrice = typeof data.unitPrice === 'number' ? data.unitPrice : 0;
      return {
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
      };
    });

    cachedProducts = products;
    return products;
  } catch (error) {
    console.warn('[CorporateProductService] Failed to fetch corporate products from Firestore, using code fallback:', error);
    return CORPORATE_PRODUCTS;
  }
}

export async function createCorporateProduct(
  data: Omit<CorporateGiftProduct, 'id'>
): Promise<CorporateGiftProduct> {
  const colRef = collection(db, CORPORATE_PRODUCTS_COLLECTION);
  const formattedPrice = `₦${data.unitPrice.toLocaleString()}`;
  const payload = {
    ...data,
    formattedPrice,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, payload);
  const newProduct: CorporateGiftProduct = {
    ...data,
    id: docRef.id,
    formattedPrice,
  };

  if (cachedProducts) {
    cachedProducts.unshift(newProduct);
  }

  return newProduct;
}

export async function updateCorporateProduct(
  id: string,
  data: Partial<CorporateGiftProduct>
): Promise<CorporateGiftProduct> {
  const docRef = doc(db, CORPORATE_PRODUCTS_COLLECTION, id);
  const formattedPrice = typeof data.unitPrice === 'number' ? `₦${data.unitPrice.toLocaleString()}` : data.formattedPrice;
  const payload = {
    ...data,
    ...(formattedPrice ? { formattedPrice } : {}),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, payload);

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
    if (idx >= 0) {
      cachedProducts[idx] = result;
    }
  }

  return result;
}

export async function deleteCorporateProduct(id: string): Promise<void> {
  const docRef = doc(db, CORPORATE_PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);

  if (cachedProducts) {
    cachedProducts = cachedProducts.filter((p) => p.id !== id);
  }
}

export async function clearAllCorporateProducts(): Promise<void> {
  const colRef = collection(db, CORPORATE_PRODUCTS_COLLECTION);
  const snap = await getDocs(colRef);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
  cachedProducts = [];
}
