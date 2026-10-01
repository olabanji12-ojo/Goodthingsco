import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  Gift,
} from 'lucide-react';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductImage,
  ProductVariant,
  BudgetRangeTier,
} from '../../types/product';
import {
  uploadImages,
  validateImageFile,
  getProductImageUrl,
  removeImageFromList,
} from '../../services/cloudinaryService';
import { slugify } from '../../utils/slugify';
import { validateCreateProduct } from '../../utils/productValidation';

// Standard Taxonomy Options
export const STANDARD_OCCASIONS = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'thank-you', label: 'Thank You' },
  { value: 'congratulations', label: 'Congratulations' },
  { value: 'just-because', label: 'Just Because' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'valentines', label: "Valentine's" },
  { value: 'easter', label: 'Easter' },
  { value: 'mothers-day', label: "Mother's Day" },
  { value: 'fathers-day', label: "Father's Day" },
  { value: 'new-year', label: 'New Year' },
];

export const STANDARD_RECIPIENTS = [
  // Primary
  { value: 'her', label: 'Her' },
  { value: 'him', label: 'Him' },
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'business', label: 'Business' },
  { value: 'self', label: 'Self / Me' },
  // Specific
  { value: 'mum', label: 'Mum' },
  { value: 'dad', label: 'Dad' },
  { value: 'husband', label: 'Husband' },
  { value: 'wife', label: 'Wife' },
  { value: 'sister', label: 'Sister' },
  { value: 'brother', label: 'Brother' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'client', label: 'Client' },
  { value: 'team', label: 'Team' },
];

export const BUDGET_TIERS: { value: BudgetRangeTier; label: string }[] = [
  { value: 'under-25000', label: 'Under ₦25,000' },
  { value: '25000-50000', label: '₦25,000 – ₦50,000' },
  { value: '50000-100000', label: '₦50,000 – ₦100,000' },
  { value: '100000-plus', label: '₦100,000+' },
];

export const STANDARD_CATEGORIES = [
  'Gift Box',
  'Hamper',
  'Desk & Executive',
  'Home & Living',
  'Sweet Treats',
  'Self-Care',
  'Keepsakes',
  'Bespoke',
];

export const STANDARD_PACKAGING = [
  'Signature Gift Box',
  'Gift Bag',
  'Handcrafted Wooden Box',
  'Keepsake Box',
  'Silk Pouch',
  'Velvet Pouch',
];

export const STANDARD_RIBBONS = [
  'Gold',
  'White',
  'Midnight Navy',
  'Black',
  'Champagne',
  'Emerald Green',
  'Burgundy',
  'Blush Pink',
];

interface ProductFormProps {
  initialProduct?: Product;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  isEdit?: boolean;
}

