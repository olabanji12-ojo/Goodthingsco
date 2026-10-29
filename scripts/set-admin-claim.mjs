/** Inspect by default. Grant requires an explicit, verified UID and project. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { loadEnv } from 'vite';

const args = process.argv.slice(2);
const email = args[0]?.trim().toLowerCase();
const option = name => args[args.indexOf(name) + 1];
const grant = args.includes('--grant');
if (!email || !email.includes('@')) {
  console.error('Usage: npm run admin:claim -- email@example.com [--grant --uid UID --project PROJECT_ID]');
  process.exit(1);
}
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
let app;
try {
  let raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credentialPath = env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json';
  if (!raw && existsSync(resolve(credentialPath))) raw = readFileSync(resolve(credentialPath), 'utf8');
  const credentials = raw ? JSON.parse(raw) : undefined;
  const projectId = env.FIREBASE_PROJECT_ID || credentials?.project_id || env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Configure FIREBASE_PROJECT_ID before inspecting admin access.');
  if (!credentials && env.FIREBASE_USE_ADC !== 'true') throw new Error('Server credentials are unavailable. Configure FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
  if (grant && (!args.includes('--uid') || !args.includes('--project') || option('--project') !== projectId)) {
    throw new Error('Grant requires --uid and --project matching the configured Firebase project.');
  }
  app = initializeApp({ projectId, credential: credentials ? cert(credentials) : applicationDefault() });
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email);
  console.log(JSON.stringify({ projectId, email: user.email, uid: user.uid, disabled: user.disabled, emailVerified: user.emailVerified, admin: user.customClaims?.admin === true }, null, 2));
  if (grant) {
    if (user.uid !== option('--uid')) throw new Error('UID does not match the selected account. No changes made.');
    if (user.disabled) throw new Error('Cannot grant access to a disabled account.');
    await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
    console.log('Admin claim saved. Sign out and sign in again to refresh the session.');
  } else console.log('Inspection only. No account or permission changes made.');
} catch (error) {
  console.error(error.code === 'auth/user-not-found' ? 'Account does not exist. Create it through Firebase Authentication before granting access.' : `Admin access check failed (${error.code || 'configuration'}). ${error.code ? 'Check Firebase connectivity and credential permissions.' : error.message}`);
  process.exitCode = 1;
} finally {
  if (app) await deleteApp(app);
}
