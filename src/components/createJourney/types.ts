export type CreationType =
  | 'custom-apparel'
  | 'custom-gift'
  | 'custom-packaging'
  | 'custom-product'
  | 'custom-merchandise';

export interface CreationTypeOption {
  id: CreationType;
  title: string;
  tagline: string;
  description: string;
  examples: string;
  icon: string;
}

export interface UploadedFileState {
  id: string;
  category: 'logo' | 'artwork' | 'reference' | 'brief';
  name: string;
  size: string;
  previewUrl: string | null;
  uploadedAt: string;
}

export interface CustomOrderRequest {
  // Step 1
  creationType: CreationType;

  // Step 2
  productItem: string;
  quantity: number;
  budgetRange: string;
  purpose: string;
  deliveryDate: string;

  // Step 3
  uploadedFiles: UploadedFileState[];

  // Step 4
  material: string;
  colour: string;
  size: string;
  packaging: string;
  branding: string;
  personalisation: string;
  specialNotes: string;

  // Contact for quote
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;

  // Step 6 & 7
  quoteReference: string;
  quoteAmount: number;
  quoteStatus: 'requested' | 'ready' | 'approved' | 'paid';

  // Step 8 & 9
  productionStage: 'design' | 'sample' | 'approval' | 'production' | 'packaging';
  deliveryStatus: 'preparing' | 'dispatched' | 'delivered';
}
