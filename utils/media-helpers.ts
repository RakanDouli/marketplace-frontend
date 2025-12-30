/**
 * Media helper utilities for handling images and videos
 */

// Video file extensions
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogg'];

// Video MIME types
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/ogg'];

/**
 * Check if a URL points to a video file based on extension or pattern
 */
export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();

  // Check file extension
  if (VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext))) {
    return true;
  }

  // Check for R2 video URLs (Cloudflare R2 storage pattern)
  // Format: https://pub-xxx.r2.dev/videos/...
  if (lowerUrl.includes('.r2.dev/videos/') || lowerUrl.includes('/videos/')) {
    return true;
  }

  return false;
}

/**
 * Get the media type from a URL
 */
export function getMediaType(url: string | undefined | null): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';

  if (isVideoUrl(url)) {
    return 'video';
  }

  return 'image';
}

/**
 * Media item interface for galleries
 */
export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  id?: string;
  thumbnail?: string; // For videos, can be a poster frame
}

/**
 * Convert image keys and video URL to unified media items array
 * Video is placed at the end of the array
 */
export function createMediaItems(
  imageKeys: string[] | undefined,
  videoUrl: string | null | undefined,
  optimizeImage?: (key: string, variant?: string) => string
): MediaItem[] {
  const items: MediaItem[] = [];

  // Add images
  if (imageKeys && imageKeys.length > 0) {
    imageKeys.forEach((key, index) => {
      const url = optimizeImage ? optimizeImage(key, 'public') : key;
      items.push({
        url,
        type: 'image',
        alt: `صورة ${index + 1}`,
        id: key,
      });
    });
  }

  // Add video at the end if exists
  if (videoUrl) {
    items.push({
      url: videoUrl,
      type: 'video',
      alt: 'فيديو',
      id: 'video',
    });
  }

  return items;
}
