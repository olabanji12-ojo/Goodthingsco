/**
 * Good Things Co. — Delivery & Shipping Configuration
 *
 * Configurable delivery fee structure, zones, and geographical taxonomy.
 * Supports:
 * - Lagos Delivery
 * - Other Nigerian States Delivery
 * - International Delivery (quote-required architecture)
 *
 * Designed for future migration to Firestore / Admin Settings.
 */

export type DeliveryZone = 'lagos' | 'other-nigeria' | 'international';

export interface DeliveryZoneConfig {
  id: DeliveryZone;
  name: string;
  description: string;
  baseFee: number;
  requiresQuote: boolean;
  estimatedDeliveryTime: string;
}

/**
 * Default configurable delivery fee matrix (in Nigerian Naira ₦)
 * These values can be updated or overridden by admin settings in the future.
 */
export const DELIVERY_ZONES: Record<DeliveryZone, DeliveryZoneConfig> = {
  lagos: {
    id: 'lagos',
    name: 'Lagos Delivery',
    description: 'Direct courier delivery across Lagos mainland and island',
    baseFee: 3500,
    requiresQuote: false,
    estimatedDeliveryTime: '1 - 2 Business Days',
  },
  'other-nigeria': {
    id: 'other-nigeria',
    name: 'Other Nigerian States',
    description: 'Interstate courier dispatch to all states across Nigeria',
    baseFee: 7000,
    requiresQuote: false,
    estimatedDeliveryTime: '3 - 5 Business Days',
  },
  international: {
    id: 'international',
    name: 'International Delivery',
    description: 'Worldwide courier dispatch via DHL/FedEx partner services',
    baseFee: 0,
    requiresQuote: true,
    estimatedDeliveryTime: 'Quote confirmed before dispatch',
  },
};

/**
 * All 36 Nigerian States + Federal Capital Territory (FCT Abuja)
 */
export const NIGERIAN_STATES: { code: string; name: string }[] = [
  { code: 'AB', name: 'Abia' },
  { code: 'AD', name: 'Adamawa' },
  { code: 'AK', name: 'Akwa Ibom' },
  { code: 'AN', name: 'Anambra' },
  { code: 'BA', name: 'Bauchi' },
  { code: 'BY', name: 'Bayelsa' },
  { code: 'BE', name: 'Benue' },
  { code: 'BO', name: 'Borno' },
  { code: 'CR', name: 'Cross River' },
  { code: 'DE', name: 'Delta' },
  { code: 'EB', name: 'Ebonyi' },
  { code: 'ED', name: 'Edo' },
  { code: 'EK', name: 'Ekiti' },
  { code: 'EN', name: 'Enugu' },
  { code: 'FC', name: 'Federal Capital Territory (Abuja)' },
  { code: 'GO', name: 'Gombe' },
  { code: 'IM', name: 'Imo' },
  { code: 'JI', name: 'Jigawa' },
  { code: 'KD', name: 'Kaduna' },
  { code: 'KN', name: 'Kano' },
  { code: 'KT', name: 'Katsina' },
  { code: 'KE', name: 'Kebbi' },
  { code: 'KO', name: 'Kogi' },
  { code: 'KW', name: 'Kwara' },
  { code: 'LA', name: 'Lagos' },
  { code: 'NA', name: 'Nasarawa' },
  { code: 'NI', name: 'Niger' },
  { code: 'OG', name: 'Ogun' },
  { code: 'ON', name: 'Ondo' },
  { code: 'OS', name: 'Osun' },
  { code: 'OY', name: 'Oyo' },
  { code: 'PL', name: 'Plateau' },
  { code: 'RI', name: 'Rivers' },
  { code: 'SO', name: 'Sokoto' },
  { code: 'TA', name: 'Taraba' },
  { code: 'YO', name: 'Yobe' },
  { code: 'ZA', name: 'Zamfara' },
];

/**
 * Supported Countries
 */
export const SUPPORTED_COUNTRIES: { code: string; name: string }[] = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'KE', name: 'Kenya' },
];

/**
 * Resolves the appropriate DeliveryZone based on country and state selection.
 */
export function resolveDeliveryZone(country: string, state?: string): DeliveryZone {
  const normCountry = (country || 'nigeria').trim().toLowerCase();
  const isNigeria = normCountry === 'nigeria' || normCountry === 'ng';

  if (!isNigeria) {
    return 'international';
  }

  const normState = (state || '').trim().toLowerCase();
  if (!normState || normState === 'lagos' || normState === 'la') {
    return 'lagos';
  }

  return 'other-nigeria';
}

export interface DeliveryCalculationResult {
  fee: number;
  requiresQuote: boolean;
  enabled: boolean;
  name: string;
  estimatedDeliveryTime: string;
  notice?: string;
}

export interface DeliveryCalculationOptions {
  areaId?: string;
  stateName?: string;
}

/**
 * Computes the delivery fee and metadata for the given zone.
 * Respects live admin settings and area-specific rates if provided;
 * otherwise falls back to static defaults.
 */
