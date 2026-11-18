/**
 * Good Things Co. — Centralized Store Settings & Business Configuration Types
 */

export interface BusinessSettings {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
}

export interface ShippingAreaRate {
  id: string;
  name: string;
  description?: string;
  fee: number;
  estimatedDeliveryTime?: string;
  enabled?: boolean;
}

export interface CustomStateDeliveryConfig {
  id: string;
  stateName: string;
  enabled: boolean;
  defaultFee: number;
  estimatedDeliveryTime?: string;
  areas?: ShippingAreaRate[];
}

export interface ZoneDeliverySettings {
  enabled: boolean;
  fee: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  label?: string;
  notice?: string;
  areas?: ShippingAreaRate[];
}

export interface InternationalDeliverySettings {
  enabled: boolean;
  mode: 'quote-required' | 'fixed';
  fee: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  notice?: string;
}

export interface VehiclePricingSettings {
  carSurcharge: number;
  vanSurcharge: number;
  airFreightRate: number;
  lagosDeliveryEstimate: string;
  outsideLagosDeliveryEstimate: string;
  airFreightDeliveryEstimate: string;
}

export const DEFAULT_VEHICLE_SETTINGS: VehiclePricingSettings = {
  carSurcharge: 3000,
  vanSurcharge: 8000,
  airFreightRate: 15000,
  lagosDeliveryEstimate: '2 – 5 Working Days',
  outsideLagosDeliveryEstimate: '5 – 14 Working Days',
  airFreightDeliveryEstimate: '2 – 4 Working Days',
};

export interface ShippingSettings {
  lagos: ZoneDeliverySettings;
  otherNigeria: ZoneDeliverySettings;
  customStates?: CustomStateDeliveryConfig[];
  vehicles?: VehiclePricingSettings;
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
  areas?: ShippingAreaRate[];
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
    customStates?: CustomStateDeliveryConfig[];
    vehicles?: VehiclePricingSettings;
    international: PublicInternationalDeliveryConfig;
  };
  packaging?: PackagingSettings;
}

export const DEFAULT_LAGOS_SHIPPING_AREAS: ShippingAreaRate[] = [
  {
    id: 'lagos-ikoyi-obalende-sura',
    name: 'Ikoyi, Obalende, Sura',
    description: "YOU'LL BE REQUIRED TO RECEIVE AT ESTATE GATE IF BIKES AREN'T ALLOWED 24-48HRS",
    fee: 2000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-vi-island-lekki1',
    name: 'VI, Lagos Island, Lekki 1 EST; Isale-eko',
    description: "YOU'LL BE REQUIRED TO RECEIVE AT EST GATE IF BIKES AREN'T ALLOWED 24-48HRS",
    fee: 2500,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-marwa-ikate-osapa',
    name: 'Marwa to Ikate, Osapa, ologolo, Igbo efon',
    description: "YOU'LL RECEIVE AT GATE IF BIKES AREN'T ALLOWED 24-48HRS",
    fee: 3000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-iddo-apapa-surulere',
    name: 'IDDO, APAPA, EBUTE-META, SURULERE, YABA, IWAYA, ALAGBOMEJI, OBANIKORO, ILUPEJU',
    description: '24-48hrs dispatch window',
    fee: 3500,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-chevron-ikeja-magodo',
    name: 'CHEVRON, IKEJA, MAGODO 2, SHAGINSHA, OSHODI, IKOSI, MUSHIN, ILASA',
    description: '24-48HRS dispatch window',
    fee: 4000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-gbagada-ketu-maryland',
    name: 'GBAGADA, KETU, OGUDU, ANTHONY, MARYLAND',
    description: '24-48hrs dispatch window',
    fee: 4000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-abraham-adesanya-vgc',
    name: 'Abraham Adesanya, VGC',
    description: "YOU'LL BE REQUIRED TO RECEIVE AT EST GATE IF BIKES AREN'T ALLOWED 24-48HRS",
    fee: 5000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-dopemu-iyana-ipaja-festac',
    name: 'DOPEMU, IYANA-IPAJA, ILE-EPO, OMOLE 1, ISHERI, BERGER, OJODU, MAGODO 1, ISOLO, FESTAC, ALAKIJA, IKOTUN, LASU, EJIGBO',
    description: '24-48HRS dispatch window',
    fee: 6000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
  {
    id: 'lagos-iju-agege-ikorodu',
    name: 'IJU, AGEGE, OGBA, OMOLE 2, FAGBA, OKO-OBA, ISHERI-PIPELINE, OKOTA, IDIMU, IKORODU BEFORE THE GARAGE',
    description: '24-48HRS dispatch window',
    fee: 6000,
    estimatedDeliveryTime: '24 - 48 Business Hours',
    enabled: true,
  },
];

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
  {
    id: 'festive-box',
    name: 'Festive Christmas Keepsake Box',
    description: 'Holiday crimson & gold embossed keepsake box with seasonal botanical lining',
    price: 0,
    badge: 'Holiday Edition',
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
      fee: 2000,
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      label: 'Lagos Delivery',
      notice: 'Direct courier delivery across Lagos mainland and island',
      areas: DEFAULT_LAGOS_SHIPPING_AREAS,
    },
    otherNigeria: {
      enabled: true,
      fee: 7000,
      estimatedMinDays: 3,
      estimatedMaxDays: 5,
      label: 'Other Nigerian States',
      notice: 'Interstate courier dispatch to all states across Nigeria',
    },
    customStates: [],
    vehicles: DEFAULT_VEHICLE_SETTINGS,
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
    customStates?: CustomStateDeliveryConfig[];
    vehicles?: Partial<VehiclePricingSettings>;
    international?: Partial<InternationalDeliverySettings>;
  };
  packaging?: Partial<PackagingSettings>;
  abandonedCheckout?: Partial<AbandonedCheckoutSettings>;
  quotes?: Partial<QuoteDefaultsSettings>;
};
