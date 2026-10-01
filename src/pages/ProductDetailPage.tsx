import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Package,
  AlertCircle,
  Truck,
  Share2,
} from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { getProductBySlug } from '../services/productService';
import { getProductImageUrl } from '../services/cloudinaryService';
import { Product } from '../types/product';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Interaction State
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});
  const [selectedPackaging, setSelectedPackaging] = useState<string>('');
  const [selectedRibbon, setSelectedRibbon] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) {
        setError('No product slug provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const item = await getProductBySlug(slug);
        if (!item || item.isArchived) {
          setError('This curation is currently unavailable or has been archived.');
        } else {
          setProduct(item);
          // Pre-select first options if available
          if (item.variants && item.variants.length > 0) {
            const defaults: Record<string, string> = {};
            item.variants.forEach((v) => {
              if (v.options && v.options.length > 0) {
                defaults[v.name] = v.options[0];
              }
            });
            setSelectedVariantOptions(defaults);
          }
          if (item.packagingOptions && item.packagingOptions.length > 0) {
            setSelectedPackaging(item.packagingOptions[0]);
          }
          if (item.ribbonColours && item.ribbonColours.length > 0) {
            setSelectedRibbon(item.ribbonColours[0]);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve curation details.');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleProceedToShop = () => {
    // Navigate to shop with deep link parameters
    const params = new URLSearchParams();
    if (product?.occasions?.[0]) params.set('occasion', product.occasions[0]);
    if (product?.recipients?.[0]) params.set('recipient', product.recipients[0]);
    navigate(`/shop?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
        {/* Minimal Header Navigation */}
        <GatewayNav activePath="shop" />

        <main className="w-full py-6 sm:py-10">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-medium hover:text-brand-dark transition-colors"
            >
              <ArrowLeft size={14} /> Back to Curated Gift Finder
            </Link>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 animate-pulse">
              <div className="lg:col-span-7 aspect-[4/3] bg-brand-cream/80 rounded-3xl" />
              <div className="lg:col-span-5 space-y-4">
                <div className="h-4 bg-brand-cream w-1/4 rounded" />
                <div className="h-8 bg-brand-cream w-3/4 rounded" />
                <div className="h-6 bg-brand-cream w-1/3 rounded" />
                <div className="h-24 bg-brand-cream rounded-xl" />
                <div className="h-12 bg-brand-cream rounded-xl" />
              </div>
            </div>
          )}

          {/* Error / Not Found */}
          {!loading && (error || !product) && (
            <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center bg-white rounded-3xl border border-brand-dark/10 shadow-sm">
              <AlertCircle size={40} className="text-brand-light mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-normal text-brand-dark mb-2">
                Curation Not Available
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-medium/80 mb-6 leading-relaxed">
                {error || 'The gift creation you are looking for is no longer in our active catalog.'}
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-colors"
              >
                <ArrowLeft size={14} /> Explore Available Curations
              </Link>
            </div>
          )}

          {/* Product Detail Content */}
          {!loading && product && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              {/* Left Column: Image Gallery (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Main Large Image */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden bg-brand-cream/80 border border-brand-dark/10 shadow-sm group">
                  <img
                    src={
                      product.images?.[selectedImageIndex]
                        ? getProductImageUrl(product.images[selectedImageIndex])
                        : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />

                  {product.featured && (
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gold-600 text-white font-sans text-[10px] font-bold tracking-wider uppercase shadow-xs">
                      Featured Atelier Curation
                    </span>
                  )}

                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm text-brand-dark hover:bg-white shadow-xs transition-colors"
                      title="Share curation"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {copiedLink && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-brand-dark/95 text-white font-sans text-xs shadow-md">
                      Link copied to clipboard!
                    </div>
                  )}
                </div>

                {/* Thumbnails Strip */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {product.images.map((img, idx) => {
                      const url = getProductImageUrl(img);
                      const isSelected = selectedImageIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative w-20 sm:w-24 aspect-square rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand-dark ring-2 ring-brand-dark/20'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Craftsmanship Guarantees Bar */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-brand-dark/10 text-center font-sans text-[11px] text-brand-medium">
                  <div className="flex flex-col items-center gap-1">
                    <Package size={16} className="text-gold-600" />
                    <span>Artisanal Packaging</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-x border-brand-dark/10">
                    <Sparkles size={16} className="text-gold-600" />
                    <span>Personalised Card</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck size={16} className="text-gold-600" />
                    <span>White-Glove Dispatch</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editorial Details & Options (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">
                      Good Things Co. · {product.category || 'Atelier Gift'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-brand-light" />
                    <span className="font-sans text-xs text-brand-medium">
                      {product.isAvailable && product.stock > 0 ? (
                        <span className="text-emerald-700 font-medium">In Stock ({product.stock} available)</span>
                      ) : (
                        <span className="text-rose-700 font-medium">Temporarily Unavailable</span>
                      )}
                    </span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-brand-dark font-normal tracking-tight mb-3">
                    {product.name}
                  </h1>

                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark">
                      ₦{product.price.toLocaleString()}
                    </span>
                    {product.compareAtPrice && (
                      <span className="font-sans text-sm text-brand-light line-through">
                        ₦{product.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-brand-dark/10">
                  <p className="font-sans text-sm text-brand-medium/90 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                {/* Taxonomy Tags / Gifting Suitability */}
                <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-3 font-sans text-xs">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-brand-light">
                    Gifting Suitability
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.occasions?.map((occ) => (
                      <span
                        key={occ}
                        className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark capitalize text-[11px]"
                      >
                        {occ.replace(/-/g, ' ')}
                      </span>
                    ))}
                    {product.recipients?.map((rec) => (
                      <span
                        key={rec}
                        className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-brand-dark/10 text-brand-dark capitalize text-[11px]"
                      >
                        For {rec.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Variants (if present) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {product.variants.map((v) => (
                      <div key={v.name} className="space-y-2">
                        <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block">
                          Select {v.name}:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => {
                            const isSelected = selectedVariantOptions[v.name] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setSelectedVariantOptions({ ...selectedVariantOptions, [v.name]: opt })
                                }
                                className={`px-4 py-2 rounded-xl border text-xs font-sans transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-brand-dark text-white border-brand-dark font-semibold shadow-xs'
                                    : 'bg-white text-brand-dark border-brand-dark/15 hover:border-brand-dark/40'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Packaging & Presentation Options */}
                {product.packagingOptions && product.packagingOptions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block">
                      Presentation Packaging:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.packagingOptions.map((pkg) => {
                        const isSelected = selectedPackaging === pkg;
                        return (
                          <button
                            key={pkg}
                            type="button"
                            onClick={() => setSelectedPackaging(pkg)}
                            className={`p-3 rounded-xl border text-left text-xs font-sans transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-dark text-white border-brand-dark font-medium shadow-xs'
                                : 'bg-white text-brand-dark border-brand-dark/15 hover:border-brand-dark/40'
                            }`}
                          >
                            <span>{pkg}</span>
                            {isSelected && <Check size={14} className="text-gold-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ribbon Colours */}
                {product.ribbonColours && product.ribbonColours.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark block">
                      Silk Ribbon Finish:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.ribbonColours.map((rib) => {
                        const isSelected = selectedRibbon === rib;
                        return (
                          <button
                            key={rib}
                            type="button"
                            onClick={() => setSelectedRibbon(rib)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-sans transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gold-600 text-white border-gold-600 font-semibold shadow-xs'
                                : 'bg-white text-brand-dark border-brand-dark/15 hover:border-brand-dark/40'
                            }`}
                          >
                            {rib} Ribbon
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Personalisation Available Badge */}
                {product.personalisation?.enabled && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
                    <Sparkles size={18} className="text-gold-700 shrink-0 mt-0.5" />
                    <div className="font-sans text-xs text-amber-950">
                      <div className="font-bold mb-0.5">Bespoke Personalisation Included</div>
                      <div className="text-amber-900/80 leading-relaxed">
                        {product.personalisation.messageAllowed && 'Handwritten calligraphy card'}
                        {product.personalisation.messageAllowed && product.personalisation.customTextAllowed && ' & '}
                        {product.personalisation.customTextAllowed &&
                          `Custom foil monogramming (up to ${product.personalisation.maxTextLength || 24} chars)`}
                        {' configured during concierge checkout.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleProceedToShop}
                    disabled={!product.isAvailable || product.stock === 0}
                    className={`w-full py-4 rounded-2xl font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                      product.isAvailable && product.stock > 0
                        ? 'bg-brand-dark text-white hover:bg-gold-600 active:scale-[0.99]'
                        : 'bg-brand-light text-brand-medium cursor-not-allowed'
                    }`}
                  >
                    <span>Personalise & Order This Gift</span>
                    <span>→</span>
                  </button>

                  <div className="text-center font-sans text-[11px] text-brand-light">
                    Complimentary handwritten gift card & presentation packaging included with every curation.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
