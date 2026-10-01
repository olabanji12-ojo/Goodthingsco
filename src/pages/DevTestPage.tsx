import { useState, ChangeEvent } from 'react';
import { runProductCrudTests, TestSuiteReport } from '../scripts/testProductCrud';
import { seedSampleProducts } from '../scripts/seedProducts';
import { getActiveProducts, createProduct, getProductById } from '../services/productService';
import {
  uploadImages,
  validateImageFile,
  getProductImageUrl,
  removeImageFromList,
  getCloudinaryConfig,
} from '../services/cloudinaryService';
import { Product, ProductImage } from '../types/product';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function DevTestPage() {
  // CRUD Test Suite state
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  // Cloudinary Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);

  // Firestore Product with Cloudinary Images state
  const [persistingProduct, setPersistingProduct] = useState(false);
  const [persistedProduct, setPersistedProduct] = useState<Product | null>(null);
  const [persistMessage, setPersistMessage] = useState<string | null>(null);

  // Read Cloudinary config
  let cloudConfigInfo = { cloudName: '', uploadPreset: '' };
  try {
    cloudConfigInfo = getCloudinaryConfig();
  } catch (e) {
    console.warn(e);
  }

  // 1. Run 10-Step CRUD Tests
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

  // 2. Seed Sample Products
  const handleSeed = async () => {
    setLoading(true);
    setSeedStatus('Seeding initial products into Firestore...');
    try {
      const seeded = await seedSampleProducts();
      setSeedStatus(
        `Successfully seeded ${seeded.created.length} sample product(s)! (${seeded.skipped.length} already existed)`
      );
      const active = await getActiveProducts();
      setActiveProducts(active);
    } catch (err) {
      setSeedStatus(`Error seeding: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. File Selection & Validation
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
    setUploadStatus('idle');
    setUploadError(null);

    const errors: string[] = [];
    files.forEach((f) => {
      const val = validateImageFile(f);
      if (!val.isValid && val.error) {
        errors.push(val.error);
      }
    });
    setValidationErrors(errors);
  };

  // 4. Upload to Cloudinary
  const handleUploadToCloudinary = async () => {
    if (selectedFiles.length === 0) return;

    setUploadStatus('uploading');
    setUploadError(null);
    setUploadProgress(`Uploading 0 of ${selectedFiles.length}...`);

    try {
      const images = await uploadImages(selectedFiles, (completed, total) => {
        setUploadProgress(`Uploading ${completed} of ${total} images...`);
      });

      setUploadedImages((prev) => [...prev, ...images]);
      setUploadStatus('success');
      setUploadProgress(`Successfully uploaded ${images.length} image(s) to Cloudinary!`);
      setSelectedFiles([]);
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : String(err));
    }
  };

  // 5. Remove an image from local state
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => removeImageFromList(prev, index) as ProductImage[]);
  };

  // 6. Save Product with Uploaded Images to Firestore
  const handleSaveProductToFirestore = async () => {
    if (uploadedImages.length === 0) {
      setPersistMessage('Please upload at least one image first.');
      return;
    }

    setPersistingProduct(true);
    setPersistMessage(null);

    try {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const newProduct = await createProduct({
        name: `Bespoke Botanical Hamper ${uniqueSuffix}`,
        description: 'Luxury botanical gift box with artisanal teas, hand-crafted diffuser, and personalized note card.',
        price: 52000,
        compareAtPrice: 60000,
        category: 'Gift Box',
        occasions: ['birthday', 'thank-you', 'celebration'],
        recipients: ['her', 'mum', 'colleague'],
        budgetRange: '50000-100000',
        stock: 8,
        isAvailable: true,
        featured: true,
        images: uploadedImages, // Full ProductImage[] with publicId and secure URL
        packagingOptions: ['Gift Box', 'Wooden Box'],
        ribbonColours: ['Gold', 'Olive'],
        personalisation: {
          enabled: true,
          messageAllowed: true,
        },
      });

      // Read back from Firestore to verify persistence
      const verified = await getProductById(newProduct.id!);
      setPersistedProduct(verified);
      setPersistMessage(`🎉 Successfully saved product "${verified?.name}" to Firestore with ${verified?.images.length} Cloudinary image(s)!`);

      const active = await getActiveProducts();
      setActiveProducts(active);
    } catch (err) {
      setPersistMessage(`Failed to save product: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPersistingProduct(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1080px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>
          Good Things Co. — Functional Foundation Testbed
        </h1>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: '#4b5563' }}>
          <span>
            Firestore: <code>goodthingsco01</code>
          </span>
          <span>
            Cloudinary Cloud: <code>{cloudConfigInfo.cloudName || 'not set'}</code>
          </span>
          <span>
            Preset: <code>{cloudConfigInfo.uploadPreset || 'not set'} (unsigned)</code>
          </span>
        </div>
      </header>

      {/* ======================================================== */}
      {/* SECTION A: CLOUDINARY IMAGE UPLOAD & PERSISTENCE TEST   */}
      {/* ======================================================== */}
      <section
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 600, margin: '0 0 4px 0', color: '#0f172a' }}>
              📸 Cloudinary Image Upload & Persistence
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Unsigned upload endpoint: <code>https://api.cloudinary.com/v1_1/{cloudConfigInfo.cloudName || '{cloudName}'}/image/upload</code>
            </p>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: uploadStatus === 'success' ? '#dcfce7' : uploadStatus === 'uploading' ? '#fef3c7' : '#f1f5f9',
              color: uploadStatus === 'success' ? '#166534' : uploadStatus === 'uploading' ? '#92400e' : '#475569',
            }}
          >
            Status: {uploadStatus.toUpperCase()}
          </span>
        </div>

        {/* Upload Controls */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <label
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1e293b',
            }}
          >
            Select Image(s)
            <input
              id="cloudinary-file-input"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {selectedFiles.length > 0 && (
            <span style={{ fontSize: '14px', color: '#334155' }}>
              {selectedFiles.length} file(s) selected
            </span>
          )}

          <button
            id="cloudinary-upload-btn"
            onClick={handleUploadToCloudinary}
            disabled={selectedFiles.length === 0 || validationErrors.length > 0 || uploadStatus === 'uploading'}
            style={{
              padding: '10px 22px',
              backgroundColor:
                selectedFiles.length === 0 || validationErrors.length > 0 || uploadStatus === 'uploading'
                  ? '#94a3b8'
                  : '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              cursor:
                selectedFiles.length === 0 || validationErrors.length > 0 || uploadStatus === 'uploading'
                  ? 'not-allowed'
                  : 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
          >
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload to Cloudinary'}
          </button>

          {uploadedImages.length > 0 && (
            <button
              id="save-product-with-images-btn"
              onClick={handleSaveProductToFirestore}
              disabled={persistingProduct}
              style={{
                padding: '10px 22px',
                backgroundColor: persistingProduct ? '#94a3b8' : '#059669',
                color: '#ffffff',
                borderRadius: '8px',
                border: 'none',
                cursor: persistingProduct ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              {persistingProduct ? 'Saving to Firestore...' : 'Save Product with Images to Firestore'}
            </button>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '13px', marginBottom: '4px' }}>
              Validation Failed:
            </div>
            {validationErrors.map((err, idx) => (
              <div key={idx} style={{ fontSize: '13px', color: '#b91c1c' }}>
                • {err}
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress / Message */}
        {uploadProgress && (
          <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            {uploadProgress}
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600, color: '#991b1b' }}>Upload Error: </span>
            <span style={{ fontSize: '13px', color: '#b91c1c' }}>{uploadError}</span>
          </div>
        )}

        {/* Firestore Persistence Message */}
        {persistMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: persistedProduct ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${persistedProduct ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '8px',
              color: persistedProduct ? '#166534' : '#991b1b',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {persistMessage}
          </div>
        )}

        {/* Gallery of Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
              Uploaded Images ({uploadedImages.length}):
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {uploadedImages.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ position: 'relative', height: '160px', backgroundColor: '#f1f5f9' }}>
                    <img
                      src={getProductImageUrl(img)}
                      alt={img.alt || `Product Image ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {idx === 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Cover Image
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '12px', fontSize: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                      <strong>Public ID:</strong> <code style={{ wordBreak: 'break-all' }}>{img.publicId}</code>
                    </div>
                    {img.width && img.height && (
                      <div>
                        <strong>Dimensions:</strong> {img.width} × {img.height} px
                      </div>
                    )}
                    {img.format && (
                      <div>
                        <strong>Format:</strong> {img.format.toUpperCase()}
                      </div>
                    )}
                    {img.bytes && (
                      <div>
                        <strong>Size:</strong> {(img.bytes / 1024).toFixed(1)} KB
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Remove from list
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persisted Product Details */}
        {persistedProduct && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#166534', fontWeight: 600 }}>
              Verified Firestore Document:
            </h4>
            <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.6' }}>
              <div><strong>Document ID:</strong> <code>{persistedProduct.id}</code></div>
              <div><strong>Name:</strong> {persistedProduct.name}</div>
              <div><strong>Price:</strong> ₦{persistedProduct.price.toLocaleString()}</div>
              <div><strong>Stored Images Count:</strong> {persistedProduct.images.length}</div>
              <div>
                <strong>Images JSON Stored in Firestore:</strong>
                <pre style={{ margin: '8px 0 0 0', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '11px', overflowX: 'auto' }}>
                  {JSON.stringify(persistedProduct.images, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION B: 10-STEP CRUD TEST SUITE & SAMPLE SEEDING     */}
      {/* ======================================================== */}
      <section>
        <h2 style={{ fontSize: '19px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
          📦 Firestore Product CRUD Test Suite
        </h2>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
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
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: report.failed === 0 ? '#166534' : '#991b1b' }}>
                {report.failed === 0 ? '🎉 All 10 CRUD Tests Passed Successfully!' : `⚠️ ${report.failed} Test(s) Failed`}
              </h3>
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
              {activeProducts.map((p) => {
                const firstImg = p.images?.[0];
                const imgUrl = firstImg ? getProductImageUrl(firstImg) : null;
                return (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#fafafa',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {imgUrl && (
                      <div style={{ height: '140px', backgroundColor: '#f1f5f9' }}>
                        <img
                          src={imgUrl}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{p.name}</h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>{p.slug}</p>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>₦{p.price.toLocaleString()}</div>
                      <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                        Occasions: {p.occasions.join(', ')} | Recipients: {p.recipients.join(', ')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                        ID: <code>{p.id}</code> | Images: {p.images.length}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
