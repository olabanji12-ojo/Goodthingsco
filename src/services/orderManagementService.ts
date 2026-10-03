import { auth } from '../lib/firebase';
import type { Order } from '../types/order';
import type { OrderListResult, OrderUpdateInput, OrderUpdateResult, TrackingOrder } from '../types/orderManagement';

async function request<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (admin) {
    if (!auth.currentUser) throw new Error('Please sign in again.');
    headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
  }
  let response: Response;
  try { response = await fetch(path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' }); }
  catch (error) { if (error instanceof Error && error.name === 'AbortError') throw error; throw new Error('Connection interrupted. Please try again.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('The order service is unavailable. Please try again shortly.'); }
  if (!response.ok) throw new Error(data.message || 'Unable to load this order.');
  return data as T;
}
export const listAdminOrders = (query: URLSearchParams, signal?: AbortSignal) => request<OrderListResult>(`/api/admin/orders?${query}`, { signal }, true);
export const getAdminOrder = async (id: string, signal?: AbortSignal) => (await request<{ order: Order }>(`/api/admin/orders/${encodeURIComponent(id)}`, { signal }, true)).order;
export const updateAdminOrder = (id: string, update: OrderUpdateInput) => request<OrderUpdateResult>(`/api/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(update) }, true);
export const trackOrder = async (orderNumber: string, verification: string) => (await request<{ order: TrackingOrder }>('/api/track-order', { method: 'POST', body: JSON.stringify({ orderNumber, verification }) })).order;
export const resumeTracking = async () => (await request<{ order: TrackingOrder }>('/api/track-order')).order;
export const forgetTracking = () => request('/api/track-order', { method: 'DELETE' });
