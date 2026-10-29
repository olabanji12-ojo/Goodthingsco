/**
 * Good Things Co. — Client-Side Abandoned Checkout Session Service
 *
 * Manages client checkout session persistence, debounced autosave,
 * and secure resume token retrieval.
 * Never stores or transmits card numbers, CVVs, or payment credentials.
 */

import type { CartItem } from '../types/cart';
import type {
  CheckoutFormData,
} from '../types/checkout';
import type {
  CheckoutSessionInput,
  RecoveredCheckoutPayload,
} from '../types/abandonedCheckout';

const TOKEN_STORAGE_KEY = 'gtc_checkout_session_token';
export function getStoredSessionToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}
function storeToken(token: string): void {
  try { sessionStorage.setItem(TOKEN_STORAGE_KEY, token); } catch {}
}
const SESSION_STORAGE_KEY = 'gtc_checkout_session_id';

export function getStoredSessionId(): string | null {
  try {
    return getStoredSessionToken() ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function setStoredSessionId(id: string): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {}
}

export function clearStoredSessionId(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

/**
 * Initializes or updates an active checkout session on the server.
 */
export async function initCheckoutSession(
  input: CheckoutSessionInput
): Promise<{ sessionId: string; resumeToken: string; resumeUrl: string } | null> {
  try {
    const existingId = getStoredSessionToken() ? input.sessionId || getStoredSessionId() || undefined : undefined;
    const response = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredSessionToken() || ''}` },
      body: JSON.stringify({ ...input, sessionId: existingId }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      console.warn(`[CheckoutSession] Server returned non-JSON response (${response.status}) during session init`);
      return null;
    }

    if (!response.ok || !data.success) {
      if (response.status === 403 || response.status === 404 || response.status === 409) {
        clearStoredSessionId();
      }
      console.warn('[CheckoutSession] Failed to initialize session:', data?.message);
      return null;
    }

    if (data.sessionId) {
      storeToken(data.resumeToken);
      setStoredSessionId(data.sessionId);
    }
    return {
      sessionId: data.sessionId,
      resumeToken: data.resumeToken,
      resumeUrl: data.resumeUrl,
    };
  } catch (error) {
    console.warn('[CheckoutSession] Network exception during session init:', error);
    return null;
  }
}

/**
 * Autosaves the checkout session with debouncing.
 */
export async function autosaveCheckoutSession(
  sessionId: string,
  updates: Partial<CheckoutSessionInput>
): Promise<boolean> {
  try {
    const response = await fetch(`/api/checkout/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredSessionToken() || ''}` },
      body: JSON.stringify(updates),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      console.warn(`[CheckoutSession] Server returned non-JSON response (${response.status}) during autosave`);
      return false;
    }

    if (response.status === 403 || response.status === 404 || response.status === 409 || !response.ok) {
      clearStoredSessionId();
      return false;
    }

    return Boolean(data.success);
  } catch (error) {
    clearStoredSessionId();
    console.warn('[CheckoutSession] Autosave failed:', error);
    return false;
  }
}

/**
 * Debounced checkout autosave manager.
 */
export function createCheckoutAutosaver(debounceMs = 1000) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let pendingData: {
    formData: CheckoutFormData;
    items: CartItem[];
  } | null = null;

  async function flush() {
    if (!pendingData || inFlight) return;
    inFlight = true;
    const current = pendingData;
    pendingData = null;

    try {
      let sessionId = getStoredSessionId();
      const input: CheckoutSessionInput = {
        sessionId: sessionId || undefined,
        customer: current.formData.customer,
        recipient: current.formData.recipient,
        delivery: current.formData.delivery,
        giftMessage: current.formData.giftMessage,
        items: current.items,
      };

      if (!sessionId) {
        const initResult = await initCheckoutSession(input);
        if (initResult?.sessionId) {
          sessionId = initResult.sessionId;
        }
      } else {
        const ok = await autosaveCheckoutSession(sessionId, input);
        if (!ok) {
          clearStoredSessionId();
          await initCheckoutSession(input);
        }
      }
    } finally {
      inFlight = false;
      if (pendingData) {
        // Run any trailing update queued during inFlight
        flush();
      }
    }
  }

  return {
    queueSave(formData: CheckoutFormData, items: CartItem[]) {
      if (!items || items.length === 0) return;
      pendingData = { formData, items };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        flush();
      }, debounceMs);
    },
    cancel() {
      if (timer) clearTimeout(timer);
      pendingData = null;
    },
    flushImmediately() {
      if (timer) clearTimeout(timer);
      return flush();
    },
  };
}

/**
 * Resumes a checkout session using a secure random resume token.
 * Token is verified server-side via cryptographic hash.
 */
export async function resumeCheckoutSession(
  token: string
): Promise<{ success: boolean; payload?: RecoveredCheckoutPayload; message?: string }> {
  try {
    const response = await fetch('/api/checkout/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Could not parse response from checkout recovery service.',
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data?.message || 'Could not resume checkout session.',
      };
    }

    if (data.payload?.sessionId) {
      storeToken(token);
      setStoredSessionId(data.payload.sessionId);
    }

    return {
      success: true,
      payload: data.payload,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to connect to checkout recovery service.',
    };
  }
}

/**
 * Explicitly marks a checkout session converted (e.g., upon confirmed order).
 */
export async function markCheckoutSessionConverted(
  sessionId: string,
  orderId: string,
  orderNumber: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/checkout/session/${sessionId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredSessionToken() || ''}` },
      body: JSON.stringify({ orderId, orderNumber }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return false;
    }

    clearStoredSessionId();
    return Boolean(response.ok && data.success);
  } catch {
    return false;
  }
}