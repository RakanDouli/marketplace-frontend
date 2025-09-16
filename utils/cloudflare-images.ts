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
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const SUPABASE_STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
  "https://supabase.co/storage/v1/object/public";

/**
 * Optimizes image URL using Cloudflare Image Resizing
 * Converts Supabase URLs to Cloudflare-optimized URLs
 */
export function optimizeImageUrl(
  originalUrl: string,
  options: CloudflareImageOptions = {}
): string {
  // In development, skip Cloudflare optimization and return original URL
  if (IS_DEVELOPMENT || !CLOUDFLARE_DOMAIN) {
    return originalUrl;
  }

  // If it's already a Cloudflare URL, return as-is
  if (originalUrl.includes("/cdn-cgi/image/")) {
    return originalUrl;
  }

  // Default optimization options for Syrian marketplace
  const defaultOptions: CloudflareImageOptions = {
    quality: 85, // Good balance for Syrian internet speeds
    format: "auto", // Let browser choose best format
    fit: "scale-down", // Don't upscale images
    ...options,
  };

  // Build Cloudflare image transformation parameters
  const params: string[] = [];

  if (defaultOptions.width) params.push(`width=${defaultOptions.width}`);
  if (defaultOptions.height) params.push(`height=${defaultOptions.height}`);
  if (defaultOptions.quality) params.push(`quality=${defaultOptions.quality}`);
  if (defaultOptions.format) params.push(`format=${defaultOptions.format}`);
  if (defaultOptions.fit) params.push(`fit=${defaultOptions.fit}`);
  if (defaultOptions.gravity) params.push(`gravity=${defaultOptions.gravity}`);

  const transformParams = params.join(",");

  // Handle different URL formats
  let targetUrl = originalUrl;

  // If it's a relative URL, make it absolute
  if (originalUrl.startsWith("/")) {
    targetUrl = `${CLOUDFLARE_DOMAIN}${originalUrl}`;
  }

  // If it's a Supabase URL, use it directly
  if (originalUrl.includes("supabase.co") || originalUrl.includes("supabase")) {
    targetUrl = originalUrl;
  }

  // Return Cloudflare-optimized URL
  return `https://${CLOUDFLARE_DOMAIN}/cdn-cgi/image/${transformParams}/${targetUrl}`;
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
 * Optimizes listing card images for grid/list view
 */
export function optimizeListingImage(
  imageKey: string,
  viewMode: "grid" | "list" = "grid"
): string {
  // Convert imageKey to full URL if needed
  const baseUrl = imageKey.startsWith("http")
    ? imageKey
    : `${SUPABASE_STORAGE_URL}/listings/${imageKey}`;

  const options: CloudflareImageOptions = {
    quality: 85,
    format: "auto",
    fit: "cover",
  };

  // Different sizes for different view modes
  if (viewMode === "grid") {
    options.width = 400;
    options.height = 300;
  } else {
    options.width = 200;
    options.height = 150;
  }

  return optimizeImageUrl(baseUrl, options);
}

/**
 * Creates optimized placeholder/blur data URL
 */
export function createBlurDataUrl(originalUrl: string): string {
  return optimizeImageUrl(originalUrl, {
    width: 20,
    height: 20,
    quality: 20,
    format: "jpeg",
  });
}
