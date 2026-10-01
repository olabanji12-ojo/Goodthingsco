import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Search,
  Edit,
  Archive,
  Star,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getActiveProducts, archiveProduct } from '../../services/productService';
import { getProductImageUrl } from '../../services/cloudinaryService';
import { Product } from '../../types/product';

type FilterAvailability = 'all' | 'available' | 'unavailable' | 'featured';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterAvailability>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Archive Confirmation Modal
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch only unarchived products
      const list = await getActiveProducts(false); // false = return all active (both available and unavailable)
      setProducts(list);
    } catch (err) {
      console.error(err);
      setError('Failed to load products. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleArchiveConfirm = async () => {
    if (!productToArchive?.id) return;
    setArchiving(true);
    try {
      await archiveProduct(productToArchive.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToArchive.id));
      setToastMessage(`Product "${productToArchive.name}" has been archived.`);
      setProductToArchive(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive product.');
    } finally {
      setArchiving(false);
    }
  };

  // Derive categories from current active products
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    // Search match
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (selectedFilter === 'available') {
      matchesStatus = p.isAvailable && p.stock > 0;
    } else if (selectedFilter === 'unavailable') {
      matchesStatus = !p.isAvailable || p.stock === 0;
    } else if (selectedFilter === 'featured') {
      matchesStatus = Boolean(p.featured);
    }

    // Category filter
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Add CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
            Products Catalog
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Manage inventory, pricing, discovery tags, and presentation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/admin/products/new"
            id="admin-add-product-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <PlusCircle size={17} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Search & Filters Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or slug..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', borderRadius: '6px', backgroundColor: '#f1f5f9', padding: '3px' }}>
            {(['all', 'available', 'unavailable', 'featured'] as FilterAvailability[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: selectedFilter === tab ? '#ffffff' : 'transparent',
                  color: selectedFilter === tab ? '#0f172a' : '#64748b',
                  fontWeight: selectedFilter === tab ? 600 : 400,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: selectedFilter === tab ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                backgroundColor: '#ffffff',
                color: '#334155',
                outline: 'none',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Products Table Card */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Package size={44} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px 0' }}>
              {products.length === 0 ? 'No products yet.' : 'No matching products found.'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              {products.length === 0
                ? 'Create your first product to begin building your curated inventory.'
                : 'Try clearing your search or adjusting filters.'}
            </p>
            {products.length === 0 && (
              <Link
                to="/admin/products/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                <PlusCircle size={16} /> Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 20px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Price</th>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Featured</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const firstImg = p.images?.[0];
                  const imgUrl = firstImg ? getProductImageUrl(firstImg) : null;
                  const isAvailableInStore = p.isAvailable && p.stock > 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              <span>slug: {p.slug}</span>
                              <span style={{ margin: '0 6px' }}>•</span>
                              <span>{p.images.length} photo(s)</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '12px' }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>₦{p.price.toLocaleString()}</div>
                        {p.compareAtPrice && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ₦{p.compareAtPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ color: p.stock === 0 ? '#dc2626' : '#0f172a', fontWeight: p.stock === 0 ? 600 : 500 }}>
                          {p.stock} units
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: isAvailableInStore ? '#dcfce7' : '#fee2e2',
                            color: isAvailableInStore ? '#166534' : '#991b1b',
                          }}
                        >
                          {isAvailableInStore ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{isAvailableInStore ? 'Available' : p.stock === 0 ? 'Out of Stock' : 'Hidden'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {p.featured ? (
                          <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500 }}>
                            <Star size={14} fill="#d97706" /> Yes
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#0f172a',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            <Edit size={13} /> Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => setProductToArchive(p)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#fef2f2',
                              color: '#b91c1c',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            <Archive size={13} /> Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Archiving */}
      {productToArchive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', marginBottom: '12px' }}>
              <Archive size={22} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                Archive this product?
              </h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to archive <strong>"{productToArchive.name}"</strong>? It will no longer appear in the active customer store, but can be restored at any time from Archived Products.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setProductToArchive(null)}
                disabled={archiving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={archiving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: archiving ? 'not-allowed' : 'pointer',
                }}
              >
                {archiving ? 'Archiving...' : 'Yes, Archive Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
