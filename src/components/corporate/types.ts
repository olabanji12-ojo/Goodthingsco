/**
 * Types for Corporate Gifting Flow — Good Things Co.
 *
 * 5 Streamlined Stages:
 * Stage 1: Build Your Order (Purpose, Gift Type, Budget, Gift Selection, Quantity)
 * Stage 2: Customise (Company Logo, Packaging, Ribbon, Company Message, Personalisation)
 * Stage 3: Add Recipients (Individual entry & Bulk CSV/Excel upload)
 * Stage 4: Review & Approve (Review summary, Pay Now vs Request Quote)
 * Stage 5: Order Confirmation & Live Status Tracking (Production -> Packaging -> Delivery -> Delivered)
 */

export type CorporatePurpose =
  | 'employee'
  | 'client'
  | 'executive'
  | 'event'
  | 'new-employee'
  | 'appreciation'
  | 'custom';

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

export type CorporateGiftType = 'choose-gift' | 'build-own' | 'branded-merch';

export type CorporateBudgetTier = 'under-25k' | '25k-50k' | '50k-100k' | 'premium';

export interface CorporateGiftProduct {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  formattedPrice: string;
  image: string;
  alt: string;
  purposes: CorporatePurpose[];
  giftTypes: CorporateGiftType[];
  budgetTier: CorporateBudgetTier;
  description: string;
  includedItems: string[];
  minQuantity: number;
  badge?: string;
}

export interface CorporateRecipient {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface CorporateCustomisation {
  logoFileName: string | null;
  logoPreviewUrl: string | null;
  packagingId: string;
  packagingName: string;
  packagingCost: number;
  ribbonColorId: string;
  ribbonColorName: string;
  companyMessage: string;
  hasIndividualMonogram: boolean;
  monogramCostPerUnit: number;
}

export interface CorporateOrderState {
  // Stage 1
  purpose: CorporatePurpose;
  giftType: CorporateGiftType;
  budgetTier: CorporateBudgetTier;
  selectedProduct: CorporateGiftProduct;
  quantity: number;

  // Stage 2
  customisation: CorporateCustomisation;

  // Stage 3
  recipients: CorporateRecipient[];
  deliveryMethod: 'single-hub' | 'direct-recipient';

  // Stage 4
  actionType: 'pay' | 'quote' | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;

  // Stage 5
  orderId: string | null;
  orderStatus: 'production' | 'packaging' | 'delivery' | 'delivered';
}
