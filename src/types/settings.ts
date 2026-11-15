/**
 * Good Things Co. — Centralized Store Settings & Business Configuration Types
 */

export interface BusinessSettings {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
}

export interface ZoneDeliverySettings {
  enabled: boolean;
  fee: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  label?: string;
  notice?: string;
}

export interface InternationalDeliverySettings {
  enabled: boolean;
  mode: 'quote-required' | 'fixed';
  fee: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  notice?: string;
}

export interface ShippingSettings {
  lagos: ZoneDeliverySettings;
  otherNigeria: ZoneDeliverySettings;
  international: InternationalDeliverySettings;
}

export interface AbandonedCheckoutSettings {
  abandonedAfterMinutes: number;
  reminderDelaysHours: number[];
  maxReminders: number;
  resumeExpiryDays: number;
}

export interface QuoteDefaultsSettings {
  corporateDefaultValidityDays: number;
  customDefaultValidityDays: number;
}

export interface PackagingOptionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  badge?: string;
  enabled?: boolean;
}

export interface RibbonOptionItem {
  id: string;
  name: string;
  hex: string;
  enabled?: boolean;
}

export interface PackagingSettings {
  giftBoxFee: number;
  linenBagFee: number;
  woodenBoxFee: number;
  pouchFee: number;
  options?: PackagingOptionItem[];
  ribbons?: RibbonOptionItem[];
}

export interface StoreSettings {
  business: BusinessSettings;
  shipping: ShippingSettings;
  packaging?: PackagingSettings;
  abandonedCheckout: AbandonedCheckoutSettings;
  quotes: QuoteDefaultsSettings;
  updatedAt: string;
  updatedBy: string;
}

export interface PublicZoneDeliveryConfig {
  enabled: boolean;
  fee: number;
  estimatedDeliveryTime: string;
  label: string;
  notice?: string;
}

export interface PublicInternationalDeliveryConfig extends PublicZoneDeliveryConfig {
  mode: 'quote-required' | 'fixed';
  requiresQuote: boolean;
}

export interface PublicStoreSettings {
  business: BusinessSettings;
  shipping: {
    lagos: PublicZoneDeliveryConfig;
    otherNigeria: PublicZoneDeliveryConfig;
    international: PublicInternationalDeliveryConfig;
  };
  packaging?: PackagingSettings;
}

export const DEFAULT_PACKAGING_OPTIONS: PackagingOptionItem[] = [
  {
    id: 'gift-box',
    name: 'Signature Gift Box',
    description: 'Sturdy debossed ivory box with golden interior lining',
    price: 0,
    badge: 'Complimentary',
    enabled: true,
  },
  {
    id: 'gift-bag',
    name: 'Textured Linen Bag',
    description: 'Heavy natural cotton linen bag with hand-tied twill handles',
    price: 0,
    badge: 'Complimentary',
    enabled: true,
  },
  {
    id: 'wooden-box',
    name: 'Artisan Wooden Crate',
    description: 'Handcrafted solid cedar keepsake box with sliding lid',
    price: 0,
    enabled: true,
  },
  {
    id: 'pouch',
    name: 'Silk Keepsake Pouch',
    description: 'Soft drawstring satin pouch for jewelry & daily objects',
    price: 0,
    enabled: true,
  },
];

export const DEFAULT_RIBBON_OPTIONS: RibbonOptionItem[] = [
  { id: 'gold', name: 'Champagne Gold', hex: '#C89D5C', enabled: true },
  { id: 'ivory', name: 'Warm Ivory', hex: '#F5F0E8', enabled: true },
  { id: 'olive', name: 'Forest Olive', hex: '#3F4634', enabled: true },
  { id: 'navy', name: 'Midnight Navy', hex: '#1C2638', enabled: true },
  { id: 'terracotta', name: 'Earthy Terracotta', hex: '#A85741', enabled: true },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  business: {
    brandName: 'Good Things Co.',
    supportEmail: 'concierge@goodthingsco.ng',
    supportPhone: '+234 800 GOOD THINGS',
  },
  shipping: {
    lagos: {
      enabled: true,
      fee: 0,
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      label: 'Lagos Delivery',
      notice: 'Direct courier delivery across Lagos mainland and island',
    },
    otherNigeria: {
      enabled: true,
      fee: 0,
      estimatedMinDays: 3,
      estimatedMaxDays: 5,
      label: 'Other Nigerian States',
      notice: 'Interstate courier dispatch to all states across Nigeria',
    },
    international: {
      enabled: true,
      mode: 'quote-required',
      fee: 0,
      estimatedMinDays: 5,
      estimatedMaxDays: 10,
      notice: 'Worldwide courier dispatch via DHL/FedEx partner services (Quote confirmed before dispatch)',
    },
  },
  packaging: {
    giftBoxFee: 0,
    linenBagFee: 0,
    woodenBoxFee: 0,
    pouchFee: 0,
    options: DEFAULT_PACKAGING_OPTIONS,
    ribbons: DEFAULT_RIBBON_OPTIONS,
  },
  abandonedCheckout: {
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
    maxReminders: 2,
    resumeExpiryDays: 7,
  },
  quotes: {
    corporateDefaultValidityDays: 7,
    customDefaultValidityDays: 7,
  },
  updatedAt: '2026-10-01T00:00:00.000Z',
  updatedBy: 'system-default',
};

export type StoreSettingsUpdateInput = {
  business?: Partial<BusinessSettings>;
  shipping?: {
    lagos?: Partial<ZoneDeliverySettings>;
    otherNigeria?: Partial<ZoneDeliverySettings>;
    international?: Partial<InternationalDeliverySettings>;
  };
  packaging?: Partial<PackagingSettings>;
  abandonedCheckout?: Partial<AbandonedCheckoutSettings>;
  quotes?: Partial<QuoteDefaultsSettings>;
};
