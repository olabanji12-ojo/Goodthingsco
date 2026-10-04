import { env } from 'node:process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { OrderHttpError } from './orders/domain.js';

function findLocalServiceAccount(): string | null {
  try {
    const cwd = process.cwd();
    const defaultPath = resolve(cwd, 'service-account.json');
    if (existsSync(defaultPath)) return readFileSync(defaultPath, 'utf8');

    const files = readdirSync(cwd);
    const match = files.find(f => f.includes('adminsdk') && f.endsWith('.json'));
    if (match) return readFileSync(resolve(cwd, match), 'utf8');
  } catch {
    // ignore
  }
  return null;
}

// Lazy initialization keeps local startup safe without server credentials.
export function getAdminApp() {
  const existing = getApps().find(app => app.name === 'goodthingsco-trusted-server');
  if (existing) return existing;
  try {
    let raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      const localJson = findLocalServiceAccount();
      if (localJson) raw = localJson;
    }
    const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
    if (!raw && !env.GOOGLE_APPLICATION_CREDENTIALS && env.FIREBASE_USE_ADC !== 'true'
      && !env.K_SERVICE && !env.FIRESTORE_EMULATOR_HOST) throw new Error('Missing server credentials');
    return initializeApp({ projectId, credential: raw ? cert(JSON.parse(raw)) : applicationDefault() }, 'goodthingsco-trusted-server');
  } catch {
    throw new OrderHttpError(503, 'Secure order service is not configured. Please contact the store.');
  }
}
const configured = new WeakSet<object>();
export function getAdminFirestore() {
  const database = getFirestore(getAdminApp());
  if (!configured.has(database)) { database.settings({ ignoreUndefinedProperties: true }); configured.add(database); }
  return database;
}
export const getAdminAuth = () => getAuth(getAdminApp());
export const db = getAdminFirestore;
