/**
 * Good Things Co. — Custom / Create Requests Type Definitions
 *
 * Models bespoke commissions, custom product development, asset references,
 * pro-forma quotation lifecycle, and production-stage tracking.
 */

export type CustomCreationType =
  | 'custom-apparel'
  | 'custom-gift'
  | 'custom-packaging'
  | 'custom-product'
  | 'custom-merchandise';

export type CustomRequestStatus =
  | 'submitted'
  | 'under-review'
  | 'quote-prepared'
  | 'quote-sent'
  | 'accepted'
  | 'design'
  | 'sample'
  | 'awaiting-approval'
  | 'production'
  | 'packaging'
  | 'delivery'
  | 'delivered'
  | 'declined'
  | 'cancelled';

export type CustomQuoteStatus =
  | 'not-prepared'
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired';

export type CustomAssetCategory = 'logo' | 'artwork' | 'reference' | 'brief';

export interface CustomRequestAsset {
  id?: string;
  type: CustomAssetCategory;
  url: string;
  publicId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface CustomRequestCustomer {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface CustomRequestDetails {
  item: string;
  quantity: number;
  budgetRange?: string;
  budgetAmount?: number;
  purpose?: string;
  preferredDeliveryDate?: string;
  description?: string;
}

export interface CustomSpecifications {
  material?: string;
  colour?: string;
  size?: string;
  packaging?: string;
  branding?: string;
  personalisation?: string;
  additionalNotes?: string;
}

export interface CustomQuote {
  status: CustomQuoteStatus;
  subtotal?: number;
  designFee?: number;
  productionFee?: number;
  packagingFee?: number;
  deliveryFee?: number;
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

export interface CustomStatusHistoryEntry {
  status: CustomRequestStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
  changeId?: string;
}

export interface CustomRequest {
  id: string;
  referenceNumber: string;
  customer: CustomRequestCustomer;
  requestType: CustomCreationType;
  requestDetails: CustomRequestDetails;
  specifications?: CustomSpecifications;
  assets?: CustomRequestAsset[];
  quote: CustomQuote;
  requestStatus: CustomRequestStatus;
  adminNotes?: string;
  statusHistory: CustomStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  idempotencyKey?: string;
}

export interface CustomRequestSubmissionInput {
  customer: CustomRequestCustomer;
  requestType: CustomCreationType;
  requestDetails: CustomRequestDetails;
  specifications?: CustomSpecifications;
  assets?: CustomRequestAsset[];
  idempotencyKey?: string;
}

export interface CustomQuoteUpdateInput {
  subtotal?: number;
  designFee?: number;
  productionFee?: number;
  packagingFee?: number;
  deliveryFee?: number;
  discount?: number;
  notes?: string;
  validUntil?: string;
}

export interface CustomStatusUpdateInput {
  status: CustomRequestStatus;
  note?: string;
  changeId?: string;
}
