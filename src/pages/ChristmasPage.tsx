import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { getActiveProducts } from '../services/productService';
import {
  GIFTS_CATALOG,
  getPackagingOptions,
  PackagingOption,
  RIBBON_COLORS,
  GiftItem,
} from '../data/giftsData';
import { getPublicStoreSettings } from '../services/settingsService';
import { adaptProductToGiftItem } from '../utils/productAdapter';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';
import {
  ShoppingBag,
  Sparkles,
  Check,
  X,
  Share2,
  Copy,
  ChevronRight,
  Loader2,
  AlertCircle,
  Gift,
} from 'lucide-react';

export default function ChristmasPage() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [products, setProducts] = useState<GiftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Personalisation Drawer State
  const [personalisingProduct, setPersonalisingProduct] = useState<GiftItem | null>(null);
  const [selectedModalImageIndex, setSelectedModalImageIndex] = useState<number>(0);
  const [packagingList, setPackagingList] = useState<PackagingOption[]>(() => getPackagingOptions());
  const [selectedPackaging, setSelectedPackaging] = useState<PackagingOption>(() => {
    const opts = getPackagingOptions();
    const festive = opts.find((p) => p.id.includes('festive') || p.name.toLowerCase().includes('festive'));
    return festive || opts[0];
  });
  const [ribbonList, setRibbonList] = useState<any[]>(() => RIBBON_COLORS);
  const [selectedRibbon, setSelectedRibbon] = useState(RIBBON_COLORS[0]);
  const [giftMessage, setGiftMessage] = useState<string>('');

  // Cart Notice State
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [addedModalOpen, setAddedModalOpen] = useState<boolean>(false);
  const [lastAddedTitle, setLastAddedTitle] = useState<string>('');

  // ── 1. Fetch Christmas Products (Live Firestore + Fallback Data) ──
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getActiveProducts(true).catch(() => []),
      getPublicStoreSettings().catch(() => null),
    ])
      .then(([liveProducts, storeSettings]) => {
        if (!isMounted) return;

        // Packaging & Ribbon Settings
        if (storeSettings) {
          const opts = getPackagingOptions(storeSettings.packaging);
          setPackagingList(opts);
          const festive = opts.find((p) => p.id.includes('festive') || p.name.toLowerCase().includes('festive'));
          if (festive) setSelectedPackaging(festive);

          if (storeSettings.packaging?.ribbons && storeSettings.packaging.ribbons.length > 0) {
            const activeRibbons = storeSettings.packaging.ribbons.filter((r: any) => r.enabled !== false);
            if (activeRibbons.length > 0) {
              setRibbonList(activeRibbons);
              setSelectedRibbon(activeRibbons[0]);
            }
          }
        }

        // Filter for Christmas products from live Firestore
        const liveChristmas = liveProducts
          .filter((p) => {
            const occMatch = p.occasions?.some((o) => o.toLowerCase() === 'christmas' || o.toLowerCase() === 'seasonal');
            const catMatch = p.category?.toLowerCase().includes('christmas') || p.category?.toLowerCase().includes('festive');
            return occMatch || catMatch;
          })
          .map((p) => adaptProductToGiftItem(p));

        // Curated Christmas products from local catalog
        const localChristmas = GIFTS_CATALOG.filter((g: GiftItem) =>
          g.occasions?.some((o: string) => o === 'christmas' || o === 'seasonal')
        );

        // Deduplicate by ID and slug
        const seenIds = new Set<string>();
        const combined: GiftItem[] = [];

        for (const item of [...liveChristmas, ...localChristmas]) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            combined.push(item);
          }
        }

        setProducts(combined);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ── 2. Share Link Handlers ──
  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      });
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const msg = encodeURIComponent(
      `Explore Good Things Co. 2026 Festive Christmas Hampers & Holiday Edits:\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // ── 3. Personalisation Modal Handlers ──
  const handleOpenPersonalise = (gift: GiftItem) => {
    setPersonalisingProduct(gift);
    setSelectedModalImageIndex(0);
    setGiftMessage('');

    // Default packaging: Festive Christmas Box if available
    const festive = packagingList.find((p) => p.id.includes('festive') || p.name.toLowerCase().includes('festive'));
    setSelectedPackaging(festive || packagingList[0]);
  };

  const handleClosePersonalise = () => {
    setPersonalisingProduct(null);
  };

  const handleAddToCart = () => {
    if (!personalisingProduct) return;

    const raw = (personalisingProduct.rawProduct || personalisingProduct) as Product | undefined;
    const stock = raw?.stock !== undefined ? raw.stock : 99;
    if (stock <= 0) {
      setCartNotice('This festive curation is currently out of stock.');
      setTimeout(() => setCartNotice(null), 3500);
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

    const isPackagingIncluded = Boolean((raw as any)?.packagingIncluded || (personalisingProduct as any)?.packagingIncluded);
    const packagingExtra = isPackagingIncluded ? 0 : (selectedPackaging.price || 0);
    const unitPrice = personalisingProduct.price + packagingExtra;

    const result = addItem({
      productId: raw?.id || personalisingProduct.id,
      slug: personalisingProduct.slug || raw?.slug || personalisingProduct.id,
      name: personalisingProduct.title,
      unitPrice,
      quantity: 1,
      currentStock: stock,
      image: imagePayload,
      packaging: isPackagingIncluded ? `${selectedPackaging.name} (Included)` : selectedPackaging.name,
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

  // Modal images
  const modalImages = useMemo(() => {
    if (!personalisingProduct) return [];
    const raw = (personalisingProduct.rawProduct || personalisingProduct) as Product | undefined;
    if (raw?.images && Array.isArray(raw.images) && raw.images.length > 0) {
      return raw.images.map((img) => (typeof img === 'string' ? img : img.url));
    }
    return [personalisingProduct.image];
  }, [personalisingProduct]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      {/* ── Toast Cart Notice ── */}
      {cartNotice && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-brand-dark text-white rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-sans">
          <AlertCircle size={16} className="text-gold-400 shrink-0" />
          <span>{cartNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 pb-16">
        {/* Navigation */}
        <GatewayNav />

        {/* ── Hero / Festive Banner ── */}
        <header className="w-full text-center py-8 sm:py-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-sans font-semibold mb-4 animate-fade-in shadow-2xs">
            <Sparkles size={14} className="text-emerald-600 animate-pulse" />
            <span>2026 Festive Atelier Edit · Direct Holiday Catalogue</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-dark font-normal tracking-tight mb-4">
            The Christmas Collection
          </h1>

          <p className="font-sans text-xs sm:text-sm text-brand-medium/90 max-w-xl mx-auto leading-relaxed mb-6">
            Handcrafted holiday hampers, gourmet confections, and artisanal keepsakes finished with seasonal satin ribbons and calligraphed gift cards. Ready for nationwide doorstep delivery.
          </p>

          {/* Direct Share Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-brand-dark/15 text-xs font-sans font-semibold text-brand-dark hover:bg-black/5 transition-all shadow-2xs cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-brand-medium" />
                  <span>Copy Direct Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-xs font-sans font-semibold text-emerald-900 hover:bg-[#25D366]/20 transition-all shadow-2xs cursor-pointer"
            >
              <Share2 size={13} className="text-[#25D366]" />
              <span>Share on WhatsApp</span>
            </button>

            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-transparent text-xs font-sans font-medium text-brand-medium hover:text-brand-dark underline transition-colors"
            >
              <span>Explore all occasions</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </header>

        {/* ── Products Showcase (Direct Display with No Questions) ── */}
        <main className="w-full">
          {isLoading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-brand-medium">
              <Loader2 className="animate-spin text-gold-600" size={32} />
              <span className="font-serif text-sm">Gathering festive curations...</span>
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="p-12 rounded-3xl bg-white border border-brand-dark/10 text-center max-w-lg mx-auto space-y-4">
              <Gift size={32} className="mx-auto text-gold-600" />
              <p className="font-serif text-lg text-brand-dark">Festive curations are being assembled</p>
              <p className="font-sans text-xs text-brand-medium">
                Our atelier is packaging new seasonal releases. In the meantime, discover curations in the main shop.
              </p>
              <Link
                to="/shop"
                className="inline-block px-6 py-2.5 rounded-full bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
              >
                Go to Shop
              </Link>
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-brand-dark/10">
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-medium">
                  {products.length} Festive Presentation{products.length === 1 ? '' : 's'}
                </span>
                <span className="text-[11px] font-sans text-brand-light">
                  Complimentary handwritten note included
                </span>
              </div>

              {/* Grid of Christmas Gifts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
                {products.map((gift) => (
                  <article
                    key={gift.id}
                    onClick={() => handleOpenPersonalise(gift)}
                    className="group bg-white rounded-3xl border border-brand-dark/10 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left cursor-pointer"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-square w-full overflow-hidden bg-[#FAF8F5]">
                      <img
                        src={gift.image}
                        alt={gift.alt}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-800 text-white text-[10px] font-sans font-bold uppercase tracking-wider shadow-xs">
                          {gift.badge || 'Holiday Edition'}
                        </span>
                        {gift.rawProduct?.packagingIncluded && (
                          <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-emerald-900 text-[10px] font-sans font-bold border border-emerald-200">
                            Box Included
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay Quick Actions (Desktop) */}
                      <div className="absolute inset-x-3 bottom-3 hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPersonalise(gift);
                          }}
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

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-1.5">
                          <h2 className="font-serif text-lg text-brand-dark font-normal group-hover:text-gold-700 transition-colors">
                            {gift.title}
                          </h2>
                          <span className="font-serif text-base font-semibold text-brand-dark shrink-0">
                            {gift.formattedPrice || `₦${gift.price.toLocaleString()}`}
                          </span>
                        </div>

                        <p className="font-sans text-xs text-brand-medium/90 line-clamp-2 leading-relaxed mb-4">
                          {gift.description}
                        </p>
                      </div>

                      {/* Mobile Action Button */}
                      <div className="sm:hidden pt-3 border-t border-brand-dark/10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPersonalise(gift);
                          }}
                          className="w-full py-2.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <ShoppingBag size={13} />
                          <span>Personalise & Add</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* PERSONALISATION MODAL / DRAWER                          */}
      {/* ======================================================== */}
      {personalisingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-brand-dark/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-brand-dark/10 animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-dark/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gold-700 block mb-0.5">
                  Holiday Personalisation
                </span>
                <h3 className="font-serif text-xl font-semibold text-brand-dark">
                  {personalisingProduct.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePersonalise}
                className="p-2 rounded-full text-brand-medium hover:text-brand-dark hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Multi-Image Gallery */}
              <div>
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF8F5] mb-2.5 border border-brand-dark/10">
                  <img
                    src={modalImages[selectedModalImageIndex] || personalisingProduct.image}
                    alt={personalisingProduct.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {modalImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {modalImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedModalImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          selectedModalImageIndex === idx
                            ? 'border-brand-dark ring-2 ring-brand-dark/20'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. Packaging Selection */}
              <div>
                {(() => {
                  const raw = (personalisingProduct.rawProduct || personalisingProduct) as any;
                  const isPackagingIncluded = Boolean(raw?.packagingIncluded);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-dark">
                          1. Presentation Packaging
                        </label>
                        {isPackagingIncluded && (
                          <span className="text-[11px] font-sans font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ✓ Packaging Included in Price
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {packagingList.map((pkg) => {
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
                                <span className={`font-sans text-xs font-semibold ${isPackagingIncluded ? 'text-emerald-700' : 'text-gold-700'}`}>
                                  {isPackagingIncluded ? 'Included' : (pkg.price === 0 ? 'Included' : `+₦${pkg.price.toLocaleString()}`)}
                                </span>
                              </div>
                              <span className="font-sans text-[11px] text-brand-medium">
                                {pkg.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 2. Ribbon Selection */}
              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                  2. Double-Satin Ribbon Colour: <span className="text-gold-700">{selectedRibbon.name}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {ribbonList.map((rb) => {
                    const isSelected = selectedRibbon.id === rb.id;
                    return (
                      <button
                        key={rb.id}
                        type="button"
                        onClick={() => setSelectedRibbon(rb)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-sans transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-brand-dark bg-brand-dark text-white shadow-2xs'
                            : 'border-brand-dark/15 hover:border-brand-dark/30 bg-white text-brand-dark'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: rb.hex || '#ffffff' }}
                        />
                        <span>{rb.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Handwritten Card Message */}
              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  3. Complimentary Handwritten Card Message
                </label>
                <p className="font-sans text-[11px] text-brand-medium mb-2">
                  Calligraphed with care onto our signature heavy cardstock, finished with wax seal.
                </p>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Draft your seasonal message here (e.g. Wishing you warmth, joy and wonderful moments this holiday season)..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-brand-dark/20 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-dark leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-brand-dark/10 bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-sans text-[11px] text-brand-medium block">Total Price:</span>
                <span className="font-serif text-xl font-bold text-brand-dark">
                  ₦
                  {(() => {
                    const raw = (personalisingProduct.rawProduct || personalisingProduct) as any;
                    const isPackagingIncluded = Boolean(raw?.packagingIncluded);
                    return (
                      personalisingProduct.price +
                      (isPackagingIncluded ? 0 : (selectedPackaging.price || 0))
                    ).toLocaleString();
                  })()}
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
      {/* ADDED TO CART NOTIFICATION MODAL                        */}
      {/* ======================================================== */}
      {addedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-dark/10 text-center animate-scale-up space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Check size={28} />
            </div>

            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                Added to Gifting Cart
              </span>
              <h3 className="font-serif text-xl font-semibold text-brand-dark">
                {lastAddedTitle}
              </h3>
              <p className="font-sans text-xs text-brand-medium mt-1">
                Your holiday curation has been placed in your cart.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddedModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-brand-dark/20 font-sans text-xs font-semibold text-brand-dark hover:bg-black/5 transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>View Cart & Checkout</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
