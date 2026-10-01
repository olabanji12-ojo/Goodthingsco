/**
 * Good Things Co. — Firebase & Firestore Initialization
 *
 * Dedicated, centralized Firebase instance for the Good Things Co. platform.
 * Project: goodthingsco01
 *
 * All credentials are read from environment variables (VITE_FIREBASE_*).
 * No credentials or private keys are hardcoded in application logic.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// 1. Read configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 2. Validate configuration at startup
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missingKeys.length > 0) {
  console.error(
    `[Firebase] Missing required Firebase configuration keys in environment: ${missingKeys.join(
      ', '
    )}. Please check your .env file.`
  );
}

// 3. Initialize Firebase app as a singleton
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// 4. Initialize Firestore
export const db: Firestore = getFirestore(app);

// 5. Initialize Firebase Auth (prepared for future Admin dashboard)
export const auth: Auth = getAuth(app);

export default app;
