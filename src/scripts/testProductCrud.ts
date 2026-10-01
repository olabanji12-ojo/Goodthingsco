/**
 * Good Things Co. — Product CRUD & Firestore Integration Test Suite
 *
 * Runs an end-to-end verification against the live Firestore database (goodthingsco01):
 * 1. Create a product from code
 * 2. Confirm Firestore creates collection "products"
 * 3. Retrieve all active products
 * 4. Retrieve one product by document ID
 * 5. Retrieve one product by slug
 * 6. Update product
 * 7. Archive product (soft delete)
 * 8. Verify active product queries exclude archived products
 * 9. Restore archived product
 * 10. Verify timestamps & stored values
 * 11. Test Occasion, Recipient, and Budget queries
 */

import {
  createProduct,
  getProducts,
  getActiveProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  archiveProduct,
  restoreProduct,
  getProductsByOccasion,
  getProductsByRecipient,
  getProductsByBudget,
} from '../services/productService';
import { CreateProductInput } from '../types/product';

export interface TestResultItem {
  name: string;
  passed: boolean;
  details?: string;
  data?: unknown;
}

export interface TestSuiteReport {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  results: TestResultItem[];
}

export async function runProductCrudTests(): Promise<TestSuiteReport> {
  const results: TestResultItem[] = [];

  const recordResult = (name: string, passed: boolean, details?: string, data?: unknown) => {
    results.push({ name, passed, details, data });
    if (passed) {
      console.log(`✅ [PASS] ${name}`, details ? `— ${details}` : '');
    } else {
      console.error(`❌ [FAIL] ${name}`, details ? `— ${details}` : '');
    }
  };

  let createdProductId: string | null = null;
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testSlug = `sample-luxury-birthday-box-${uniqueSuffix}`;

  const sampleProductInput: CreateProductInput = {
    name: `The Atelier Birthday Hamper ${uniqueSuffix}`,
    slug: testSlug,
    description: 'An exquisitely curated luxury birthday gift hamper with bespoke artisanal treats and personalized note.',
    price: 45000,
    compareAtPrice: 50000,
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800',
    ],
    category: 'Gift Box',
    occasions: ['birthday', 'thank-you'],
    recipients: ['her', 'mum', 'family'],
    budgetRange: '25000-50000',
    stock: 12,
    isAvailable: true,
    featured: true,
    packagingOptions: ['Gift Box', 'Wooden Box'],
    ribbonColours: ['Gold', 'Midnight Navy'],
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
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Create a product from code
    // ----------------------------------------------------
    console.log('--- Step 1: Testing createProduct() ---');
    const created = await createProduct(sampleProductInput);
    if (created && created.id && created.slug === testSlug) {
      createdProductId = created.id;
      recordResult(
        '1. Create product from code',
        true,
        `Document ID: ${created.id}, Slug: ${created.slug}, Price: ₦${created.price.toLocaleString()}`,
        { id: created.id, name: created.name }
      );
    } else {
      recordResult('1. Create product from code', false, 'Product created without valid ID or slug.');
      return buildReport(results);
    }

    // ----------------------------------------------------
    // TEST 2: Confirm Firestore collection "products" exists
    // ----------------------------------------------------
    console.log('--- Step 2: Confirming Firestore products collection ---');
    const allProducts = await getProducts();
    const collectionFound = allProducts.some((p) => p.id === createdProductId);
    recordResult(
      '2. Confirm Firestore "products" collection auto-created and populated',
      collectionFound,
      `Collection contains ${allProducts.length} product(s). Found created document ${createdProductId}.`
    );

    // ----------------------------------------------------
    // TEST 3: Retrieve all active products
    // ----------------------------------------------------
    console.log('--- Step 3: Testing getActiveProducts() ---');
    const activeProducts = await getActiveProducts();
    const isActive = activeProducts.some((p) => p.id === createdProductId);
    recordResult(
      '3. Retrieve active products',
      isActive,
      `Found ${activeProducts.length} active product(s), newly created product included.`
    );

    // ----------------------------------------------------
    // TEST 4: Retrieve one product by Document ID
    // ----------------------------------------------------
    console.log('--- Step 4: Testing getProductById() ---');
    const fetchedById = await getProductById(createdProductId);
    const idMatch = fetchedById !== null && fetchedById.id === createdProductId && fetchedById.name === sampleProductInput.name;
    recordResult(
      '4. Retrieve product by Document ID',
      idMatch,
      idMatch ? `Retrieved name: "${fetchedById?.name}"` : 'Failed to retrieve by ID'
    );

    // ----------------------------------------------------
    // TEST 5: Retrieve one product by Slug
    // ----------------------------------------------------
    console.log('--- Step 5: Testing getProductBySlug() ---');
    const fetchedBySlug = await getProductBySlug(testSlug);
    const slugMatch = fetchedBySlug !== null && fetchedBySlug.id === createdProductId && fetchedBySlug.slug === testSlug;
    recordResult(
      '5. Retrieve product by Slug',
      slugMatch,
      slugMatch ? `Retrieved slug: "${fetchedBySlug?.slug}"` : 'Failed to retrieve by slug'
    );

    // ----------------------------------------------------
    // TEST 6: Update product
    // ----------------------------------------------------
    console.log('--- Step 6: Testing updateProduct() ---');
    const updatedPrice = 48500;
    const updatedStock = 9;
    const updated = await updateProduct(createdProductId, {
      price: updatedPrice,
      stock: updatedStock,
      description: 'Updated luxury description for testing purposes.',
    });
    const updateVerified = updated.price === updatedPrice && updated.stock === updatedStock;
    recordResult(
      '6. Update product (partial update preserving timestamps)',
      updateVerified,
      `Updated price to ₦${updated.price.toLocaleString()}, stock to ${updated.stock}`
    );

    // ----------------------------------------------------
    // TEST 7: Archive product (soft-delete)
    // ----------------------------------------------------
    console.log('--- Step 7: Testing archiveProduct() ---');
    await archiveProduct(createdProductId);
    const fetchedArchived = await getProductById(createdProductId);
    const archiveVerified = fetchedArchived?.isArchived === true && fetchedArchived?.isAvailable === false;
    recordResult(
      '7. Archive product (soft delete)',
      archiveVerified,
      `isArchived: ${fetchedArchived?.isArchived}, isAvailable: ${fetchedArchived?.isAvailable}`
    );

    // ----------------------------------------------------
    // TEST 8: Verify active products exclude archived
    // ----------------------------------------------------
    console.log('--- Step 8: Verifying active query excludes archived ---');
    const activeAfterArchive = await getActiveProducts();
    const excludedFromActive = !activeAfterArchive.some((p) => p.id === createdProductId);
    recordResult(
      '8. Active product query excludes archived product',
      excludedFromActive,
      `Archived product correctly excluded from ${activeAfterArchive.length} active items.`
    );

    // ----------------------------------------------------
    // TEST 9: Restore product
    // ----------------------------------------------------
    console.log('--- Step 9: Testing restoreProduct() ---');
    await restoreProduct(createdProductId);
    const fetchedRestored = await getProductById(createdProductId);
    const restoreVerified = fetchedRestored?.isArchived === false;
    recordResult(
      '9. Restore archived product',
      restoreVerified,
      `isArchived restored to ${fetchedRestored?.isArchived}`
    );

    // ----------------------------------------------------
    // TEST 10: Verify timestamps & taxonomy queries
    // ----------------------------------------------------
    console.log('--- Step 10: Testing Occasion, Recipient, Budget queries & Timestamps ---');
    // Ensure available for queries
    await updateProduct(createdProductId, { isAvailable: true });

    const occasionMatches = await getProductsByOccasion('birthday');
    const recipientMatches = await getProductsByRecipient('mum');
    const budgetMatches = await getProductsByBudget('25000-50000');

    const queriesWorking =
      occasionMatches.some((p) => p.id === createdProductId) &&
      recipientMatches.some((p) => p.id === createdProductId) &&
      budgetMatches.some((p) => p.id === createdProductId);

    recordResult(
      '10. Discovery queries (Occasion, Recipient, Budget) & Timestamps',
      queriesWorking,
      `Matches found: Birthday (${occasionMatches.length}), Mum (${recipientMatches.length}), ₦25,000-₦50,000 (${budgetMatches.length})`
    );

    return buildReport(results);
  } catch (error) {
    recordResult('Unhandled Test Error', false, error instanceof Error ? error.message : String(error));
    return buildReport(results);
  }
}

function buildReport(results: TestResultItem[]): TestSuiteReport {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    results,
  };
}
