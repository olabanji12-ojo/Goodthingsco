/**
 * Good Things Co. — Store Settings Domain & Validation Logic
 */

import type {
  StoreSettings,
  PublicStoreSettings,
  StoreSettingsUpdateInput,
  ShippingSettings,
} from '../../src/types/settings';
import type { DeliveryZone } from '../../src/config/shipping';

export class SettingsHttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'SettingsHttpError';
  }
}

export function sanitizeText(text?: unknown, maxLength = 500): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim();
  if (normalized.length === 0 || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
}

export function formatEstimatedDeliveryTime(minDays?: number, maxDays?: number, fallback = 'Flexible'): string {
  if (typeof minDays === 'number' && typeof maxDays === 'number' && minDays > 0 && maxDays >= minDays) {
    return minDays === maxDays
      ? `${minDays} Business Day${minDays > 1 ? 's' : ''}`
      : `${minDays} - ${maxDays} Business Days`;
  }
  return fallback;
}

export function toPublicSettings(settings: StoreSettings): PublicStoreSettings {
  return {
    business: {
      brandName: settings.business.brandName,
      supportEmail: settings.business.supportEmail,
      supportPhone: settings.business.supportPhone,
    },
    shipping: {
      lagos: {
        enabled: settings.shipping.lagos.enabled,
        fee: settings.shipping.lagos.fee,
        estimatedDeliveryTime: formatEstimatedDeliveryTime(
          settings.shipping.lagos.estimatedMinDays,
          settings.shipping.lagos.estimatedMaxDays,
          '1 - 2 Business Days'
        ),
        label: settings.shipping.lagos.label || 'Lagos Delivery',
        notice: settings.shipping.lagos.notice,
      },
      otherNigeria: {
        enabled: settings.shipping.otherNigeria.enabled,
        fee: settings.shipping.otherNigeria.fee,
        estimatedDeliveryTime: formatEstimatedDeliveryTime(
          settings.shipping.otherNigeria.estimatedMinDays,
          settings.shipping.otherNigeria.estimatedMaxDays,
          '3 - 5 Business Days'
        ),
        label: settings.shipping.otherNigeria.label || 'Other Nigerian States',
        notice: settings.shipping.otherNigeria.notice,
      },
      international: {
        enabled: settings.shipping.international.enabled,
        mode: settings.shipping.international.mode,
        fee: settings.shipping.international.mode === 'fixed' ? settings.shipping.international.fee : 0,
        requiresQuote: settings.shipping.international.mode === 'quote-required',
        estimatedDeliveryTime: formatEstimatedDeliveryTime(
          settings.shipping.international.estimatedMinDays,
          settings.shipping.international.estimatedMaxDays,
          '5 - 10 Business Days'
        ),
        label: 'International Delivery',
        notice: settings.shipping.international.notice,
      },
    },
  };
}

export function calculateEffectiveDeliveryFee(
  zone: DeliveryZone,
  shipping: ShippingSettings
): {
  fee: number;
  requiresQuote: boolean;
  enabled: boolean;
  name: string;
  estimatedDeliveryTime: string;
  notice?: string;
} {
  if (zone === 'lagos') {
    const config = shipping.lagos;
    return {
      fee: config.enabled ? Math.max(0, config.fee) : 0,
      requiresQuote: false,
      enabled: config.enabled,
      name: config.label || 'Lagos Delivery',
      estimatedDeliveryTime: formatEstimatedDeliveryTime(config.estimatedMinDays, config.estimatedMaxDays, '1 - 2 Business Days'),
      notice: config.notice,
    };
  }

  if (zone === 'other-nigeria') {
    const config = shipping.otherNigeria;
    return {
      fee: config.enabled ? Math.max(0, config.fee) : 0,
      requiresQuote: false,
      enabled: config.enabled,
      name: config.label || 'Other Nigerian States',
      estimatedDeliveryTime: formatEstimatedDeliveryTime(config.estimatedMinDays, config.estimatedMaxDays, '3 - 5 Business Days'),
      notice: config.notice,
    };
  }

  if (zone === 'international') {
    const config = shipping.international;
    const isFixed = config.mode === 'fixed';
    return {
      fee: config.enabled && isFixed ? Math.max(0, config.fee) : 0,
      requiresQuote: !isFixed,
      enabled: config.enabled,
      name: 'International Delivery',
      estimatedDeliveryTime: formatEstimatedDeliveryTime(config.estimatedMinDays, config.estimatedMaxDays, '5 - 10 Business Days'),
      notice: config.notice,
    };
  }

  // Fallback
  return {
    fee: 7500,
    requiresQuote: false,
    enabled: true,
    name: 'Standard Delivery',
    estimatedDeliveryTime: '3 - 5 Business Days',
  };
}

