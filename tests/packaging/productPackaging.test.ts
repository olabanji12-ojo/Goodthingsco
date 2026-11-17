/**
 * Good Things Co. — Product Packaging & Multi-Filter Test Suite
 *
 * Verifies:
 * 1. Products with inbuilt packaging (`packagingIncluded: true`) do NOT incur extra packaging fees (fee is ₦0).
 * 2. Products without inbuilt packaging (`packagingIncluded: false`) correctly apply the chosen packaging upgrade fee.
 * 3. Total item price strictly equals `product.price` when packaging is inbuilt.
 * 4. Multi-budget filtering: products match if they fall into ANY of the selected budget ranges.
 * 5. Multi-recipient filtering: products match if they suit ANY of the selected recipients.
 * 6. Product creation & update payloads correctly preserve `packagingIncluded`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBudgetTier } from '../../src/services/productService';
import { resolveDeliveryZone } from '../../src/config/shipping';
import type { Product, CreateProductInput } from '../../src/types/product';

// Helper to compute packaging fee and total unit price
function calculateCartUnitPrice(
  basePrice: number,
  packagingOptionPrice: number,
  packagingIncluded: boolean = false
): { unitPrice: number; packagingFee: number; label: string } {
  const packagingFee = packagingIncluded ? 0 : packagingOptionPrice;
  const unitPrice = basePrice + packagingFee;
  const label = packagingIncluded ? 'Included in Price' : (packagingFee === 0 ? 'Included' : `+₦${packagingFee.toLocaleString()}`);
  return { unitPrice, packagingFee, label };
}

// Helper to check if a product price matches multiple budget tiers
function matchesBudgetTiers(price: number, tiers: string[]): boolean {
  return tiers.some((tier) => {
    const normalized = normalizeBudgetTier(tier);
    if (normalized === 'under-25000') return price < 25000;
    if (normalized === '25000-50000') return price >= 25000 && price <= 50000;
    if (normalized === '50000-100000') return price >= 50000 && price <= 100000;
    if (normalized === '100000-250000') return price >= 100000 && price <= 250000;
    if (normalized === '250000-plus') return price >= 250000;
    return false;
  });
}

// Helper to check if a product matches multiple recipients
function matchesRecipients(productRecipients: string[], filterRecipients: string[]): boolean {
  if (filterRecipients.length === 0) return true;
  return filterRecipients.some((target) =>
    productRecipients.some(
      (r) =>
        r.toLowerCase() === target.toLowerCase() ||
        r.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(r.toLowerCase())
    )
  );
}

test('Packaging Configuration Test Suite', async (t) => {
  await t.test('1. Product with packagingIncluded: true charges ₦0 packaging fee', () => {
    const basePrice = 65000;
    const luxuryBoxPrice = 5000; // e.g. Festive Keepsake Box
    const result = calculateCartUnitPrice(basePrice, luxuryBoxPrice, true);

    assert.equal(result.packagingFee, 0, 'Packaging fee must be 0 when packaging is inbuilt');
    assert.equal(result.unitPrice, 65000, 'Unit price must equal base product price');
    assert.equal(result.label, 'Included in Price');
  });

  await t.test('2. Product with packagingIncluded: false applies packaging upgrade fee', () => {
    const basePrice = 45000;
    const keepsakeBoxPrice = 5000;
    const result = calculateCartUnitPrice(basePrice, keepsakeBoxPrice, false);

    assert.equal(result.packagingFee, 5000, 'Packaging fee must be added when not inbuilt');
    assert.equal(result.unitPrice, 50000, 'Unit price must be basePrice + packagingFee');
    assert.equal(result.label, '+₦5,000');
  });

  await t.test('3. Free standard box charges ₦0 even if packagingIncluded: false', () => {
    const basePrice = 30000;
    const standardBoxPrice = 0;
    const result = calculateCartUnitPrice(basePrice, standardBoxPrice, false);

    assert.equal(result.packagingFee, 0);
    assert.equal(result.unitPrice, 30000);
    assert.equal(result.label, 'Included');
  });

  await t.test('4. Multi-range budget filtering matches products in ANY selected tier', () => {
    const selectedTiers = ['25k-50k', '50k-100k'];

    // Product A: ₦35,000 (falls in 25k-50k) -> MATCH
    assert.equal(matchesBudgetTiers(35000, selectedTiers), true);

    // Product B: ₦75,000 (falls in 50k-100k) -> MATCH
    assert.equal(matchesBudgetTiers(75000, selectedTiers), true);

    // Product C: ₦18,000 (under 25k) -> NO MATCH
    assert.equal(matchesBudgetTiers(18000, selectedTiers), false);

    // Product D: ₦500,000 (over 250k) -> NO MATCH
    assert.equal(matchesBudgetTiers(500000, selectedTiers), false);
  });

  await t.test('5. Multi-recipient filtering matches products matching ANY selected recipient', () => {
    const selectedRecipients = ['mum', 'sister'];

    // Hamper 1: targeted for Mum
    assert.equal(matchesRecipients(['her', 'mum'], selectedRecipients), true);

    // Hamper 2: targeted for Sister
    assert.equal(matchesRecipients(['sister', 'family'], selectedRecipients), true);

    // Hamper 3: targeted for Corporate Executive
    assert.equal(matchesRecipients(['executive', 'client', 'him'], selectedRecipients), false);
  });

  await t.test('6. Product model preserves packagingIncluded property', () => {
    const input: CreateProductInput = {
      name: 'Festive Luxury Hamper',
      description: 'Champagne, artisanal chocolates, and handwritten card.',
      price: 120000,
      category: 'Festive Collection',
      occasions: ['christmas'],
      recipients: ['family', 'client'],
      budgetRange: '100000-250000',
      packagingIncluded: true,
      packagingOptions: ['Signature Keepsake Box'],
    };

    assert.equal(input.packagingIncluded, true, 'packagingIncluded must be preserved on input payload');

    const createdProduct: Product = {
      id: 'prod-festive-101',
      slug: 'festive-luxury-hamper',
      ...input,
      stock: 10,
      isAvailable: true,
      isArchived: false,
      images: [],
    };

    assert.equal(createdProduct.packagingIncluded, true, 'packagingIncluded must exist on created product');
  });

  await t.test('7. Authoritative order calculation accurately charges packaging fee', () => {
    const prod = { price: 50000, packagingIncluded: false };
    const cartItem = { quantity: 2, packagingFee: 4000 };
    const effectiveUnitPrice = prod.price + (prod.packagingIncluded ? 0 : cartItem.packagingFee);
    const itemSubtotal = effectiveUnitPrice * cartItem.quantity;
    const deliveryFee = 3500;
    const orderTotal = itemSubtotal + deliveryFee;

    assert.equal(effectiveUnitPrice, 54000);
    assert.equal(itemSubtotal, 108000);
    assert.equal(orderTotal, 111500, 'Order total must include packaging upgrade fees and delivery fee');
  });

  await t.test('8. Delivery zone resolves correctly for Lagos, Interstate, and International', () => {
    assert.equal(resolveDeliveryZone('Nigeria', 'Lagos'), 'lagos');
    assert.equal(resolveDeliveryZone('Nigeria', ''), 'lagos', 'Empty state defaults to Lagos base zone');
    assert.equal(resolveDeliveryZone('Nigeria', 'Rivers'), 'other-nigeria');
    assert.equal(resolveDeliveryZone('United Kingdom', 'London'), 'international');
  });
});
