/**
 * Good Things Co. — Custom Requests Client Service
 *
 * Provides:
 * - Public submission of bespoke/custom commission requests
 * - Admin listing, detail inspection, status workflow updates, quotation management,
 *   and production-stage tracking
 */

import { auth } from '../lib/firebase';
import type {
  CustomRequest,
  CustomRequestSubmissionInput,
  CustomQuoteUpdateInput,
  CustomStatusUpdateInput,
  CustomRequestStatus,
} from '../types/customRequest';

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
    throw new Error('The bespoke commissions service is temporarily unavailable. Please try again shortly.');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Operation failed on bespoke commission service.');
  }

  return data as T;
}

/**
 * 1. Public Submission
 */
export async function submitCustomRequest(
  input: CustomRequestSubmissionInput
): Promise<{ success: boolean; referenceNumber: string; request: CustomRequest }> {
  return await request<{ success: boolean; referenceNumber: string; request: CustomRequest }>(
    '/api/custom-requests',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

/**
 * 2. Admin List Requests
 */
export async function listAdminCustomRequests(
  query: URLSearchParams,
  signal?: AbortSignal
): Promise<{ requests: CustomRequest[]; total: number; page: number; pageSize: number }> {
  return await request<{ requests: CustomRequest[]; total: number; page: number; pageSize: number }>(
    `/api/admin/custom?${query.toString()}`,
    { signal },
    true
  );
}

/**
 * 3. Admin Get Request Detail
 */
export async function getAdminCustomRequest(
  id: string,
  signal?: AbortSignal
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}`,
    { signal },
    true
  );
  return result.request;
}

/**
 * 4. Admin Update Status
 */
export async function updateAdminCustomStatus(
  id: string,
  input: CustomStatusUpdateInput
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    true
  );
  return result.request;
}

/**
 * 5. Admin Save Quote Draft
 */
export async function saveAdminCustomQuoteDraft(
  id: string,
  input: CustomQuoteUpdateInput
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'draft', ...input }),
    },
    true
  );
  return result.request;
}

/**
 * 6. Admin Send Quote
 */
export async function sendAdminCustomQuote(
  id: string,
  input: CustomQuoteUpdateInput
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'send', ...input }),
    },
    true
  );
  return result.request;
}

/**
 * 7. Admin Accept Quote
 */
export async function acceptAdminCustomQuote(
  id: string,
  note?: string
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'accept', note }),
    },
    true
  );
  return result.request;
}

/**
 * 8. Admin Decline Quote
 */
export async function declineAdminCustomQuote(
  id: string,
  reason?: string,
  note?: string
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/quote`,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'decline', reason, note }),
    },
    true
  );
  return result.request;
}

/**
 * 9. Admin Progress Production Stage
 */
export async function updateAdminCustomProductionStage(
  id: string,
  stage: CustomRequestStatus,
  note?: string
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/production`,
    {
      method: 'PATCH',
      body: JSON.stringify({ stage, note }),
    },
    true
  );
  return result.request;
}

/**
 * 10. Admin Update Internal Notes
 */
export async function updateAdminCustomNotes(
  id: string,
  notes: string
): Promise<CustomRequest> {
  const result = await request<{ success: boolean; request: CustomRequest }>(
    `/api/admin/custom/${encodeURIComponent(id)}/notes`,
    {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    },
    true
  );
  return result.request;
}
