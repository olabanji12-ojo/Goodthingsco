import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
// Test-only identity. The real server rejects this string as an invalid Firebase token.
export const auth = { currentUser: { getIdToken: async () => 'preview-admin' } } as unknown as Auth;
export const db = {} as Firestore;
