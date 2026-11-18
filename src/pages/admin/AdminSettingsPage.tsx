/**
 * Good Things Co. — Admin Settings & Operational Configuration Page
 *
 * Dedicated admin management interface for:
 * 1. Business Contact Details
 * 2. Delivery Rates & Shipping Zones (Lagos, Other Nigeria, International)
 * 3. Abandoned Checkout Automation Timing & Delays
 * 4. Quote Validity Defaults (Corporate & Custom)
 * 5. Safe Persistence & Audit Logging
 */

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Truck,
  Building2,
  Package,
  Clock,
  FileCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Info,
  Globe,
  MapPin,
  Mail,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getAdminStoreSettings,
  updateAdminStoreSettings,
} from '../../services/settingsService';
import type { StoreSettings, StoreSettingsUpdateInput, PackagingOptionItem, RibbonOptionItem, ShippingAreaRate, CustomStateDeliveryConfig } from '../../types/settings';
import { DEFAULT_STORE_SETTINGS, DEFAULT_PACKAGING_OPTIONS, DEFAULT_RIBBON_OPTIONS, DEFAULT_LAGOS_SHIPPING_AREAS, DEFAULT_VEHICLE_SETTINGS } from '../../types/settings';
import { NIGERIAN_STATES } from '../../config/shipping';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [reminderDelaysInput, setReminderDelaysInput] = useState<string>('1, 24');
  const [selectedNewState, setSelectedNewState] = useState<string>('');
  const [newStateFee, setNewStateFee] = useState<number>(7000);

  // Load existing settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const settings = await getAdminStoreSettings();
      if (settings) {
        const packaging = settings.packaging || DEFAULT_STORE_SETTINGS.packaging || {
          giftBoxFee: 0,
          linenBagFee: 0,
          woodenBoxFee: 0,
          pouchFee: 0,
          options: DEFAULT_PACKAGING_OPTIONS,
        };
        const options = packaging.options && packaging.options.length > 0
          ? packaging.options
          : [
            {
              id: 'gift-box',
              name: 'Signature Gift Box',
              description: 'Sturdy debossed ivory box with golden interior lining',
              price: packaging.giftBoxFee ?? 0,
              badge: (packaging.giftBoxFee ?? 0) === 0 ? 'Complimentary' : undefined,
              enabled: true,
            },
            {
              id: 'gift-bag',
              name: 'Textured Linen Bag',
              description: 'Heavy natural cotton linen bag with hand-tied twill handles',
              price: packaging.linenBagFee ?? 0,
              badge: (packaging.linenBagFee ?? 0) === 0 ? 'Complimentary' : undefined,
              enabled: true,
            },
            {
              id: 'wooden-box',
              name: 'Artisan Wooden Crate',
              description: 'Handcrafted solid cedar keepsake box with sliding lid',
              price: packaging.woodenBoxFee ?? 0,
              badge: (packaging.woodenBoxFee ?? 0) === 0 ? 'Complimentary' : undefined,
              enabled: true,
            },
            {
              id: 'pouch',
              name: 'Silk Keepsake Pouch',
              description: 'Soft drawstring satin pouch for jewelry & daily objects',
              price: packaging.pouchFee ?? 0,
              badge: (packaging.pouchFee ?? 0) === 0 ? 'Complimentary' : undefined,
              enabled: true,
            },
          ];

        const ribbons = packaging.ribbons && packaging.ribbons.length > 0
          ? packaging.ribbons
          : DEFAULT_RIBBON_OPTIONS;

        const lagosAreas =
          settings.shipping.lagos?.areas && settings.shipping.lagos.areas.length > 0
            ? settings.shipping.lagos.areas
            : DEFAULT_LAGOS_SHIPPING_AREAS;
        const customStates = settings.shipping.customStates || [];

        setFormData({
          ...settings,
          shipping: {
            ...settings.shipping,
            lagos: {
              ...settings.shipping.lagos,
              areas: lagosAreas,
            },
            customStates,
            vehicles: settings.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS,
          },
          packaging: {
            giftBoxFee: packaging.giftBoxFee ?? 0,
            linenBagFee: packaging.linenBagFee ?? 0,
            woodenBoxFee: packaging.woodenBoxFee ?? 0,
            pouchFee: packaging.pouchFee ?? 0,
            options,
            ribbons,
          },
        });
        setReminderDelaysInput(settings.abandonedCheckout.reminderDelaysHours.join(', '));
      }
    } catch (err: any) {
      console.error('[AdminSettings] Error fetching settings:', err);
      setError(err?.message || 'Failed to connect to store settings service.');
    } finally {
      setLoading(false);
    }
  }

  // Lagos Areas Handlers
  const handleAddLagosArea = () => {
    const newArea: ShippingAreaRate = {
      id: `lagos-${Date.now()}`,
      name: '',
      description: '',
      fee: 2500,
      estimatedDeliveryTime: '24 - 48 Business Hours',
      enabled: true,
    };
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        lagos: {
          ...prev.shipping.lagos,
          areas: [...(prev.shipping.lagos.areas || DEFAULT_LAGOS_SHIPPING_AREAS), newArea],
        },
      },
    }));
  };

  const handleUpdateLagosArea = (id: string, updates: Partial<ShippingAreaRate>) => {
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        lagos: {
          ...prev.shipping.lagos,
          areas: (prev.shipping.lagos.areas || DEFAULT_LAGOS_SHIPPING_AREAS).map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        },
      },
    }));
  };

  const handleRemoveLagosArea = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        lagos: {
          ...prev.shipping.lagos,
          areas: (prev.shipping.lagos.areas || DEFAULT_LAGOS_SHIPPING_AREAS).filter((a) => a.id !== id),
        },
      },
    }));
  };

  const handleResetLagosAreas = () => {
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        lagos: {
          ...prev.shipping.lagos,
          areas: DEFAULT_LAGOS_SHIPPING_AREAS,
        },
      },
    }));
  };

  // Custom States Handlers
  const handleAddCustomState = () => {
    if (!selectedNewState) return;
    const existing = (formData.shipping.customStates || []).find(
      (cs) => cs.stateName.toLowerCase() === selectedNewState.toLowerCase()
    );
    if (existing) {
      setError(`State "${selectedNewState}" has already been added.`);
      return;
    }
    const stateObj: CustomStateDeliveryConfig = {
      id: `state-${Date.now()}`,
      stateName: selectedNewState,
      defaultFee: Math.max(0, newStateFee || 0),
      estimatedDeliveryTime: '3 - 5 Business Days',
      enabled: true,
      areas: [],
    };
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        customStates: [...(prev.shipping.customStates || []), stateObj],
      },
    }));
    setSelectedNewState('');
  };

  const handleUpdateCustomState = (id: string, updates: Partial<CustomStateDeliveryConfig>) => {
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        customStates: (prev.shipping.customStates || []).map((cs) =>
          cs.id === id ? { ...cs, ...updates } : cs
        ),
      },
    }));
  };

  const handleRemoveCustomState = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        customStates: (prev.shipping.customStates || []).filter((cs) => cs.id !== id),
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse reminder delays
      const parsedDelays = reminderDelaysInput
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);

      if (parsedDelays.length === 0) {
        setError('Abandoned checkout reminder delays must contain at least one positive hour interval (e.g. "1, 24").');
        setSaving(false);
        return;
      }

      // Sort delays
      const sortedDelays = [...new Set(parsedDelays)].sort((a, b) => a - b);

      // Validation
      if (formData.shipping.lagos.fee < 0 || formData.shipping.otherNigeria.fee < 0) {
        setError('Delivery fees cannot be negative.');
        setSaving(false);
        return;
      }

      if (
        (formData.shipping.lagos.estimatedMinDays || 0) >
        (formData.shipping.lagos.estimatedMaxDays || 0)
      ) {
        setError('Lagos minimum estimated delivery days cannot exceed maximum days.');
        setSaving(false);
        return;
      }

      if (
        (formData.shipping.otherNigeria.estimatedMinDays || 0) >
        (formData.shipping.otherNigeria.estimatedMaxDays || 0)
      ) {
        setError('Other Nigeria minimum estimated delivery days cannot exceed maximum days.');
        setSaving(false);
        return;
      }

      const payload: StoreSettingsUpdateInput = {
        business: {
          brandName: formData.business.brandName?.trim() || 'Good Things Co.',
          supportEmail: formData.business.supportEmail?.trim() || undefined,
          supportPhone: formData.business.supportPhone?.trim() || undefined,
        },
        shipping: {
          lagos: {
            enabled: Boolean(formData.shipping.lagos.enabled),
            fee: Number(formData.shipping.lagos.fee),
            estimatedMinDays: Number(formData.shipping.lagos.estimatedMinDays) || 1,
            estimatedMaxDays: Number(formData.shipping.lagos.estimatedMaxDays) || 2,
            label: formData.shipping.lagos.label?.trim() || 'Lagos Delivery',
            areas: (formData.shipping.lagos.areas || DEFAULT_LAGOS_SHIPPING_AREAS).map((a) => ({
              id: a.id,
              name: a.name.trim(),
              description: (a.description || '').trim(),
              fee: Math.max(0, Number(a.fee) || 0),
              estimatedDeliveryTime: (a.estimatedDeliveryTime || '24 - 48 Business Hours').trim(),
              enabled: a.enabled !== false,
            })),
          },
          otherNigeria: {
            enabled: Boolean(formData.shipping.otherNigeria.enabled),
            fee: Number(formData.shipping.otherNigeria.fee),
            estimatedMinDays: Number(formData.shipping.otherNigeria.estimatedMinDays) || 3,
            estimatedMaxDays: Number(formData.shipping.otherNigeria.estimatedMaxDays) || 5,
            label: formData.shipping.otherNigeria.label?.trim() || 'Other Nigerian States',
          },
          customStates: (formData.shipping.customStates || []).map((cs) => ({
            id: cs.id,
            stateName: cs.stateName.trim(),
            enabled: cs.enabled !== false,
            defaultFee: Math.max(0, Number(cs.defaultFee) || 0),
            estimatedDeliveryTime: (cs.estimatedDeliveryTime || '3 - 5 Business Days').trim(),
            areas: Array.isArray(cs.areas)
              ? cs.areas.map((a) => ({
                id: a.id,
                name: a.name.trim(),
                description: (a.description || '').trim(),
                fee: Math.max(0, Number(a.fee) || 0),
                estimatedDeliveryTime: (a.estimatedDeliveryTime || '3 - 5 Business Days').trim(),
                enabled: a.enabled !== false,
              }))
              : [],
          })),
          vehicles: {
            carSurcharge: Math.max(0, Number(formData.shipping.vehicles?.carSurcharge) || 3000),
            vanSurcharge: Math.max(0, Number(formData.shipping.vehicles?.vanSurcharge) || 8000),
            airFreightRate: Math.max(0, Number(formData.shipping.vehicles?.airFreightRate) || 15000),
            lagosDeliveryEstimate: (formData.shipping.vehicles?.lagosDeliveryEstimate || '2 – 5 Working Days').trim(),
            outsideLagosDeliveryEstimate: (formData.shipping.vehicles?.outsideLagosDeliveryEstimate || '5 – 14 Working Days').trim(),
            airFreightDeliveryEstimate: (formData.shipping.vehicles?.airFreightDeliveryEstimate || '2 – 4 Working Days').trim(),
          },
          international: {
            enabled: Boolean(formData.shipping.international.enabled),
            mode: formData.shipping.international.mode === 'fixed' ? 'fixed' : 'quote-required',
            fee:
              formData.shipping.international.mode === 'fixed'
                ? Number(formData.shipping.international.fee) || 0
                : 0,
            estimatedMinDays: Number(formData.shipping.international.estimatedMinDays) || 5,
            estimatedMaxDays: Number(formData.shipping.international.estimatedMaxDays) || 10,
            notice: formData.shipping.international.notice?.trim() || undefined,
          },
        },
        packaging: {
          giftBoxFee: Math.max(0, Number(formData.packaging?.giftBoxFee) || 0),
          linenBagFee: Math.max(0, Number(formData.packaging?.linenBagFee) || 0),
          woodenBoxFee: Math.max(0, Number(formData.packaging?.woodenBoxFee) || 0),
          pouchFee: Math.max(0, Number(formData.packaging?.pouchFee) || 0),
          options: (formData.packaging?.options || []).map((opt) => ({
            id: opt.id,
            name: opt.name.trim(),
            description: (opt.description || '').trim(),
            price: Math.max(0, Number(opt.price) || 0),
            badge: opt.badge?.trim() || undefined,
            enabled: opt.enabled !== false,
          })),
          ribbons: (formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS).map((r) => ({
            id: r.id,
            name: r.name.trim(),
            hex: r.hex.trim() || '#C89D5C',
            enabled: r.enabled !== false,
          })),
        },
        abandonedCheckout: {
          abandonedAfterMinutes: Math.max(5, Number(formData.abandonedCheckout.abandonedAfterMinutes) || 60),
          reminderDelaysHours: sortedDelays,
          maxReminders: Math.max(1, Math.min(5, Number(formData.abandonedCheckout.maxReminders) || 2)),
          resumeExpiryDays: Math.max(1, Math.min(30, Number(formData.abandonedCheckout.resumeExpiryDays) || 7)),
        },
        quotes: {
          corporateDefaultValidityDays: Math.max(1, Math.min(90, Number(formData.quotes.corporateDefaultValidityDays) || 7)),
          customDefaultValidityDays: Math.max(1, Math.min(90, Number(formData.quotes.customDefaultValidityDays) || 7)),
        },
      };

      const saved = await updateAdminStoreSettings(payload);
      if (saved) {
        const packaging = saved.packaging || DEFAULT_STORE_SETTINGS.packaging;
        const options = packaging?.options && packaging.options.length > 0
          ? packaging.options
          : (payload.packaging?.options || DEFAULT_PACKAGING_OPTIONS);
        const ribbons = packaging?.ribbons && packaging.ribbons.length > 0
          ? packaging.ribbons
          : (payload.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS);

        setFormData({
          ...saved,
          packaging: {
            giftBoxFee: packaging?.giftBoxFee ?? 0,
            linenBagFee: packaging?.linenBagFee ?? 0,
            woodenBoxFee: packaging?.woodenBoxFee ?? 0,
            pouchFee: packaging?.pouchFee ?? 0,
            options,
            ribbons,
          },
        });
        setReminderDelaysInput(saved.abandonedCheckout.reminderDelaysHours.join(', '));
        setSuccess('Store settings and delivery rates saved successfully.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('[AdminSettings] Update failed:', err);
      setError(err?.message || 'Server error while updating settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 size={36} className="animate-spin text-[#c5a880] mb-3" />
        <p className="font-sans text-sm">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-[#c5a880]/20 text-[#96774c] flex items-center justify-center font-bold">
              <Settings size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 font-semibold tracking-tight">
              Store Settings & Delivery
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Configure live shipping rates, brand contact information, abandoned checkout timing, and quote defaults.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw size={14} />
            Discard / Refresh
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-[#c5a880] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#c5a880]" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 font-medium">{success}</div>
        </div>
      )}

      {/* Audit Banner */}
      <div className="mb-8 p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[#96774c]" />
          <span>
            Authoritative source: <strong>Firestore (settings/store)</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {formData.updatedAt && (
            <span>
              Last modified: <strong>{new Date(formData.updatedAt).toLocaleString()}</strong>
            </span>
          )}
          {formData.updatedBy && (
            <span>
              By: <strong>{formData.updatedBy}</strong>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* ── Section 1: Business Details ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Business & Support Contact</h2>
              <p className="text-xs text-slate-500">Public customer-facing contact details displayed in checkout and automated emails.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.business.brandName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, brandName: e.target.value },
                  })
                }
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                placeholder="Good Things Co."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Support Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={formData.business.supportEmail || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, supportEmail: e.target.value },
                    })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  placeholder="hello@goodthingsco.ng"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Support Phone / WhatsApp
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={formData.business.supportPhone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business: { ...formData.business, supportPhone: e.target.value },
                    })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Delivery & Shipping Rates ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Truck size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Shipping & Delivery Rates</h2>
                <p className="text-xs text-slate-500">Live delivery pricing and dispatch estimates used by guest checkout and order verification.</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Lagos Zone */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <MapPin size={18} className="text-[#96774c]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Lagos State Delivery</h3>
                    <p className="text-xs text-slate-500">Covers all delivery destinations within Lagos state.</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.shipping.lagos.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          lagos: { ...formData.shipping.lagos, enabled: e.target.checked },
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Zone Enabled
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shipping.lagos.fee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          lagos: { ...formData.shipping.lagos, fee: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Min Estimate (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.shipping.lagos.estimatedMinDays || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          lagos: { ...formData.shipping.lagos, estimatedMinDays: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Max Estimate (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.shipping.lagos.estimatedMaxDays || 2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          lagos: { ...formData.shipping.lagos, estimatedMaxDays: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer Label
                  </label>
                  <input
                    type="text"
                    value={formData.shipping.lagos.label || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          lagos: { ...formData.shipping.lagos, label: e.target.value },
                        },
                      })
                    }
                    placeholder="Lagos Delivery"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* ── Lagos Delivery Areas & Pricing Manager ── */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Lagos Delivery Areas & Pricing</span>
                      <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {(formData.shipping.lagos.areas || DEFAULT_LAGOS_SHIPPING_AREAS).length} Areas Configured
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customers in Lagos select their specific area during checkout to determine their exact courier fee.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetLagosAreas}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      title="Reset back to the 9 client reference areas"
                    >
                      <RotateCcw size={12} />
                      <span>Reset to 9 Reference Areas</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLagosArea}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-[#c5a880] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Area</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(formData.shipping.lagos.areas || DEFAULT_LAGOS_SHIPPING_AREAS).map((area, idx) => (
                    <div
                      key={area.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-8">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Area Name / Locations Covered
                              </label>
                              <input
                                type="text"
                                value={area.name}
                                onChange={(e) => handleUpdateLagosArea(area.id, { name: e.target.value })}
                                placeholder="e.g. Ikoyi, Obalende, Sura"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-slate-900"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Delivery Fee (₦)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={area.fee}
                                onChange={(e) => handleUpdateLagosArea(area.id, { fee: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Customer Delivery Note / Transit Timing (Optional)
                            </label>
                            <input
                              type="text"
                              value={area.description || ''}
                              onChange={(e) => handleUpdateLagosArea(area.id, { description: e.target.value })}
                              placeholder="e.g. YOU'LL BE REQUIRED TO RECEIVE AT ESTATE GATE IF BIKES AREN'T ALLOWED 24-48HRS"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={area.enabled !== false}
                              onChange={(e) => handleUpdateLagosArea(area.id, { enabled: e.target.checked })}
                              className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-900"
                            />
                            <span>Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveLagosArea(area.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete this area"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Other Nigeria Zone */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <MapPin size={18} className="text-[#96774c]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Other Nigerian States</h3>
                    <p className="text-xs text-slate-500">Covers nationwide courier dispatches outside Lagos (Abuja, Port Harcourt, Ibadan, etc.).</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.shipping.otherNigeria.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          otherNigeria: { ...formData.shipping.otherNigeria, enabled: e.target.checked },
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Zone Enabled
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shipping.otherNigeria.fee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          otherNigeria: { ...formData.shipping.otherNigeria, fee: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Min Estimate (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.shipping.otherNigeria.estimatedMinDays || 3}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          otherNigeria: { ...formData.shipping.otherNigeria, estimatedMinDays: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Max Estimate (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.shipping.otherNigeria.estimatedMaxDays || 5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          otherNigeria: { ...formData.shipping.otherNigeria, estimatedMaxDays: Number(e.target.value) },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer Label
                  </label>
                  <input
                    type="text"
                    value={formData.shipping.otherNigeria.label || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          otherNigeria: { ...formData.shipping.otherNigeria, label: e.target.value },
                        },
                      })
                    }
                    placeholder="Other Nigerian States"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* ── Custom Serviceable States Manager ── */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Specific Serviceable States (Outside Lagos)</span>
                      <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {(formData.shipping.customStates || []).length} Custom States Added
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add only the specific states outside Lagos you ship to. If empty, the general interstate rate above applies.
                    </p>
                  </div>
                </div>

                {/* Add State Form */}
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-white/70 mb-4 flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Select Nigerian State to Add
                    </label>
                    <select
                      value={selectedNewState}
                      onChange={(e) => setSelectedNewState(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-slate-900 bg-white"
                    >
                      <option value="">Choose a State (e.g. Abuja, Rivers, Oyo)...</option>
                      {NIGERIAN_STATES.filter(
                        (st) =>
                          st.name.toLowerCase() !== 'lagos' &&
                          !(formData.shipping.customStates || []).some(
                            (cs) => cs.stateName.toLowerCase() === st.name.toLowerCase()
                          )
                      ).map((st) => (
                        <option key={st.code} value={st.name}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-44">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Delivery Fee (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={newStateFee}
                      onChange={(e) => setNewStateFee(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomState}
                    disabled={!selectedNewState}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-[#c5a880] disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add State</span>
                  </button>
                </div>

                {/* State list */}
                {formData.shipping.customStates && formData.shipping.customStates.length > 0 && (
                  <div className="space-y-2.5">
                    {formData.shipping.customStates.map((cs) => (
                      <div
                        key={cs.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-6 font-semibold text-xs text-slate-900">
                            {cs.stateName}
                          </div>
                          <div className="sm:col-span-3 flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Fee:</span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={cs.defaultFee}
                              onChange={(e) =>
                                handleUpdateCustomState(cs.id, {
                                  defaultFee: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-24 px-2 py-1 rounded border border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div className="sm:col-span-3 text-[11px] text-slate-500">
                            {cs.estimatedDeliveryTime || '3 - 5 Business Days'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={cs.enabled !== false}
                              onChange={(e) => handleUpdateCustomState(cs.id, { enabled: e.target.checked })}
                              className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-900"
                            />
                            <span>Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomState(cs.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove state"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section: Logistics Methods & Vehicle Surcharges ── */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <Truck size={18} className="text-[#96774c]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Logistics Mediums & Vehicle Tiers</h3>
                    <p className="text-xs text-slate-500">
                      Configure vehicle upgrade rates (Bike, Car, Van, Air Freight) and official dispatch timelines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    🚗 Car Delivery Upgrade (₦)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Added to base area rate for trunks & delicate hampers
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shipping.vehicles?.carSurcharge ?? 3000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          vehicles: {
                            ...(formData.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS),
                            carSurcharge: Math.max(0, Number(e.target.value) || 0),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    🚐 Van Delivery Upgrade (₦)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Added to base area rate for oversized crates & bulk
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shipping.vehicles?.vanSurcharge ?? 8000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          vehicles: {
                            ...(formData.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS),
                            vanSurcharge: Math.max(0, Number(e.target.value) || 0),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ✈️ Air Freight Express Rate (₦)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Express interstate flight dispatch outside Lagos
                  </p>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shipping.vehicles?.airFreightRate ?? 15000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          vehicles: {
                            ...(formData.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS),
                            airFreightRate: Math.max(0, Number(e.target.value) || 0),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Transit Windows */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lagos Working Days Window
                  </label>
                  <input
                    type="text"
                    value={formData.shipping.vehicles?.lagosDeliveryEstimate || '2 – 5 Working Days'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          vehicles: {
                            ...(formData.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS),
                            lagosDeliveryEstimate: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="2 – 5 Working Days"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Outside Lagos Working Days Window
                  </label>
                  <input
                    type="text"
                    value={formData.shipping.vehicles?.outsideLagosDeliveryEstimate || '5 – 14 Working Days'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          vehicles: {
                            ...(formData.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS),
                            outsideLagosDeliveryEstimate: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="5 – 14 Working Days"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Air Freight Working Days Window
                  </label>
                  <input
                    type="text"
                    value={formData.shipping.vehicles?.airFreightDeliveryEstimate || '2 – 4 Working Days'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          vehicles: {
                            ...(formData.shipping.vehicles || DEFAULT_VEHICLE_SETTINGS),
                            airFreightDeliveryEstimate: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="2 – 4 Working Days"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* International Zone */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <Globe size={18} className="text-[#96774c]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">International Shipping</h3>
                    <p className="text-xs text-slate-500">Covers international orders to UK, US, Canada, Europe, and UAE.</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.shipping.international.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          international: { ...formData.shipping.international, enabled: e.target.checked },
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Zone Enabled
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mode selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pricing Mode
                    </label>
                    <select
                      value={formData.shipping.international.mode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping: {
                            ...formData.shipping,
                            international: {
                              ...formData.shipping.international,
                              mode: e.target.value as 'quote-required' | 'fixed',
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 bg-white"
                    >
                      <option value="quote-required">Quote Required (Contact customer)</option>
                      <option value="fixed">Fixed Rate (Charge flat fee at checkout)</option>
                    </select>
                  </div>

                  {formData.shipping.international.mode === 'fixed' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Fixed International Fee (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={formData.shipping.international.fee || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shipping: {
                              ...formData.shipping,
                              international: {
                                ...formData.shipping.international,
                                fee: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Estimated Range (Days)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.shipping.international.estimatedMinDays || 5}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shipping: {
                              ...formData.shipping,
                              international: {
                                ...formData.shipping.international,
                                estimatedMinDays: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 text-center"
                        placeholder="Min"
                      />
                      <span className="text-slate-400">–</span>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.shipping.international.estimatedMaxDays || 10}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shipping: {
                              ...formData.shipping,
                              international: {
                                ...formData.shipping.international,
                                estimatedMaxDays: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 text-center"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer Notice
                  </label>
                  <input
                    type="text"
                    value={formData.shipping.international.notice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping: {
                          ...formData.shipping,
                          international: {
                            ...formData.shipping.international,
                            notice: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="International delivery rates vary by destination weight and customs..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Presentation Packaging Pricing & Upgrades ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Presentation Packaging & Custom Add-ons</h2>
                <p className="text-xs text-slate-500">
                  Manage packaging choices (boxes, wooden crates, leather boxes, bags, pouches) and set add-on fees in ₦. Set fee to 0 for Complimentary/Included.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const currentOptions = formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS;
                const newOpt: PackagingOptionItem = {
                  id: `pkg-${Date.now()}`,
                  name: 'New Packaging Option',
                  description: 'Description of this packaging or box presentation.',
                  price: 0,
                  enabled: true,
                };
                setFormData({
                  ...formData,
                  packaging: {
                    ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                    options: [...currentOptions, newOpt],
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Packaging Option
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS).map((opt, idx) => {
                const isComplimentary = opt.price === 0;
                return (
                  <div
                    key={opt.id || idx}
                    className={`p-4 rounded-xl border transition-all ${opt.enabled !== false ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200/50 bg-slate-100/40 opacity-70'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => {
                            const updated = [...(formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS)];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setFormData({
                              ...formData,
                              packaging: {
                                ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                options: updated,
                              },
                            });
                          }}
                          placeholder="Packaging Name"
                          className="font-semibold text-sm text-slate-900 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white bg-transparent w-full"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={opt.enabled !== false}
                            onChange={(e) => {
                              const updated = [...(formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS)];
                              updated[idx] = { ...updated[idx], enabled: e.target.checked };
                              setFormData({
                                ...formData,
                                packaging: {
                                  ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                  options: updated,
                                },
                              });
                            }}
                            className="w-3.5 h-3.5 rounded text-slate-900"
                          />
                          <span className="text-[11px] font-medium">Active</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS).filter((_, i) => i !== idx);
                            setFormData({
                              ...formData,
                              packaging: {
                                ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                options: updated,
                              },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Delete packaging option"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Description (Customer Note)
                        </label>
                        <input
                          type="text"
                          value={opt.description || ''}
                          onChange={(e) => {
                            const updated = [...(formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS)];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setFormData({
                              ...formData,
                              packaging: {
                                ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                options: updated,
                              },
                            });
                          }}
                          placeholder="e.g. Handcrafted cedar keepsake box with sliding lid"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Upgrade Fee (₦)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={opt.price}
                              onChange={(e) => {
                                const newPrice = Math.max(0, Number(e.target.value) || 0);
                                const updated = [...(formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS)];
                                updated[idx] = {
                                  ...updated[idx],
                                  price: newPrice,
                                  badge: newPrice === 0 ? 'Complimentary' : updated[idx].badge === 'Complimentary' ? undefined : updated[idx].badge,
                                };
                                const legacyFees: any = {};
                                if (updated[idx].id === 'gift-box') legacyFees.giftBoxFee = newPrice;
                                if (updated[idx].id === 'gift-bag') legacyFees.linenBagFee = newPrice;
                                if (updated[idx].id === 'wooden-box') legacyFees.woodenBoxFee = newPrice;
                                if (updated[idx].id === 'pouch') legacyFees.pouchFee = newPrice;

                                setFormData({
                                  ...formData,
                                  packaging: {
                                    ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                    ...legacyFees,
                                    options: updated,
                                  },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 bg-white"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {isComplimentary ? 'Shows as "Included"' : `Shows as "+₦${opt.price.toLocaleString()}"`}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Badge (Optional)
                          </label>
                          <input
                            type="text"
                            value={opt.badge || ''}
                            onChange={(e) => {
                              const updated = [...(formData.packaging?.options || DEFAULT_PACKAGING_OPTIONS)];
                              updated[idx] = { ...updated[idx], badge: e.target.value || undefined };
                              setFormData({
                                ...formData,
                                packaging: {
                                  ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                  options: updated,
                                },
                              });
                            }}
                            placeholder="e.g. Complimentary, Holiday Pick"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Ribbon Finishes Management ── */}
            <div className="pt-6 mt-8 border-t border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Satin Ribbon Finish Colours</h3>
                  <p className="text-xs text-slate-500">
                    Customise the satin ribbon colours customers can choose from during gift personalisation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentRibbons = formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS;
                    const newRibbon: RibbonOptionItem = {
                      id: `ribbon-${Date.now()}`,
                      name: 'New Ribbon Colour',
                      hex: '#C89D5C',
                      enabled: true,
                    };
                    setFormData({
                      ...formData,
                      packaging: {
                        ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                        ribbons: [...currentRibbons, newRibbon],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Ribbon Colour
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS).map((r, rIdx) => (
                  <div
                    key={r.id || rIdx}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 justify-between"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <input
                          type="color"
                          value={r.hex || '#C89D5C'}
                          onChange={(e) => {
                            const updated = [...(formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS)];
                            updated[rIdx] = { ...updated[rIdx], hex: e.target.value };
                            setFormData({
                              ...formData,
                              packaging: {
                                ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                ribbons: updated,
                              },
                            });
                          }}
                          className="w-7 h-7 rounded-full border border-slate-300 p-0 cursor-pointer overflow-hidden"
                          title="Pick ribbon colour"
                        />
                      </div>
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => {
                          const updated = [...(formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS)];
                          updated[rIdx] = { ...updated[rIdx], name: e.target.value };
                          setFormData({
                            ...formData,
                            packaging: {
                              ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                              ribbons: updated,
                            },
                          });
                        }}
                        placeholder="Ribbon Name"
                        className="font-medium text-xs text-slate-900 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white bg-transparent w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={r.enabled !== false}
                          onChange={(e) => {
                            const updated = [...(formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS)];
                            updated[rIdx] = { ...updated[rIdx], enabled: e.target.checked };
                            setFormData({
                              ...formData,
                              packaging: {
                                ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                                ribbons: updated,
                              },
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-slate-900"
                        />
                        <span>Active</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.packaging?.ribbons || DEFAULT_RIBBON_OPTIONS).filter((_, i) => i !== rIdx);
                          setFormData({
                            ...formData,
                            packaging: {
                              ...(formData.packaging || { giftBoxFee: 0, linenBagFee: 0, woodenBoxFee: 0, pouchFee: 0 }),
                              ribbons: updated,
                            },
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Delete ribbon colour"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Abandoned Checkout Automation ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Abandoned Checkout Recovery Settings</h2>
              <p className="text-xs text-slate-500">Automation timing parameters governing session inactivity, reminder email cadence, and token validity.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Inactivity Threshold (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={formData.abandonedCheckout.abandonedAfterMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abandonedCheckout: {
                      ...formData.abandonedCheckout,
                      abandonedAfterMinutes: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Minutes without customer activity before session is marked abandoned (Default: 60).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Reminder Delays (Hours)
              </label>
              <input
                type="text"
                value={reminderDelaysInput}
                onChange={(e) => setReminderDelaysInput(e.target.value)}
                placeholder="1, 24"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Comma-separated hours (e.g. 1st email after 1h, 2nd email 24h later).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Max Reminders per Session
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.abandonedCheckout.maxReminders}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abandonedCheckout: {
                      ...formData.abandonedCheckout,
                      maxReminders: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Caps total automated emails sent to avoid spamming customers (Max 5).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Recovery Link Expiry (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.abandonedCheckout.resumeExpiryDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abandonedCheckout: {
                      ...formData.abandonedCheckout,
                      resumeExpiryDays: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Days before secure resume checkout link expires (Default: 7).
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Quote Defaults ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Quote Validity Defaults</h2>
              <p className="text-xs text-slate-500">Default expiration duration applied when preparing corporate and bespoke custom quotes.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Gifting Default Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.quotes.corporateDefaultValidityDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quotes: {
                      ...formData.quotes,
                      corporateDefaultValidityDays: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 bg-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                Applied to new corporate gifting inquiries when an admin drafts an official quote (Default: 7 days).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Custom / Create Default Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.quotes.customDefaultValidityDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quotes: {
                      ...formData.quotes,
                      customDefaultValidityDays: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 bg-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                Applied to bespoke custom / create requests when an official quote is prepared (Default: 7 days).
              </p>
            </div>
          </div>
        </section>

        {/* Security & Secrets Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-700" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-950">Security & Credentials Segregation Notice</span>
            <p className="text-amber-900/80 leading-relaxed">
              Sensitive deployment keys (email provider credentials, payment gateway keys, Firebase service accounts)
              remain strictly isolated in secure server environment variables. This settings dashboard manages operational business configuration only.
            </p>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-[#c5a880] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#c5a880]" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Store Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
