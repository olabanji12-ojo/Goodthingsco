import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';
import { getProductById, updateProduct } from '../../services/productService';
import { Product, CreateProductInput, UpdateProductInput } from '../../types/product';

export default function AdminProductEditPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setError('No product ID provided in URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const item = await getProductById(productId);
        if (!item) {
          setError('Product not found or has been removed.');
        } else {
          setProduct(item);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve product details.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleUpdate = async (data: CreateProductInput | UpdateProductInput) => {
    if (!productId) return;
    await updateProduct(productId, data as UpdateProductInput);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#0f172a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px auto',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div>Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
          Unable to Load Product
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
          {error || 'The requested product could not be located.'}
        </p>
        <Link
          to="/admin/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Return to Products Catalog
        </Link>
      </div>
    );
  }

  return <ProductForm initialProduct={product} onSubmit={handleUpdate} isEdit={true} />;
}
