/**
 * Good Things Co. — Admin User Provisioning Script
 *
 * Usage:
 *   node --env-file=.env scripts/create-admin.js <email> <password>
 *
 * Example:
 *   node --env-file=.env scripts/create-admin.js admin@goodthingsco.com MySecurePassword123!
 */

const apiKey = process.env.VITE_FIREBASE_API_KEY;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('====================================================');
  console.log('GOOD THINGS CO. — ADMIN USER PROVISIONING TOOL');
  console.log('====================================================');
  console.log('Usage:');
  console.log('  node --env-file=.env scripts/create-admin.js <email> <password>\n');
  console.log('Example:');
  console.log('  node --env-file=.env scripts/create-admin.js admin@goodthingsco.com Atelier2026!\n');
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌ Password must be at least 6 characters long.');
  process.exit(1);
}

async function createAdmin() {
  console.log(`Connecting to Firebase Auth for project: ${projectId}...`);
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error?.message === 'EMAIL_EXISTS') {
        console.log(`ℹ️ An account with email "${email}" already exists in Firebase Auth.`);
        console.log('You can log in directly at http://localhost:5174/admin/login using this email and its existing password.');
        process.exit(0);
      }
      throw new Error(data.error?.message || 'Failed to create user in Firebase Auth.');
    }

    console.log('\n====================================================');
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('====================================================');
    console.log(`• Email:  ${data.email}`);
    console.log(`• UID:    ${data.localId}`);
    console.log(`\nYou can now log in at:`);
    console.log(`➜  http://localhost:5174/admin/login (or port 5173)`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Failed to provision admin user:', err.message);
    process.exit(1);
  }
}

createAdmin();
