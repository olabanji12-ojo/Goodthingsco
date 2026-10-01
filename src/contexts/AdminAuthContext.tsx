/**
 * Good Things Co. — Admin Authentication Context
 *
 * Dedicated authentication management for the Admin Dashboard.
 * Integrates directly with Firebase Auth while protecting admin routes.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminAuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Reads optional admin email allowlist from environment variables
function getAuthorizedAdminEmails(): string[] {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!envEmails) return [];
  return envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if current user email is authorized (if allowlist is defined)
  const authorizedEmails = getAuthorizedAdminEmails();
  const isAuthorizedAdmin = Boolean(
    user &&
      (authorizedEmails.length === 0 ||
        (user.email && authorizedEmails.includes(user.email.toLowerCase())))
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userEmail = credential.user.email?.toLowerCase();

      // Enforce allowlist if defined
      if (
        authorizedEmails.length > 0 &&
        (!userEmail || !authorizedEmails.includes(userEmail))
      ) {
        await signOut(auth);
        throw new Error(
          `Access Denied: The account "${email}" is not authorized as an administrator.`
        );
      }
    } catch (err: unknown) {
      let message = 'Failed to sign in. Please verify your credentials.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          message = 'Invalid email or password. Please try again.';
        } else if (err.message.includes('auth/user-not-found')) {
          message = 'No admin account found with this email address.';
        } else if (err.message.includes('auth/operation-not-allowed') || err.message.includes('CONFIGURATION_NOT_FOUND')) {
          message = 'Email/Password authentication has not been enabled in the Firebase Console. Visit Build > Authentication > Sign-in method and enable Email/Password.';
        } else if (err.message.includes('auth/too-many-requests')) {
          message = 'Access temporarily disabled due to multiple failed login attempts. Please try again later.';
        } else {
          message = err.message;
        }
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[AdminAuth] Logout failed:', err);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAuthorizedAdmin,
        login,
        logout,
        authError,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
