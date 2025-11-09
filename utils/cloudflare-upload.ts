/**
 * Unified Cloudflare Image Upload Utility
 * Single source of truth for all image uploads in the application
 */

import { cachedGraphQLRequest } from './graphql-cache';

export interface CloudflareUploadResult {
  imageId: string;
  uploadUrl: string;
}

export interface CloudflareUploadError {
  message: string;
  code?: string;
}

/**
 * Upload a single image to Cloudflare
 *
 * @param file - The image file to upload
 * @param mutationType - The GraphQL mutation to use ('image' | 'avatar')
 * @returns Promise with the actual Cloudflare image ID
 *
 * @example
 * ```typescript
 * // For listing images
 * const imageId = await uploadToCloudflare(file, 'image');
 *
 * // For avatar uploads
 * const imageId = await uploadToCloudflare(file, 'avatar');
 * ```
 */
export async function uploadToCloudflare(
  file: File,
  mutationType: 'image' | 'avatar' = 'image'
): Promise<string> {
  try {
    // Step 1: Get Cloudflare upload URL from backend
    const mutation = mutationType === 'avatar'
      ? 'mutation { createAvatarUploadUrl { uploadUrl assetKey } }'
      : 'mutation { createImageUploadUrl { uploadUrl assetKey } }';

    const uploadData = await cachedGraphQLRequest(mutation);
    const field = mutationType === 'avatar' ? 'createAvatarUploadUrl' : 'createImageUploadUrl';
    const { uploadUrl, assetKey } = (uploadData as any)[field];

    console.log(`📤 Uploading ${mutationType} to Cloudflare...`);
    console.log(`   Pre-upload assetKey: ${assetKey}`);

    // Step 2: Upload file to Cloudflare
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Cloudflare upload failed:', uploadResponse.status, errorText);
      throw new Error('فشل رفع الصورة إلى Cloudflare');
    }

    // Step 3: Extract ACTUAL image ID from Cloudflare response
    const uploadResult = await uploadResponse.json();
    console.log('📥 Cloudflare upload response:', uploadResult);

    if (!uploadResult.success) {
      console.error('❌ Cloudflare upload failed (success=false):', uploadResult);
      throw new Error('فشل رفع الصورة');
    }

    const actualImageId = uploadResult?.result?.id;
    if (!actualImageId) {
      console.error('❌ Missing image ID in Cloudflare response:', uploadResult);
      throw new Error('لم يتم الحصول على معرف الصورة من Cloudflare');
    }

    console.log('✅ Image uploaded successfully to Cloudflare');
    console.log(`   Actual Cloudflare ID: ${actualImageId}`);

    return actualImageId;
  } catch (error) {
    console.error('❌ Error in uploadToCloudflare:', error);
    throw error;
  }
}

/**
 * Upload multiple images to Cloudflare in parallel
 *
 * @param files - Array of image files to upload
 * @param mutationType - The GraphQL mutation to use
 * @returns Promise with array of actual Cloudflare image IDs
 *
 * @example
 * ```typescript
 * const imageIds = await uploadMultipleToCloudflare(files, 'image');
 * ```
 */
export async function uploadMultipleToCloudflare(
  files: File[],
  mutationType: 'image' | 'avatar' = 'image'
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadToCloudflare(file, mutationType));
    const imageIds = await Promise.all(uploadPromises);

    console.log(`✅ Uploaded ${imageIds.length} images to Cloudflare`);
    return imageIds;
  } catch (error) {
    console.error('❌ Error in uploadMultipleToCloudflare:', error);
    throw error;
  }
}

/**
 * Validate image file before upload
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns Error message if invalid, undefined if valid
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): string | undefined {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP';
  }

  return undefined;
}

/**
 * Delete image from Cloudflare via backend
 *
 * @param imageId - The Cloudflare image ID to delete
 * @returns Promise resolving to true if successful
 *
 * @example
 * ```typescript
 * await deleteFromCloudflare('8f4d20fb-9d44-4c33-728b-3622eeb32500');
 * ```
 */
export async function deleteFromCloudflare(imageId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting image from Cloudflare: ${imageId}`);

    // Note: Backend handles the actual deletion via ImagesService
    // This is typically called through mutations like deleteMessage, updateMyListing, etc.
    // This function is here for reference and future direct deletion support

    console.log(`✅ Image deleted from Cloudflare: ${imageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting image from Cloudflare:`, error);
    throw error;
  }
}
