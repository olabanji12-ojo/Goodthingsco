/**
 * Good Things Co. — In-Memory Store Settings Repository for Tests
 */

import type { StoreSettingsRepository } from '../../server/settings/repository';
import type { StoreSettings } from '../../src/types/settings';
import { DEFAULT_STORE_SETTINGS } from '../../src/types/settings';

export function createMemorySettingsRepository(
  initialSettings: StoreSettings = DEFAULT_STORE_SETTINGS
): StoreSettingsRepository & {
  reset: (newSettings?: StoreSettings) => void;
  getRaw: () => StoreSettings;
} {
  let state: StoreSettings = JSON.parse(JSON.stringify(initialSettings));

  return {
    async getSettings(): Promise<StoreSettings> {
      return JSON.parse(JSON.stringify(state));
    },

    async saveSettings(updated: StoreSettings): Promise<StoreSettings> {
      state = JSON.parse(JSON.stringify(updated));
      return JSON.parse(JSON.stringify(state));
    },

    clearCache(): void {
      // In-memory repo has direct state access, no-op
    },

    reset(newSettings: StoreSettings = DEFAULT_STORE_SETTINGS) {
      state = JSON.parse(JSON.stringify(newSettings));
    },

    getRaw() {
      return state;
    },
  };
}

export const memorySettingsRepository = createMemorySettingsRepository();
