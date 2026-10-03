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

export interface StoreSettings {
  business: BusinessSettings;
  shipping: ShippingSettings;
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
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  business: {
    brandName: 'Good Things Co.',
    supportEmail: 'concierge@goodthingsco.ng',
    supportPhone: '+234 800 GOOD THINGS',
  },
  shipping: {
    lagos: {
      enabled: true,
      fee: 3500,
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      label: 'Lagos Delivery',
      notice: 'Direct courier delivery across Lagos mainland and island',
    },
    otherNigeria: {
      enabled: true,
      fee: 7500,
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
  abandonedCheckout?: Partial<AbandonedCheckoutSettings>;
  quotes?: Partial<QuoteDefaultsSettings>;
};
