/**
 * Good Things Co. — Store Settings Firestore Repository
 */

import { getAdminFirestore } from '../firebase.js';
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from '../../src/types/settings.js';

export const SETTINGS_COLLECTION = 'settings';
export const STORE_SETTINGS_DOC = 'store';

export interface StoreSettingsRepository {
  getSettings(): Promise<StoreSettings>;
  saveSettings(settings: StoreSettings): Promise<StoreSettings>;
  clearCache(): void;
}

// In-memory cache for fast reads
let cachedSettings: StoreSettings | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export const firestoreSettingsRepository: StoreSettingsRepository = {
  async getSettings(): Promise<StoreSettings> {
    const now = Date.now();
    if (cachedSettings && cacheExpiresAt > now) {
      return structuredClone(cachedSettings);
    }

    try {
      const snap = await getAdminFirestore()
        .collection(SETTINGS_COLLECTION)
        .doc(STORE_SETTINGS_DOC)
        .get();

      if (!snap.exists) {
        // Document does not exist yet; return defaults
        cachedSettings = structuredClone(DEFAULT_STORE_SETTINGS);
        cacheExpiresAt = now + CACHE_TTL_MS;
        return structuredClone(cachedSettings);
      }

      const data = snap.data() as Partial<StoreSettings>;

      // Deep merge with DEFAULT_STORE_SETTINGS to guarantee schema completeness
      const merged: StoreSettings = {
        business: {
          ...DEFAULT_STORE_SETTINGS.business,
          ...data.business,
        },
        shipping: {
          lagos: {
            ...DEFAULT_STORE_SETTINGS.shipping.lagos,
            ...data.shipping?.lagos,
          },
          otherNigeria: {
            ...DEFAULT_STORE_SETTINGS.shipping.otherNigeria,
            ...data.shipping?.otherNigeria,
          },
          international: {
            ...DEFAULT_STORE_SETTINGS.shipping.international,
            ...data.shipping?.international,
          },
        },
        packaging: {
          giftBoxFee: data.packaging?.giftBoxFee ?? DEFAULT_STORE_SETTINGS.packaging?.giftBoxFee ?? 0,
          linenBagFee: data.packaging?.linenBagFee ?? DEFAULT_STORE_SETTINGS.packaging?.linenBagFee ?? 0,
          woodenBoxFee: data.packaging?.woodenBoxFee ?? DEFAULT_STORE_SETTINGS.packaging?.woodenBoxFee ?? 0,
          pouchFee: data.packaging?.pouchFee ?? DEFAULT_STORE_SETTINGS.packaging?.pouchFee ?? 0,
        },
        abandonedCheckout: {
          ...DEFAULT_STORE_SETTINGS.abandonedCheckout,
          ...data.abandonedCheckout,
        },
        quotes: {
          ...DEFAULT_STORE_SETTINGS.quotes,
          ...data.quotes,
        },
        updatedAt: data.updatedAt || DEFAULT_STORE_SETTINGS.updatedAt,
        updatedBy: data.updatedBy || DEFAULT_STORE_SETTINGS.updatedBy,
      };

      cachedSettings = merged;
      cacheExpiresAt = now + CACHE_TTL_MS;
      return structuredClone(merged);
    } catch (err) {
      throw err;
    }
  },

  async saveSettings(settings: StoreSettings): Promise<StoreSettings> {
    await getAdminFirestore()
      .collection(SETTINGS_COLLECTION)
      .doc(STORE_SETTINGS_DOC)
      .set(settings, { merge: true });

    // Invalidate and refresh cache immediately
    cachedSettings = structuredClone(settings);
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return structuredClone(settings);
  },

  clearCache(): void {
    cachedSettings = null;
    cacheExpiresAt = 0;
  },
};
