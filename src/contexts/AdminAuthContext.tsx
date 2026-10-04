import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminAuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  authError: string | null;
  clearError(): void;
}
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
const ADMIN_EMAILS = [
  'olabanji@gmail.com',
  'ojo@gmail.com',
  'emmanuelojo291@gmail.com',
  'tofunmieolabanji@gmail.com',
];
function checkIsAdmin(user: any, token: any): boolean {
  if (token?.claims?.admin === true) return true;
  const email = (user?.email || '').toLowerCase();
  return ADMIN_EMAILS.includes(email);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorizedAdmin, setAuthorized] = useState(false);
  const [authError, setError] = useState<string | null>(null);
  useEffect(() => {
    try { localStorage.removeItem('gtc_admin_auth'); } catch { /* Storage may be disabled. Firebase remains the authority. */ }
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (current: any) => {
      const version = ++generation;
      setUser(null); setAuthorized(false); setLoading(true);
      try {
        const token = current ? await current.getIdTokenResult() : null;
        if (version === generation) { setUser(current); setAuthorized(checkIsAdmin(current, token)); }
      } catch { if (version === generation) setError('Please sign in again.'); }
      finally { if (version === generation) setLoading(false); }
    });
    return () => { generation++; unsubscribe(); };
  }, []);
  async function login(email: string, password: string) {
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const token = await (credential.user as any).getIdTokenResult(true);
      if (!checkIsAdmin(credential.user, token)) {
        await signOut(auth);
        throw new Error('This account does not have administrator access. Contact the store owner.');
      }
      setUser(credential.user); setAuthorized(true);
    } catch (error) {
      const message = error instanceof Error && error.message.startsWith('This account')
        ? error.message : 'Sign-in failed. Check your credentials and try again.';
      setError(message); throw new Error(message);
    }
  }
  async function logout() { await signOut(auth); setUser(null); setAuthorized(false); }
  return <AdminAuthContext.Provider value={{ user, loading, isAuthorizedAdmin, login, logout, authError, clearError: () => setError(null) }}>{children}</AdminAuthContext.Provider>;
}
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('AdminAuthProvider is required');
  return context;
}
