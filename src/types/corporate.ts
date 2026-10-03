/**
 * Good Things Co. — Corporate Gifting Type Definitions
 *
 * Models corporate inquiries, multi-recipient consignments, custom branding,
 * pro-forma quotation lifecycle, and fulfillment statuses.
 */

export type CorporateGiftingPurpose =
  | 'employee'
  | 'client'
  | 'executive'
  | 'event-conference'
  | 'new-employee'
  | 'appreciation'
  | 'custom';

export type CorporateGiftType =
  | 'choose-gift'
  | 'build-your-own'
  | 'branded-merchandise';

export type CorporateBudgetRange =
  | 'under-25000'
  | '25000-50000'
  | '50000-100000'
  | '100000-plus';

export type CorporateIndustry =
  | 'finance'
  | 'technology'
  | 'healthcare'
  | 'legal'
  | 'consulting'
  | 'education'
  | 'real-estate-building'
  | 'hospitality'
  | 'government'
  | 'agriculture'
  | 'media-creative'
  | 'other';

export type CorporateRequestStatus =
  | 'submitted'
  | 'under-review'
  | 'quote-prepared'
  | 'quote-sent'
  | 'accepted'
  | 'declined'
  | 'production'
  | 'packaging'
  | 'delivery'
  | 'delivered'
  | 'cancelled';

export type CorporateQuoteStatus =
  | 'not-prepared'
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface UploadedAssetReference {
  url: string;
  publicId?: string;
  originalFilename?: string;
  format?: string;
  bytes?: number;
  uploadedAt?: string;
}

export interface CorporateSelectedProduct {
  productId: string;
  name: string;
  imageUrl?: string;
  unitPriceSnapshot?: number;
  quantity?: number;
  description?: string;
}

export interface CorporateRecipient {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CorporateCustomisation {
  companyMessage?: string;
  packaging?: string;
  ribbonColour?: string;
  personalisationNotes?: string;
  brandingRequired?: boolean;
  logoAsset?: UploadedAssetReference;
}

export interface CorporateQuote {
  status: CorporateQuoteStatus;
  subtotal?: number;
  deliveryFee?: number;
  brandingFee?: number;
  discount?: number;
  total?: number;
  notes?: string;
  validUntil?: string;
  preparedAt?: string;
  sentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
}

export interface CorporateStatusHistoryEntry {
  eventId: string;
  status: CorporateRequestStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface CorporateCompanyDetails {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface CorporateDeliveryDetails {
  preferredDeliveryDate?: string;
  deliveryNotes?: string;
  deliveryMethod?: 'single-hub' | 'direct-recipient';
}

export interface CorporateRequest {
  id?: string;
  referenceNumber: string;

  company: CorporateCompanyDetails;
  giftingPurpose: CorporateGiftingPurpose;
  industry?: CorporateIndustry | string;
  otherIndustry?: string;
  giftType: CorporateGiftType;
  budgetRange: CorporateBudgetRange;

  selectedProducts?: CorporateSelectedProduct[];
  quantity: number;

  customisation?: CorporateCustomisation;
  recipients?: CorporateRecipient[];
  recipientListFile?: UploadedAssetReference;

  delivery?: CorporateDeliveryDetails;

  quote: CorporateQuote;
  requestStatus: CorporateRequestStatus;
  statusHistory: CorporateStatusHistoryEntry[];

  adminNotes?: string;
  idempotencyKey?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CorporateRequestSubmissionInput {
  idempotencyKey?: string;
  company: CorporateCompanyDetails;
  giftingPurpose: CorporateGiftingPurpose | string;
  industry?: CorporateIndustry | string;
  otherIndustry?: string;
  giftType: CorporateGiftType | string;
  budgetRange: CorporateBudgetRange | string;
  selectedProducts?: CorporateSelectedProduct[];
  quantity: number;
  customisation?: CorporateCustomisation;
  recipients?: CorporateRecipient[];
  recipientListFile?: UploadedAssetReference;
  delivery?: CorporateDeliveryDetails;
  notes?: string;
}

export interface CorporateQuoteUpdateInput {
  subtotal: number;
  deliveryFee?: number;
  brandingFee?: number;
  discount?: number;
  notes?: string;
  validUntil?: string;
  action: 'draft' | 'send';
}

export interface CorporateStatusUpdateInput {
  status: CorporateRequestStatus;
  note?: string;
}
