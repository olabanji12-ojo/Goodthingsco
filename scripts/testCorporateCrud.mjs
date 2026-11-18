/**
 * Live End-to-End Test for Corporate Products Lifecycle (Create -> Verify -> Delete -> Verify)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadEnv } from 'vite';

const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };

let app;

async function runCorporateCrudTest() {
  console.log('\n======================================================');
  console.log('   Corporate Product Lifecycle (Create & Delete) Test  ');
  console.log('======================================================\n');

  try {
    let raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credentialPath = env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json';
    if (!raw && existsSync(resolve(credentialPath))) {
      raw = readFileSync(resolve(credentialPath), 'utf8');
    }
    const credentials = raw ? JSON.parse(raw) : undefined;
    const projectId = env.FIREBASE_PROJECT_ID || credentials?.project_id || env.VITE_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error('Project ID not configured.');
    }

    app = initializeApp({
      projectId,
      credential: credentials ? cert(credentials) : applicationDefault(),
    });

    const db = getFirestore(app);
    const colRef = db.collection('corporateProducts');

    // ── STEP 1: CREATE ──
    console.log('[STEP 1] Creating Test Corporate Package...');
    const testPackage = {
      name: 'Verification Atelier Executive Crate',
      category: 'Executive Suite',
      unitPrice: 75000,
      formattedPrice: '₦75,000',
      minQuantity: 10,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      alt: 'Verification Atelier Executive Crate',
      purposes: ['client', 'executive', 'appreciation'],
      giftTypes: ['choose-gift'],
      budgetTier: '50k-100k',
      description: 'Handcrafted luxury cedar crate with personalized laser monogramming.',
      includedItems: [
        'Solid Cedar Keepsake Box with Sliding Lid',
        'Hand-poured Botanical Candle',
        'Single-Origin Bean-to-Bar Chocolate',
        'Custom Debossed Leather Journal',
      ],
      badge: 'Test Commission',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await colRef.add(testPackage);
    const createdId = docRef.id;
    console.log(`✔ SUCCESS: Created Corporate Package with Document ID: "${createdId}"`);

    // ── STEP 2: VERIFY CREATION ──
    console.log('\n[STEP 2] Verifying document exists in Firestore...');
    const createdSnap = await colRef.doc(createdId).get();
    if (!createdSnap.exists) {
      throw new Error(`Failed to find created document ${createdId} in Firestore.`);
    }
    const data = createdSnap.data();
    console.log(`✔ SUCCESS: Verified document exists!`);
    console.log(`   - Name: "${data.name}"`);
    console.log(`   - Price: ${data.formattedPrice}`);
    console.log(`   - Category: ${data.category}`);
    console.log(`   - Min Qty: ${data.minQuantity}`);
    console.log(`   - Items Count: ${data.includedItems?.length}`);

    // ── STEP 3: DELETE ──
    console.log(`\n[STEP 3] Deleting Test Corporate Package "${createdId}"...`);
    await colRef.doc(createdId).delete();
    console.log(`✔ SUCCESS: Delete request executed for ID "${createdId}"`);

    // ── STEP 4: VERIFY DELETION ──
    console.log('\n[STEP 4] Verifying document is completely deleted from Firestore...');
    const deletedSnap = await colRef.doc(createdId).get();
    if (deletedSnap.exists) {
      throw new Error(`Document ${createdId} still exists after deletion!`);
    }
    console.log('✔ SUCCESS: Document successfully purged. Firestore corporateProducts collection is clean!');

    console.log('\n======================================================');
    console.log('   🎉 ALL TESTS PASSED: CREATE AND DELETE WORK 100%!  ');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (app) {
      await deleteApp(app);
    }
  }
}

runCorporateCrudTest();
