/**
 * Good Things Co. — Store Settings Client Service
 */

import { auth } from '../lib/firebase';
import type {
  StoreSettings,
  PublicStoreSettings,
  StoreSettingsUpdateInput,
} from '../types/settings';

async function request<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');

  if (admin) {
    if (!auth.currentUser) throw new Error('Please sign in to your administrator account.');
    headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Network connection interrupted. Please try again.');
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('Store settings service is temporarily unavailable. Please try again shortly.');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Operation failed on store settings.');
  }

  return data as T;
}

/**
 * 1. Public: Fetch live public-safe settings (shipping fees, estimates, support contact)
 */
export async function getPublicStoreSettings(signal?: AbortSignal): Promise<PublicStoreSettings> {
  const res = await request<{ success: boolean; settings: PublicStoreSettings }>(
    '/api/settings/public',
    { signal },
    false
  );
  return res.settings;
}

/**
 * 2. Admin: Fetch full store configuration
 */
export async function getAdminStoreSettings(signal?: AbortSignal): Promise<StoreSettings> {
  const res = await request<{ success: boolean; settings: StoreSettings }>(
    '/api/admin/settings',
    { signal },
    true
  );
  return res.settings;
}

/**
 * 3. Admin: Update store configuration
 */
export async function updateAdminStoreSettings(
  update: StoreSettingsUpdateInput
): Promise<StoreSettings> {
  const res = await request<{ success: boolean; settings: StoreSettings }>(
    '/api/admin/settings',
    {
      method: 'PATCH',
      body: JSON.stringify(update),
    },
    true
  );
  return res.settings;
}
