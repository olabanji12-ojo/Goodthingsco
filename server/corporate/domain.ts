/**
 * Good Things Co. — Corporate Domain Logic, Sanitization, Reference Generator & Validation
 */

import { randomBytes } from 'node:crypto';
import type {
  CorporateRequestSubmissionInput,
  CorporateRequestStatus,
  CorporateGiftingPurpose,
  CorporateIndustry,
  CorporateGiftType,
  CorporateBudgetRange,
  UploadedAssetReference,
} from '../../src/types/corporate';

export class CorporateHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'CorporateHttpError';
  }
}

/**
 * Generates human-readable, unique corporate reference numbers.
 * Example: GTC-CORP-20261003-7B2F
 */
export function generateCorporateReferenceNumber(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const randomSuffix = randomBytes(2).toString('hex').toUpperCase();
  return `GTC-CORP-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export function sanitizeText(val: unknown, maxLen = 1000): string {
  if (typeof val !== 'string') return '';
  // Strip HTML tags and control characters
  const clean = val.replace(/<[^>]*>?/gm, '').replace(/[\x00-\x1F\x7F]/g, '');
  return clean.trim().slice(0, maxLen);
}

export function sanitizeEmail(val: unknown): string {
  if (typeof val !== 'string') return '';
  const email = val.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    throw new CorporateHttpError(400, 'Please provide a valid corporate email address.');
  }
  return email;
}

export function sanitizePhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  const clean = val.replace(/[^\d+()-\s]/g, '').trim();
  if (clean.length < 7 || clean.length > 30) {
    throw new CorporateHttpError(400, 'Please provide a valid phone number (at least 7 characters).');
  }
  return clean;
}

export function sanitizeAssetReference(asset?: unknown): UploadedAssetReference | undefined {
  if (!asset || typeof asset !== 'object') return undefined;
  const raw = asset as Record<string, unknown>;
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!url) return undefined;

  // Block javascript: or malicious data URIs
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    throw new CorporateHttpError(400, 'Invalid asset reference URL.');
  }

  return {
    url,
    publicId: sanitizeText(raw.publicId, 255) || undefined,
    originalFilename: sanitizeText(raw.originalFilename, 255) || undefined,
    format: sanitizeText(raw.format, 20) || undefined,
    bytes: typeof raw.bytes === 'number' && Number.isSafeInteger(raw.bytes) ? raw.bytes : undefined,
    uploadedAt: typeof raw.uploadedAt === 'string' ? raw.uploadedAt : new Date().toISOString(),
  };
}

const VALID_PURPOSES = new Set<CorporateGiftingPurpose>([
  'employee',
  'client',
  'executive',
  'event-conference',
  'new-employee',
  'appreciation',
  'custom',
]);

const VALID_GIFT_TYPES = new Set<CorporateGiftType>([
  'choose-gift',
  'build-your-own',
  'branded-merchandise',
]);

const VALID_BUDGETS = new Set<CorporateBudgetRange>([
  'under-25000',
  '25000-50000',
  '50000-100000',
  '100000-plus',
]);

export function normalizePurpose(val?: string): CorporateGiftingPurpose {
  if (val === 'event') return 'event-conference';
  if (val && VALID_PURPOSES.has(val as CorporateGiftingPurpose)) {
    return val as CorporateGiftingPurpose;
  }
  return 'custom';
}

export function normalizeGiftType(val?: string): CorporateGiftType {
  if (val === 'build-own') return 'build-your-own';
  if (val === 'branded-merch') return 'branded-merchandise';
  if (val && VALID_GIFT_TYPES.has(val as CorporateGiftType)) {
    return val as CorporateGiftType;
  }
  return 'choose-gift';
}

export function normalizeBudgetRange(val?: string): CorporateBudgetRange {
  if (val === 'under-25k') return 'under-25000';
  if (val === '25k-50k') return '25000-50000';
  if (val === '50k-100k') return '50000-100000';
  if (val === 'premium') return '100000-plus';
  if (val && VALID_BUDGETS.has(val as CorporateBudgetRange)) {
    return val as CorporateBudgetRange;
  }
  return '25000-50000';
}

export const VALID_INDUSTRIES = new Set<CorporateIndustry>([
  'finance',
  'technology',
  'healthcare',
  'legal',
  'consulting',
  'education',
  'real-estate-building',
  'hospitality',
  'government',
  'agriculture',
  'media-creative',
  'other',
]);

export function normalizeIndustry(val?: string): CorporateIndustry | undefined {
  if (!val) return undefined;
  const clean = val.toLowerCase().trim() as CorporateIndustry;
  if (VALID_INDUSTRIES.has(clean)) {
    return clean;
  }
  return 'other';
}

/**
 * Validates and normalizes client input for a new corporate request.
 */
export function validateCorporateSubmission(input: CorporateRequestSubmissionInput): {
  company: { companyName: string; contactName: string; email: string; phone: string };
  giftingPurpose: CorporateGiftingPurpose;
  industry?: CorporateIndustry;
  otherIndustry?: string;
  giftType: CorporateGiftType;
  budgetRange: CorporateBudgetRange;
  quantity: number;
  selectedProducts: any[];
  customisation: any;
  recipients: any[];
  recipientListFile?: UploadedAssetReference;
  delivery: any;
  idempotencyKey?: string;
} {
  if (!input || typeof input !== 'object') {
    throw new CorporateHttpError(400, 'Invalid corporate request payload.');
  }

  const companyRaw = input.company || ({} as any);
  const companyName = sanitizeText(companyRaw.companyName, 150);
  if (!companyName || companyName.length < 2) {
    throw new CorporateHttpError(400, 'Company name is required (minimum 2 characters).');
  }

  const contactName = sanitizeText(companyRaw.contactName, 120);
  if (!contactName || contactName.length < 2) {
    throw new CorporateHttpError(400, 'Contact person name is required (minimum 2 characters).');
  }

  const email = sanitizeEmail(companyRaw.email);
  const phone = sanitizePhone(companyRaw.phone);

  const quantity = Math.floor(Number(input.quantity));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new CorporateHttpError(400, 'Gift quantity must be a positive number of at least 1.');
  }
  if (quantity > 1000000) {
    throw new CorporateHttpError(400, 'Gift quantity exceeds maximum allowed (1,000,000).');
  }

  const giftingPurpose = normalizePurpose(input.giftingPurpose);
  const industry = normalizeIndustry(input.industry);
  const otherIndustry = industry === 'other' ? sanitizeText(input.otherIndustry, 100) || undefined : undefined;
  const giftType = normalizeGiftType(input.giftType);
  const budgetRange = normalizeBudgetRange(input.budgetRange);

  // Selected products snapshots
  const selectedProducts = Array.isArray(input.selectedProducts)
    ? input.selectedProducts.slice(0, 50).map((prod) => ({
        productId: sanitizeText(prod.productId, 100) || 'custom',
        name: sanitizeText(prod.name, 150) || 'Custom Selection',
        imageUrl: typeof prod.imageUrl === 'string' && /^https?:\/\//i.test(prod.imageUrl) ? prod.imageUrl : undefined,
        unitPriceSnapshot: typeof prod.unitPriceSnapshot === 'number' && prod.unitPriceSnapshot >= 0 ? prod.unitPriceSnapshot : undefined,
        quantity: typeof prod.quantity === 'number' && prod.quantity > 0 ? Math.floor(prod.quantity) : undefined,
        description: sanitizeText(prod.description, 500) || undefined,
      }))
    : [];

  // Customisation details
  const custRaw = input.customisation || {};
  const customisation = {
    companyMessage: sanitizeText(custRaw.companyMessage, 1000) || undefined,
    packaging: sanitizeText(custRaw.packaging, 100) || undefined,
    ribbonColour: sanitizeText(custRaw.ribbonColour, 100) || undefined,
    personalisationNotes: sanitizeText(custRaw.personalisationNotes, 1000) || undefined,
    brandingRequired: Boolean(custRaw.brandingRequired || custRaw.logoAsset),
    logoAsset: sanitizeAssetReference(custRaw.logoAsset),
  };

  // Recipients
  const recipients = Array.isArray(input.recipients)
    ? input.recipients.slice(0, 1000).map((rec, i) => ({
        id: sanitizeText(rec.id, 50) || `rec-${i + 1}`,
        name: sanitizeText(rec.name, 120),
        phone: typeof rec.phone === 'string' ? sanitizeText(rec.phone, 30) : undefined,
        email: typeof rec.email === 'string' && rec.email.includes('@') ? sanitizeText(rec.email, 120) : undefined,
        address: typeof rec.address === 'string' ? sanitizeText(rec.address, 300) : undefined,
        notes: typeof rec.notes === 'string' ? sanitizeText(rec.notes, 200) : undefined,
      })).filter((r) => r.name.length > 0)
    : [];

  const recipientListFile = sanitizeAssetReference(input.recipientListFile);

  // Delivery preferences
  const delRaw = input.delivery || {};
  const delivery = {
    preferredDeliveryDate: typeof delRaw.preferredDeliveryDate === 'string' ? sanitizeText(delRaw.preferredDeliveryDate, 30) : undefined,
    deliveryNotes: sanitizeText(delRaw.deliveryNotes, 1000) || undefined,
    deliveryMethod: delRaw.deliveryMethod === 'direct-recipient' ? 'direct-recipient' : 'single-hub',
  };

  const idempotencyKey = typeof input.idempotencyKey === 'string' ? sanitizeText(input.idempotencyKey, 128) : undefined;

  return {
    company: { companyName, contactName, email, phone },
    giftingPurpose,
    industry,
    otherIndustry,
    giftType,
    budgetRange,
    quantity,
    selectedProducts,
    customisation,
    recipients,
    recipientListFile,
    delivery,
    idempotencyKey,
  };
}

/**
 * Calculates authoritative quote totals.
 * total = subtotal + deliveryFee + brandingFee - discount
 */
export function calculateQuoteTotal(input: {
  subtotal: number;
  deliveryFee?: number;
  brandingFee?: number;
  discount?: number;
}): { subtotal: number; deliveryFee: number; brandingFee: number; discount: number; total: number } {
  const subtotal = Math.max(0, Math.floor(Number(input.subtotal) || 0));
  const deliveryFee = Math.max(0, Math.floor(Number(input.deliveryFee) || 0));
  const brandingFee = Math.max(0, Math.floor(Number(input.brandingFee) || 0));
  const discount = Math.max(0, Math.floor(Number(input.discount) || 0));

  const total = subtotal + deliveryFee + brandingFee - discount;
  if (total < 0) {
    throw new CorporateHttpError(400, 'Discount cannot exceed the combined subtotal, delivery, and branding charges.');
  }

  return { subtotal, deliveryFee, brandingFee, discount, total };
}

/**
 * Validates status transitions to prevent accidental invalid state skips.
 */
export function canTransitionStatus(
  current: CorporateRequestStatus,
  target: CorporateRequestStatus
): boolean {
  if (current === target) return true;

  const validNextStates: Record<CorporateRequestStatus, CorporateRequestStatus[]> = {
    submitted: ['under-review', 'quote-prepared', 'quote-sent', 'cancelled'],
    'under-review': ['quote-prepared', 'quote-sent', 'declined', 'cancelled'],
    'quote-prepared': ['quote-sent', 'under-review', 'cancelled'],
    'quote-sent': ['accepted', 'declined', 'under-review', 'quote-prepared', 'cancelled'],
    accepted: ['production', 'packaging', 'delivery', 'delivered', 'cancelled'],
    production: ['packaging', 'delivery', 'delivered', 'cancelled'],
    packaging: ['delivery', 'delivered', 'cancelled'],
    delivery: ['delivered', 'cancelled'],
    delivered: [], // terminal
    declined: ['under-review', 'quote-prepared'], // allows renegotiation
    cancelled: [], // terminal
  };

  const allowed = validNextStates[current] || [];
  return allowed.includes(target);
}
