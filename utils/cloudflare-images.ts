// Cloudflare Image Optimization Utility
// Transforms Supabase/raw image URLs to optimized Cloudflare URLs

export interface CloudflareImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpeg" | "png";
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  gravity?: "auto" | "center" | "left" | "right" | "top" | "bottom";
}

const CLOUDFLARE_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFLARE_DOMAIN;
const CLOUDFLARE_IMAGES_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH;
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const SUPABASE_STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
  "https://supabase.co/storage/v1/object/public";

/**
 * Extract Cloudflare image ID from various URL formats
 */
function extractImageId(url: string): string | null {
  // If it's already a Cloudflare Images URL, extract the ID
  if (url.includes("imagedelivery.net")) {
    const match = url.match(/imagedelivery\.net\/[^\/]+\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // If it's a UUID (image key from backend), use it directly
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const uuidMatch = url.match(uuidRegex);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Extract filename without extension for other cases
  const filename = url.split('/').pop()?.split('.')[0];
  return filename || null;
}

/**
 * Map image options to predefined Cloudflare Images variants
 * You need to create these variants in your Cloudflare Images dashboard
 */
function getVariantName(options: CloudflareImageOptions): string {
  const { width, height } = options;

  // Card images (400x300) - Used for product cards, grid views
  if (width === 400 && height === 300) return 'card'; // Grid view cards

  // Small images (300x200) - Used for list views, previews
  if (width === 300 && height === 200) return 'small'; // List view, small previews

  // Large images (800x600) - Used for detail views, hero images
  if (width === 800 && height === 600) return 'large'; // Detail view, hero images

  // Responsive breakpoint sizes (different from card sizes)
  if (width === 360 && height === 270) return 'mobile'; // Mobile responsive (smaller than card)
  if (width === 768 && height === 576) return 'tablet'; // Tablet responsive
  if (width === 1200 && height === 900) return 'desktop'; // Desktop responsive

  // Blur placeholder (tiny, low quality)
  if (width === 20 && height === 20) return 'blur';

  // Regular thumbnails (small but decent quality)
  if (width === 150 && height === 150) return 'thumbnail';

  // Default public variant
  return 'public';
}

/**
 * Optimizes image URL using Cloudflare Images
 * Converts image keys/URLs to Cloudflare Images URLs
 */
export function optimizeImageUrl(
  originalUrl: string,
  options: CloudflareImageOptions = {}
): string {
  // In development, use original URLs to avoid Cloudflare optimization
  if (IS_DEVELOPMENT) {
    return originalUrl;
  }

  // If missing required Cloudflare config, return original
  if (!CLOUDFLARE_DOMAIN || !CLOUDFLARE_IMAGES_HASH) {
    return originalUrl;
  }

  // If it's already a properly formed Cloudflare Images URL, return as-is
  if (originalUrl.includes(`${CLOUDFLARE_DOMAIN}/${CLOUDFLARE_IMAGES_HASH}/`)) {
    return originalUrl;
  }

  // Extract image ID from the URL
  const imageId = extractImageId(originalUrl);
  if (!imageId) {
    return originalUrl; // Can't extract ID, return original
  }

  // Default optimization options for Syrian marketplace
  const defaultOptions: CloudflareImageOptions = {
    quality: 85, // Good balance for Syrian internet speeds
    format: "auto", // Let browser choose best format
    fit: "cover", // Cover by default for better appearance
    ...options,
  };

  // Get appropriate variant name
  const variant = getVariantName(defaultOptions);

  // Return Cloudflare Images URL
  return `https://${CLOUDFLARE_DOMAIN}/${CLOUDFLARE_IMAGES_HASH}/${imageId}/${variant}`;
}

/**
 * Generates responsive image URLs for different screen sizes
 * Perfect for Next.js Image component srcSet
 */
export function generateResponsiveImageUrls(
  originalUrl: string,
  baseOptions: CloudflareImageOptions = {}
): {
  mobile: string;
  tablet: string;
  desktop: string;
  original: string;
} {
  return {
    mobile: optimizeImageUrl(originalUrl, { ...baseOptions, width: 400 }),
    tablet: optimizeImageUrl(originalUrl, { ...baseOptions, width: 768 }),
    desktop: optimizeImageUrl(originalUrl, { ...baseOptions, width: 1200 }),
    original: optimizeImageUrl(originalUrl, baseOptions),
  };
}

/**
 * Optimizes images for different view modes (grid/list/detail)
 * Can be used for any content: listings, products, profiles, etc.
 */
export function optimizeListingImage(
  imageKey: string,
  viewMode: "grid" | "list" | "detail" | "admin" = "grid"
): string {
  // Add type safety check
  if (!imageKey || typeof imageKey !== 'string') {
    console.warn('optimizeListingImage: imageKey is not a valid string:', imageKey);
    return ''; // Return empty string or a default image URL
  }

  // If it's already a full URL, use it directly
  // Otherwise, treat it as an image key/UUID for Cloudflare Images
  const imageUrl = imageKey.startsWith("http") ? imageKey : imageKey;

  const options: CloudflareImageOptions = {
    quality: 85,
    format: "auto",
    fit: "cover",
  };

  // Different sizes for different view modes
  if (viewMode === "grid") {
    options.width = 400;  // Uses 'card' variant
    options.height = 300;
  } else if (viewMode === "list") {
    options.width = 300;  // Uses 'small' variant
    options.height = 200;
  } else if (viewMode === "admin") {
    options.width = 200;  // Uses 'thumbnail' variant for admin approval
    options.height = 150;
    options.quality = 70; // Lower quality for faster loading
  } else {
    // Default/detail view
    options.width = 800;  // Uses 'large' variant
    options.height = 600;
  }

  console.log(`optimizeListingImage - viewMode: ${viewMode}, size: ${options.width}x${options.height}, quality: ${options.quality}`);
  console.log(`Input imageUrl: ${imageUrl}`);

  // In development, manually optimize Unsplash URLs
  if (IS_DEVELOPMENT && imageUrl.includes('unsplash.com')) {
    const url = new URL(imageUrl);
    url.searchParams.set('w', options.width?.toString() || '400');
    url.searchParams.set('h', options.height?.toString() || '300');
    url.searchParams.set('q', options.quality?.toString() || '85');
    url.searchParams.set('fit', 'crop');
    const optimizedUrl = url.toString();
    console.log(`Development Unsplash optimization: ${optimizedUrl}`);
    return optimizedUrl;
  }

  return optimizeImageUrl(imageUrl, options);
}

/**
 * Creates optimized placeholder/blur data URL
 * This creates a tiny, low-quality image that will be blurred with CSS
 * The browser applies filter: blur() to create the blur effect
 */
export function createBlurDataUrl(originalUrl: string): string {
  return optimizeImageUrl(originalUrl, {
    width: 20,
    height: 20,
    quality: 10, // Low quality = smaller file = faster loading
    format: "jpeg",
  });
}

/**
 * Creates a regular thumbnail (small but clear)
 */
export function createThumbnail(originalUrl: string): string {
  return optimizeImageUrl(originalUrl, {
    width: 150,
    height: 150,
    quality: 85, // Good quality for clear thumbnails
    format: "auto",
    fit: "cover",
  });
}
