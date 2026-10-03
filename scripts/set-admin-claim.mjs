/**
 * Good Things Co. — Grant Admin Custom Claim Script
 *
 * Usage:
 *   npm run admin:claim <admin-email> [optional-password-if-user-does-not-exist]
 *
 * Example:
 *   npm run admin:claim ojo@gmail.com
 *   npm run admin:claim ojo@gmail.com MySecurePassword123!
 */

import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { loadEnv } from 'vite';

const targetEmail = process.argv[2]?.trim().toLowerCase();
const optionalPassword = process.argv[3]?.trim();

if (!targetEmail) {
  console.log('====================================================');
  console.log('👑 GOOD THINGS CO. — SET ADMIN CUSTOM CLAIM');
  console.log('====================================================');
  console.log('Usage:');
  console.log('  npm run admin:claim <admin-email> [optional-password]\n');
  console.log('Example:');
  console.log('  npm run admin:claim ojo@gmail.com\n');
  process.exit(1);
}

function findLocalServiceAccount() {
  const cwd = process.cwd();
  const directPath = path.resolve(cwd, 'service-account.json');
  if (fs.existsSync(directPath)) {
    return { path: directPath, content: fs.readFileSync(directPath, 'utf8') };
  }

  const files = fs.readdirSync(cwd);
  const match = files.find(f => f.includes('adminsdk') && f.endsWith('.json'));
  if (match) {
    const fullPath = path.resolve(cwd, match);
    return { path: fullPath, content: fs.readFileSync(fullPath, 'utf8') };
  }

  return null;
}

const env = loadEnv('development', process.cwd(), '');
let rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || env.FIREBASE_SERVICE_ACCOUNT_JSON;
let credentialsSource = rawCredentials ? 'FIREBASE_SERVICE_ACCOUNT_JSON' : null;

if (!rawCredentials) {
  const localFile = findLocalServiceAccount();
  if (localFile) {
    rawCredentials = localFile.content;
    credentialsSource = path.basename(localFile.path);
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || 'goodthingsco01';

if (!rawCredentials && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.K_SERVICE && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('\n====================================================');
  console.error('❌ Server credentials not found.');
  console.error('====================================================');
  console.error('To grant admin privileges, Firebase requires a Service Account key.\n');
  console.error('How to get it in 3 easy steps:');
  console.error('1. Go to Firebase Console:');
  console.error(`   https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`);
  console.error('2. Click "Generate new private key" (downloads a .json file).');
  console.error('3. Place that downloaded file in this project root as:');
  console.error(`   service-account.json`);
  console.error('   (It is already in .gitignore, so it will never be uploaded to GitHub)\n');
  console.error('Then simply run:');
  console.error(`   npm run admin:claim ${targetEmail}\n`);
  console.error('====================================================\n');
  process.exit(1);
}

if (credentialsSource) {
  console.log(`ℹ️  Using Firebase server credentials from: ${credentialsSource}`);
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  projectId,
  credential: rawCredentials ? cert(JSON.parse(rawCredentials)) : applicationDefault(),
});

const auth = getAuth(app);

async function grantAdminClaim() {
  try {
    let user;
    try {
      user = await auth.getUserByEmail(targetEmail);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        if (optionalPassword) {
          console.log(`ℹ️  User "${targetEmail}" does not exist yet. Creating user account now...`);
          user = await auth.createUser({
            email: targetEmail,
            password: optionalPassword,
            emailVerified: true,
          });
          console.log(`✅ User "${targetEmail}" created successfully.`);
        } else {
          console.error('\n====================================================');
          console.error(`⚠️  User "${targetEmail}" not found in Firebase Authentication.`);
          console.error('====================================================');
          console.error('You can either:');
          console.error(`1. Auto-create this account with a password:`);
          console.error(`   npm run admin:claim ${targetEmail} YourPassword123!`);
          console.error('\n2. Or create the user manually in Firebase Console:');
          console.error(`   https://console.firebase.google.com/project/${projectId}/authentication/users`);
          console.error('   Click "Add user", enter email & password, then re-run this command.\n');
          console.error('====================================================\n');
          process.exit(1);
        }
      } else {
        throw err;
      }
    }

    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log('\n====================================================');
    console.log('🎉 ADMIN CUSTOM CLAIM GRANTED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`• Email: ${user.email}`);
    console.log(`• UID:   ${user.uid}`);
    console.log(`• Claim: { admin: true }`);
    console.log('====================================================');
    console.log('You can now log in at:');
    console.log('👉 http://localhost:5174/admin/login\n');
  } catch (error) {
    console.error(`❌ Failed to set admin claim for "${targetEmail}":`, error.message);
    process.exit(1);
  }
}

grantAdminClaim();
