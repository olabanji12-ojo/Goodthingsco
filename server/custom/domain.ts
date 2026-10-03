/**
 * Good Things Co. — Custom Requests Domain Logic
 *
 * Implements reference number generation, data sanitization, schema validation,
 * asset verification, quote calculations, and status transition rules.
 */

import type {
  CustomCreationType,
  CustomRequestStatus,
  CustomRequestSubmissionInput,
  CustomQuoteUpdateInput,
  CustomRequestAsset,
  CustomAssetCategory,
} from '../../src/types/customRequest';

export class CustomHttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'CustomHttpError';
  }
}

/**
 * Generate human-readable reference number:
 * Format: GTC-CUSTOM-YYYYMMDD-XXXX (e.g. GTC-CUSTOM-20261003-AB12)
 */
export function generateCustomReferenceNumber(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GTC-CUSTOM-${yyyy}${mm}${dd}-${rand}`;
}

export function sanitizeText(text?: unknown, maxLength = 1000): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF]/g, '') // Strip non-printable / control chars
    .trim()
    .slice(0, maxLength);
}

export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim();
  if (normalized.length === 0 || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
}

export function validatePhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 16;
}

const VALID_CREATION_TYPES = new Set<CustomCreationType>([
  'custom-apparel',
  'custom-gift',
  'custom-packaging',
  'custom-product',
  'custom-merchandise',
]);

const VALID_ASSET_CATEGORIES = new Set<CustomAssetCategory>([
  'logo',
  'artwork',
  'reference',
  'brief',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]);

const DISALLOWED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.msi', '.vbs', '.js', '.ts',
  '.html', '.htm', '.php', '.py', '.rb', '.jar', '.com', '.scr',
];

export function validateCustomAsset(asset: any): CustomRequestAsset {
  if (!asset || typeof asset !== 'object') {
    throw new CustomHttpError(400, 'Invalid asset reference format.');
  }

  const type = asset.type as CustomAssetCategory;
  if (!VALID_ASSET_CATEGORIES.has(type)) {
    throw new CustomHttpError(400, `Invalid asset type: "${type}". Expected logo, artwork, reference, or brief.`);
  }

  const url = sanitizeText(asset.url, 2048);
  if (!url) {
    throw new CustomHttpError(400, 'Asset must include a valid URL.');
  }

  // Must be safe https:, http:, data: URL, or cloud storage reference
  if (!/^https?:\/\//i.test(url) && !url.startsWith('data:image/') && !url.startsWith('/uploads/')) {
    throw new CustomHttpError(400, 'Asset URL must use https, http, or safe image reference.');
  }

  const fileName = sanitizeText(asset.fileName || asset.name, 255);
  if (fileName) {
    const lower = fileName.toLowerCase();
    for (const ext of DISALLOWED_EXTENSIONS) {
      if (lower.endsWith(ext)) {
        throw new CustomHttpError(400, `Dangerous or unsupported file extension rejected: ${ext}`);
      }
    }
  }

  const mimeType = (asset.mimeType || '').toLowerCase().trim();
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new CustomHttpError(400, `Unsupported file MIME type: ${mimeType}. Allowed: PNG, JPEG, WebP, SVG, PDF.`);
  }

  const fileSize = typeof asset.fileSize === 'number' && Number.isFinite(asset.fileSize)
    ? Math.max(0, Math.floor(asset.fileSize))
    : undefined;

  // Max 25 MB
  if (fileSize && fileSize > 25 * 1024 * 1024) {
    throw new CustomHttpError(400, 'Asset file size exceeds maximum limit of 25MB.');
  }

  return {
    id: sanitizeText(asset.id, 64) || undefined,
    type,
    url,
    publicId: sanitizeText(asset.publicId, 255) || undefined,
    fileName: fileName || undefined,
    mimeType: mimeType || undefined,
    fileSize,
    uploadedAt: sanitizeText(asset.uploadedAt, 64) || new Date().toISOString(),
  };
}

/**
 * Validate customer submission input payload
 */
export function validateCustomSubmission(raw: any): CustomRequestSubmissionInput {
  if (!raw || typeof raw !== 'object') {
    throw new CustomHttpError(400, 'Missing or invalid request payload.');
  }

  // 1. Customer
  const customerRaw = raw.customer;
  if (!customerRaw || typeof customerRaw !== 'object') {
    throw new CustomHttpError(400, 'Customer details are required.');
  }

  const fullName = sanitizeText(customerRaw.fullName || customerRaw.name, 120);
  if (!fullName || fullName.length < 2) {
    throw new CustomHttpError(400, 'Customer full name must be at least 2 characters.');
  }

  const email = (customerRaw.email || '').toString().trim().toLowerCase();
  if (!validateEmail(email)) {
    throw new CustomHttpError(400, 'A valid customer contact email is required.');
  }

  const phone = (customerRaw.phone || '').toString().trim();
  if (!validatePhone(phone)) {
    throw new CustomHttpError(400, 'A valid customer phone number is required (at least 7 digits).');
  }

  const companyName = sanitizeText(customerRaw.companyName, 150) || undefined;

  // 2. Request Type
  const requestType = raw.requestType as CustomCreationType;
  if (!VALID_CREATION_TYPES.has(requestType)) {
    throw new CustomHttpError(400, `Invalid request type: "${requestType}". Supported types: custom-apparel, custom-gift, custom-packaging, custom-product, custom-merchandise.`);
  }

  // 3. Request Details
  const detailsRaw = raw.requestDetails || raw.details;
  if (!detailsRaw || typeof detailsRaw !== 'object') {
    throw new CustomHttpError(400, 'Request details (item, quantity) are required.');
  }

  const item = sanitizeText(detailsRaw.item || detailsRaw.productItem, 200);
  if (!item || item.length < 2) {
    throw new CustomHttpError(400, 'Requested item/concept must be specified (at least 2 characters).');
  }

  const quantity = Number(detailsRaw.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity) || quantity > 1_000_000) {
    throw new CustomHttpError(400, 'Quantity must be a positive whole number up to 1,000,000 units.');
  }

  const budgetRange = sanitizeText(detailsRaw.budgetRange, 100) || undefined;
  const budgetAmount = typeof detailsRaw.budgetAmount === 'number' && Number.isFinite(detailsRaw.budgetAmount) && detailsRaw.budgetAmount >= 0
    ? detailsRaw.budgetAmount
    : undefined;

  const purpose = sanitizeText(detailsRaw.purpose, 200) || undefined;
  const preferredDeliveryDate = sanitizeText(detailsRaw.preferredDeliveryDate || detailsRaw.deliveryDate, 64) || undefined;
  const description = sanitizeText(detailsRaw.description, 3000) || undefined;

  // 4. Specifications (optional)
  let specifications: CustomRequestSubmissionInput['specifications'] = undefined;
  if (raw.specifications && typeof raw.specifications === 'object') {
    specifications = {
      material: sanitizeText(raw.specifications.material, 500) || undefined,
      colour: sanitizeText(raw.specifications.colour, 200) || undefined,
      size: sanitizeText(raw.specifications.size, 200) || undefined,
      packaging: sanitizeText(raw.specifications.packaging, 300) || undefined,
      branding: sanitizeText(raw.specifications.branding, 300) || undefined,
      personalisation: sanitizeText(raw.specifications.personalisation, 500) || undefined,
      additionalNotes: sanitizeText(raw.specifications.additionalNotes || raw.specifications.specialNotes, 2000) || undefined,
    };
  }

  // 5. Assets (optional array, max 10)
  let assets: CustomRequestAsset[] | undefined = undefined;
  const rawAssets = Array.isArray(raw.assets) ? raw.assets : (Array.isArray(raw.uploadedFiles) ? raw.uploadedFiles : undefined);
  if (rawAssets) {
    if (rawAssets.length > 10) {
      throw new CustomHttpError(400, 'A maximum of 10 design reference files can be attached.');
    }
    assets = rawAssets.map((a: unknown) => validateCustomAsset(a));
  }

  const idempotencyKey = sanitizeText(raw.idempotencyKey, 128) || undefined;

  return {
    customer: {
      fullName,
      email,
      phone,
      companyName,
    },
    requestType,
    requestDetails: {
      item,
      quantity,
      budgetRange,
      budgetAmount,
      purpose,
      preferredDeliveryDate,
      description,
    },
    specifications,
    assets,
    idempotencyKey,
  };
}

/**
 * Server calculation for quotation totals.
 * total = subtotal + designFee + productionFee + packagingFee + deliveryFee - discount
 */
export function calculateCustomQuoteTotal(quote: CustomQuoteUpdateInput): number {
  const sanitizeFee = (val?: number) => {
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) return 0;
    return Math.round(val * 100) / 100;
  };

  const subtotal = sanitizeFee(quote.subtotal);
  const designFee = sanitizeFee(quote.designFee);
  const productionFee = sanitizeFee(quote.productionFee);
  const packagingFee = sanitizeFee(quote.packagingFee);
  const deliveryFee = sanitizeFee(quote.deliveryFee);
  const discount = sanitizeFee(quote.discount);

  const rawTotal = subtotal + designFee + productionFee + packagingFee + deliveryFee - discount;
  return Math.max(0, Math.round(rawTotal * 100) / 100);
}

/**
 * Allowed status transitions for Custom Requests
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<CustomRequestStatus, CustomRequestStatus[]> = {
  submitted: ['under-review', 'cancelled', 'declined'],
  'under-review': ['quote-prepared', 'cancelled', 'declined'],
  'quote-prepared': ['quote-sent', 'under-review', 'cancelled', 'declined'],
  'quote-sent': ['accepted', 'declined', 'cancelled', 'quote-prepared'],
  accepted: ['design', 'cancelled'],
  design: ['sample', 'awaiting-approval', 'cancelled'],
  sample: ['awaiting-approval', 'design', 'cancelled'],
  'awaiting-approval': ['production', 'design', 'sample', 'cancelled'],
  production: ['packaging', 'cancelled'],
  packaging: ['delivery', 'cancelled'],
  delivery: ['delivered'],
  delivered: [], // Terminal
  declined: ['under-review'], // Allow admin re-evaluation if requested
  cancelled: [], // Terminal
};

export function canTransitionCustomStatus(from: CustomRequestStatus, to: CustomRequestStatus): boolean {
  if (from === to) return true; // Idempotent same-status
  const allowed = ALLOWED_STATUS_TRANSITIONS[from];
  return Boolean(allowed && allowed.includes(to));
}

export const PRODUCTION_STAGES: CustomRequestStatus[] = [
  'design',
  'sample',
  'awaiting-approval',
  'production',
  'packaging',
  'delivery',
  'delivered',
];
