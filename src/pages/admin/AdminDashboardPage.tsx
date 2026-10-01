import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Archive,
  PlusCircle,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { getProducts } from '../../services/productService';
import { getProductImageUrl } from '../../services/cloudinaryService';
import { Product } from '../../types/product';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const all = await getProducts(); // Retrieves both active and archived
        setProducts(all);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const activeProducts = products.filter((p) => !p.isArchived);
  const archivedProducts = products.filter((p) => p.isArchived);
  const availableProducts = activeProducts.filter((p) => p.isAvailable && p.stock > 0);
  const outOfStockProducts = activeProducts.filter((p) => p.stock === 0);
  const recentProducts = [...activeProducts].slice(0, 5);

  const stats = [
    {
      label: 'Active Products',
      value: activeProducts.length,
      icon: Package,
      color: '#2563eb',
      bgColor: 'rgba(37, 99, 235, 0.1)',
    },
    {
      label: 'Available in Store',
      value: availableProducts.length,
      icon: CheckCircle2,
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
    },
    {
      label: 'Out of Stock',
      value: outOfStockProducts.length,
      icon: AlertTriangle,
      color: outOfStockProducts.length > 0 ? '#d97706' : '#64748b',
      bgColor: outOfStockProducts.length > 0 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(100, 116, 139, 0.1)',
    },
    {
      label: 'Archived Products',
      value: archivedProducts.length,
      icon: Archive,
      color: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.1)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Banner & Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
            Dashboard Overview
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Welcome to the Good Things Co. product management atelier.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/admin/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {loading ? '...' : s.value}
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: s.bgColor,
                  color: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Products Section */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 2px 0', color: '#0f172a' }}>
              Recently Added Products
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Latest active creations in your store.
            </p>
          </div>
          <Link
            to="/admin/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0f172a',
              textDecoration: 'none',
            }}
          >
            <span>View All ({activeProducts.length})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading products...
          </div>
        ) : recentProducts.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Package size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px 0' }}>
              No products yet
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Start curating your first Good Things Co. gift creation.
            </p>
            <Link
              to="/admin/products/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <PlusCircle size={15} /> Add your first product
            </Link>
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
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((p) => {
                  const firstImg = p.images?.[0];
                  const imgUrl = firstImg ? getProductImageUrl(firstImg) : null;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '6px', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{p.category}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>₦{p.price.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ color: p.stock === 0 ? '#dc2626' : '#0f172a', fontWeight: p.stock === 0 ? 600 : 400 }}>
                          {p.stock} units
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: p.isAvailable && p.stock > 0 ? '#dcfce7' : '#fee2e2',
                            color: p.isAvailable && p.stock > 0 ? '#166534' : '#991b1b',
                          }}
                        >
                          {p.isAvailable && p.stock > 0 ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
