/**
 * Good Things Co. — Grant Admin Custom Claim Script
 *
 * Usage:
 *   node scripts/set-admin-claim.mjs <admin-email>
 *
 * Requires server credentials:
 *   FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS
 */

import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { loadEnv } from 'vite';

const targetEmail = process.argv[2]?.trim().toLowerCase();

if (!targetEmail) {
  console.log('====================================================');
  console.log('GOOD THINGS CO. — SET ADMIN CUSTOM CLAIM');
  console.log('====================================================');
  console.log('Usage:');
  console.log('  node scripts/set-admin-claim.mjs <admin-email>\n');
  console.log('Example:');
  console.log('  node scripts/set-admin-claim.mjs admin@goodthingsco.com\n');
  process.exit(1);
}

const env = loadEnv('development', process.cwd(), '');
const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;

if (!rawCredentials && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.K_SERVICE && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('❌ Server credentials not found.');
  console.error('Please configure FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS before running this script.');
  process.exit(1);
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  projectId,
  credential: rawCredentials ? cert(JSON.parse(rawCredentials)) : applicationDefault(),
});

const auth = getAuth(app);

async function grantAdminClaim() {
  try {
    const user = await auth.getUserByEmail(targetEmail);
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log('\n====================================================');
    console.log('🎉 ADMIN CUSTOM CLAIM GRANTED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`• Email: ${user.email}`);
    console.log(`• UID:   ${user.uid}`);
    console.log(`• Claim: { admin: true }`);
    console.log('====================================================\n');
  } catch (error) {
    console.error(`❌ Failed to set admin claim for "${targetEmail}":`, error.message);
    process.exit(1);
  }
}

grantAdminClaim();