export default function ProductForm({ initialProduct, onSubmit, isEdit = false }: ProductFormProps) {
  const navigate = useNavigate();

  // Basic Information
  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialProduct?.slug));
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || STANDARD_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');

  // Pricing & Inventory
  const [price, setPrice] = useState<string>(initialProduct?.price ? String(initialProduct.price) : '');
  const [compareAtPrice, setCompareAtPrice] = useState<string>(
    initialProduct?.compareAtPrice ? String(initialProduct.compareAtPrice) : ''
  );
  const [stock, setStock] = useState<string>(initialProduct?.stock !== undefined ? String(initialProduct.stock) : '10');
  const [isAvailable, setIsAvailable] = useState<boolean>(initialProduct?.isAvailable !== undefined ? initialProduct.isAvailable : true);
  const [featured, setFeatured] = useState<boolean>(initialProduct?.featured || false);

  // Taxonomy
  const [budgetRange, setBudgetRange] = useState<BudgetRangeTier>(initialProduct?.budgetRange || '25000-50000');
  const [occasions, setOccasions] = useState<string[]>(initialProduct?.occasions || ['birthday']);
  const [recipients, setRecipients] = useState<string[]>(initialProduct?.recipients || ['her']);
  const [customOccasionInput, setCustomOccasionInput] = useState('');
  const [customRecipientInput, setCustomRecipientInput] = useState('');

  // Images
  const [images, setImages] = useState<(ProductImage | string)[]>(initialProduct?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);

  // Personalisation
  const [personalisationEnabled, setPersonalisationEnabled] = useState<boolean>(
    initialProduct?.personalisation?.enabled || false
  );
  const [messageAllowed, setMessageAllowed] = useState<boolean>(
    initialProduct?.personalisation?.messageAllowed !== undefined
      ? initialProduct.personalisation.messageAllowed
      : true
  );
  const [customTextAllowed, setCustomTextAllowed] = useState<boolean>(
    initialProduct?.personalisation?.customTextAllowed || false
  );
  const [maxTextLength, setMaxTextLength] = useState<string>(
    initialProduct?.personalisation?.maxTextLength ? String(initialProduct.personalisation.maxTextLength) : '24'
  );

  // Packaging & Ribbons
  const [packagingOptions, setPackagingOptions] = useState<string[]>(
    initialProduct?.packagingOptions || ['Signature Gift Box', 'Gift Bag']
  );
  const [ribbonColours, setRibbonColours] = useState<string[]>(
    initialProduct?.ribbonColours || ['Gold', 'White']
  );

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);

  // Form Submission & Validation State
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-generate slug when name changes (unless manually edited)
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugManuallyEdited) {
      setSlug(slugify(newName));
    }
  };

  // Image Upload Handling
  const handleImageFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setImageError(null);

    // Client-side file validation
    for (const f of files) {
      const v = validateImageFile(f);
      if (!v.isValid) {
        setImageError(v.error || 'Invalid image file.');
        return;
      }
    }

    setUploadingImages(true);
    setUploadProgress(`Uploading 0 of ${files.length}...`);

    try {
      const uploaded = await uploadImages(files, (completed, total) => {
        setUploadProgress(`Uploading ${completed} of ${total} images...`);
      });
      setImages((prev) => [...prev, ...uploaded]);
      setUploadProgress(`Successfully uploaded ${uploaded.length} image(s)!`);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Cloudinary upload failed.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => removeImageFromList(prev, index));
  };

  const handleMoveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[fromIndex];
      copy[fromIndex] = copy[toIndex];
      copy[toIndex] = temp;
      return copy;
    });
  };

  // Occasions Toggle
  const toggleOccasion = (val: string) => {
    setOccasions((prev) =>
      prev.includes(val) ? prev.filter((o) => o !== val) : [...prev, val]
    );
  };

  const handleAddCustomOccasion = () => {
    const formatted = slugify(customOccasionInput);
    if (formatted && !occasions.includes(formatted)) {
      setOccasions([...occasions, formatted]);
      setCustomOccasionInput('');
    }
  };

  // Recipients Toggle
  const toggleRecipient = (val: string) => {
    setRecipients((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  };

  const handleAddCustomRecipient = () => {
    const formatted = slugify(customRecipientInput);
    if (formatted && !recipients.includes(formatted)) {
      setRecipients([...recipients, formatted]);
      setCustomRecipientInput('');
    }
  };

  // Packaging & Ribbon Toggles
  const togglePackaging = (val: string) => {
    setPackagingOptions((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
    );
  };

  const toggleRibbon = (val: string) => {
    setRibbonColours((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  };

  // Variant Handlers
  const handleAddVariant = () => {
    setVariants([...variants, { name: 'Size', options: ['Standard', 'Deluxe'] }]);
  };

  const handleRemoveVariant = (vIdx: number) => {
    setVariants(variants.filter((_, idx) => idx !== vIdx));
  };

  const handleVariantNameChange = (vIdx: number, newName: string) => {
    setVariants(
      variants.map((v, idx) => (idx === vIdx ? { ...v, name: newName } : v))
    );
  };

  const handleAddVariantOption = (vIdx: number, optionVal: string) => {
    if (!optionVal.trim()) return;
    setVariants(
      variants.map((v, idx) =>
        idx === vIdx ? { ...v, options: [...v.options, optionVal.trim()] } : v
      )
    );
  };

  const handleRemoveVariantOption = (vIdx: number, optIdx: number) => {
    setVariants(
      variants.map((v, idx) =>
        idx === vIdx
          ? { ...v, options: v.options.filter((_, oI) => oI !== optIdx) }
          : v
      )
    );
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const numPrice = parseFloat(price);
    const numComparePrice = compareAtPrice ? parseFloat(compareAtPrice) : undefined;
    const numStock = parseInt(stock, 10);
    const selectedCategory = category === '__custom__' ? customCategory.trim() : category;

    const payload: CreateProductInput = {
      name: name.trim(),
      slug: slug.trim() ? slugify(slug) : slugify(name),
      description: description.trim(),
      price: isNaN(numPrice) ? 0 : numPrice,
      compareAtPrice: numComparePrice,
      category: selectedCategory,
      stock: isNaN(numStock) ? 0 : numStock,
      isAvailable,
      featured,
      budgetRange,
      occasions,
      recipients,
      images,
      packagingOptions,
      ribbonColours,
      variants,
      personalisation: personalisationEnabled
        ? {
            enabled: true,
            messageAllowed,
            customTextAllowed,
            maxTextLength: customTextAllowed ? parseInt(maxTextLength, 10) || 24 : undefined,
          }
        : { enabled: false },
    };

    // Validate payload
    const validation = validateCreateProduct(payload);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      navigate('/admin/products');
    } catch (err) {
      setValidationErrors([err instanceof Error ? err.message : 'Failed to save product.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '8px',
            }}
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            {isEdit ? `Edit: ${initialProduct?.name || 'Product'}` : 'Add New Product'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            id="product-form-save-btn"
            type="submit"
            disabled={saving || uploadingImages}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              backgroundColor: saving || uploadingImages ? '#94a3b8' : '#0f172a',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving || uploadingImages ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            {saving ? 'Saving Product...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div style={{ padding: '16px 20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 600, marginBottom: '6px' }}>
            <AlertCircle size={18} />
            <span>Please correct the following errors before saving:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '24px', color: '#b91c1c', fontSize: '13px' }}>
            {validationErrors.map((err, idx) => (
              <li key={idx} style={{ marginTop: '2px' }}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: BASIC INFORMATION                             */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Tag size={18} color="#0f172a" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>Basic Information</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="product-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Product Name *
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. The Atelier Birthday Hamper"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label htmlFor="product-slug" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              URL Slug *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>goodthings.co/shop/</span>
              <input
                id="product-slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                placeholder="the-atelier-birthday-hamper"
                required
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-description" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Description *
            </label>
            <textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the sensory elements, contents, and luxury experience of this gift..."
              rows={4}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label htmlFor="product-category" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Category *
            </label>
            <select
              id="product-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            >
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">+ Custom Category...</option>
            </select>

            {category === '__custom__' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name"
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: PRICING & INVENTORY                           */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <DollarSign size={18} color="#0f172a" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>Pricing & Inventory</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <label htmlFor="product-price" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Selling Price (₦) *
            </label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="35000"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label htmlFor="product-compare-price" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Compare-at Price (₦) (Optional)
            </label>
            <input
              id="product-compare-price"
              type="number"
              min="0"
              step="500"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="42000"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label htmlFor="product-stock" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Stock Quantity *
            </label>
            <input
              id="product-stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="10"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Status Toggles */}
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }}>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
            />
            <span><strong>Available for Purchase</strong> (Customers can buy)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
            />
            <span><strong>Featured Product</strong> (Highlight on Home & Curated edits)</span>
          </label>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: CLOUDINARY PRODUCT IMAGES                     */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={18} color="#0f172a" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>Product Images</h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Cloudinary Unsigned Upload • Max 10MB each
          </span>
        </div>

        {/* Upload Button & Dropzone */}
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '28px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            marginBottom: '20px',
          }}
        >
          <UploadCloud size={32} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
            Select product photography to upload
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
            Supports JPEG, PNG, WebP, AVIF. The first image will be used as the primary cover photo.
          </p>

          <label
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: uploadingImages ? 'not-allowed' : 'pointer',
            }}
          >
            {uploadingImages ? 'Uploading to Cloudinary...' : 'Choose Images'}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleImageFileSelect}
              disabled={uploadingImages}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Progress & Errors */}
        {uploadProgress && (
          <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            {uploadProgress}
          </div>
        )}

        {imageError && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            {imageError}
          </div>
        )}

        {/* Image Thumbnails Gallery */}
        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {images.map((img, idx) => {
              const url = getProductImageUrl(img);
              const isCover = idx === 0;

              return (
                <div
                  key={idx}
                  style={{
                    border: isCover ? '2px solid #c5a880' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative', height: '140px', backgroundColor: '#f1f5f9' }}>
                    <img
                      src={url}
                      alt={`Product view ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isCover && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: '#c5a880',
                          color: '#0f172a',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Move Left / Right Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveImage(idx, 'left')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        color: idx === 0 ? '#cbd5e1' : '#475569',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Move left"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>#{idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMoveImage(idx, 'right')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: idx === images.length - 1 ? 'not-allowed' : 'pointer',
                        color: idx === images.length - 1 ? '#cbd5e1' : '#475569',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Move right"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 4: GIFT DISCOVERY TAXONOMY                       */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Gift size={18} color="#0f172a" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
            Gift Discovery Taxonomy (Occasion • Recipient • Budget)
          </h2>
        </div>

        {/* Budget Range Tier */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Budget Range Tier *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {BUDGET_TIERS.map((tier) => {
              const selected = budgetRange === tier.value;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setBudgetRange(tier.value)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: selected ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selected ? 'rgba(15, 23, 42, 0.05)' : '#ffffff',
                    color: selected ? '#0f172a' : '#475569',
                    fontWeight: selected ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{tier.label}</span>
                  {selected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Occasions Multi-Select */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Occasions * (Select one or more)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {STANDARD_OCCASIONS.map((occ) => {
              const selected = occasions.includes(occ.value);
              return (
                <button
                  key={occ.value}
                  type="button"
                  onClick={() => toggleOccasion(occ.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: selected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selected ? '#0f172a' : '#ffffff',
                    color: selected ? '#ffffff' : '#475569',
                    fontSize: '13px',
                    fontWeight: selected ? 500 : 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {selected && <Check size={14} />}
                  <span>{occ.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Occasion Input */}
          <div style={{ display: 'flex', gap: '8px', maxWidth: '320px' }}>
            <input
              type="text"
              value={customOccasionInput}
              onChange={(e) => setCustomOccasionInput(e.target.value)}
              placeholder="Add custom occasion"
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomOccasion}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Recipients Multi-Select */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Recipients * (Select one or more)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {STANDARD_RECIPIENTS.map((rec) => {
              const selected = recipients.includes(rec.value);
              return (
                <button
                  key={rec.value}
                  type="button"
                  onClick={() => toggleRecipient(rec.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: selected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selected ? '#0f172a' : '#ffffff',
                    color: selected ? '#ffffff' : '#475569',
                    fontSize: '13px',
                    fontWeight: selected ? 500 : 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {selected && <Check size={14} />}
                  <span>{rec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Recipient Input */}
          <div style={{ display: 'flex', gap: '8px', maxWidth: '320px' }}>
            <input
              type="text"
              value={customRecipientInput}
              onChange={(e) => setCustomRecipientInput(e.target.value)}
              placeholder="Add custom recipient"
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomRecipient}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 5: PERSONALISATION & PRESENTATION                */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Sparkles size={18} color="#0f172a" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
            Personalisation & Packaging Options
          </h2>
        </div>

        {/* Personalisation Toggle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', marginBottom: '14px' }}>
            <input
              type="checkbox"
              checked={personalisationEnabled}
              onChange={(e) => setPersonalisationEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
            />
            <span><strong>Enable Personalisation for this product</strong></span>
          </label>

          {personalisationEnabled && (
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={messageAllowed}
                  onChange={(e) => setMessageAllowed(e.target.checked)}
                  style={{ accentColor: '#0f172a' }}
                />
                <span>Allow handwritten calligraphy gift note</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={customTextAllowed}
                  onChange={(e) => setCustomTextAllowed(e.target.checked)}
                  style={{ accentColor: '#0f172a' }}
                />
                <span>Allow custom engraving / foil embossing</span>
              </label>

              {customTextAllowed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <label htmlFor="max-text-len" style={{ fontSize: '12px', color: '#64748b' }}>
                    Max Custom Characters:
                  </label>
                  <input
                    id="max-text-len"
                    type="number"
                    min="1"
                    max="100"
                    value={maxTextLength}
                    onChange={(e) => setMaxTextLength(e.target.value)}
                    style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Packaging Options */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Supported Packaging Options
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {STANDARD_PACKAGING.map((pkg) => {
              const selected = packagingOptions.includes(pkg);
              return (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => togglePackaging(pkg)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selected ? 'rgba(15, 23, 42, 0.08)' : '#ffffff',
                    color: selected ? '#0f172a' : '#475569',
                    fontSize: '12px',
                    fontWeight: selected ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {pkg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ribbon Colours */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Supported Ribbon Colours
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {STANDARD_RIBBONS.map((rib) => {
              const selected = ribbonColours.includes(rib);
              return (
                <button
                  key={rib}
                  type="button"
                  onClick={() => toggleRibbon(rib)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: selected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selected ? 'rgba(15, 23, 42, 0.08)' : '#ffffff',
                    color: selected ? '#0f172a' : '#475569',
                    fontSize: '12px',
                    fontWeight: selected ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {rib}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 6: VARIANTS (OPTIONAL)                           */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#0f172a" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>Variants (Optional)</h2>
          </div>
          <button
            type="button"
            onClick={handleAddVariant}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Add Variant Group
          </button>
        </div>

        {variants.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            No variants configured. Product uses default single-option stock.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {variants.map((v, vIdx) => (
              <div
                key={vIdx}
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Variant Name:</span>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVariantNameChange(vIdx, e.target.value)}
                      placeholder="e.g. Size, Scent, Colour"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(vIdx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove Group
                  </button>
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {v.options.map((opt, optIdx) => (
                    <span
                      key={optIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        color: '#1e293b',
                      }}
                    >
                      {opt}
                      <X
                        size={12}
                        style={{ cursor: 'pointer', color: '#94a3b8' }}
                        onClick={() => handleRemoveVariantOption(vIdx, optIdx)}
                      />
                    </span>
                  ))}

                  {/* Add Option Mini-Form */}
                  <input
                    type="text"
                    placeholder="+ Add option & press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        handleAddVariantOption(vIdx, target.value);
                        target.value = '';
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px dashed #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || uploadingImages}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            backgroundColor: saving || uploadingImages ? '#94a3b8' : '#0f172a',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: saving || uploadingImages ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
