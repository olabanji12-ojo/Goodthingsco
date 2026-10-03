/**
 * Good Things Co. — Corporate Requests Client Service
 *
 * Provides:
 * - Public submission of corporate gifting inquiries
 * - Admin listing, detail inspection, status workflow updates, and quote management
 */

import { auth } from '../lib/firebase';
import type {
  CorporateRequest,
  CorporateRequestSubmissionInput,
  CorporateQuoteUpdateInput,
  CorporateStatusUpdateInput,
} from '../types/corporate';

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
    throw new Error('The corporate gifting service is temporarily unavailable. Please try again shortly.');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Operation failed on corporate service.');
  }

  return data as T;
}

/**
 * 1. Public Submission
 */
export async function submitCorporateRequest(
  input: CorporateRequestSubmissionInput
): Promise<{ success: boolean; referenceNumber: string; request: CorporateRequest }> {
  return await request<{ success: boolean; referenceNumber: string; request: CorporateRequest }>(
    '/api/corporate-requests',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

/**
 * 2. Admin List Inquiries
 */
export async function listAdminCorporateRequests(
  query: URLSearchParams,
  signal?: AbortSignal
): Promise<{ requests: CorporateRequest[]; total: number; page: number; pageSize: number }> {
  return await request<{ requests: CorporateRequest[]; total: number; page: number; pageSize: number }>(
    `/api/admin/corporate?${query.toString()}`,
    { signal },
    true
  );
}

/**
 * 3. Admin Get Inquiry Detail
 */
export async function getAdminCorporateRequest(
  id: string,
  signal?: AbortSignal
): Promise<CorporateRequest> {
  const result = await request<{ success: boolean; request: CorporateRequest }>(
    `/api/admin/corporate/${encodeURIComponent(id)}`,
    { signal },
    true
  );
  return result.request;
}

/**
 * 4. Admin Update Status
 */
export async function updateAdminCorporateStatus(
  id: string,
  input: CorporateStatusUpdateInput
): Promise<CorporateRequest> {
  const result = await request<{ success: boolean; request: CorporateRequest }>(
    `/api/admin/corporate/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    true
  );
  return result.request;
}

/**
 * 5. Admin Manage Quote (Draft or Send)
 */
export async function manageAdminCorporateQuote(
  id: string,
  input: CorporateQuoteUpdateInput
): Promise<CorporateRequest> {
  const result = await request<{ success: boolean; request: CorporateRequest }>(
    `/api/admin/corporate/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    true
  );
  return result.request;
}

/**
 * 6. Admin Accept Quote
 */
export async function acceptAdminCorporateQuote(
  id: string,
  note?: string
): Promise<CorporateRequest> {
  const result = await request<{ success: boolean; request: CorporateRequest }>(
    `/api/admin/corporate/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'accept', note }),
    },
    true
  );
  return result.request;
}

/**
 * 7. Admin Decline Quote
 */
export async function declineAdminCorporateQuote(
  id: string,
  reason?: string
): Promise<CorporateRequest> {
  const result = await request<{ success: boolean; request: CorporateRequest }>(
    `/api/admin/corporate/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'decline', reason }),
    },
    true
  );
  return result.request;
}
