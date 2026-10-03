/**
 * Good Things Co. — Store Settings Orchestration Service
 */

import { getAdminAuth } from '../firebase';
import {
  firestoreSettingsRepository,
  type StoreSettingsRepository,
} from './repository';
import {
  SettingsHttpError,
  validateStoreSettingsUpdate,
  applySettingsUpdate,
  toPublicSettings,
} from './domain';
import type {
  StoreSettings,
  PublicStoreSettings,
  ShippingSettings,
  QuoteDefaultsSettings,
  AbandonedCheckoutSettings,
} from '../../src/types/settings';

type AdminIdentity = { uid: string; admin?: unknown; email?: string };

interface ServiceDependencies {
  repository?: StoreSettingsRepository;
  verify?: (token: string) => Promise<AdminIdentity>;
  now?: () => string;
}

export function createSettingsManagement(dependencies: ServiceDependencies = {}) {
  const repo = dependencies.repository || firestoreSettingsRepository;
  const verify = dependencies.verify || ((token) => getAdminAuth().verifyIdToken(token, true));
  const now = dependencies.now || (() => new Date().toISOString());

  async function requireAdmin(authorization?: string): Promise<AdminIdentity> {
    if (!authorization || !/^Bearer \S{1,8192}$/.test(authorization)) {
      throw new SettingsHttpError(401, 'Administrator authentication required.');
    }
    const token = authorization.slice(7);
    let identity: AdminIdentity;
    try {
      identity = await verify(token);
    } catch {
      throw new SettingsHttpError(401, 'Invalid, revoked, or expired admin token.');
    }

    if (identity.admin !== true) {
      throw new SettingsHttpError(403, 'Administrator privilege required.');
    }
    return identity;
  }

  return {
    /**
     * 1. Public: Get Public Store Settings (fees, estimates, support contact)
     */
    async getPublicStoreSettings(): Promise<PublicStoreSettings> {
      const settings = await repo.getSettings();
      return toPublicSettings(settings);
    },

    /**
     * 2. Admin: Get Full Store Settings (requires admin token)
     */
    async getStoreSettingsAsAdmin(authorization: string | undefined): Promise<StoreSettings> {
      await requireAdmin(authorization);
      return await repo.getSettings();
    },

    /**
     * 3. Internal / Server: Get Full Store Settings (server-to-server only, no token needed)
     */
    async getStoreSettings(): Promise<StoreSettings> {
      return await repo.getSettings();
    },

    /**
     * 3. Admin: Update Store Settings
     */
    async updateStoreSettings(
      authorization: string | undefined,
      rawUpdate: unknown
    ): Promise<StoreSettings> {
      const admin = await requireAdmin(authorization);
      const validatedUpdate = validateStoreSettingsUpdate(rawUpdate);

      const current = await repo.getSettings();
      const timestamp = now();
      const updatedBy = admin.email || admin.uid;

      const merged = applySettingsUpdate(current, validatedUpdate, updatedBy, timestamp);
      const saved = await repo.saveSettings(merged);
      return saved;
    },

    /**
     * Helper for Checkout / Orders: Get active shipping configuration
     */
    async getEffectiveShipping(): Promise<ShippingSettings> {
      const settings = await repo.getSettings();
      return settings.shipping;
    },

    /**
     * Helper for Quotes: Get active quote validity defaults
     */
    async getEffectiveQuoteDefaults(): Promise<QuoteDefaultsSettings> {
      const settings = await repo.getSettings();
      return settings.quotes;
    },

    /**
     * Helper for Abandoned Checkout: Get active abandoned checkout settings
     */
    async getEffectiveAbandonedCheckout(): Promise<AbandonedCheckoutSettings> {
      const settings = await repo.getSettings();
      return settings.abandonedCheckout;
    },
  };
}

export const settingsService = createSettingsManagement();
