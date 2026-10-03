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
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  fetchAdminPageContent,
  updateAdminPageContent,
  DEFAULT_PAGE_CONTENTS,
} from '../../services/contentService';
import type {
  ContentPageId,
  HomePageContent,
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
  const [shopData, setShopData] = useState<ShopPageContent>(DEFAULT_PAGE_CONTENTS.shop);
  const [corporateData, setCorporateData] = useState<CorporatePageContent>(DEFAULT_PAGE_CONTENTS.corporate);
  const [createData, setCreateData] = useState<CreatePageContent>(DEFAULT_PAGE_CONTENTS.create);
  const [aboutData, setAboutData] = useState<AboutPageContent>(DEFAULT_PAGE_CONTENTS.about);
  const [footerData, setFooterData] = useState<FooterContent>(DEFAULT_PAGE_CONTENTS.footer);

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
              <div className="space-y-5">
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

            {/* 2. SHOP TAB */}
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