export function getDeliveryFeeCalculation(
  zone: DeliveryZone,
  liveShipping?: any,
  options?: DeliveryCalculationOptions
): DeliveryCalculationResult {
  if (liveShipping) {
    if (zone === 'lagos' && liveShipping.lagos) {
      const z = liveShipping.lagos;
      const estimate =
        z.estimatedMinDays && z.estimatedMaxDays
          ? `${z.estimatedMinDays}–${z.estimatedMaxDays} business days`
          : z.estimatedDeliveryTime || '1 - 2 Business Days';

      const areas = Array.isArray(z.areas) ? z.areas : [];
      if (options?.areaId) {
        const selectedArea = areas.find((a: any) => a.id === options.areaId && a.enabled !== false);
        if (selectedArea) {
          return {
            fee: Math.max(0, selectedArea.fee),
            requiresQuote: false,
            enabled: z.enabled !== false,
            name: selectedArea.name,
            estimatedDeliveryTime: selectedArea.estimatedDeliveryTime || estimate,
            notice: selectedArea.description || z.notice,
          };
        }
      }

      // If no specific area was provided or matched, pick the first active area if available
      const firstArea = areas.find((a: any) => a.enabled !== false);
      const effectiveFee = firstArea ? firstArea.fee : Math.max(0, z.fee ?? 0);
      const effectiveName = firstArea ? firstArea.name : (z.label || 'Lagos Delivery');

      return {
        fee: z.enabled !== false ? effectiveFee : 0,
        requiresQuote: false,
        enabled: z.enabled !== false,
        name: effectiveName,
        estimatedDeliveryTime: firstArea?.estimatedDeliveryTime || estimate,
        notice: firstArea?.description || z.notice,
      };
    }

    if (zone === 'other-nigeria') {
      const customStates = Array.isArray(liveShipping.customStates) ? liveShipping.customStates : [];
      const matchedState = options?.stateName
        ? customStates.find(
            (cs: any) =>
              cs.enabled !== false &&
              cs.stateName?.trim().toLowerCase() === options.stateName?.trim().toLowerCase()
          )
        : null;

      if (matchedState) {
        const stateAreas = Array.isArray(matchedState.areas) ? matchedState.areas : [];
        if (options?.areaId) {
          const selectedArea = stateAreas.find((a: any) => a.id === options.areaId && a.enabled !== false);
          if (selectedArea) {
            return {
              fee: Math.max(0, selectedArea.fee),
              requiresQuote: false,
              enabled: true,
              name: `${matchedState.stateName} — ${selectedArea.name}`,
              estimatedDeliveryTime: selectedArea.estimatedDeliveryTime || matchedState.estimatedDeliveryTime || '3 - 5 Business Days',
              notice: selectedArea.description,
            };
          }
        }

        const firstStateArea = stateAreas.find((a: any) => a.enabled !== false);
        const stateFee = firstStateArea ? firstStateArea.fee : Math.max(0, matchedState.defaultFee ?? 0);
        return {
          fee: stateFee,
          requiresQuote: false,
          enabled: true,
          name: firstStateArea ? `${matchedState.stateName} — ${firstStateArea.name}` : `${matchedState.stateName} Delivery`,
          estimatedDeliveryTime: matchedState.estimatedDeliveryTime || '3 - 5 Business Days',
        };
      }

      const z = liveShipping.otherNigeria;
      if (z) {
        const estimate =
          z.estimatedMinDays && z.estimatedMaxDays
            ? `${z.estimatedMinDays}–${z.estimatedMaxDays} business days`
            : z.estimatedDeliveryTime || '3 - 5 Business Days';
        return {
          fee: z.enabled ? Math.max(0, z.fee) : 0,
          requiresQuote: false,
          enabled: z.enabled !== false,
          name: z.label || 'Other Nigerian States',
          estimatedDeliveryTime: estimate,
          notice: z.notice,
        };
      }
    }

    if (zone === 'international' && liveShipping.international) {
      const z = liveShipping.international;
      const isFixed = z.mode === 'fixed';
      const estimate =
        z.estimatedMinDays && z.estimatedMaxDays
          ? `${z.estimatedMinDays}–${z.estimatedMaxDays} business days`
          : z.estimatedDeliveryTime || '5 - 10 Business Days';
      return {
        fee: z.enabled && isFixed ? Math.max(0, z.fee) : 0,
        requiresQuote: !isFixed,
        enabled: z.enabled !== false,
        name: z.label || 'International Delivery',
        estimatedDeliveryTime: estimate,
        notice: z.notice,
      };
    }
  }

  const config = DELIVERY_ZONES[zone] || DELIVERY_ZONES['other-nigeria'];
  return {
    fee: config.baseFee,
    requiresQuote: config.requiresQuote,
    enabled: true,
    name: config.name,
    estimatedDeliveryTime: config.estimatedDeliveryTime,
  };
}
