import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  OCCASIONS,
  RECIPIENTS,
  BUDGET_TIERS,
  PACKAGING_OPTIONS,
  RIBBON_COLORS,
  GiftItem,
  OccasionId,
  RecipientGroupId,
} from '../../data/giftsData';
import {
  getFilteredProducts,
  getActiveProducts,
} from '../../services/productService';
import { adaptProductToGiftItem } from '../../utils/productAdapter';
import { Product } from '../../types/product';
import {
  Sparkles,
  ExternalLink,
  RotateCcw,
  Loader2,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export interface ShopFlowContainerProps {
  className?: string;
  onComplete?: (orderRef: string) => void;
}

const DEFAULT_FALLBACK_GIFT: GiftItem = {
  id: 'atelier-curation',
  title: 'Atelier Signature Curation',
  subtitle: 'Artisanal Gift Box',
  price: 35000,
  formattedPrice: '₦35,000',
  image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  alt: 'Atelier Signature Curation',
  occasions: ['birthday'],
  primaryRecipient: 'her',
  subRecipients: ['mum'],
  budgetTier: '25k-50k',
  description: 'Handcrafted curation prepared with personal care and artisanal attention.',
  included: ['Signature Gift Box', 'Handwritten Card', 'Artisanal Keepsake'],
};

export const ShopFlowContainer: React.FC<ShopFlowContainerProps> = ({
  className = '',
  onComplete,
}) => {
  const { addItem, getCartCount } = useCart();
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [addedModalOpen, setAddedModalOpen] = useState<boolean>(false);
  const [lastAddedName, setLastAddedName] = useState<string>('');

  const [searchParams] = useSearchParams();
  const initialOccasion = searchParams.get('occasion') as OccasionId | null;
  const initialRecipient = searchParams.get('recipient') as RecipientGroupId | null;

  // Current active step (1 to 10 strictly in order — deep-link to step 2 if occasion in URL)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (initialOccasion) return 2;
    if (initialRecipient) return 3;
    return 1;
  });

  // ── Step 2: Occasion ──
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionId>(() => {
    if (initialOccasion && OCCASIONS.some((o) => o.id === initialOccasion)) {
      return initialOccasion;
    }
    return 'birthday';
  });
  const [occasionFilter, setOccasionFilter] = useState<'all' | 'seasonal' | 'everyday'>(() => {
    if (initialOccasion) {
      const match = OCCASIONS.find((o) => o.id === initialOccasion);
      if (match?.category) return match.category;
    }
    return 'all';
  });

  // ── Step 3: Recipient ──
  const [selectedRecipientGroup, setSelectedRecipientGroup] = useState<RecipientGroupId>(() => {
    if (initialRecipient && RECIPIENTS.some((r) => r.id === initialRecipient)) {
      return initialRecipient;
    }
    return 'her';
  });
  const [specificRecipient, setSpecificRecipient] = useState<string>(() => {
    if (initialRecipient === 'self') return 'self';
    if (initialRecipient === 'family') return 'mum';
    if (initialRecipient === 'business') return 'colleague';
    return 'mum';
  });

  // ── Step 4: Budget ──
  const [selectedBudget, setSelectedBudget] = useState<
    'under-25k' | '25k-50k' | '50k-100k' | 'premium'
  >('25k-50k');

  // ── Firestore Live Products State ──
  const [exactMatches, setExactMatches] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productFetchError, setProductFetchError] = useState<string | null>(null);
  const [showAllGifts, setShowAllGifts] = useState<boolean>(false);

  // ── Step 5 & 6: Selected Product ──
  const [selectedProduct, setSelectedProduct] = useState<GiftItem>(DEFAULT_FALLBACK_GIFT);

  // ── Fetch Live Products from Firestore ──
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductFetchError(null);
    try {
      const [filterResult, activeList] = await Promise.all([
        getFilteredProducts({
          occasion: selectedOccasion,
          recipient: selectedRecipientGroup,
          specificRecipient,
          budgetRange: selectedBudget,
        }),
        getActiveProducts(true),
      ]);

      setExactMatches(filterResult.exactMatches);
      setSuggestions(filterResult.suggestions);
      setAllProducts(activeList);

      // Pre-select first appropriate product if none selected yet or previously selected product is not in list
      const candidateList =
        filterResult.exactMatches.length > 0
          ? filterResult.exactMatches
          : filterResult.suggestions.length > 0
          ? filterResult.suggestions
          : activeList;

      if (candidateList.length > 0) {
        setSelectedProduct((prev) => {
          const currentId = prev.rawProduct?.id || prev.id;
          const stillExists = candidateList.some((c) => (c.id || c.slug) === currentId);
          return stillExists ? prev : adaptProductToGiftItem(candidateList[0]);
        });
      }
    } catch (err: any) {
      console.error('[ShopFlowContainer] Error fetching Firestore products:', err);
      setProductFetchError('Unable to load gifts from our database. Please check your connection.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [selectedOccasion, selectedRecipientGroup, specificRecipient, selectedBudget]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Step 7: Personalisation ──
  const [selectedPackaging, setSelectedPackaging] = useState(PACKAGING_OPTIONS[0]);
  const [selectedRibbon, setSelectedRibbon] = useState(RIBBON_COLORS[0]);
  const [giftMessage, setGiftMessage] = useState(
    'Wishing you a season filled with warmth, inspiring moments, and wonderful joy.'
  );
  const [hasMonogram, setHasMonogram] = useState<boolean>(false);
  const [monogramText, setMonogramText] = useState<string>('M.A.B.');
  const [openPersonaliseSection, setOpenPersonaliseSection] = useState<'packaging' | 'ribbon' | 'message' | 'engraving'>('packaging');

  // ── Step 8: Recipient & Delivery Details ──
  const [recipientName, setRecipientName] = useState<string>('Amara Adeyemi');
  const [recipientPhone, setRecipientPhone] = useState<string>('+234 802 987 6543');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    'Plot 28 Admiralty Way, Lekki Phase 1, Lagos'
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    () => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Kindly call before dispatch.');

  // ── Step 9 & 10: Checkout & Confirmation ──
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [orderRefNumber, setOrderRefNumber] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter occasions by tab category
  const displayedOccasions = useMemo(() => {
    if (occasionFilter === 'seasonal') {
      return OCCASIONS.filter((occ) => occ.category === 'seasonal');
    }
    if (occasionFilter === 'everyday') {
      return OCCASIONS.filter((occ) => occ.category === 'everyday');
    }
    return OCCASIONS;
  }, [occasionFilter]);

  // ── Displayed Gifts derived from Firestore ──
  const displayedGifts = useMemo(() => {
    if (showAllGifts) {
      return allProducts.map(adaptProductToGiftItem);
    }
    return exactMatches.map(adaptProductToGiftItem);
  }, [showAllGifts, allProducts, exactMatches]);

  const displayedSuggestions = useMemo(() => {
    return suggestions.map(adaptProductToGiftItem);
  }, [suggestions]);

  // Pricing calculations
  const packagingPrice = selectedPackaging.price;
  const monogramPrice = hasMonogram ? 2500 : 0;
  const grandTotal = selectedProduct.price + packagingPrice + monogramPrice;

  // Process checkout
  const handleProceedCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const randDigits = Math.floor(10000 + Math.random() * 90000);
      const ref = `GTC-ORD-${randDigits}`;
      setOrderRefNumber(ref);
      goToStep(10);
      if (onComplete) onComplete(ref);
    }, 750);
  };

  // Step Meta Titles
  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: { title: 'Find a Thoughtful Gift', subtitle: 'Curated gifting concierge for your special occasions' },
    2: { title: 'What’s the occasion?', subtitle: 'Select an everyday milestone or seasonal celebration' },
    3: { title: 'Who is the gift for?', subtitle: 'Select a recipient or choose shopping for yourself' },
    4: { title: 'What’s your budget?', subtitle: 'Select the anticipated investment for this gift' },
    5: { title: 'Browse Curated Gifts', subtitle: 'Gifts selected based on your occasion, recipient, and budget' },
    6: { title: 'Selected Gift Details', subtitle: 'Review the details of your chosen curation' },
    7: { title: 'Personalise Your Gift', subtitle: 'Choose presentation packaging, ribbon finish, and card message' },
    8: {
      title: selectedRecipientGroup === 'self' ? 'Your Delivery Details' : 'Add Recipient & Delivery Details',
      subtitle: selectedRecipientGroup === 'self' ? 'Specify where and when your self-care gift should be delivered' : 'Specify where and when this gift should be delivered',
    },
    9: { title: 'Review & Checkout', subtitle: 'Review your complete gift summary before placing your order' },
    10: { title: 'Order Confirmed', subtitle: 'Your thoughtful gift is registered and being handcrafted' },
  };

  // Find recipient group definition
  const currentRecipientGroupDef = RECIPIENTS.find((r) => r.id === selectedRecipientGroup);

  // Quick Add to Cart for Step 5 & 6
  const handleQuickAddToCart = (gift: GiftItem) => {
    const raw = gift.rawProduct as Product | undefined;
    const stock = raw?.stock !== undefined ? raw.stock : 999;
    if (stock <= 0) {
      setCartNotice(`"${gift.title}" is currently out of stock.`);
      setTimeout(() => setCartNotice(null), 3000);
      return;
    }

    const firstImage = raw?.images?.[0];
    const imagePayload = firstImage
      ? {
          url: typeof firstImage === 'string' ? firstImage : firstImage.url,
          publicId: typeof firstImage === 'object' ? firstImage.publicId : undefined,
          alt: typeof firstImage === 'object' ? firstImage.alt : gift.title,
        }
      : { url: gift.image, alt: gift.title };

    const result = addItem({
      productId: raw?.id || gift.id,
      slug: gift.slug || raw?.slug || gift.id,
      name: gift.title,
      unitPrice: gift.price,
      quantity: 1,
      currentStock: stock,
      image: imagePayload,
      packaging: 'Signature Presentation Box',
      ribbonColour: 'Gold Satin',
    });

    if (result.success) {
      setCartNotice(`Added "${gift.title}" to your cart.`);
      setTimeout(() => setCartNotice(null), 3500);
    } else {
      setCartNotice(result.message);
      setTimeout(() => setCartNotice(null), 4000);
    }
  };

  // Add Personalised Gift to Cart from Step 7
  const handleAddPersonalisedToCart = () => {
    const raw = selectedProduct.rawProduct as Product | undefined;
    const stock = raw?.stock !== undefined ? raw.stock : 999;
    if (stock <= 0) {
      setCartNotice(`"${selectedProduct.title}" is currently out of stock.`);
      setTimeout(() => setCartNotice(null), 3000);
      return;
    }

    const firstImage = raw?.images?.[0];
    const imagePayload = firstImage
      ? {
          url: typeof firstImage === 'string' ? firstImage : firstImage.url,
          publicId: typeof firstImage === 'object' ? firstImage.publicId : undefined,
          alt: typeof firstImage === 'object' ? firstImage.alt : selectedProduct.title,
        }
      : { url: selectedProduct.image, alt: selectedProduct.title };

    const calculatedUnitPrice = selectedProduct.price + packagingPrice + monogramPrice;

    const result = addItem({
      productId: raw?.id || selectedProduct.id,
      slug: selectedProduct.slug || raw?.slug || selectedProduct.id,
      name: selectedProduct.title,
      unitPrice: calculatedUnitPrice,
      quantity: 1,
      currentStock: stock,
      image: imagePayload,
      packaging: selectedPackaging.name,
      ribbonColour: selectedRibbon.name,
      giftMessage: giftMessage.trim() || undefined,
      personalisationText: hasMonogram ? monogramText.trim() || undefined : undefined,
    });

    if (result.success) {
      setLastAddedName(selectedProduct.title);
      setAddedModalOpen(true);
    } else {
      setCartNotice(result.message);
      setTimeout(() => setCartNotice(null), 4000);
    }
  };

  // Helper to render high-finish product card
  const renderProductCard = (gift: GiftItem, isSuggested = false) => {
    const isSelected = (selectedProduct.slug || selectedProduct.id) === (gift.slug || gift.id);
    const raw = gift.rawProduct as Product | undefined;
    const isOutOfStock = raw?.stock !== undefined && raw.stock <= 0;
    const isLowStock = raw?.stock !== undefined && raw.stock > 0 && raw.stock <= 3;

    return (
      <div
        key={gift.id || gift.slug}
        className={`group rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 ${
          isSelected
            ? 'bg-white border-brand-dark ring-2 ring-brand-dark shadow-md'
            : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
        }`}
      >
        <div
          onClick={() => {
            if (!isOutOfStock) {
              setSelectedProduct(gift);
              goToStep(6);
            }
          }}
          className={`relative aspect-[4/3] overflow-hidden bg-brand-cream/80 ${
            isOutOfStock ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <img
            src={gift.image}
            alt={gift.alt}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {isSuggested && (
              <span className="px-2.5 py-0.5 rounded-full bg-gold-600 text-white text-[9px] font-sans font-bold uppercase tracking-wider shadow-xs">
                Suggested Match
              </span>
            )}
            {!isSuggested && gift.badge && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-dark text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                {gift.badge}
              </span>
            )}
            {isLowStock && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-sans font-semibold uppercase tracking-wider">
                Only {raw?.stock} left
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2.5 py-0.5 rounded-full bg-stone-700 text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                Out of Stock
              </span>
            )}
          </div>

          {isSelected && (
            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-gold-600 text-white text-[10px] font-sans font-bold shadow-xs">
              ✓ Selected
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-gold-600 truncate">
                {gift.subtitle}
              </span>
              {gift.slug && (
                <Link
                  to={`/shop/product/${gift.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] font-sans text-brand-medium/70 hover:text-brand-dark inline-flex items-center gap-0.5 underline shrink-0"
                  title="Open full product page in new tab"
                >
                  Details <ExternalLink size={10} />
                </Link>
              )}
            </div>

            <h4
              onClick={() => {
                if (!isOutOfStock) {
                  setSelectedProduct(gift);
                  goToStep(6);
                }
              }}
              className="font-serif text-base font-medium text-brand-dark mb-1 line-clamp-1 cursor-pointer hover:text-gold-700 transition-colors"
            >
              {gift.title}
            </h4>
            <p className="font-sans text-xs text-brand-medium leading-relaxed mb-3 line-clamp-2">
              {gift.description}
            </p>
          </div>

          <div className="pt-3 border-t border-brand-dark/10 flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className="font-serif text-base font-bold text-brand-dark">
                  {gift.formattedPrice}
                </span>
                {raw?.compareAtPrice && (
                  <span className="font-sans text-[11px] text-brand-light line-through">
                    ₦{raw.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  if (!isOutOfStock) {
                    setSelectedProduct(gift);
                    goToStep(6);
                  }
                }}
                className="text-xs font-sans font-semibold text-gold-700 hover:text-gold-900 cursor-pointer underline flex items-center gap-0.5"
              >
                <span>Select & Personalise</span>
                <span>→</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAddToCart(gift);
              }}
              className={`w-full py-2 rounded-xl font-sans text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isOutOfStock
                  ? 'bg-brand-dark/15 text-brand-medium/50 cursor-not-allowed border border-brand-dark/5'
                  : 'bg-brand-dark text-white hover:bg-gold-600 active:scale-[0.99] shadow-xs'
              }`}
            >
              <ShoppingBag size={13} />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Gifting Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-4xl mx-auto bg-white rounded-3xl border border-brand-dark/10 shadow-[0_12px_40px_rgba(28,20,14,0.06)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* ── Top Header & Subtle Progress Line ── */}
      <div className="bg-[#FAF8F5] border-b border-brand-dark/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-600">
              Good Things Co. · Gifting Concierge
            </span>
          </div>

          <div className="flex items-center gap-2 font-sans text-xs">
            <span className="font-bold text-brand-dark">Step {currentStep} of 10</span>
            <span className="text-brand-light">({Math.round((currentStep / 10) * 100)}%)</span>
          </div>
        </div>

        {/* Thin progress line */}
        <div className="w-full bg-brand-dark/10 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-brand-dark h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Step Title & Subtitle */}
        <div className="text-left">
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight">
            {stepMeta[currentStep]?.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-medium/85 mt-1">
            {stepMeta[currentStep]?.subtitle}
          </p>
        </div>
      </div>

      {/* ── Main Dynamic Flow Body: Only Active Step Rendered ── */}
      <div className="p-6 sm:p-8 md:p-10 min-h-[380px] flex flex-col justify-between">
        {/* =========================================================
            STEP 1 — SHOP INTRO
            ========================================================= */}
        {currentStep === 1 && (
          <div key="step-1" className="space-y-6 animate-fade-in text-center sm:text-left py-4">
            <div className="max-w-xl">
              <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold-600 block mb-2">
                Personal Gifting Made Effortless
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal mb-3">
                Find a thoughtful gift.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/85 leading-relaxed mb-6">
                Choose the occasion, who it is for, and your budget, and we’ll help you find suitable gifts.
              </p>
            </div>

            {/* 3 Quick Step Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">🎯</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  1. Guided Discovery
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  Select occasion, recipient, and budget for bespoke suggestions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">✨</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  2. Personalise
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  Pick your packaging, silk ribbon, and handwritten card note.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 text-left">
                <span className="text-xl mb-2 block">📦</span>
                <h4 className="font-serif text-sm font-semibold text-brand-dark mb-1">
                  3. Doorstep Delivery
                </h4>
                <p className="font-sans text-xs text-brand-medium/80">
                  White-glove doorstep delivery direct to recipient or yourself.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto px-9 py-4 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Start Shopping →
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2 — CHOOSE AN OCCASION
            ========================================================= */}
        {currentStep === 2 && (
          <div key="step-2" className="space-y-6 animate-fade-in">
            {/* Occasion Category Filter Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => setOccasionFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  occasionFilter === 'all'
                    ? 'bg-brand-dark text-white font-semibold shadow-xs'
                    : 'bg-[#FAF8F5] text-brand-dark/75 hover:text-brand-dark border border-brand-dark/10'
                }`}
              >
                All Occasions ({OCCASIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setOccasionFilter('seasonal')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                  occasionFilter === 'seasonal'
                    ? 'bg-gold-600 text-white font-semibold shadow-xs'
                    : 'bg-gold-50/80 text-gold-800 hover:bg-gold-100 border border-gold-200/60'
                }`}
              >
                <span>✦ Seasonal Celebrations (6)</span>
              </button>
              <button
                type="button"
                onClick={() => setOccasionFilter('everyday')}
                className={`px-4 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  occasionFilter === 'everyday'
                    ? 'bg-brand-dark text-white font-semibold shadow-xs'
                    : 'bg-[#FAF8F5] text-brand-dark/75 hover:text-brand-dark border border-brand-dark/10'
                }`}
              >
                Everyday & Milestones (4)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedOccasions.map((occ) => {
                const isSelected = selectedOccasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setSelectedOccasion(occ.id)}
                    className={`p-6 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark ring-1 ring-brand-dark shadow-md'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-lg font-medium">{occ.label}</h3>
                        {occ.category === 'seasonal' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-wider uppercase ${
                              isSelected
                                ? 'bg-gold-500/25 text-gold-200'
                                : 'bg-gold-100 text-gold-700'
                            }`}
                          >
                            Seasonal
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-sans text-xs ${
                          isSelected ? 'text-brand-ivory/80' : 'text-brand-medium/70'
                        }`}
                      >
                        {occ.tagline}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500 text-white font-bold'
                          : 'border-brand-dark/20 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3 — CHOOSE RECIPIENT (Progressive Disclosure)
            ========================================================= */}
        {currentStep === 3 && (
          <div key="step-3" className="space-y-6 animate-fade-in">
            {/* Top-Level Choices */}
            <div>
              <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block mb-3">
                Recipient Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {RECIPIENTS.map((rec) => {
                  const isSelected = selectedRecipientGroup === rec.id;
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipientGroup(rec.id);
                        if (rec.id === 'family') setSpecificRecipient('mum');
                        else if (rec.id === 'business') setSpecificRecipient('colleague');
                        else if (rec.id === 'self') {
                          setSpecificRecipient('self');
                          if (giftMessage.startsWith('Wishing you')) {
                            setGiftMessage(
                              'A thoughtful treat for myself — celebrating this moment with intention and care.'
                            );
                          }
                        } else {
                          setSpecificRecipient(rec.id);
                        }
                      }}
                      className={`py-3.5 px-3 rounded-2xl text-center border font-sans text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-dark text-brand-ivory border-brand-dark font-bold shadow-2xs ring-1 ring-brand-dark'
                          : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                      }`}
                    >
                      {rec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shopping for Self Highlight Banner */}
            {selectedRecipientGroup === 'self' && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-gold-50/80 via-white to-gold-50/60 border border-gold-200/70 animate-fade-in flex items-start sm:items-center gap-3.5 text-left">
                <span className="w-8 h-8 rounded-full bg-gold-500/15 text-gold-700 flex items-center justify-center text-sm font-serif font-bold shrink-0 mt-0.5 sm:mt-0">
                  ✦
                </span>
                <div>
                  <h4 className="font-sans text-xs font-bold text-brand-dark">
                    Curated Treat for Yourself
                  </h4>
                  <p className="font-sans text-xs text-brand-medium/90 mt-0.5">
                    Every order is hand-packaged with our full signature presentation box, satin ribbon, and personalized card to celebrate your moments.
                  </p>
                </div>
              </div>
            )}

            {/* Progressive Disclosure Sub-options */}
            {currentRecipientGroupDef?.hasSuboptions && currentRecipientGroupDef.suboptions && (
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark">
                    Specific {currentRecipientGroupDef.label} Recipient
                  </label>
                  <span className="font-sans text-xs text-gold-700 font-semibold capitalize">
                    {specificRecipient}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentRecipientGroupDef.suboptions.map((sub) => {
                    const isSubSelected = specificRecipient === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSpecificRecipient(sub.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer border ${
                          isSubSelected
                            ? 'bg-brand-dark text-brand-ivory border-brand-dark font-semibold shadow-2xs'
                            : 'bg-white text-brand-dark/80 hover:text-brand-dark border-brand-dark/15 hover:border-brand-dark/30'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STEP 4 — CHOOSE BUDGET
            ========================================================= */}
        {currentStep === 4 && (
          <div key="step-4" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUDGET_TIERS.map((tier) => {
                const isSelected = selectedBudget === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedBudget(tier.id)}
                    className={`p-6 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-dark text-brand-ivory border-brand-dark ring-1 ring-brand-dark shadow-md'
                        : 'bg-[#FAF8F5] text-brand-dark border-brand-dark/10 hover:border-brand-dark/30 hover:bg-white'
                    }`}
                  >
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-1">{tier.label}</h3>
                      <p
                        className={`font-sans text-xs ${
                          isSelected ? 'text-brand-ivory/80' : 'text-brand-medium/70'
                        }`}
                      >
                        {tier.id === 'under-25k' && 'Thoughtful daily rituals & stationery'}
                        {tier.id === '25k-50k' && 'Signature homeware, scents & wellness'}
                        {tier.id === '50k-100k' && 'Timepieces & fine handcrafted leather'}
                        {tier.id === 'premium' && 'Collector hampers & bespoke trunks'}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500 text-white font-bold'
                          : 'border-brand-dark/20 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5 — BROWSE CURATED GIFTS
            ========================================================= */}
        {currentStep === 5 && (
          <div key="step-5" className="space-y-5 animate-fade-in">
            {/* Active Filters Bar with quick edit capability */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-light">
                  Active Filters:
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-brand-dark/10 font-sans text-xs text-brand-dark capitalize">
                  Occasion: {selectedOccasion.replace(/-/g, ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-brand-dark/10 font-sans text-xs text-brand-dark capitalize">
                  Recipient: {selectedRecipientGroup === 'self' ? 'Shopping for Self' : (specificRecipient || selectedRecipientGroup)}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white border border-brand-dark/10 font-sans text-xs text-brand-dark">
                  Budget: {BUDGET_TIERS.find((b) => b.id === selectedBudget)?.label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {showAllGifts && (
                  <button
                    type="button"
                    onClick={() => setShowAllGifts(false)}
                    className="text-xs font-sans text-brand-medium hover:text-brand-dark cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset to Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="text-xs font-sans font-semibold text-gold-700 underline hover:text-gold-900 cursor-pointer"
                >
                  Edit Filters
                </button>
              </div>
            </div>

            {/* Notification if showing all gifts */}
            {showAllGifts && (
              <div className="p-3.5 px-4 rounded-xl bg-gold-50/80 border border-gold-200/80 flex items-center justify-between gap-3 text-xs font-sans text-brand-dark animate-fade-in">
                <span>Displaying all {allProducts.length} curations from our live atelier collection.</span>
                <button
                  type="button"
                  onClick={() => setShowAllGifts(false)}
                  className="text-gold-800 underline font-semibold cursor-pointer"
                >
                  Return to Filtered
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoadingProducts && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
                <Loader2 size={32} className="animate-spin text-gold-600" />
                <p className="font-serif text-lg text-brand-dark">Curating your selections...</p>
                <p className="font-sans text-xs text-brand-medium/75">
                  Reading live curations from our Firestore database
                </p>
              </div>
            )}

            {/* Error State */}
            {!isLoadingProducts && productFetchError && (
              <div className="p-6 rounded-2xl bg-rose-50/80 border border-rose-200 text-center space-y-3">
                <AlertCircle size={32} className="text-rose-600 mx-auto" />
                <p className="font-serif text-lg text-brand-dark">Unable to load curations</p>
                <p className="font-sans text-xs text-brand-medium">{productFetchError}</p>
                <button
                  type="button"
                  onClick={fetchProducts}
                  className="px-4 py-2 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold hover:bg-gold-600 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Main Product Browsing Grid: Exactly matching products */}
            {!isLoadingProducts && !productFetchError && displayedGifts.length > 0 && (
              <div className="max-h-[520px] overflow-y-auto pr-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedGifts.map((gift) => renderProductCard(gift))}
                </div>
              </div>
            )}

            {/* No Results State */}
            {!isLoadingProducts && !productFetchError && displayedGifts.length === 0 && (
              <div className="space-y-6">
                <div className="p-8 sm:p-10 rounded-3xl bg-[#FAF8F5] border border-brand-dark/10 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center mx-auto text-xl font-serif">
                    ✦
                  </div>
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl text-brand-dark font-medium mb-1">
                      We couldn't find an exact match.
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-brand-medium/85 max-w-md mx-auto leading-relaxed">
                      We couldn't find a live curation tailored for{' '}
                      <strong className="text-brand-dark capitalize">
                        {selectedOccasion.replace(/-/g, ' ')}
                      </strong>
                      , recipient{' '}
                      <strong className="text-brand-dark capitalize">
                        {selectedRecipientGroup === 'self'
                          ? 'Shopping for Self'
                          : specificRecipient || selectedRecipientGroup}
                      </strong>{' '}
                      within your selected budget.
                    </p>
                  </div>

                  {/* Filter Modification Options */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-brand-dark/15 text-brand-dark font-sans text-xs font-medium hover:border-brand-dark transition-colors cursor-pointer"
                    >
                      Change Occasion
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-brand-dark/15 text-brand-dark font-sans text-xs font-medium hover:border-brand-dark transition-colors cursor-pointer"
                    >
                      Change Recipient
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(4)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-brand-dark/15 text-brand-dark font-sans text-xs font-medium hover:border-brand-dark transition-colors cursor-pointer"
                    >
                      Change Budget
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAllGifts(true)}
                      className="px-3.5 py-2 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold hover:bg-gold-600 transition-colors cursor-pointer"
                    >
                      View All Atelier Gifts ({allProducts.length})
                    </button>
                  </div>
                </div>

                {/* Broader Suggested Alternatives */}
                {displayedSuggestions.length > 0 && (
                  <div className="pt-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-gold-600" />
                      <h4 className="font-serif text-lg text-brand-dark font-medium">
                        You might also consider these curations:
                      </h4>
                    </div>
                    <p className="font-sans text-xs text-brand-medium/75 -mt-2">
                      Broadened recommendations based on your preferences
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedSuggestions.map((gift) => renderProductCard(gift, true))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            STEP 6 — SELECT GIFT (DETAILS)
            ========================================================= */}
        {currentStep === 6 && (
          <div key="step-6" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Product Image (5 cols) */}
              <div className="md:col-span-5 rounded-2xl overflow-hidden border border-brand-dark/10 bg-[#FAF8F5] aspect-[4/3] sm:aspect-square relative">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.alt}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover object-center"
                />
                {selectedProduct.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-brand-dark text-white text-[9px] font-sans font-bold uppercase tracking-wider">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>

              {/* Product Editorial Details (7 cols) */}
              <div className="md:col-span-7 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
                    {selectedProduct.subtitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(5)}
                    className="text-xs font-sans text-brand-dark underline font-semibold cursor-pointer"
                  >
                    Change Gift
                  </button>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                  {selectedProduct.title}
                </h3>

                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-2xl text-brand-dark font-bold">
                    {selectedProduct.formattedPrice}
                  </span>
                  {selectedProduct.rawProduct?.compareAtPrice && (
                    <span className="font-sans text-sm text-brand-light line-through">
                      ₦{selectedProduct.rawProduct.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                  {selectedProduct.rawProduct?.stock !== undefined && (
                    <span className="text-xs font-sans font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      In Stock ({selectedProduct.rawProduct.stock} available)
                    </span>
                  )}
                </div>

                <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* What's Included */}
                <div className="pt-2">
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block mb-2">
                    Included in this curation:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.included.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark text-xs font-sans font-medium"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Personalisation Badge Notice */}
                {selectedProduct.rawProduct?.personalisation?.enabled && (
                  <div className="p-3 rounded-xl bg-gold-50/70 border border-gold-200/60 text-xs font-sans text-brand-dark flex items-center gap-2">
                    <Sparkles size={14} className="text-gold-600 shrink-0" />
                    <span>Personalisation available: Custom presentation box, satin ribbon & handwritten wax-sealed card.</span>
                  </div>
                )}

                {/* Dedicated Product Detail Route Link */}
                {selectedProduct.slug && (
                  <div className="pt-1">
                    <Link
                      to={`/shop/product/${selectedProduct.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-gold-700 hover:text-gold-900 underline"
                    >
                      View Full Atelier Product Page <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                {/* Preserved Criteria Summary */}
                <div className="pt-4 border-t border-brand-dark/10 flex flex-wrap gap-2 text-[11px] font-sans text-brand-medium">
                  <span>
                    Occasion:{' '}
                    <strong className="text-brand-dark">
                      {OCCASIONS.find((o) => o.id === selectedOccasion)?.label || selectedOccasion}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Recipient:{' '}
                    <strong className="text-brand-dark">
                      {selectedRecipientGroup === 'self'
                        ? 'Shopping for Self'
                        : specificRecipient || selectedRecipientGroup}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Budget:{' '}
                    <strong className="text-brand-dark">
                      {BUDGET_TIERS.find((b) => b.id === selectedBudget)?.label}
                    </strong>
                  </span>
                </div>

                {/* Step 6 Action CTAs */}
                <div className="pt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAddToCart(selectedProduct)}
                    className="px-5 py-2.5 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ShoppingBag size={14} />
                    <span>Add to Gifting Cart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(7)}
                    className="px-5 py-2.5 rounded-xl border border-brand-dark/20 text-brand-dark hover:border-brand-dark font-sans text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Personalise This Gift →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 7 — PERSONALISE YOUR GIFT
            ========================================================= */}
        {currentStep === 7 && (
          <div key="step-7" className="space-y-4 animate-fade-in text-left">
            {/* 1. Packaging Finish */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'packaging' ? 'ribbon' : 'packaging')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Packaging Type</h4>
                    <span className="font-sans text-xs text-brand-medium">
                      {selectedPackaging.name} (+₦{selectedPackaging.price.toLocaleString()})
                    </span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'packaging' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'packaging' && (
                <div className="p-5 border-t border-brand-dark/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                  {PACKAGING_OPTIONS.map((pkg) => {
                    const isSelected = selectedPackaging.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackaging(pkg)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-white border-gold-600 ring-1 ring-gold-600 shadow-2xs'
                            : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif text-xs font-bold text-brand-dark">{pkg.name}</span>
                          <span className="font-sans text-xs text-gold-700 font-semibold">+₦{pkg.price.toLocaleString()}</span>
                        </div>
                        <p className="font-sans text-[11px] text-brand-medium/80 leading-snug">{pkg.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Ribbon Colour */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'ribbon' ? 'message' : 'ribbon')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Ribbon Colour</h4>
                    <span className="font-sans text-xs text-brand-medium">{selectedRibbon.name}</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'ribbon' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'ribbon' && (
                <div className="p-5 border-t border-brand-dark/10 flex flex-wrap gap-2.5 bg-white">
                  {RIBBON_COLORS.map((ribbon) => {
                    const isSelected = selectedRibbon.id === ribbon.id;
                    return (
                      <button
                        key={ribbon.id}
                        type="button"
                        onClick={() => setSelectedRibbon(ribbon)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-brand-dark ring-1 ring-brand-dark shadow-2xs font-semibold'
                            : 'bg-[#FAF8F5] border-brand-dark/10 hover:border-brand-dark/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: ribbon.hex }}
                        />
                        <span className="text-xs font-sans text-brand-dark">{ribbon.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Add a Message */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'message' ? 'engraving' : 'message')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Handwritten Card Message</h4>
                    <span className="font-sans text-xs text-brand-medium">Calligraphed on archival letterpress card</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'message' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'message' && (
                <div className="p-5 border-t border-brand-dark/10 bg-white">
                  <textarea
                    rows={3}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Write your personal message..."
                    className="w-full p-3.5 rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] font-sans text-brand-light">
                    <span>Complimentary calligraphy card included with every gift</span>
                    <span>{giftMessage.length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Add Personalisation (Engraving) */}
            <div className="border border-brand-dark/10 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenPersonaliseSection(openPersonaliseSection === 'engraving' ? 'packaging' : 'engraving')
                }
                className="w-full p-4.5 bg-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark">Personalisation / Monogram</h4>
                    <span className="font-sans text-xs text-brand-medium">
                      {hasMonogram ? `Engraved: "${monogramText}" (+₦2,500)` : 'Optional custom name or monogram initials'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-dark">
                  {openPersonaliseSection === 'engraving' ? '▲' : '▼'}
                </span>
              </button>

              {openPersonaliseSection === 'engraving' && (
                <div className="p-5 border-t border-brand-dark/10 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-sans text-xs font-bold text-brand-dark">
                        Enable Laser Monogram or Name (+₦2,500)
                      </h5>
                      <p className="font-sans text-xs text-brand-medium">
                        Custom laser-engraved initials or name onto item or gift box plaque.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasMonogram}
                      onChange={(e) => setHasMonogram(e.target.checked)}
                      className="w-5 h-5 rounded accent-brand-dark cursor-pointer"
                    />
                  </div>

                  {hasMonogram && (
                    <div className="pt-2 animate-fade-in">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                        Initials or Full Name
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={monogramText}
                        onChange={(e) => setMonogramText(e.target.value)}
                        placeholder="e.g. M.A.B. or Olabisi"
                        className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-brand-dark/15 text-xs font-sans uppercase tracking-widest font-semibold"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 7 Add Personalised Gift CTA bar */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-serif text-sm sm:text-base font-semibold text-brand-dark block">
                  Add This Personalised Curation to Your Cart
                </span>
                <span className="font-sans text-xs text-brand-medium">
                  {selectedPackaging.name} · {selectedRibbon.name} {hasMonogram ? `· Monogram "${monogramText}"` : ''} · Complimentary Handwritten Card
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddPersonalisedToCart}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag size={14} />
                <span>Add to Gifting Cart</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 8 — RECIPIENT & DELIVERY DETAILS
            ========================================================= */}
        {currentStep === 8 && (
          <div key="step-8" className="space-y-6 animate-fade-in text-left">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-dark block">
                  {selectedRecipientGroup === 'self'
                    ? 'Your Details & Delivery Information'
                    : 'Direct Recipient & Delivery Information'}
                </span>
                {selectedRecipientGroup === 'self' && (
                  <span className="text-[10px] font-sans font-semibold text-gold-700 bg-gold-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Shopping for Self
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    {selectedRecipientGroup === 'self' ? 'Your Full Name' : 'Recipient Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={selectedRecipientGroup === 'self' ? 'Your name' : 'e.g. Amara Adeyemi'}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    {selectedRecipientGroup === 'self' ? 'Your Phone Number' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. +234 802 987 6543"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street, Apartment/Suite, City, State"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Preferred Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-dark block mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Call upon arrival, leave with concierge"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-brand-dark/15 text-xs font-sans focus:outline-none focus:border-brand-dark"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 9 — CHECKOUT
            ========================================================= */}
        {currentStep === 9 && (
          <div key="step-9" className="space-y-6 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Order Summary */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Complete Gift Summary
                </span>

                <div className="flex items-center gap-4 pb-3 border-b border-brand-dark/10">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.alt}
                    className="w-16 h-16 object-cover rounded-xl border border-brand-dark/10 bg-white"
                  />
                  <div>
                    <h4 className="font-serif text-base text-brand-dark font-medium">
                      {selectedProduct.title}
                    </h4>
                    <span className="text-xs font-sans text-brand-medium">
                      {selectedProduct.formattedPrice}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-sans text-brand-medium">
                  <div className="flex justify-between">
                    <span>Packaging:</span>
                    <strong className="text-brand-dark">{selectedPackaging.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ribbon Colour:</span>
                    <strong className="text-brand-dark">{selectedRibbon.name}</strong>
                  </div>
                  {hasMonogram && (
                    <div className="flex justify-between">
                      <span>Monogram Engraving:</span>
                      <strong className="text-brand-dark">"{monogramText}"</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{selectedRecipientGroup === 'self' ? 'Customer / Recipient:' : 'Recipient:'}</span>
                    <strong className="text-brand-dark">
                      {recipientName} {selectedRecipientGroup === 'self' ? '(Self)' : ''}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Date:</span>
                    <strong className="text-brand-dark">{deliveryDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <strong className="text-brand-dark line-clamp-1">{deliveryAddress}</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Breakdown & Payment Method */}
              <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gold-600 block">
                  Payment & Total
                </span>

                <div className="space-y-2 text-xs font-sans text-brand-medium pb-4 border-b border-brand-dark/10">
                  <div className="flex justify-between">
                    <span>Base Gift:</span>
                    <span>{selectedProduct.formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{selectedPackaging.name}:</span>
                    <span>+₦{packagingPrice.toLocaleString()}</span>
                  </div>
                  {hasMonogram && (
                    <div className="flex justify-between">
                      <span>Laser Personalisation:</span>
                      <span>+₦{monogramPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>White-Glove Doorstep Delivery:</span>
                    <span className="text-green-700 font-semibold">Complimentary</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-sans text-xs uppercase font-bold text-brand-dark">Grand Total</span>
                  <span className="font-serif text-2xl text-brand-dark font-bold">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* Payment Options Selection */}
                <div className="pt-2 space-y-2">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark block">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-sans text-center transition-all ${
                        paymentMethod === 'card'
                          ? 'border-brand-dark bg-brand-dark text-white font-bold'
                          : 'border-brand-dark/15 bg-[#FAF8F5] text-brand-dark hover:border-brand-dark/30'
                      }`}
                    >
                      Debit / Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 rounded-xl border text-xs font-sans text-center transition-all ${
                        paymentMethod === 'transfer'
                          ? 'border-brand-dark bg-brand-dark text-white font-bold'
                          : 'border-brand-dark/15 bg-[#FAF8F5] text-brand-dark hover:border-brand-dark/30'
                      }`}
                    >
                      Bank Transfer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 10 — ORDER CONFIRMATION & TRACKING
            ========================================================= */}
        {currentStep === 10 && (
          <div key="step-10" className="space-y-6 animate-fade-in text-left">
            {/* Confirmation Banner */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 font-sans text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Order Confirmed & Processing</span>
                </div>
                <h3 className="font-serif text-2xl text-brand-dark font-normal">
                  Order Reference: #{orderRefNumber}
                </h3>
                <p className="font-sans text-xs text-brand-medium mt-1">
                  {selectedRecipientGroup === 'self' ? (
                    <>Thank you! Your personal treat for <strong className="text-brand-dark">{recipientName}</strong> is registered.</>
                  ) : (
                    <>Thank you! Your gift for <strong className="text-brand-dark">{recipientName}</strong> is registered.</>
                  )}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-sans text-brand-light block">Amount Paid</span>
                <span className="font-serif text-2xl text-gold-700 font-bold">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── 4-Stage Fulfillment Order Tracking ── */}
            <div className="p-6 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600 block">
                  Delivery Status Tracker
                </span>
                <span className="text-xs font-sans text-green-700 font-semibold">
                  Status: Preparing Gift
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'conf', label: '1. Confirmed', desc: 'Order verified & queued', done: true, active: false },
                  { id: 'prep', label: '2. Preparing', desc: 'Handcrafted & ribbon tied', done: false, active: true },
                  { id: 'out', label: '3. Out for Delivery', desc: 'Dispatched with courier', done: false, active: false },
                  { id: 'deliv', label: '4. Delivered', desc: 'Signed & gifted', done: false, active: false },
                ].map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-brand-dark/10 bg-[#FAF8F5]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold ${
                          st.done
                            ? 'bg-gold-600 text-white'
                            : st.active
                            ? 'bg-brand-dark text-white ring-2 ring-brand-dark/20 animate-pulse'
                            : 'bg-brand-dark/10 text-brand-dark/40'
                        }`}
                      >
                        {st.done ? '✓' : ''}
                      </div>
                      <span className="font-sans text-xs font-bold text-brand-dark">{st.label}</span>
                    </div>
                    <p className="font-sans text-[11px] text-brand-medium/70 leading-snug">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient & Dispatch Snapshot */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-brand-dark/10 flex flex-col sm:flex-row justify-between gap-4 text-xs font-sans text-brand-medium">
              <div>
                <span className="font-bold text-brand-dark block mb-1">Delivering To:</span>
                <p>{recipientName} · {recipientPhone}</p>
                <p>{deliveryAddress}</p>
              </div>
              <div>
                <span className="font-bold text-brand-dark block mb-1">Target Date:</span>
                <p className="text-gold-700 font-semibold">{deliveryDate}</p>
              </div>
            </div>

            {/* Step 10 Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-dark/10">
              <button
                type="button"
                onClick={() => alert(`Downloading official receipt for order #${orderRefNumber}...`)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-brand-dark/20 text-brand-dark hover:border-brand-dark font-sans text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
              >
                📥 Download Order Receipt
              </button>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Start Another Gift Order →
              </button>
            </div>
          </div>
        )}

        {/* ── Persistent Bottom Navigation Controls (Steps 2 to 9) ── */}
        {currentStep > 1 && currentStep < 10 && (
          <div className="pt-6 mt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-gold-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>← Back</span>
            </button>

            {/* Step Status Pill */}
            <div className="text-xs font-sans text-brand-light hidden sm:block">
              {currentStep === 2 && <span>Occasion: <strong className="text-brand-dark capitalize">{selectedOccasion}</strong></span>}
              {currentStep === 3 && <span>Recipient: <strong className="text-brand-dark capitalize">{specificRecipient || selectedRecipientGroup}</strong></span>}
              {currentStep === 4 && <span>Budget: <strong className="text-brand-dark">{BUDGET_TIERS.find(b => b.id === selectedBudget)?.label}</strong></span>}
              {currentStep === 5 && <span>Selecting Gift</span>}
              {currentStep === 6 && <span>Gift: <strong className="text-brand-dark">{selectedProduct.title}</strong></span>}
              {currentStep === 7 && <span>Total: <strong className="text-brand-dark">₦{grandTotal.toLocaleString()}</strong></span>}
              {currentStep === 8 && <span>Direct Delivery: <strong className="text-brand-dark">{recipientName}</strong></span>}
              {currentStep === 9 && <span>Total to pay: <strong className="text-brand-dark">₦{grandTotal.toLocaleString()}</strong></span>}
            </div>

            {/* Continue Button or Checkout Button */}
            {currentStep === 9 ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProceedCheckout}
                className="w-full sm:w-auto px-10 py-3.5 bg-brand-dark hover:bg-gold-600 text-white font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isProcessing ? 'Processing...' : 'Complete Order & Pay →'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-dark text-white hover:bg-gold-600 font-sans text-xs font-semibold tracking-widest uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Added to Cart Modal */}
      {addedModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-dark/10 text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>

            <h3 className="font-serif text-2xl text-brand-dark font-normal">
              Added to Cart
            </h3>

            <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed">
              <strong className="text-brand-dark font-semibold">"{lastAddedName}"</strong> has been added to your cart with your personalized presentation options.
            </p>

            <div className="pt-3 flex flex-col gap-2.5">
              <Link
                to="/cart"
                onClick={() => setAddedModalOpen(false)}
                className="w-full py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-[0.16em] hover:bg-gold-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Cart & Checkout ({getCartCount()})</span>
                <span>→</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setAddedModalOpen(false);
                  goToStep(5);
                }}
                className="w-full py-3 rounded-xl bg-brand-cream/80 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-brand-cream transition-colors cursor-pointer"
              >
                Continue Gifting Discovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {cartNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark text-white px-5 py-3.5 rounded-xl shadow-2xl font-sans text-xs font-medium flex items-center gap-2.5 border border-white/10 animate-fade-in">
          <CheckCircle2 size={16} className="text-gold-400 shrink-0" />
          <span>{cartNotice}</span>
        </div>
      )}
    </div>
  );
};

export default ShopFlowContainer;
