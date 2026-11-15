import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  OCCASIONS,
  RECIPIENT_OPTIONS,
  BUDGET_TIERS,
  LIFESTYLE_OPTIONS,
  getPackagingOptions,
  PackagingOption,
  RIBBON_COLORS,
  GiftItem,
  BudgetTierId,
} from '../../data/giftsData';
import { getPublicStoreSettings } from '../../services/settingsService';
import {
  getFilteredProducts,
  getActiveProducts,
} from '../../services/productService';
import { adaptProductToGiftItem } from '../../utils/productAdapter';
import { Product, LifestyleCategory } from '../../types/product';
import {
  ShoppingBag,
  Check,
  X,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export interface ShopFlowContainerProps {
  className?: string;
  onComplete?: (orderRef: string) => void;
}

export const ShopFlowContainer: React.FC<ShopFlowContainerProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const { addItem, totalQuantity } = useCart();
  const [searchParams] = useSearchParams();

  // Filter Selection States (Saved immediately on click)
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(() => {
    return searchParams.get('occasion') || 'birthday';
  });
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(() => {
    return searchParams.get('recipient') || null;
  });
  const [selectedBudget, setSelectedBudget] = useState<BudgetTierId | null>(null);
  const [selectedLifestyle, setSelectedLifestyle] = useState<LifestyleCategory | null>(null);

  // Progressive Disclosure Stage: which sections are currently unlocked/active
  // 1: Occasion active
  // 2: Recipient active
  // 3: Budget active
  // 4: Lifestyle active
  const [unlockedStage, setUnlockedStage] = useState<number>(() => {
    if (searchParams.get('recipient')) return 3;
    if (searchParams.get('occasion')) return 2;
    return 2; // Default occasion is selected ('birthday'), so recipient is active
  });

  // Section DOM refs for smooth focus transition
  const recipientRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const lifestyleRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Products Data State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [exactMatches, setExactMatches] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Personalisation Modal State (Same-page personalisation)
  const [personalisingProduct, setPersonalisingProduct] = useState<GiftItem | null>(null);
  const [selectedModalImageIndex, setSelectedModalImageIndex] = useState<number>(0);
  const [packagingList, setPackagingList] = useState<PackagingOption[]>(() => getPackagingOptions());
  const [selectedPackaging, setSelectedPackaging] = useState<PackagingOption>(() => getPackagingOptions()[0]);
  const [ribbonList, setRibbonList] = useState<any[]>(() => RIBBON_COLORS);
  const [selectedRibbon, setSelectedRibbon] = useState(RIBBON_COLORS[0]);
  const [giftMessage, setGiftMessage] = useState<string>('');

  // Cart Success Toast / Modal State
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [addedModalOpen, setAddedModalOpen] = useState<boolean>(false);
  const [lastAddedTitle, setLastAddedTitle] = useState<string>('');

  // ── 1. Fetch Products Dynamically ──
  const loadFilteredProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [filterResult, fullList] = await Promise.all([
        getFilteredProducts({
          occasion: selectedOccasion || undefined,
          recipient: selectedRecipient || undefined,
          specificRecipient: selectedRecipient || undefined,
          budgetRange: selectedBudget || undefined,
          lifestyle: selectedLifestyle || undefined,
        }),
        getActiveProducts(true),
      ]);

      setExactMatches(filterResult.exactMatches);
      setSuggestions(filterResult.suggestions);
      setAllProducts(fullList);
    } catch (err: any) {
      console.warn('[ShopFlow] Live product query failed:', err);
      setFetchError('Temporarily showing curated atelier selections.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedOccasion, selectedRecipient, selectedBudget, selectedLifestyle]);

  useEffect(() => {
    loadFilteredProducts();
  }, [loadFilteredProducts]);

  // Load live packaging & ribbon settings from store settings
  useEffect(() => {
    let isMounted = true;
    getPublicStoreSettings()
      .then((settings) => {
        if (!isMounted) return;
        const opts = getPackagingOptions(settings?.packaging);
        setPackagingList(opts);
        setSelectedPackaging((prev) => opts.find((o) => o.id === prev.id) || opts[0]);

        if (settings?.packaging?.ribbons && settings.packaging.ribbons.length > 0) {
          const activeRibbons = settings.packaging.ribbons.filter((r: any) => r.enabled !== false);
          if (activeRibbons.length > 0) {
            setRibbonList(activeRibbons);
            setSelectedRibbon((prev) => activeRibbons.find((r) => r.id === prev.id) || activeRibbons[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('[ShopFlow] Failed to load store settings:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ── 2. Filter Click Handlers with Auto-Progression (No "Next" buttons!) ──
  const handleSelectOccasion = (id: string) => {
    setSelectedOccasion(id);
    if (unlockedStage < 2) setUnlockedStage(2);
    // Smoothly draw attention to Recipient
    setTimeout(() => {
      recipientRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelectRecipient = (id: string) => {
    setSelectedRecipient(id);
    if (unlockedStage < 3) setUnlockedStage(3);
    // Smoothly draw attention to Budget
    setTimeout(() => {
      budgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelectBudget = (tierId: BudgetTierId) => {
    setSelectedBudget(tierId);
    if (unlockedStage < 4) setUnlockedStage(4);
    // Smoothly draw attention to Lifestyle
    setTimeout(() => {
      lifestyleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  const handleSelectLifestyle = (catId: LifestyleCategory) => {
    setSelectedLifestyle((prev) => (prev === catId ? null : catId));
    // Smoothly draw attention to Results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const handleResetFilters = () => {
    setSelectedOccasion('birthday');
    setSelectedRecipient(null);
    setSelectedBudget(null);
    setSelectedLifestyle(null);
    setUnlockedStage(2);
  };

  // ── 3. Same-Page Personalisation Handlers ──
  const handleOpenPersonalise = (product: Product | GiftItem) => {
    const item: GiftItem = 'rawProduct' in (product as any) ? (product as GiftItem) : adaptProductToGiftItem(product as Product);
    setPersonalisingProduct(item);

    const raw = (item.rawProduct || item) as Product | undefined;
    const allowed = raw?.packagingOptions;
    let initialPkg = packagingList[0] || getPackagingOptions()[0];
    if (Array.isArray(allowed) && allowed.length > 0) {
      const matched = packagingList.find((pkg) =>
        allowed.some(
          (a) =>
            a.toLowerCase() === pkg.id.toLowerCase() ||
            a.toLowerCase() === pkg.name.toLowerCase() ||
            pkg.name.toLowerCase().includes(a.toLowerCase()) ||
            a.toLowerCase().includes(pkg.name.toLowerCase())
        )
      );
      if (matched) initialPkg = matched;
    } else {
      // Prioritize Festive Christmas packaging for holiday items
      const isChristmas =
        selectedOccasion === 'christmas' ||
        product.occasions?.some((o: string) => o.toLowerCase() === 'christmas') ||
        raw?.occasions?.some((o: string) => o.toLowerCase() === 'christmas');
      if (isChristmas) {
        const festive = packagingList.find(
          (p) =>
            p.id.includes('festive') ||
            p.id.includes('christmas') ||
            p.name.toLowerCase().includes('festive') ||
            p.name.toLowerCase().includes('christmas')
        );
        if (festive) initialPkg = festive;
      }
    }

    setSelectedPackaging(initialPkg);
    setSelectedRibbon(ribbonList[0] || RIBBON_COLORS[0]);
    setGiftMessage('');
    setSelectedModalImageIndex(0);
  };

  const handleClosePersonalise = () => {
    setPersonalisingProduct(null);
  };

  // Add Personalised Gift to Gifting Cart
  const handleAddToCart = () => {
    if (!personalisingProduct) return;

    const raw = personalisingProduct.rawProduct as Product | undefined;
    const stock = raw?.stock !== undefined ? raw.stock : 999;
    if (stock <= 0) {
      setCartNotice(`"${personalisingProduct.title}" is currently out of stock.`);
      setTimeout(() => setCartNotice(null), 3000);
      return;
    }

    const firstImage = raw?.images?.[0];
    const imagePayload = firstImage
      ? {
          url: typeof firstImage === 'string' ? firstImage : firstImage.url,
          publicId: typeof firstImage === 'object' ? firstImage.publicId : undefined,
          alt: typeof firstImage === 'object' ? firstImage.alt : personalisingProduct.title,
        }
      : { url: personalisingProduct.image, alt: personalisingProduct.title };

    const packagingExtra = selectedPackaging.price || 0;
    const unitPrice = personalisingProduct.price + packagingExtra;

    const result = addItem({
      productId: raw?.id || personalisingProduct.id,
      slug: personalisingProduct.slug || raw?.slug || personalisingProduct.id,
      name: personalisingProduct.title,
      unitPrice,
      quantity: 1,
      currentStock: stock,
      image: imagePayload,
      packaging: selectedPackaging.name,
      packagingFee: packagingExtra,
      ribbonColour: selectedRibbon.name,
      giftMessage: giftMessage.trim() || undefined,
    });

    if (result.success) {
      setLastAddedTitle(personalisingProduct.title);
      setPersonalisingProduct(null);
      setAddedModalOpen(true);
    } else {
      setCartNotice(result.message);
      setTimeout(() => setCartNotice(null), 3500);
    }
  };

  // Quick Add opens personalisation modal so customer chooses packaging & ribbons
  const handleQuickAdd = (product: Product | GiftItem, e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenPersonalise(product);
  };

  // Filter packaging options for current product
  const activePackagingForProduct = useMemo(() => {
    if (!personalisingProduct) return packagingList;
    const raw = (personalisingProduct.rawProduct || personalisingProduct) as Product | undefined;
    const allowed = raw?.packagingOptions;
    if (Array.isArray(allowed) && allowed.length > 0) {
      const filtered = packagingList.filter((pkg) =>
        allowed.some(
          (a) =>
            a.toLowerCase() === pkg.id.toLowerCase() ||
            a.toLowerCase() === pkg.name.toLowerCase() ||
            pkg.name.toLowerCase().includes(a.toLowerCase()) ||
            a.toLowerCase().includes(pkg.name.toLowerCase())
        )
      );
      if (filtered.length > 0) return filtered;
    }

    // If Christmas, prioritize the festive holiday box
    const isChristmas =
      selectedOccasion === 'christmas' ||
      personalisingProduct.occasions?.some((o: string) => o.toLowerCase() === 'christmas') ||
      raw?.occasions?.some((o: string) => o.toLowerCase() === 'christmas');
    if (isChristmas) {
      const festive = packagingList.filter(
        (p) =>
          p.id.includes('festive') ||
          p.id.includes('christmas') ||
          p.name.toLowerCase().includes('festive') ||
          p.name.toLowerCase().includes('christmas')
      );
      if (festive.length > 0) {
        return [...festive, ...packagingList.filter((p) => !festive.some((f) => f.id === p.id))];
      }
    }

    return packagingList;
  }, [personalisingProduct, packagingList, selectedOccasion]);

  // Products to display: when active filters exist, strictly respect exactMatches!
  const hasActiveFilters = Boolean(
    (selectedOccasion && selectedOccasion !== 'all') ||
    selectedRecipient ||
    selectedBudget ||
    selectedLifestyle
  );
  const displayProducts = hasActiveFilters ? exactMatches : (suggestions.length > 0 ? suggestions : allProducts);
  const isShowingSuggestions = exactMatches.length === 0 && !hasActiveFilters && suggestions.length > 0;

  // Multi-image gallery for personalization modal
  const modalImages = useMemo(() => {
    if (!personalisingProduct) return [];
    const raw = (personalisingProduct.rawProduct || personalisingProduct) as Product | undefined;
    if (raw?.images && Array.isArray(raw.images) && raw.images.length > 0) {
      return raw.images.map((img) => (typeof img === 'string' ? img : img.url));
    }
    return [personalisingProduct.image];
  }, [personalisingProduct]);

  // Active filter count summary
  const activeFiltersCount = [
    Boolean(selectedOccasion),
    Boolean(selectedRecipient),
    Boolean(selectedBudget),
    Boolean(selectedLifestyle),
  ].filter(Boolean).length;

  return (
    <div className={`w-full max-w-5xl mx-auto flex flex-col items-center text-center ${className}`}>
      {/* ── Toast Cart Notice ── */}
      {cartNotice && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-brand-dark text-white rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-sans">
          <AlertCircle size={16} className="text-gold-400 shrink-0" />
          <span>{cartNotice}</span>
        </div>
      )}

      {fetchError && (
        <div className="w-full mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-xs font-sans text-amber-900 flex items-center justify-center gap-2">
          <AlertCircle size={14} className="text-amber-700 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. PROGRESSIVE GIFT DISCOVERY FILTERS (ON ONE PAGE)     */}
      {/* ======================================================== */}
      <section className="w-full bg-white rounded-3xl border border-brand-dark/10 shadow-xs p-6 sm:p-8 md:p-10 mb-10 transition-all">
        {/* Step Indicator & Active Filter Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-brand-dark/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-brand-dark">
              Atelier Gift Discovery
            </span>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-sans text-brand-medium">
                {activeFiltersCount} of 4 criteria selected
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-brand-dark hover:text-gold-600 underline cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          )}
        </div>

        {/* ── FILTER GROUP 1: OCCASION ── */}
        <div className="mb-8 text-center">
          <div className="mb-3">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
              Step 1
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
              What is the Occasion?
            </h2>
            <p className="font-sans text-xs text-brand-medium/80 mt-0.5">
              Select an everyday celebration or seasonal milestone
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto pt-2">
            {OCCASIONS.map((occ) => {
              const isSelected = selectedOccasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => handleSelectOccasion(occ.id)}
                  className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs ring-1 ring-brand-dark'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={13} className="text-gold-400" />}
                  <span>{occ.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FILTER GROUP 2: RECIPIENT ── */}
        <div
          ref={recipientRef}
          className={`pt-6 border-t border-brand-dark/10 text-center transition-all duration-300 ${
            unlockedStage < 2 ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="mb-3">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
              Step 2
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
              Who is the Gift For?
            </h2>
            <p className="font-sans text-xs text-brand-medium/80 mt-0.5">
              Choose the recipient to refine suitable curations
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto pt-2">
            {RECIPIENT_OPTIONS.map((rec) => {
              const isSelected = selectedRecipient === rec.id;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => handleSelectRecipient(rec.id)}
                  className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs ring-1 ring-brand-dark'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={13} className="text-gold-400" />}
                  <span>{rec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FILTER GROUP 3: BUDGET ── */}
        <div
          ref={budgetRef}
          className={`pt-6 mt-8 border-t border-brand-dark/10 text-center transition-all duration-300 ${
            unlockedStage < 3 ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="mb-3">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
              Step 3
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
              Select Your Budget
            </h2>
            <p className="font-sans text-xs text-brand-medium/80 mt-0.5">
              Anticipated investment for this thoughtful gesture
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto pt-2">
            {BUDGET_TIERS.map((tier) => {
              const isSelected = selectedBudget === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleSelectBudget(tier.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-brand-dark text-brand-ivory font-semibold shadow-xs ring-1 ring-brand-dark'
                      : 'bg-[#FAF8F5] text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={13} className="text-gold-400" />}
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FILTER GROUP 4: LIFESTYLE ── */}
        <div
          ref={lifestyleRef}
          className={`pt-6 mt-8 border-t border-brand-dark/10 text-center transition-all duration-300 ${
            unlockedStage < 4 ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="mb-3">
            <span className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
              Step 4 (Optional)
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-normal">
              Explore by Lifestyle
            </h2>
            <p className="font-sans text-xs text-brand-medium/80 mt-0.5">
              Tailor gifts to their unique passions and aesthetic living
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto pt-2">
            {LIFESTYLE_OPTIONS.map((ls) => {
              const isSelected = selectedLifestyle === ls.id;
              return (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => handleSelectLifestyle(ls.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gold-600 text-white font-semibold shadow-xs'
                      : 'bg-[#FAF8F5] text-brand-dark/90 hover:bg-brand-dark/5 border border-brand-dark/10'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                  <span>{ls.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. DYNAMIC LIVE GIFT RESULTS (ON SAME PAGE)             */}
      {/* ======================================================== */}
      <section ref={resultsRef} className="w-full text-center">
        {/* Results Header */}
        <div className="mb-8">
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700 block mb-1">
            Hand-Curated Atelier Edits
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            Matching Thoughtful Gifts
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2 text-xs font-sans text-brand-medium">
            <span>
              Showing{' '}
              <strong className="text-brand-dark font-bold">
                {displayProducts.length}
              </strong>{' '}
              gift{displayProducts.length === 1 ? '' : 's'}
            </span>
            {isShowingSuggestions && (
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                Tailored alternative suggestions
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-brand-medium">
            <Loader2 className="animate-spin text-gold-600" size={32} />
            <span className="font-serif text-sm">Searching the Good Things Co. collection...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayProducts.length === 0 && (
          <div className="p-12 rounded-3xl bg-white border border-brand-dark/10 text-center max-w-lg mx-auto space-y-4">
            <p className="font-serif text-lg text-brand-dark">No exact matches found</p>
            <p className="font-sans text-xs text-brand-medium leading-relaxed">
              Try adjusting your occasion, budget tier, or lifestyle filter to discover more curations.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-full bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Curated Gifts Grid */}
        {!isLoading && displayProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            {displayProducts.map((prod) => {
              const gift = adaptProductToGiftItem(prod);
              return (
                <article
                  key={gift.id}
                  onClick={() => handleOpenPersonalise(gift)}
                  className="group bg-white rounded-3xl border border-brand-dark/10 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer"
                >
                  {/* Product Photography */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#FAF8F5]">
                    <img
                      src={gift.image}
                      alt={gift.alt}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Featured / Occasion Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {gift.badge && (
                        <span className="px-2.5 py-1 rounded-full bg-brand-dark text-white text-[10px] font-sans font-bold uppercase tracking-wider">
                          {gift.badge}
                        </span>
                      )}
                      {(() => {
                        const matchedOccasion = selectedOccasion && gift.occasions?.find((o) => o.toLowerCase() === selectedOccasion.toLowerCase());
                        const displayOccasion = matchedOccasion || gift.rawProduct?.category || gift.occasions?.[0];
                        return displayOccasion ? (
                          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-brand-dark text-[10px] font-sans font-semibold capitalize border border-black/5">
                            {displayOccasion.replace(/-/g, ' ')}
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Quick Add Overlay on Hover (Desktop) */}
                    <div className="absolute inset-x-3 bottom-3 hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(gift, e)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/95 text-brand-dark font-sans text-xs font-semibold hover:bg-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag size={13} className="text-gold-600" />
                        <span>Quick Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPersonalise(gift)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold hover:bg-gold-600 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Personalise</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-medium">
                          {gift.subtitle}
                        </span>
                        <span className="font-serif text-base font-semibold text-brand-dark">
                          {gift.formattedPrice}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg text-brand-dark font-medium leading-snug group-hover:text-gold-700 transition-colors">
                        {gift.title}
                      </h3>

                      <p className="font-sans text-xs text-brand-medium/80 mt-1 line-clamp-2 leading-relaxed">
                        {gift.description}
                      </p>
                    </div>

                    {/* Action Bar (Mobile & Accessible) */}
                    <div className="pt-4 mt-4 border-t border-brand-dark/10 flex items-center justify-between">
                      <span className="text-[11px] font-sans font-medium text-gold-700 flex items-center gap-1 group-hover:underline">
                        <span>Personalise & Add</span>
                        <ArrowRight size={12} />
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(gift, e)}
                        className="sm:hidden p-2 rounded-full bg-brand-dark text-white"
                        aria-label="Quick Add to Cart"
                      >
                        <ShoppingBag size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 3. SAME-PAGE PERSONALISATION MODAL / DRAWER             */}
      {/* ======================================================== */}
      {personalisingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-dark/10 overflow-hidden max-h-[92vh] flex flex-col text-left">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-brand-dark/10 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-gold-600" />
                <h3 className="font-serif text-lg font-medium text-brand-dark">
                  Personalise Your Curation
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePersonalise}
                className="p-1.5 rounded-full hover:bg-black/5 text-brand-dark transition-colors cursor-pointer"
                aria-label="Close personalisation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product Summary Row with Multi-Image View */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-3">
                <div className="flex items-center gap-4">
                  <img
                    src={modalImages[selectedModalImageIndex] || personalisingProduct.image}
                    alt={personalisingProduct.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-brand-dark/10 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base font-medium text-brand-dark truncate">
                      {personalisingProduct.title}
                    </h4>
                    <p className="font-sans text-xs text-brand-medium mt-0.5">
                      Base: <strong className="text-brand-dark">{personalisingProduct.formattedPrice}</strong>
                    </p>
                    <p className="font-sans text-[11px] text-brand-light line-clamp-1 mt-0.5">
                      {personalisingProduct.subtitle}
                    </p>
                  </div>
                </div>

                {/* Additional View Thumbnails in Modal */}
                {modalImages.length > 1 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-dark/5 overflow-x-auto">
                    <span className="text-[10px] font-sans text-brand-light uppercase tracking-wider font-semibold mr-1 shrink-0">
                      Views ({modalImages.length}):
                    </span>
                    {modalImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedModalImageIndex(idx)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          selectedModalImageIndex === idx
                            ? 'border-brand-dark ring-1 ring-brand-dark scale-105'
                            : 'border-brand-dark/15 opacity-60 hover:opacity-100'
                        }`}
                        title={`View angle ${idx + 1}`}
                      >
                        <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. Packaging Selection */}
              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                  1. Presentation Packaging
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activePackagingForProduct.map((pkg) => {
                    const isSelected = selectedPackaging.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackaging(pkg)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-brand-dark bg-[#FAF8F5] ring-1 ring-brand-dark shadow-2xs'
                            : 'border-brand-dark/15 hover:border-brand-dark/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif text-sm font-semibold text-brand-dark">
                            {pkg.name}
                          </span>
                          <span className="font-sans text-xs text-gold-700 font-semibold">
                            {pkg.price === 0 ? 'Included' : `+₦${pkg.price.toLocaleString()}`}
                          </span>
                        </div>
                        <span className="font-sans text-[11px] text-brand-medium">
                          {pkg.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ribbon Selection */}
              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                  2. Satin Ribbon Finish
                </label>
                <div className="flex flex-wrap gap-2">
                  {ribbonList.map((ribbon) => {
                    const isSelected = selectedRibbon.id === ribbon.id || selectedRibbon.name === ribbon.name;
                    return (
                      <button
                        key={ribbon.id || ribbon.name}
                        type="button"
                        onClick={() => setSelectedRibbon(ribbon)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-sans transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-dark bg-brand-dark text-white font-semibold'
                            : 'border-brand-dark/15 bg-white text-brand-dark hover:border-brand-dark/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: ribbon.hex }}
                        />
                        <span>{ribbon.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Complimentary Handwritten Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark">
                    3. Complimentary Handwritten Card Message
                  </label>
                  <span className="font-sans text-[11px] text-brand-medium">
                    {giftMessage.length}/250 characters
                  </span>
                </div>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value.slice(0, 250))}
                  placeholder="Write your heartfelt note here. Our atelier will hand-scribe this onto our heavy cotton letterpress stationery..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer / Add to Gifting Cart */}
            <div className="p-5 border-t border-brand-dark/10 bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-sans text-[11px] text-brand-medium block">Total Price:</span>
                <span className="font-serif text-xl font-bold text-brand-dark">
                  ₦
                  {(
                    personalisingProduct.price +
                    (selectedPackaging.price || 0)
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClosePersonalise}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShoppingBag size={14} />
                  <span>Add to Gifting Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. POST-ADD TO CART CONFIRMATION MODAL                   */}
      {/* ======================================================== */}
      {addedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-dark/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>

            <h3 className="font-serif text-xl font-medium text-brand-dark">
              Added to Your Gifting Bag
            </h3>

            <p className="font-sans text-xs text-brand-medium leading-relaxed">
              <strong>{lastAddedTitle}</strong> has been added to your cart. You have{' '}
              <strong className="text-brand-dark">{totalQuantity} item(s)</strong> in your bag.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setAddedModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-brand-dark/20 text-brand-dark font-sans text-xs font-semibold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddedModalOpen(false);
                  navigate('/checkout');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopFlowContainer;
