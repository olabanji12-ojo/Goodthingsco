import { useState } from 'react';
import { runProductCrudTests, TestSuiteReport } from '../scripts/testProductCrud';
import { seedSampleProducts } from '../scripts/seedProducts';
import { getActiveProducts } from '../services/productService';
import { Product } from '../types/product';

export default function DevTestPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const handleRunTests = async () => {
    setLoading(true);
    try {
      const res = await runProductCrudTests();
      setReport(res);
      const active = await getActiveProducts();
      setActiveProducts(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setSeedStatus('Seeding initial products into Firestore...');
    try {
      const seeded = await seedSampleProducts();
      setSeedStatus(`Successfully seeded ${seeded.created.length} sample product(s)! (${seeded.skipped.length} already existed)`);
      const active = await getActiveProducts();
      setActiveProducts(active);
    } catch (err) {
      setSeedStatus(`Error seeding: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        Firebase / Firestore Product Data Foundation Test Suite
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Target Project: <code>goodthingsco01</code> | Collection: <code>products</code>
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button
          id="run-crud-tests-btn"
          onClick={handleRunTests}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {loading ? 'Running Test Suite...' : 'Run 10-Step CRUD Test Suite'}
        </button>

        <button
          id="seed-products-btn"
          onClick={handleSeed}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#059669',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          Seed Sample Products
        </button>
      </div>

      {seedStatus && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', color: '#065f46', borderRadius: '6px', marginBottom: '24px' }}>
          {seedStatus}
        </div>
      )}

      {report && (
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: report.failed === 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${report.failed === 0 ? '#bbf7d0' : '#fecaca'}`,
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', color: report.failed === 0 ? '#166534' : '#991b1b' }}>
              {report.failed === 0 ? '🎉 All 10 CRUD Tests Passed Successfully!' : `⚠️ ${report.failed} Test(s) Failed`}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
              Completed at: {report.timestamp} | Total: {report.total} | Passed: {report.passed} | Failed: {report.failed}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.results.map((res, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: res.passed ? '#ffffff' : '#fff1f2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>{res.passed ? '✅' : '❌'}</span>
                  <span>{res.name}</span>
                </div>
                {res.details && (
                  <div style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280', paddingLeft: '26px' }}>
                    {res.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeProducts.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Active Products in Firestore ({activeProducts.length}):
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {activeProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                }}
              >
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{p.name}</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>{p.slug}</p>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>₦{p.price.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                  Occasions: {p.occasions.join(', ')} | Recipients: {p.recipients.join(', ')}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                  ID: <code>{p.id}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
