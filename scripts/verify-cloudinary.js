/**
 * Cloudinary Unsigned Upload Verification Script
 *
 * Tests the Cloudinary configuration directly against the Cloudinary API
 * using cloudName: j5edimte and uploadPreset: goodthingsco.
 */

const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

console.log('====================================================');
console.log('CLOUDINARY UNSIGNED UPLOAD VERIFICATION');
console.log(`Cloud Name: ${cloudName}`);
console.log(`Upload Preset: ${uploadPreset}`);
console.log('====================================================\n');

if (!cloudName || !uploadPreset) {
  console.error('❌ Missing Cloudinary environment variables in .env');
  process.exit(1);
}

async function testCloudinaryUpload() {
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log(`1. Testing endpoint: ${endpoint}`);

  // Create a minimal 1x1 transparent PNG buffer for testing
  const png1x1Base64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const formData = new FormData();
  formData.append('file', png1x1Base64);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'goodthingsco/products');

  console.log('2. Sending unsigned upload request with FormData...');
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Cloudinary error (${res.status}):`, data?.error?.message || data);
      process.exit(1);
    }

    console.log('\n✅ UPLOAD SUCCESSFUL!');
    console.log(`• Secure URL: ${data.secure_url}`);
    console.log(`• Public ID:  ${data.public_id}`);
    console.log(`• Dimensions: ${data.width}x${data.height}`);
    console.log(`• Format:     ${data.format}`);
    console.log(`• Bytes:      ${data.bytes}`);
    console.log(`• Folder:     ${data.asset_folder || data.folder || 'goodthingsco/products'}`);

    console.log('\n====================================================');
    console.log('🎉 CLOUDINARY CONFIGURATION AND UPLOAD VERIFIED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Request failed:', err);
    process.exit(1);
  }
}

testCloudinaryUpload();
