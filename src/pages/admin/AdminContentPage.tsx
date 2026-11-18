/**
 * Good Things Co. — Website Content CMS Admin Page
 *
 * Dedicated admin interface to customize public headings, narratives,
 * announcement banners, and concierge details across customer storefront pages.
 */

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import defaultGiftBoxImg from '../../assets/gift-hero.png';
import { uploadImage } from '../../services/cloudinaryService';
import { CorporateProductsManager } from '../../components/admin/CorporateProductsManager';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  fetchAdminPageContent,
  updateAdminPageContent,
  DEFAULT_PAGE_CONTENTS,
} from '../../services/contentService';
import type {
  ContentPageId,
  HomePageContent,
  GatewaysPageContent,
  ShopPageContent,
  CorporatePageContent,
  CreatePageContent,
  AboutPageContent,
  FooterContent,
} from '../../types/content';
import { CONTENT_PAGES } from '../../types/content';

export default function AdminContentPage() {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ContentPageId>('home');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Form states per tab
  const [homeData, setHomeData] = useState<HomePageContent>(DEFAULT_PAGE_CONTENTS.home);
  const [gatewaysData, setGatewaysData] = useState<GatewaysPageContent>(DEFAULT_PAGE_CONTENTS.gateways);
  const [shopData, setShopData] = useState<ShopPageContent>(DEFAULT_PAGE_CONTENTS.shop);
  const [corporateData, setCorporateData] = useState<CorporatePageContent>(DEFAULT_PAGE_CONTENTS.corporate);
  const [createData, setCreateData] = useState<CreatePageContent>(DEFAULT_PAGE_CONTENTS.create);
  const [aboutData, setAboutData] = useState<AboutPageContent>(DEFAULT_PAGE_CONTENTS.about);
  const [footerData, setFooterData] = useState<FooterContent>(DEFAULT_PAGE_CONTENTS.footer);

  // Hero Image Upload State
  const [uploadingHeroImg, setUploadingHeroImg] = useState<boolean>(false);
  const [heroImgError, setHeroImgError] = useState<string | null>(null);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeroImg(true);
    setHeroImgError(null);
    try {
      const uploaded = await uploadImage(file, 'goodthingsco/hero');
      if (uploaded?.url) {
        setHomeData((prev) => ({
          ...prev,
          heroImageUrl: uploaded.url,
        }));
      }
    } catch (err: any) {
      setHeroImgError(err?.message || 'Failed to upload image. Please verify your file or connection.');
    } finally {
      setUploadingHeroImg(false);
      e.target.value = '';
    }
  };

  // Load content whenever activeTab changes
  useEffect(() => {
    loadPageContent(activeTab);
  }, [activeTab]);

  async function loadPageContent(pageId: ContentPageId) {
    setLoading(true);
    setError(null);
    try {
      const token = user ? await user.getIdToken() : '';
      const result = await fetchAdminPageContent(pageId, token);
      if (result && result.content) {
        setLastUpdated(result.updatedAt || null);
        switch (pageId) {
          case 'home':
            setHomeData(result.content as HomePageContent);
            break;
          case 'gateways':
            setGatewaysData(result.content as GatewaysPageContent);
            break;
          case 'shop':
            setShopData(result.content as ShopPageContent);
            break;
          case 'corporate':
            setCorporateData(result.content as CorporatePageContent);
            break;
          case 'create':
            setCreateData(result.content as CreatePageContent);
            break;
          case 'about':
            setAboutData(result.content as AboutPageContent);
            break;
          case 'footer':
            setFooterData(result.content as FooterContent);
            break;
        }
      }
    } catch (err: any) {
      console.warn(`[AdminContent] Error loading ${pageId}:`, err);
      // Fallback to defaults already set
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
      const token = user ? await user.getIdToken() : '';
      let payload: any;
      switch (activeTab) {
        case 'home':
          payload = homeData;
          break;
        case 'gateways':
          payload = gatewaysData;
          break;
        case 'shop':
          payload = shopData;
          break;
        case 'corporate':
          payload = corporateData;
          break;
        case 'create':
          payload = createData;
          break;
        case 'about':
          payload = aboutData;
          break;
        case 'footer':
          payload = footerData;
          break;
      }

      const res = await updateAdminPageContent(activeTab, payload, token);
      setSuccess(`"${CONTENT_PAGES.find((p) => p.id === activeTab)?.label}" published successfully.`);
      setLastUpdated(res.updatedAt);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('[AdminContent] Save error:', err);
      setError(err?.message || 'Failed to publish changes. Check your network or privileges.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm(`Revert "${CONTENT_PAGES.find((p) => p.id === activeTab)?.label}" fields to factory atelier defaults?`)) {
      switch (activeTab) {
        case 'home':
          setHomeData(DEFAULT_PAGE_CONTENTS.home);
          break;
        case 'gateways':
          setGatewaysData(DEFAULT_PAGE_CONTENTS.gateways);
          break;
        case 'shop':
          setShopData(DEFAULT_PAGE_CONTENTS.shop);
          break;
        case 'corporate':
          setCorporateData(DEFAULT_PAGE_CONTENTS.corporate);
          break;
        case 'create':
          setCreateData(DEFAULT_PAGE_CONTENTS.create);
          break;
        case 'about':
          setAboutData(DEFAULT_PAGE_CONTENTS.about);
          break;
        case 'footer':
          setFooterData(DEFAULT_PAGE_CONTENTS.footer);
          break;
      }
    }
  };

  const getPreviewUrl = (pageId: ContentPageId): string => {
    switch (pageId) {
      case 'home':
        return '/';
      case 'gateways':
        return '/';
      case 'shop':
        return '/shop';
      case 'corporate':
        return '/corporate';
      case 'create':
        return '/create';
      case 'about':
        return '/about';
      case 'footer':
        return '/';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-dark/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gold-500/10 text-gold-700">
              <FileText size={18} />
            </span>
            <span className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-gold-700">
              Atelier CMS
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal">
            Website Content & Copy
          </h1>
          <p className="font-sans text-xs sm:text-sm text-brand-medium mt-1">
            Directly customize public titles, hero statements, and brand storytelling across the storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getPreviewUrl(activeTab)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-dark/15 text-xs font-sans font-semibold text-brand-dark hover:bg-black/5 transition-colors"
          >
            <Eye size={14} className="text-brand-medium" />
            <span>Preview Page</span>
            <ExternalLink size={12} className="text-brand-light" />
          </a>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-dark/10">
        {CONTENT_PAGES.map((page) => {
          const isActive = activeTab === page.id;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => setActiveTab(page.id)}
              className={`px-4 py-2.5 rounded-xl font-sans text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-dark text-white shadow-xs'
                  : 'text-brand-medium hover:text-brand-dark hover:bg-brand-dark/5'
              }`}
            >
              {page.label}
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Description & Timestamp ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10">
        <div className="flex items-center gap-2 text-xs font-sans text-brand-dark">
          <Sparkles size={15} className="text-gold-600 shrink-0" />
          <span>{CONTENT_PAGES.find((p) => p.id === activeTab)?.description}</span>
        </div>
        {lastUpdated && (
          <span className="text-[11px] font-sans text-brand-medium/70 shrink-0">
            Last saved: {new Date(lastUpdated).toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Alert Notifications ── */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-sans flex items-center gap-3 animate-fade-in">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Form Section ── */}
      <form onSubmit={handleSave} className="space-y-6">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-brand-dark/10 space-y-3">
            <Loader2 className="animate-spin mx-auto text-brand-dark" size={24} />
            <span className="text-xs font-sans text-brand-medium block">Loading page content...</span>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-brand-dark/10 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* 1. HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Seasonal Top Announcement Bar */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/15 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                    <div>
                      <h4 className="font-serif text-sm sm:text-base font-semibold text-brand-dark">
                        Top Announcement Bar (Seasonal Banner)
                      </h4>
                      <p className="text-[11px] font-sans text-brand-medium">
                        Prominently appears across the top of the home screen. Perfect for seasonal events (Christmas, Valentine&apos;s, Mother&apos;s Day).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homeData.announcementEnabled !== false}
                        onChange={(e) =>
                          setHomeData({ ...homeData, announcementEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Season / Badge Tag
                      </label>
                      <input
                        type="text"
                        value={homeData.announcementBadge ?? '2026 FESTIVE COLLECTION'}
                        onChange={(e) =>
                          setHomeData({ ...homeData, announcementBadge: e.target.value })
                        }
                        placeholder="e.g. 2026 FESTIVE COLLECTION or VALENTINE'S EDIT"
                        className="w-full px-4 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Button / Link Text
                      </label>
                      <input
                        type="text"
                        value={homeData.announcementCtaText ?? 'Explore Gift Sets →'}
                        onChange={(e) =>
                          setHomeData({ ...homeData, announcementCtaText: e.target.value })
                        }
                        placeholder="e.g. Explore Gift Sets →"
                        className="w-full px-4 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Announcement Headline
                      </label>
                      <input
                        type="text"
                        value={homeData.announcementText ?? '’Tis the Season to Be Merry'}
                        onChange={(e) =>
                          setHomeData({ ...homeData, announcementText: e.target.value })
                        }
                        placeholder="e.g. ’Tis the Season to Be Merry"
                        className="w-full px-4 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Destination Link / Route
                      </label>
                      <input
                        type="text"
                        value={homeData.announcementLink ?? '/christmas'}
                        onChange={(e) =>
                          setHomeData({ ...homeData, announcementLink: e.target.value })
                        }
                        placeholder="e.g. /christmas or /shop"
                        className="w-full px-4 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Hero Eyebrow Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={homeData.heroTagline}
                    onChange={(e) => setHomeData({ ...homeData, heroTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Hero Main Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={homeData.heroTitle}
                    onChange={(e) => setHomeData({ ...homeData, heroTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Hero Subtitle / Narrative
                  </label>
                  <textarea
                    rows={3}
                    value={homeData.heroSubtitle}
                    onChange={(e) => setHomeData({ ...homeData, heroSubtitle: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={homeData.heroCtaText}
                    onChange={(e) => setHomeData({ ...homeData, heroCtaText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                {/* Hero Showcase Centerpiece Image */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/15 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                    <div>
                      <h4 className="font-serif text-sm sm:text-base font-semibold text-brand-dark flex items-center gap-2">
                        <ImageIcon size={16} className="text-gold-600" />
                        <span>Homepage Centerpiece Gift Box Image</span>
                      </h4>
                      <p className="text-[11px] font-sans text-brand-medium">
                        Customize or replace the central 3D signature gift box image displayed on the homepage.
                      </p>
                    </div>

                    {homeData.heroImageUrl && (
                      <button
                        type="button"
                        onClick={() => setHomeData({ ...homeData, heroImageUrl: '' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-dark/20 text-brand-dark hover:bg-black/5 text-xs font-sans font-medium transition-colors cursor-pointer"
                        title="Revert to default gift box"
                      >
                        <RotateCcw size={12} />
                        <span>Reset to Default Box</span>
                      </button>
                    )}
                  </div>

                  {heroImgError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{heroImgError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Live Image Preview */}
                    <div className="relative w-40 sm:w-48 aspect-square rounded-2xl bg-white border border-brand-dark/10 p-3 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      <img
                        src={homeData.heroImageUrl || defaultGiftBoxImg}
                        alt="Gift Box Preview"
                        className="max-w-full max-h-full object-contain drop-shadow-sm"
                      />
                      {!homeData.heroImageUrl && (
                        <span className="absolute bottom-1.5 inset-x-2 text-center text-[9px] font-sans font-semibold uppercase tracking-wider bg-brand-dark/70 text-white rounded py-0.5 backdrop-blur-xs">
                          Default Box
                        </span>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1.5">
                          Upload New Image (Cloudinary)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all shadow-xs cursor-pointer ${
                            uploadingHeroImg
                              ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                              : 'bg-brand-dark text-white hover:bg-gold-600'
                          }`}>
                            {uploadingHeroImg ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={13} />
                                <span>Choose Image File</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/avif"
                              disabled={uploadingHeroImg}
                              onChange={handleHeroImageUpload}
                              className="sr-only"
                            />
                          </label>
                          <span className="text-[11px] font-sans text-brand-light">
                            Supports PNG, JPG, WebP (Transparent PNG recommended)
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                          Or Direct Image URL
                        </label>
                        <input
                          type="url"
                          value={homeData.heroImageUrl || ''}
                          onChange={(e) => setHomeData({ ...homeData, heroImageUrl: e.target.value })}
                          placeholder="https://res.cloudinary.com/.../my-box.png"
                          className="w-full px-4 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                          Image Alt / Accessibility Text
                        </label>
                        <input
                          type="text"
                          value={homeData.heroImageAlt || ''}
                          onChange={(e) => setHomeData({ ...homeData, heroImageAlt: e.target.value })}
                          placeholder="e.g. Good Things Co. 2026 Festive Keepsake Box"
                          className="w-full px-4 py-2 rounded-xl border border-brand-dark/20 text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-dark/10">
                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Curated Section Heading
                    </label>
                    <input
                      type="text"
                      value={homeData.curatedHeading}
                      onChange={(e) => setHomeData({ ...homeData, curatedHeading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Concierge Section Heading
                    </label>
                    <input
                      type="text"
                      value={homeData.conciergeHeading}
                      onChange={(e) => setHomeData({ ...homeData, conciergeHeading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Curated Section Description
                  </label>
                  <textarea
                    rows={2}
                    value={homeData.curatedDescription}
                    onChange={(e) => setHomeData({ ...homeData, curatedDescription: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Concierge Advisory Note
                  </label>
                  <textarea
                    rows={2}
                    value={homeData.conciergeText}
                    onChange={(e) => setHomeData({ ...homeData, conciergeText: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 2. GATEWAYS TAB (Homepage Cards & Expanded Details) */}
            {activeTab === 'gateways' && (
              <div className="space-y-8">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs font-sans text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Homepage 4-Gateway Showcase</p>
                  <p className="text-amber-800">
                    These fields control the 4 primary entrance cards displayed directly on your homepage. 
                    Changes update both the collapsed card previews and the expanded &quot;DETAILS&quot; views.
                  </p>
                </div>

                {/* ── CARD 1: SHOP ── */}
                <div className="p-6 rounded-2xl border border-brand-dark/10 bg-[#FCFBF9] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <h3 className="font-serif text-base font-semibold text-brand-dark">Card 1: Shop</h3>
                    </div>
                    <span className="text-[11px] font-sans font-medium text-brand-medium uppercase tracking-wider">
                      Individual Gifting
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Audience Tagline Badge
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.shopTargetAudience}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, shopTargetAudience: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. For individuals"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Card Headline
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.shopHeadline}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, shopHeadline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-sm"
                        placeholder="e.g. Find a gift."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Short Preview Description (Shown on Card)
                    </label>
                    <textarea
                      rows={2}
                      value={gatewaysData.shopShortDesc}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, shopShortDesc: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Brief teaser shown directly on the homepage card"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Expanded Details Narrative (Shown when &quot;DETAILS&quot; is clicked)
                    </label>
                    <textarea
                      rows={3}
                      value={gatewaysData.shopDescription}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, shopDescription: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Full paragraph shown when customer opens the card modal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Journey Steps (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.shopJourneySteps}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, shopJourneySteps: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Occasion, Recipient, Gift, Checkout"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.shopCtaText}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, shopCtaText: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Enter Shop"
                      />
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: CORPORATE ── */}
                <div className="p-6 rounded-2xl border border-brand-dark/10 bg-[#FCFBF9] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      <h3 className="font-serif text-base font-semibold text-brand-dark">Card 2: Corporate</h3>
                    </div>
                    <span className="text-[11px] font-sans font-medium text-brand-medium uppercase tracking-wider">
                      Business & Scale
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Audience Tagline Badge
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.corporateTargetAudience}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, corporateTargetAudience: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. For organisations"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Card Headline
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.corporateHeadline}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, corporateHeadline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-sm"
                        placeholder="e.g. Gift at scale."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Short Preview Description (Shown on Card)
                    </label>
                    <textarea
                      rows={2}
                      value={gatewaysData.corporateShortDesc}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, corporateShortDesc: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Brief teaser shown directly on the homepage card"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Expanded Details Narrative (Shown when &quot;DETAILS&quot; is clicked)
                    </label>
                    <textarea
                      rows={3}
                      value={gatewaysData.corporateDescription}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, corporateDescription: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Full paragraph shown when customer opens the card modal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Journey Steps (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.corporateJourneySteps}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, corporateJourneySteps: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Build campaign, Customise, Upload recipients, Approve, Pay, Track"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.corporateCtaText}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, corporateCtaText: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Explore Corporate"
                      />
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: CREATE ── */}
                <div className="p-6 rounded-2xl border border-brand-dark/10 bg-[#FCFBF9] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <h3 className="font-serif text-base font-semibold text-brand-dark">Card 3: Create</h3>
                    </div>
                    <span className="text-[11px] font-sans font-medium text-brand-medium uppercase tracking-wider">
                      Custom & Bespoke
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Audience Tagline Badge
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.createTargetAudience}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, createTargetAudience: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Custom & bespoke"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Card Headline
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.createHeadline}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, createHeadline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-sm"
                        placeholder="e.g. Create something unique."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Short Preview Description (Shown on Card)
                    </label>
                    <textarea
                      rows={2}
                      value={gatewaysData.createShortDesc}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, createShortDesc: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Brief teaser shown directly on the homepage card"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Expanded Details Narrative (Shown when &quot;DETAILS&quot; is clicked)
                    </label>
                    <textarea
                      rows={3}
                      value={gatewaysData.createDescription}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, createDescription: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Full paragraph shown when customer opens the card modal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Journey Steps (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.createJourneySteps}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, createJourneySteps: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Ideate & Consult, Material Selection, Handcrafted Delivery"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.createCtaText}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, createCtaText: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Start Custom Order"
                      />
                    </div>
                  </div>
                </div>

                {/* ── CARD 4: ABOUT ── */}
                <div className="p-6 rounded-2xl border border-brand-dark/10 bg-[#FCFBF9] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                      <h3 className="font-serif text-base font-semibold text-brand-dark">Card 4: About</h3>
                    </div>
                    <span className="text-[11px] font-sans font-medium text-brand-medium uppercase tracking-wider">
                      Philosophy & Story
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Audience Tagline Badge
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.aboutTargetAudience}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, aboutTargetAudience: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Our philosophy"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Card Headline
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.aboutHeadline}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, aboutHeadline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-sm"
                        placeholder="e.g. The art of thoughtful living."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Short Preview Description (Shown on Card)
                    </label>
                    <textarea
                      rows={2}
                      value={gatewaysData.aboutShortDesc}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, aboutShortDesc: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Brief teaser shown directly on the homepage card"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Expanded Details Narrative (Shown when &quot;DETAILS&quot; is clicked)
                    </label>
                    <textarea
                      rows={3}
                      value={gatewaysData.aboutDescription}
                      onChange={(e) => setGatewaysData({ ...gatewaysData, aboutDescription: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                      placeholder="Full paragraph shown when customer opens the card modal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Journey Steps (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.aboutJourneySteps}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, aboutJourneySteps: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Curated Intentionality, Artisanal Packaging, Lasting Memory"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={gatewaysData.aboutCtaText}
                        onChange={(e) => setGatewaysData({ ...gatewaysData, aboutCtaText: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                        placeholder="e.g. Discover Our Story"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SHOP TAB */}
            {activeTab === 'shop' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Catalog Main Title
                  </label>
                  <input
                    type="text"
                    required
                    value={shopData.headerTitle}
                    onChange={(e) => setShopData({ ...shopData, headerTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Catalog Subtitle & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={shopData.headerSubtitle}
                    onChange={(e) => setShopData({ ...shopData, headerSubtitle: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Storefront Announcement Banner
                  </label>
                  <input
                    type="text"
                    value={shopData.announcementText}
                    onChange={(e) => setShopData({ ...shopData, announcementText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Search Input Placeholder
                  </label>
                  <input
                    type="text"
                    value={shopData.searchPlaceholder}
                    onChange={(e) => setShopData({ ...shopData, searchPlaceholder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Empty Search Results Notice
                  </label>
                  <textarea
                    rows={2}
                    value={shopData.emptyResultsMessage}
                    onChange={(e) => setShopData({ ...shopData, emptyResultsMessage: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 3. CORPORATE TAB */}
            {activeTab === 'corporate' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Corporate Eyebrow Tagline
                  </label>
                  <input
                    type="text"
                    value={corporateData.heroTagline}
                    onChange={(e) => setCorporateData({ ...corporateData, heroTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Corporate Hero Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={corporateData.heroTitle}
                    onChange={(e) => setCorporateData({ ...corporateData, heroTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Corporate Narrative Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={corporateData.heroSubtitle}
                    onChange={(e) => setCorporateData({ ...corporateData, heroSubtitle: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-dark/10">
                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Logistics Process Heading
                    </label>
                    <input
                      type="text"
                      value={corporateData.processHeading}
                      onChange={(e) => setCorporateData({ ...corporateData, processHeading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Volume Advantage Heading
                    </label>
                    <input
                      type="text"
                      value={corporateData.volumeHeading}
                      onChange={(e) => setCorporateData({ ...corporateData, volumeHeading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Process Description
                  </label>
                  <textarea
                    rows={2}
                    value={corporateData.processDescription}
                    onChange={(e) => setCorporateData({ ...corporateData, processDescription: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Volume Terms Description
                  </label>
                  <textarea
                    rows={2}
                    value={corporateData.volumeDescription}
                    onChange={(e) => setCorporateData({ ...corporateData, volumeDescription: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                {/* ── Corporate Products Catalog Manager ── */}
                <div className="pt-8 border-t border-brand-dark/15">
                  <CorporateProductsManager />
                </div>
              </div>
            )}

            {/* 4. CREATE TAB */}
            {activeTab === 'create' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Bespoke Eyebrow Tagline
                  </label>
                  <input
                    type="text"
                    value={createData.heroTagline}
                    onChange={(e) => setCreateData({ ...createData, heroTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Bespoke Builder Main Title
                  </label>
                  <input
                    type="text"
                    required
                    value={createData.heroTitle}
                    onChange={(e) => setCreateData({ ...createData, heroTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Bespoke Narrative Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={createData.heroSubtitle}
                    onChange={(e) => setCreateData({ ...createData, heroSubtitle: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Step Guide Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={createData.stepPrompt}
                    onChange={(e) => setCreateData({ ...createData, stepPrompt: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Packaging & Completion Assurance Note
                  </label>
                  <textarea
                    rows={2}
                    value={createData.completionNote}
                    onChange={(e) => setCreateData({ ...createData, completionNote: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 5. ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    About Eyebrow Tagline
                  </label>
                  <input
                    type="text"
                    value={aboutData.heroTagline}
                    onChange={(e) => setAboutData({ ...aboutData, heroTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Atelier Philosophy Main Title
                  </label>
                  <input
                    type="text"
                    required
                    value={aboutData.heroTitle}
                    onChange={(e) => setAboutData({ ...aboutData, heroTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-serif text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Philosophy Subtitle
                  </label>
                  <input
                    type="text"
                    value={aboutData.heroSubtitle}
                    onChange={(e) => setAboutData({ ...aboutData, heroSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Our Story Heading
                  </label>
                  <input
                    type="text"
                    value={aboutData.storyHeading}
                    onChange={(e) => setAboutData({ ...aboutData, storyHeading: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Story Paragraph 1 (Founding Vision)
                  </label>
                  <textarea
                    rows={3}
                    value={aboutData.storyParagraph1}
                    onChange={(e) => setAboutData({ ...aboutData, storyParagraph1: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Story Paragraph 2 (Artisan Provenance)
                  </label>
                  <textarea
                    rows={3}
                    value={aboutData.storyParagraph2}
                    onChange={(e) => setAboutData({ ...aboutData, storyParagraph2: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Atelier Standard & Values Narrative
                  </label>
                  <textarea
                    rows={2}
                    value={aboutData.valuesDescription}
                    onChange={(e) => setAboutData({ ...aboutData, valuesDescription: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 6. FOOTER TAB */}
            {activeTab === 'footer' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Global Brand Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={footerData.tagline}
                    onChange={(e) => setFooterData({ ...footerData, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Newsletter Heading
                    </label>
                    <input
                      type="text"
                      value={footerData.newsletterHeading}
                      onChange={(e) => setFooterData({ ...footerData, newsletterHeading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Newsletter Button Label
                    </label>
                    <input
                      type="text"
                      value={footerData.newsletterButtonText}
                      onChange={(e) => setFooterData({ ...footerData, newsletterButtonText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                    Newsletter Invitation Subtext
                  </label>
                  <textarea
                    rows={2}
                    value={footerData.newsletterSubtext}
                    onChange={(e) => setFooterData({ ...footerData, newsletterSubtext: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-dark/10">
                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Concierge Support Email
                    </label>
                    <input
                      type="email"
                      value={footerData.conciergeEmail}
                      onChange={(e) => setFooterData({ ...footerData, conciergeEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Concierge Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={footerData.conciergePhone}
                      onChange={(e) => setFooterData({ ...footerData, conciergePhone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Atelier Location Address
                    </label>
                    <input
                      type="text"
                      value={footerData.atelierAddress}
                      onChange={(e) => setFooterData({ ...footerData, atelierAddress: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-brand-dark mb-1">
                      Copyright Notice
                    </label>
                    <input
                      type="text"
                      value={footerData.copyrightNotice}
                      onChange={(e) => setFooterData({ ...footerData, copyrightNotice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="pt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-dark/15 text-xs font-sans font-semibold text-brand-medium hover:text-brand-dark hover:border-brand-dark/40 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Revert to Atelier Defaults</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-brand-dark hover:bg-gold-600 text-white text-xs font-sans font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Publishing Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Publish & Update Storefront</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
