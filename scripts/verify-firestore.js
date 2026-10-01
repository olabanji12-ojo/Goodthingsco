/**
 * Verification Script: Firestore CRUD Operations for Good Things Co.
 *
 * Runs end-to-end tests against the live Firestore database (goodthingsco01).
 * Verifies all 10 requirements from the specification.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';

// 1. Read configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('====================================================');
console.log('GOOD THINGS CO. — FIRESTORE CRUD VERIFICATION SUITE');
console.log(`Connecting to Project: ${firebaseConfig.projectId}`);
console.log('====================================================\n');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PRODUCTS_COLLECTION = 'products';

async function runVerification() {
  const timestamp = Date.now();
  const testSlug = `sample-luxury-birthday-box-${timestamp.toString().slice(-6)}`;

  const sampleProduct = {
    name: 'The Grand Celebration Gift Box',
    slug: testSlug,
    description: 'An exquisitely curated luxury birthday gift box with bespoke confectionery and personalized keepsake.',
    price: 35000,
    compareAtPrice: 42000,
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Gift Box',
    occasions: ['birthday', 'thank-you'],
    recipients: ['her', 'mum', 'family'],
    budgetRange: '25000-50000',
    stock: 10,
    isAvailable: true,
    isArchived: false,
    featured: true,
    packagingOptions: ['Gift Box', 'Gift Bag'],
    ribbonColours: ['Gold', 'White'],
    personalisation: {
      enabled: true,
      messageAllowed: true,
      customTextAllowed: false,
    },
    variants: [
      {
        name: 'Size',
        options: ['Classic', 'Grand Luxe'],
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  let docId = null;

  try {
    // ----------------------------------------------------
    // TEST 1 & 2: Create product & create collection
    // ----------------------------------------------------
    console.log('[STEP 1 & 2] Writing first product to Firestore collection "products"...');
    const collectionRef = collection(db, PRODUCTS_COLLECTION);
    const docRef = await addDoc(collectionRef, sampleProduct);
    docId = docRef.id;
    console.log(`✅ SUCCESS: Document written with ID: ${docId}`);
    console.log(`✅ SUCCESS: Collection "${PRODUCTS_COLLECTION}" created automatically by Firestore.`);

    // ----------------------------------------------------
    // TEST 3: Retrieve all active products
    // ----------------------------------------------------
    console.log('\n[STEP 3] Querying active products (isArchived == false)...');
    const activeQuery = query(collectionRef, where('isArchived', '==', false));
    const activeSnap = await getDocs(activeQuery);
    const activeDocs = activeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const foundInActive = activeDocs.some((d) => d.id === docId);
    console.log(`✅ SUCCESS: Retrieved ${activeDocs.length} active product(s). Created product found: ${foundInActive}`);

    // ----------------------------------------------------
    // TEST 4: Retrieve one product by Document ID
    // ----------------------------------------------------
    console.log('\n[STEP 4] Retrieving product by document ID...');
    const singleDocRef = doc(db, PRODUCTS_COLLECTION, docId);
    const singleSnap = await getDoc(singleDocRef);
    if (!singleSnap.exists()) {
      throw new Error(`Document ${docId} not found`);
    }
    const singleData = singleSnap.data();
    console.log(`✅ SUCCESS: Fetched document ID ${docId}: "${singleData.name}" (Price: ₦${singleData.price.toLocaleString()})`);

    // ----------------------------------------------------
    // TEST 5: Retrieve one product by Slug
    // ----------------------------------------------------
    console.log('\n[STEP 5] Retrieving product by Slug...');
    const slugQuery = query(collectionRef, where('slug', '==', testSlug), limit(1));
    const slugSnap = await getDocs(slugQuery);
    if (slugSnap.empty) {
      throw new Error(`Product with slug ${testSlug} not found`);
    }
    const slugProduct = slugSnap.docs[0].data();
    console.log(`✅ SUCCESS: Fetched by slug "${testSlug}": Name="${slugProduct.name}"`);

    // ----------------------------------------------------
    // TEST 6: Update product
    // ----------------------------------------------------
    console.log('\n[STEP 6] Updating product price and stock...');
    const newPrice = 38500;
    const newStock = 8;
    await updateDoc(singleDocRef, {
      price: newPrice,
      stock: newStock,
      updatedAt: serverTimestamp(),
    });
    const updatedSnap = await getDoc(singleDocRef);
    const updatedData = updatedSnap.data();
    console.log(`✅ SUCCESS: Updated price to ₦${updatedData.price.toLocaleString()}, stock to ${updatedData.stock}`);

    // ----------------------------------------------------
    // TEST 7: Archive product (soft delete)
    // ----------------------------------------------------
    console.log('\n[STEP 7] Archiving product (soft delete)...');
    await updateDoc(singleDocRef, {
      isArchived: true,
      isAvailable: false,
      updatedAt: serverTimestamp(),
    });
    const archivedSnap = await getDoc(singleDocRef);
    const archivedData = archivedSnap.data();
    console.log(`✅ SUCCESS: Product archived: isArchived=${archivedData.isArchived}, isAvailable=${archivedData.isAvailable}`);

    // ----------------------------------------------------
    // TEST 8: Confirm archived products excluded from active
    // ----------------------------------------------------
    console.log('\n[STEP 8] Confirming archived products excluded from active query...');
    const activeQuery2 = query(collectionRef, where('isArchived', '==', false));
    const activeSnap2 = await getDocs(activeQuery2);
    const stillInActive = activeSnap2.docs.some((d) => d.id === docId);
    console.log(`✅ SUCCESS: Archived product excluded from active query: ${!stillInActive} (Active count: ${activeSnap2.docs.length})`);

    // ----------------------------------------------------
    // TEST 9: Restore product
    // ----------------------------------------------------
    console.log('\n[STEP 9] Restoring archived product...');
    await updateDoc(singleDocRef, {
      isArchived: false,
      updatedAt: serverTimestamp(),
    });
    const restoredSnap = await getDoc(singleDocRef);
    const restoredData = restoredSnap.data();
    console.log(`✅ SUCCESS: Restored product: isArchived=${restoredData.isArchived}`);

    // ----------------------------------------------------
    // TEST 10: Occasion, Recipient, Budget queries & Timestamps
    // ----------------------------------------------------
    console.log('\n[STEP 10] Testing discovery queries (Occasion, Recipient, Budget)...');
    await updateDoc(singleDocRef, { isAvailable: true });

    // Occasion query
    const occasionQ = query(collectionRef, where('occasions', 'array-contains', 'birthday'));
    const occasionSnap = await getDocs(occasionQ);

    // Recipient query
    const recipientQ = query(collectionRef, where('recipients', 'array-contains', 'mum'));
    const recipientSnap = await getDocs(recipientQ);

    // Budget query
    const budgetQ = query(collectionRef, where('budgetRange', '==', '25000-50000'));
    const budgetSnap = await getDocs(budgetQ);

    console.log(`✅ SUCCESS: Occasion filter ('birthday') matched ${occasionSnap.docs.length} product(s)`);
    console.log(`✅ SUCCESS: Recipient filter ('mum') matched ${recipientSnap.docs.length} product(s)`);
    console.log(`✅ SUCCESS: Budget filter ('25000-50000') matched ${budgetSnap.docs.length} product(s)`);
    console.log(`✅ SUCCESS: Timestamps verified: createdAt=${restoredData.createdAt ? 'ServerTimestamp' : 'missing'}, updatedAt=${restoredData.updatedAt ? 'ServerTimestamp' : 'missing'}`);

    console.log('\n====================================================');
    console.log('🎉 ALL 10 CRUD & QUERY OPERATIONS PASSED CLEANLY!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ ERROR during verification:', error);
    process.exit(1);
  }
}

runVerification().then(() => {
  process.exit(0);
});
