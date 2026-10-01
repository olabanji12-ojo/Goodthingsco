import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  RefreshCw,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { getProducts, restoreProduct } from '../../services/productService';
import { getProductImageUrl } from '../../services/cloudinaryService';
import { Product } from '../../types/product';

export default function AdminArchivedPage() {
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore Modal State
  const [productToRestore, setProductToRestore] = useState<Product | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchArchived = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getProducts({ isArchived: true });
      setArchivedProducts(all);
    } catch (err) {
      console.error(err);
      setError('Failed to load archived products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestoreConfirm = async () => {
    if (!productToRestore?.id) return;
    setRestoring(true);
    try {
      await restoreProduct(productToRestore.id);
      setArchivedProducts((prev) => prev.filter((p) => p.id !== productToRestore.id));
      setToastMessage(`Product "${productToRestore.name}" has been restored to the active catalog.`);
      setProductToRestore(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore product.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Link
            to="/admin/products"
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
              textDecoration: 'none',
              marginBottom: '8px',
            }}
          >
            <ArrowLeft size={14} /> Back to Products
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Archived Products
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Historical products hidden from the store. You can restore them to active status at any time.
          </p>
        </div>
      </div>

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

      {/* Table Card */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading archived catalog...
          </div>
        ) : archivedProducts.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Archive size={44} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px 0' }}>
              No archived products
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              All products in your catalog are currently active and available.
            </p>
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
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedProducts.map((p) => {
                  const firstImg = p.images?.[0];
                  const imgUrl = firstImg ? getProductImageUrl(firstImg) : null;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0, opacity: 0.75 }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{p.category}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>₦{p.price.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{p.stock} units</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setProductToRestore(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <RefreshCw size={13} /> Restore Product
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Restoring */}
      {productToRestore && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#059669', marginBottom: '12px' }}>
              <RefreshCw size={22} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                Restore this product?
              </h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              This will restore <strong>"{productToRestore.name}"</strong> back into your active catalog.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setProductToRestore(null)}
                disabled={restoring}
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
                onClick={handleRestoreConfirm}
                disabled={restoring}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: restoring ? 'not-allowed' : 'pointer',
                }}
              >
                {restoring ? 'Restoring...' : 'Yes, Restore Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
