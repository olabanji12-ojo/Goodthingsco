/**
 * Good Things Co. — Cloudinary Image Upload Service
 *
 * Dedicated service for client-side unsigned image uploads to Cloudinary.
 * Credentials (Cloud Name & Upload Preset) are read safely from environment variables.
 *
 * NOTE: Cloudinary API Secret is NEVER included or exposed in frontend code.
 */

import { ProductImage, ProductImageItem } from '../types/product';

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

// Maximum upload file size: 10MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = '10MB';

// Preferred folder organization in Cloudinary
export const DEFAULT_CLOUDINARY_FOLDER = 'goodthingsco/products';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  [key: string]: unknown;
}

/**
 * Reads and verifies required Cloudinary environment configuration.
 */
export function getCloudinaryConfig(): { cloudName: string; uploadPreset: string } {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error(
      '[Cloudinary] Missing VITE_CLOUDINARY_CLOUD_NAME in environment. Please verify your .env file.'
    );
  }

  if (!uploadPreset) {
    throw new Error(
      '[Cloudinary] Missing VITE_CLOUDINARY_UPLOAD_PRESET in environment. Please verify your .env file.'
    );
  }

  return { cloudName, uploadPreset };
}

/**
 * Validates a single image file before sending to Cloudinary.
 * Checks for permitted MIME types and size constraints.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type "${file.type || 'unknown'}". Allowed formats: JPEG, PNG, WebP, AVIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File "${file.name}" is ${sizeInMB}MB. Maximum permitted size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  return { isValid: true };
}

/**
 * Uploads a single image to Cloudinary via the unsigned upload API.
 *
 * @param file The image File to upload
 * @param customFolder Optional folder override (defaults to 'goodthingsco/products')
 * @returns Clean ProductImage object with secure URL and publicId
 */
export async function uploadImage(
  file: File,
  customFolder: string = DEFAULT_CLOUDINARY_FOLDER
): Promise<ProductImage> {
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (customFolder) {
    formData.append('folder', customFolder);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        `Cloudinary upload failed with status ${response.status} (${response.statusText})`;
      console.error('[Cloudinary upload error]', data);
      throw new Error(errorMessage);
    }

    const result = data as CloudinaryUploadResponse;

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected network failure occurred while uploading image.');
  }
}

/**
 * Uploads multiple images to Cloudinary in controlled sequence, preserving order.
 *
 * @param files Array of File objects to upload
 * @param onProgress Optional callback receiving (completedCount, totalCount)
 * @returns Array of uploaded ProductImage objects in the exact input order
 */
export async function uploadImages(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<ProductImage[]> {
  if (!files || files.length === 0) {
    return [];
  }

  // Pre-validate all files
  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }

  const uploadedImages: ProductImage[] = [];
  let completed = 0;

  for (const file of files) {
    const uploaded = await uploadImage(file);
    uploadedImages.push(uploaded);
    completed += 1;
    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  return uploadedImages;
}

/**
 * Utility to extract the display URL from either a ProductImage object or legacy string URL.
 */
export function getProductImageUrl(image: ProductImageItem): string {
  if (typeof image === 'string') {
    return image;
  }
  return image.url || '';
}

/**
 * Utility to safely remove an image from an array in local component state.
 */
export function removeImageFromList(
  images: ProductImageItem[],
  indexOrPublicId: number | string
): ProductImageItem[] {
  if (typeof indexOrPublicId === 'number') {
    return images.filter((_, idx) => idx !== indexOrPublicId);
  }
  return images.filter((img) => {
    if (typeof img === 'string') return img !== indexOrPublicId;
    return img.publicId !== indexOrPublicId && img.url !== indexOrPublicId;
  });
}
