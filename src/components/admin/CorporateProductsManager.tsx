import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Search,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Building2,
} from 'lucide-react';
import {
  getCorporateProducts,
  createCorporateProduct,
  updateCorporateProduct,
  deleteCorporateProduct,
  clearAllCorporateProducts,
} from '../../services/corporateProductService';
import { uploadImage } from '../../services/cloudinaryService';
import type {
  CorporateGiftProduct,
  CorporatePurpose,
  CorporateBudgetTier,
  CorporateGiftType,
} from '../corporate/types';
import {
  CORPORATE_PURPOSES,
  CORPORATE_BUDGET_TIERS,
} from '../corporate/corporateData';

export const CorporateProductsManager: React.FC = () => {
  const [products, setProducts] = useState<CorporateGiftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBudgetFilter, setSelectedBudgetFilter] = useState<string>('all');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CorporateGiftProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState<number>(35000);
  const [formMinQuantity, setFormMinQuantity] = useState<number>(5);
  const [formImage, setFormImage] = useState('');
  const [formBudgetTier, setFormBudgetTier] = useState<CorporateBudgetTier>('25k-50k');
  const [formPurposes, setFormPurposes] = useState<CorporatePurpose[]>(['client', 'employee']);
  const [formGiftTypes, setFormGiftTypes] = useState<CorporateGiftType[]>(['choose-gift']);
  const [formDescription, setFormDescription] = useState('');
  const [formIncludedItems, setFormIncludedItems] = useState('');
  const [formBadge, setFormBadge] = useState('');

  // Delete Confirmation Modal
  const [deletingProduct, setDeletingProduct] = useState<CorporateGiftProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCorporateProducts(true);
      setProducts(list);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load corporate products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Leather & Desk');
    setFormPrice(35000);
    setFormMinQuantity(5);
    setFormImage('');
    setFormBudgetTier('25k-50k');
    setFormPurposes(['client', 'employee', 'appreciation']);
    setFormGiftTypes(['choose-gift']);
    setFormDescription('');
    setFormIncludedItems('');
    setFormBadge('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: CorporateGiftProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormPrice(prod.unitPrice);
    setFormMinQuantity(prod.minQuantity);
    setFormImage(prod.image);
    setFormBudgetTier(prod.budgetTier);
    setFormPurposes(prod.purposes);
    setFormGiftTypes(prod.giftTypes);
    setFormDescription(prod.description);
    setFormIncludedItems(prod.includedItems.join('\n'));
    setFormBadge(prod.badge || '');
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadImage(file);
      setFormImage(res.url);
    } catch (err: any) {
      alert(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTogglePurpose = (pId: CorporatePurpose) => {
    setFormPurposes((prev) =>
      prev.includes(pId) ? prev.filter((p) => p !== pId) : [...prev, pId]
    );
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a package name.');
      return;
    }
    if (!formImage.trim()) {
      alert('Please upload or provide an image URL for this package.');
      return;
    }

    setSaving(true);
    try {
      const included = formIncludedItems
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formName.trim(),
        category: formCategory.trim() || 'Curated Gift Set',
        unitPrice: Math.max(0, Number(formPrice) || 0),
        formattedPrice: `₦${Number(formPrice).toLocaleString()}`,
        image: formImage.trim(),
        alt: formName.trim(),
        purposes: formPurposes.length > 0 ? formPurposes : (['client'] as CorporatePurpose[]),
        giftTypes: formGiftTypes.length > 0 ? formGiftTypes : (['choose-gift'] as CorporateGiftType[]),
        budgetTier: formBudgetTier,
        description: formDescription.trim(),
        includedItems: included,
        minQuantity: Math.max(1, Number(formMinQuantity) || 1),
        badge: formBadge.trim() || undefined,
      };

      if (editingProduct) {
        const updated = await updateCorporateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
        setToast(`Updated "${updated.name}" successfully.`);
      } else {
        const created = await createCorporateProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setToast(`Created corporate package "${created.name}" successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save corporate product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await deleteCorporateProduct(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setToast(`Deleted "${deletingProduct.name}".`);
      setDeletingProduct(null);
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete package.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to remove ALL corporate products? The page will show "Products not added yet" so you can start afresh.')) {
      return;
    }
    setLoading(true);
    try {
      await clearAllCorporateProducts();
      setProducts([]);
      setToast('Cleared all corporate products. Catalog is now completely empty.');
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to clear products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBudget =
        selectedBudgetFilter === 'all' || p.budgetTier === selectedBudgetFilter;

      return matchesSearch && matchesBudget;
    });
  }, [products, searchQuery, selectedBudgetFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-dark/10">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-brand-dark font-medium">
            Corporate Keepsakes & Gift Packages
          </h2>
          <p className="font-sans text-xs text-brand-medium mt-0.5">
            Manage packages displayed on the public Corporate Gifting Concierge page (/corporate).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Clear All Products
            </button>
          )}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus size={16} /> Add Corporate Package
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by package name or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-sans bg-white focus:outline-none focus:border-slate-900"
          />
        </div>
        <select
          value={selectedBudgetFilter}
          onChange={(e) => setSelectedBudgetFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-sans bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
        >
          <option value="all">All Budget Tiers</option>
          {CORPORATE_BUDGET_TIERS.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-sans text-xs flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-slate-700" />
          <span>Loading corporate packages...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600" />
          <span>{error}</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-semibold text-sm text-slate-800">Products not added yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {searchQuery ? 'Try clearing your search query.' : 'No corporate packages added yet. Click below to add your first package and start afresh.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus size={15} /> Add Corporate Package
            </button>
          )}
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div>
                <div className="relative mb-3 rounded-xl overflow-hidden bg-slate-100 aspect-16/10">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  {prod.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-950/80 backdrop-blur-xs text-[10px] font-sans font-bold text-amber-200 uppercase tracking-wider">
                      {prod.badge}
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-sans font-semibold text-slate-900">
                    Min {prod.minQuantity} units
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">
                    {prod.category}
                  </span>
                  <span className="font-serif text-sm font-semibold text-slate-900">
                    {prod.formattedPrice}
                  </span>
                </div>

                <h3 className="font-serif text-sm font-semibold text-slate-900 leading-snug mb-1.5">
                  {prod.name}
                </h3>

                <p className="font-sans text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {prod.description}
                </p>

                {prod.includedItems && prod.includedItems.length > 0 && (
                  <div className="mb-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Included Elements:
                    </span>
                    <ul className="text-[11px] font-sans text-slate-600 space-y-0.5">
                      {prod.includedItems.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <span className="text-amber-600">•</span> {item}
                        </li>
                      ))}
                      {prod.includedItems.length > 3 && (
                        <li className="text-[10px] text-slate-400 font-medium">
                          +{prod.includedItems.length - 3} more items
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Tier: {prod.budgetTier}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(prod)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Edit Package"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingProduct(prod)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Package"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT PACKAGE MODAL                                 */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  {editingProduct ? 'Edit Corporate Package' : 'Add Corporate Package'}
                </h3>
                <p className="font-sans text-xs text-slate-500">
                  Configure corporate keepsake presentation and pricing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. The Executive Leather Folio & Cardholder"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Leather & Desk"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price (₦) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Order Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMinQuantity}
                    onChange={(e) => setFormMinQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Photography *
                </label>
                <div className="flex items-center gap-3">
                  {formImage ? (
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Package size={20} />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="Paste Image URL or choose file..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                    />
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                      <Upload size={12} />
                      <span>{uploadingImage ? 'Uploading image...' : 'Upload from device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Budget Tier & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget Tier
                  </label>
                  <select
                    value={formBudgetTier}
                    onChange={(e) => setFormBudgetTier(e.target.value as CorporateBudgetTier)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans bg-white focus:outline-none focus:border-slate-900"
                  >
                    {CORPORATE_BUDGET_TIERS.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.label} ({tier.range})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Editorial Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. Popular for Clients, Flagship Luxury"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Purpose Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose / Occasion Suitability
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CORPORATE_PURPOSES.map((purp) => {
                    const isSelected = formPurposes.includes(purp.id);
                    return (
                      <button
                        key={purp.id}
                        type="button"
                        onClick={() => handleTogglePurpose(purp.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {purp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the presentation, tactile materials, and recipient experience..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Included Items */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Included Elements (One per line)
                </label>
                <textarea
                  rows={3}
                  value={formIncludedItems}
                  onChange={(e) => setFormIncludedItems(e.target.value)}
                  placeholder="A4 Leather Document Folio&#10;Matching Slim Cardholder&#10;Solid Brass Rollerball Pen&#10;Presentation Keepsake Box"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-sans focus:outline-none focus:border-slate-900 font-mono text-[11px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-sans font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 rounded-xl text-xs font-sans font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL                                */}
      {/* ======================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                Delete Corporate Package?
              </h3>
              <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to remove <strong>"{deletingProduct.name}"</strong>? It will no longer appear on the live Corporate Concierge page.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-sans font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                <span>Delete Package</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
