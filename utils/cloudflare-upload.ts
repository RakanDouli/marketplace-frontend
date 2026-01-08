/**
 * Unified Cloudflare Media Upload Utility
 * Single source of truth for all image and video uploads in the application
 * Note: Cloudflare Images API accepts both images and videos
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
 * Upload a single file (image or video) to Cloudflare
 *
 * @param file - The image or video file to upload
 * @param mutationType - The GraphQL mutation to use ('image' | 'avatar' | 'video')
 * @returns Promise with the actual Cloudflare asset ID
 *
 * @example
 * ```typescript
 * // For listing images
 * const imageId = await uploadToCloudflare(file, 'image');
 *
 * // For avatar uploads
 * const imageId = await uploadToCloudflare(file, 'avatar');
 *
 * // For video uploads (uses same Cloudflare Images API)
 * const videoId = await uploadToCloudflare(file, 'video');
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
  mutationType: 'image' | 'avatar' | 'video' = 'image'
): Promise<string> {
  try {
    // Step 1: Get fresh Cloudflare upload URL from backend (direct request, no cache!)
    // Note: Video uses the same mutation as image - Cloudflare Images accepts videos
    let mutation: string;
    let field: string;

    if (mutationType === 'avatar') {
      mutation = 'mutation { createAvatarUploadUrl { uploadUrl assetKey } }';
      field = 'createAvatarUploadUrl';
    } else {
      // Both 'image' and 'video' use the same endpoint
      mutation = 'mutation { createImageUploadUrl { uploadUrl assetKey } }';
      field = 'createImageUploadUrl';
    }

    const data = await directGraphQLRequest(mutation);
    const { uploadUrl, assetKey } = data[field];

    // Step 2: Upload file to Cloudflare
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorMsg = mutationType === 'video' ? 'فشل رفع الفيديو إلى Cloudflare' : 'فشل رفع الصورة إلى Cloudflare';
      throw new Error(errorMsg);
    }

    // Step 3: Extract ACTUAL asset ID from Cloudflare response
    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      const errorMsg = mutationType === 'video' ? 'فشل رفع الفيديو' : 'فشل رفع الصورة';
      throw new Error(errorMsg);
    }

    const actualAssetId = uploadResult?.result?.id;
    if (!actualAssetId) {
      const errorMsg = mutationType === 'video' ? 'لم يتم الحصول على معرف الفيديو من Cloudflare' : 'لم يتم الحصول على معرف الصورة من Cloudflare';
      throw new Error(errorMsg);
    }

    return actualAssetId;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload multiple files (images or videos) to Cloudflare in parallel
 *
 * @param files - Array of files to upload
 * @param mutationType - The GraphQL mutation to use
 * @returns Promise with array of actual Cloudflare asset IDs
 *
 * @example
 * ```typescript
 * const imageIds = await uploadMultipleToCloudflare(files, 'image');
 * const videoIds = await uploadMultipleToCloudflare(files, 'video');
 * ```
 */
export async function uploadMultipleToCloudflare(
  files: File[],
  mutationType: 'image' | 'avatar' | 'video' = 'image'
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadToCloudflare(file, mutationType));
    const assetIds = await Promise.all(uploadPromises);
    return assetIds;
  } catch (error) {
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
 * Validate video file before upload
 *
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 20MB per video)
 * @returns Error message if invalid, undefined if valid
 */
export function validateVideoFile(file: File, maxSizeMB: number = 20): string | undefined {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `حجم الفيديو كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`;
  }

  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  if (!allowedTypes.includes(file.type)) {
    return 'نوع الفيديو غير مدعوم. استخدم MP4 أو WebM أو MOV';
  }

  return undefined;
}

/**
 * Upload video to R2 storage via backend REST API
 *
 * @param file - The video file to upload
 * @returns Promise with the R2 public URL
 *
 * @example
 * ```typescript
 * const videoUrl = await uploadVideoToR2(file);
 * // Returns: "https://pub-xxx.r2.dev/videos/xxx.mp4"
 * ```
 */
export async function uploadVideoToR2(file: File): Promise<string> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.replace('/graphql', '') || 'http://localhost:4000';

  // Get auth token
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('user-auth-storage');
      if (authData) {
        const { state } = JSON.parse(authData);
        token = state?.user?.token;
      }
    } catch (error) {
      console.warn('Could not get auth token:', error);
    }
  }

  if (!token) {
    throw new Error('يرجى تسجيل الدخول أولاً');
  }

  // Create form data with video file
  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch(`${endpoint}/api/listings/upload-video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'فشل رفع الفيديو');
  }

  const result = await response.json();

  if (!result.videoUrl) {
    throw new Error('لم يتم الحصول على رابط الفيديو');
  }

  return result.videoUrl;
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
      // Don't throw - image might already be deleted
      return true;
    }

    return true;
  } catch (error) {
    // Don't throw - allow operation to continue even if deletion fails
    return false;
  }
}
