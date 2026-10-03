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
} from 'lucide-react';
import {
  getAdminStoreSettings,
  updateAdminStoreSettings,
} from '../../services/settingsService';
import type { StoreSettings, StoreSettingsUpdateInput } from '../../types/settings';
import { DEFAULT_STORE_SETTINGS } from '../../types/settings';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [reminderDelaysInput, setReminderDelaysInput] = useState<string>('1, 24');

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
        setFormData(settings);
        setReminderDelaysInput(settings.abandonedCheckout.reminderDelaysHours.join(', '));
      }
    } catch (err: any) {
      console.error('[AdminSettings] Error fetching settings:', err);
      setError(err?.message || 'Failed to connect to store settings service.');
    } finally {
      setLoading(false);
    }
  }

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
          },
          otherNigeria: {
            enabled: Boolean(formData.shipping.otherNigeria.enabled),
            fee: Number(formData.shipping.otherNigeria.fee),
            estimatedMinDays: Number(formData.shipping.otherNigeria.estimatedMinDays) || 3,
            estimatedMaxDays: Number(formData.shipping.otherNigeria.estimatedMaxDays) || 5,
            label: formData.shipping.otherNigeria.label?.trim() || 'Other Nigerian States',
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
        setFormData(saved);
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

        {/* ── Section 3: Abandoned Checkout Automation ── */}
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
