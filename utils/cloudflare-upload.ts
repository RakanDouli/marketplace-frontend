/**
 * Unified Cloudflare Image Upload Utility
 * Single source of truth for all image uploads in the application
 */

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
/**
 * Make a direct GraphQL request (bypassing cache)
 * Used for mutations that should never be cached (like upload URL generation)
 */
async function directGraphQLRequest(query: string): Promise<any> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

  // Get auth token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    try {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      const storageKey = isAdminRoute ? 'admin-auth-storage' : 'user-auth-storage';
      const authData = localStorage.getItem(storageKey);

      if (authData) {
        const { state } = JSON.parse(authData);
        const token = state?.user?.token;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Could not get auth token:', error);
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

export async function uploadToCloudflare(
  file: File,
  mutationType: 'image' | 'avatar' = 'image'
): Promise<string> {
  try {
    // Step 1: Get fresh Cloudflare upload URL from backend (direct request, no cache!)
    const mutation = mutationType === 'avatar'
      ? 'mutation { createAvatarUploadUrl { uploadUrl assetKey } }'
      : 'mutation { createImageUploadUrl { uploadUrl assetKey } }';

    const data = await directGraphQLRequest(mutation);
    const field = mutationType === 'avatar' ? 'createAvatarUploadUrl' : 'createImageUploadUrl';
    const { uploadUrl, assetKey } = data[field];

    console.log(`📤 Uploading ${mutationType} to Cloudflare...`);
    console.log(`   Pre-upload assetKey: ${assetKey}`);
    console.log(`   Upload URL: ${uploadUrl.substring(0, 60)}...`);

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
 * @param maxSizeMB - Maximum file size in megabytes (default: 2MB per image)
 * @returns Error message if invalid, undefined if valid
 */
export function validateImageFile(file: File, maxSizeMB: number = 2): string | undefined {
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

    const mutation = `
      mutation DeleteAdMedia($assetKey: String!) {
        deleteAdMedia(assetKey: $assetKey)
      }
    `;

    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

    // Get auth token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      try {
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const storageKey = isAdminRoute ? 'admin-auth-storage' : 'user-auth-storage';
        const authData = localStorage.getItem(storageKey);

        if (authData) {
          const { state } = JSON.parse(authData);
          const token = state?.user?.token;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.warn('Could not get auth token:', error);
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: mutation,
        variables: { assetKey: imageId }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      // Don't throw - image might already be deleted
      return true;
    }

    console.log(`✅ Image deleted from Cloudflare: ${imageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting image from Cloudflare:`, error);
    // Don't throw - allow operation to continue even if deletion fails
    return false;
  }
}
