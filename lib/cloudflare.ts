// Cloudflare Images utility functions for frontend

export interface CloudflareImageVariant {
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * Generate Cloudflare Images URL with variants
 * @param imageId - The Cloudflare image ID
 * @param variant - Image transformation options
 * @returns Optimized image URL
 */
export function getCloudflareImageUrl(
  imageId: string,
  variant: CloudflareImageVariant = {}
): string {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH;
  
  if (!accountId || !hash) {
    console.warn('Cloudflare Images not configured, using fallback');
    return `/images/placeholder-car.jpg`;
  }

  const baseUrl = `https://imagedelivery.net/${hash}/${imageId}`;
  
  // Build variant string
  const variantParams: string[] = [];
  
  if (variant.width) variantParams.push(`w=${variant.width}`);
  if (variant.height) variantParams.push(`h=${variant.height}`);
  if (variant.quality) variantParams.push(`q=${variant.quality}`);
  if (variant.format && variant.format !== 'auto') variantParams.push(`f=${variant.format}`);
  if (variant.fit) variantParams.push(`fit=${variant.fit}`);
  
  // Common variants for Syrian marketplace
  if (variantParams.length === 0) {
    return `${baseUrl}/public`; // Default public variant
  }
  
  return `${baseUrl}/w=${variant.width || 800},h=${variant.height || 600},fit=${variant.fit || 'cover'},q=${variant.quality || 85}`;
}

/**
 * Get optimized listing image URL
 * @param imageId - Cloudflare image ID
 * @param size - Predefined size variant
 */
export function getListingImageUrl(
  imageId: string, 
  size: 'thumb' | 'card' | 'detail' | 'full' = 'card'
): string {
  const variants = {
    thumb: { width: 150, height: 150, fit: 'cover' as const, quality: 80 },
    card: { width: 400, height: 300, fit: 'cover' as const, quality: 85 },
    detail: { width: 800, height: 600, fit: 'cover' as const, quality: 90 },
    full: { width: 1200, height: 900, fit: 'scale-down' as const, quality: 95 }
  };
  
  return getCloudflareImageUrl(imageId, variants[size]);
}

/**
 * Get optimized avatar image URL
 * @param imageId - Cloudflare image ID
 * @param size - Avatar size in pixels
 */
export function getAvatarImageUrl(
  imageId: string,
  size: number = 40
): string {
  return getCloudflareImageUrl(imageId, {
    width: size,
    height: size,
    fit: 'cover',
    quality: 85,
    format: 'webp'
  });
}

/**
 * Upload file to backend which handles Cloudflare Images
 * @param file - File to upload
 * @returns Promise with upload result
 */
export async function uploadImage(file: File): Promise<{
  success: boolean;
  imageId?: string;
  url?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Add auth header if needed
      headers: {
        // Authorization will be added by Apollo client interceptor
      }
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      imageId: result.imageId,
      url: result.url
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'); // 10MB default
  const allowedTypes = process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png', 
    'image/webp'
  ];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى ${(maxSize / (1024 * 1024)).toFixed(1)} ميجابايت`
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}