import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { GatewayNav } from '../components/gateway';
import { Footer } from '../components/homepage/footer/Footer';
import { getProductBySlug } from '../services/productService';
import { getProductImageUrl } from '../services/cloudinaryService';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';
import { formatNaira } from '../utils/cartUtils';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, getCartCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Interaction State
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});
  const [selectedPackaging, setSelectedPackaging] = useState<string>('');
  const [selectedRibbon, setSelectedRibbon] = useState<string>('');
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [personalisationText, setPersonalisationText] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Feedback State
  const [addedModalOpen, setAddedModalOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

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

  const isOutOfStock = !product || !product.isAvailable || product.stock <= 0;
  const maxStock = product ? product.stock : 0;

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityIncrease = () => {
    if (quantity >= maxStock) {
      setFeedbackNotice(`Cannot add more: only ${maxStock} in stock.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    const firstImage = product.images?.[0];
    const imagePayload = firstImage
      ? {
          url: typeof firstImage === 'string' ? firstImage : firstImage.url,
          publicId: typeof firstImage === 'object' ? firstImage.publicId : undefined,
          alt: typeof firstImage === 'object' ? firstImage.alt : product.name,
        }
      : undefined;

    const result = addItem({
      productId: product.id || product.slug,
      slug: product.slug,
      name: product.name,
      unitPrice: product.price,
      quantity,
      currentStock: product.stock,
      image: imagePayload,
      selectedVariants: Object.keys(selectedVariantOptions).length > 0 ? selectedVariantOptions : undefined,
      packaging: selectedPackaging || undefined,
      ribbonColour: selectedRibbon || undefined,
      giftMessage: giftMessage.trim() || undefined,
      personalisationText: personalisationText.trim() || undefined,
    });

    if (result.success) {
      setAddedModalOpen(true);
    } else {
      setFeedbackNotice(result.message);
      setTimeout(() => setFeedbackNotice(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-brand-dark flex flex-col justify-between selection:bg-gold-500 selection:text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col flex-1 justify-between pb-12 sm:pb-20">
        {/* Navigation */}
        <GatewayNav activePath="shop" />

        <main className="w-full py-6 sm:py-10">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8 flex items-center justify-between">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-brand-medium hover:text-brand-dark transition-colors"
            >
              <ArrowLeft size={14} /> Back to Curated Gift Finder
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-sans text-brand-light hover:text-brand-dark transition-colors cursor-pointer"
            >
              <Share2 size={13} />
              <span>{copiedLink ? 'Link Copied!' : 'Share Curation'}</span>
            </button>
          </div>

          {/* Inline Feedback Banner */}
          {feedbackNotice && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-sans text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}

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
                      Atelier Signature
                    </span>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-brand-dark/65 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-5 py-2.5 rounded-full bg-brand-dark/90 text-white font-sans text-xs font-bold uppercase tracking-[0.2em] border border-white/20">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          selectedImageIndex === idx
                            ? 'border-brand-dark scale-102 shadow-sm'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getProductImageUrl(img)}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Details & Customisation (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-sans uppercase tracking-[0.18em] text-brand-light mb-1.5">
                    <span>{product.category || 'Atelier Gift Box'}</span>
                    <span>
                      {isOutOfStock ? (
                        <strong className="text-rose-600 font-semibold">Sold Out</strong>
                      ) : (
                        <span className="text-emerald-700 font-medium">In Stock ({product.stock} available)</span>
                      )}
                    </span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-brand-dark font-normal leading-tight mb-3">
                    {product.name}
                  </h1>

                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark">
                      {formatNaira(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="font-sans text-sm text-brand-light line-through">
                        {formatNaira(product.compareAtPrice)}
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

                {/* Variants Selection */}
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
                            className={`px-3.5 py-1.5 rounded-lg border text-xs font-sans transition-all cursor-pointer ${
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

                {/* Bespoke Personalisation / Gift Message Inputs */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-dark/10 space-y-4">
                  <div className="flex items-center gap-2 font-serif text-sm font-normal text-brand-dark">
                    <Sparkles size={16} className="text-gold-600" />
                    <span>Complimentary Personalisation Included</span>
                  </div>

                  {/* Handwritten Gift Card Message */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-gift-message"
                      className="font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-medium block"
                    >
                      Handwritten Calligraphy Card Message:
                    </label>
                    <textarea
                      id="product-gift-message"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="e.g. Wishing you a year filled with warmth, joy, and peace. Happy Birthday Mum!"
                      rows={2}
                      maxLength={180}
                      className="w-full p-2.5 rounded-xl border border-brand-dark/15 text-xs font-sans text-brand-dark bg-[#FAF8F5] focus:outline-none focus:border-gold-600 resize-none"
                    />
                    <div className="text-right text-[10px] text-brand-light font-sans">
                      {giftMessage.length}/180 characters
                    </div>
                  </div>

                  {/* Monogram / Personalisation Text if enabled */}
                  {product.personalisation?.customTextAllowed && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="product-custom-text"
                        className="font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-medium block"
                      >
                        Custom Foil Monogramming / Name:
                      </label>
                      <input
                        id="product-custom-text"
                        type="text"
                        value={personalisationText}
                        onChange={(e) => setPersonalisationText(e.target.value)}
                        placeholder="e.g. KO or Emmanuel"
                        maxLength={product.personalisation.maxTextLength || 24}
                        className="w-full p-2.5 rounded-xl border border-brand-dark/15 text-xs font-sans text-brand-dark bg-[#FAF8F5] focus:outline-none focus:border-gold-600"
                      />
                      <div className="text-right text-[10px] text-brand-light font-sans">
                        {personalisationText.length}/{product.personalisation.maxTextLength || 24} characters max
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity Controls & Add to Cart */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-dark">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-brand-dark/20 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={handleQuantityDecrease}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="w-10 h-10 flex items-center justify-center text-brand-dark hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-sans text-sm font-bold text-brand-dark">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleQuantityIncrease}
                        disabled={quantity >= maxStock || isOutOfStock}
                        className="w-10 h-10 flex items-center justify-center text-brand-dark hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {!isOutOfStock && (
                      <span className="font-sans text-xs text-brand-light">
                        (Max {maxStock} available)
                      </span>
                    )}
                  </div>

                  {/* Add To Cart Primary Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full py-4 rounded-2xl font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2.5 shadow-md ${
                      !isOutOfStock
                        ? 'bg-brand-dark text-white hover:bg-gold-600 active:scale-[0.99] cursor-pointer'
                        : 'bg-brand-light/50 text-brand-medium/60 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag size={17} />
                    <span>{isOutOfStock ? 'Currently Out of Stock' : 'Add to Gifting Cart'}</span>
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

      {/* Added to Cart Feedback Modal */}
      {addedModalOpen && product && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-dark/10 text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>

            <h3 className="font-serif text-2xl text-brand-dark font-normal">
              Added to Cart
            </h3>

            <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed">
              <strong className="text-brand-dark font-semibold">"{product.name}"</strong> (Qty: {quantity}) has been added to your cart with your bespoke presentation selections.
            </p>

            <div className="pt-3 flex flex-col gap-2.5">
              <Link
                to="/cart"
                onClick={() => setAddedModalOpen(false)}
                className="w-full py-3.5 rounded-xl bg-brand-dark text-white font-sans text-xs font-semibold uppercase tracking-[0.16em] hover:bg-gold-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Cart ({getCartCount()})</span>
                <span>→</span>
              </Link>

              <button
                type="button"
                onClick={() => setAddedModalOpen(false)}
                className="w-full py-3 rounded-xl bg-brand-cream/80 text-brand-dark font-sans text-xs font-semibold uppercase tracking-wider hover:bg-brand-cream transition-colors cursor-pointer"
              >
                Continue Gifting Discovery
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