export function validateStoreSettingsUpdate(raw: any): StoreSettingsUpdateInput {
  if (!raw || typeof raw !== 'object') {
    throw new SettingsHttpError(400, 'Invalid settings update payload.');
  }

  const result: StoreSettingsUpdateInput = {};

  // 1. Business
  if (raw.business && typeof raw.business === 'object') {
    result.business = {};
    if (raw.business.brandName !== undefined) {
      const brand = sanitizeText(raw.business.brandName, 100);
      if (!brand) throw new SettingsHttpError(400, 'Brand name cannot be empty.');
      result.business.brandName = brand;
    }
    if (raw.business.supportEmail !== undefined) {
      const email = sanitizeText(raw.business.supportEmail, 254).toLowerCase();
      if (email && !validateEmail(email)) {
        throw new SettingsHttpError(400, 'Invalid customer support email address.');
      }
      result.business.supportEmail = email;
    }
    if (raw.business.supportPhone !== undefined) {
      result.business.supportPhone = sanitizeText(raw.business.supportPhone, 50);
    }
  }

  // 2. Shipping
  if (raw.shipping && typeof raw.shipping === 'object') {
    result.shipping = {};

    const validateZone = (zoneData: any, zoneName: string) => {
      const out: any = {};
      if (zoneData.enabled !== undefined) out.enabled = Boolean(zoneData.enabled);
      if (zoneData.fee !== undefined) {
        const fee = Number(zoneData.fee);
        if (!Number.isFinite(fee) || fee < 0 || fee > 10_000_000) {
          throw new SettingsHttpError(400, `${zoneName} delivery fee must be a positive number up to ₦10,000,000.`);
        }
        out.fee = Math.round(fee);
      }
      if (zoneData.estimatedMinDays !== undefined || zoneData.estimatedMaxDays !== undefined) {
        const min = zoneData.estimatedMinDays !== undefined ? Number(zoneData.estimatedMinDays) : undefined;
        const max = zoneData.estimatedMaxDays !== undefined ? Number(zoneData.estimatedMaxDays) : undefined;
        if (min !== undefined && (!Number.isInteger(min) || min < 1 || min > 90)) {
          throw new SettingsHttpError(400, `${zoneName} estimated minimum days must be between 1 and 90.`);
        }
        if (max !== undefined && (!Number.isInteger(max) || max < 1 || max > 90)) {
          throw new SettingsHttpError(400, `${zoneName} estimated maximum days must be between 1 and 90.`);
        }
        if (min !== undefined && max !== undefined && min > max) {
          throw new SettingsHttpError(400, `${zoneName} minimum days cannot exceed maximum days.`);
        }
        if (min !== undefined) out.estimatedMinDays = min;
        if (max !== undefined) out.estimatedMaxDays = max;
      }
      if (zoneData.label !== undefined) out.label = sanitizeText(zoneData.label, 100);
      if (zoneData.notice !== undefined) out.notice = sanitizeText(zoneData.notice, 500);
      return out;
    };

    if (raw.shipping.lagos && typeof raw.shipping.lagos === 'object') {
      result.shipping.lagos = validateZone(raw.shipping.lagos, 'Lagos');
    }
    if (raw.shipping.otherNigeria && typeof raw.shipping.otherNigeria === 'object') {
      result.shipping.otherNigeria = validateZone(raw.shipping.otherNigeria, 'Other Nigeria');
    }
    if (raw.shipping.international && typeof raw.shipping.international === 'object') {
      const intl = validateZone(raw.shipping.international, 'International');
      if (raw.shipping.international.mode !== undefined) {
        const mode = raw.shipping.international.mode;
        if (mode !== 'quote-required' && mode !== 'fixed') {
          throw new SettingsHttpError(400, 'International shipping mode must be "quote-required" or "fixed".');
        }
        intl.mode = mode;
      }
      result.shipping.international = intl;
    }
  }

  // 3. Abandoned Checkout
  if (raw.abandonedCheckout && typeof raw.abandonedCheckout === 'object') {
    result.abandonedCheckout = {};
    const ac = raw.abandonedCheckout;

    if (ac.abandonedAfterMinutes !== undefined) {
      const minutes = Number(ac.abandonedAfterMinutes);
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 10080) { // 5 mins to 7 days
        throw new SettingsHttpError(400, 'Abandoned inactivity threshold must be between 5 and 10,080 minutes.');
      }
      result.abandonedCheckout.abandonedAfterMinutes = minutes;
    }

    if (ac.reminderDelaysHours !== undefined) {
      if (!Array.isArray(ac.reminderDelaysHours)) {
        throw new SettingsHttpError(400, 'Reminder delays must be an array of hours (e.g. [1, 24]).');
      }
      if (ac.reminderDelaysHours.length > 5) {
        throw new SettingsHttpError(400, 'A maximum of 5 reminder delays is supported.');
      }
      const delays = ac.reminderDelaysHours
        .map((h: any) => Number(h))
        .filter((h: number) => Number.isFinite(h) && h > 0 && h <= 168); // up to 7 days
      if (delays.length === 0) {
        throw new SettingsHttpError(400, 'At least one valid positive reminder delay (in hours) is required.');
      }
      // Sort ascending and deduplicate
      const sorted: number[] = Array.from<number>(new Set(delays)).sort((a: number, b: number) => a - b);
      result.abandonedCheckout.reminderDelaysHours = sorted;
    }

    if (ac.maxReminders !== undefined) {
      const max = Number(ac.maxReminders);
      if (!Number.isInteger(max) || max < 1 || max > 5) {
        throw new SettingsHttpError(400, 'Maximum reminders must be between 1 and 5.');
      }
      result.abandonedCheckout.maxReminders = max;
    }

    if (ac.resumeExpiryDays !== undefined) {
      const days = Number(ac.resumeExpiryDays);
      if (!Number.isInteger(days) || days < 1 || days > 30) {
        throw new SettingsHttpError(400, 'Resume link expiry must be between 1 and 30 days.');
      }
      result.abandonedCheckout.resumeExpiryDays = days;
    }
  }

  // 4. Quote Defaults
  if (raw.quotes && typeof raw.quotes === 'object') {
    result.quotes = {};
    if (raw.quotes.corporateDefaultValidityDays !== undefined) {
      const days = Number(raw.quotes.corporateDefaultValidityDays);
      if (!Number.isInteger(days) || days < 1 || days > 90) {
        throw new SettingsHttpError(400, 'Corporate quote default validity must be between 1 and 90 days.');
      }
      result.quotes.corporateDefaultValidityDays = days;
    }
    if (raw.quotes.customDefaultValidityDays !== undefined) {
      const days = Number(raw.quotes.customDefaultValidityDays);
      if (!Number.isInteger(days) || days < 1 || days > 90) {
        throw new SettingsHttpError(400, 'Custom commission quote default validity must be between 1 and 90 days.');
      }
      result.quotes.customDefaultValidityDays = days;
    }
  }

  return result;
}

export function applySettingsUpdate(
  current: StoreSettings,
  update: StoreSettingsUpdateInput,
  updatedBy: string,
  now: string
): StoreSettings {
  return {
    business: {
      ...current.business,
      ...update.business,
    },
    shipping: {
      lagos: {
        ...current.shipping.lagos,
        ...update.shipping?.lagos,
      },
      otherNigeria: {
        ...current.shipping.otherNigeria,
        ...update.shipping?.otherNigeria,
      },
      international: {
        ...current.shipping.international,
        ...update.shipping?.international,
      },
    },
    abandonedCheckout: {
      ...current.abandonedCheckout,
      ...update.abandonedCheckout,
    },
    quotes: {
      ...current.quotes,
      ...update.quotes,
    },
    updatedAt: now,
    updatedBy,
  };
}
