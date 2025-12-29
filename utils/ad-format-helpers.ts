/**
 * Ad Format Helper Functions
 *
 * Filters ad formats based on:
 * 1. Ad Type (BANNER vs VIDEO)
 * 2. Placement (width constraints)
 */

// Enum values matching backend
export enum AdMediaType {
  BANNER = 'banner',
  VIDEO = 'video',
}

export enum AdPlacement {
  HOMEPAGE_TOP = 'homepage_top',
  DETAIL_TOP = 'detail_top',
  HOMEPAGE_MID = 'homepage_mid',
  BETWEEN_LISTINGS = 'between_listings',
  DETAIL_BEFORE_DESCRIPTION = 'detail_before_description',
}

export enum AdFormat {
  // Banner formats
  BILLBOARD = 'billboard',                    // 970x250
  SUPER_LEADERBOARD = 'super_leaderboard',   // 970x90
  LEADERBOARD = 'leaderboard',               // 728x90
  MOBILE_BANNER = 'mobile_banner',           // 320x50
  LARGE_MOBILE_BANNER = 'large_mobile_banner', // 320x100

  // Video formats (compact, same size as banners)
  BILLBOARD_VIDEO = 'billboard_video',       // 970x250
  LEADERBOARD_VIDEO = 'leaderboard_video',   // 970x350
}

// Format dimensions (matching backend exactly)
const AD_FORMAT_DIMENSIONS: Record<AdFormat, { desktop: { width: number; height: number }; mobile: { width: number; height: number } }> = {
  [AdFormat.BILLBOARD]: {
    desktop: { width: 970, height: 250 },
    mobile: { width: 300, height: 250 },
  },
  [AdFormat.SUPER_LEADERBOARD]: {
    desktop: { width: 970, height: 90 },
    mobile: { width: 300, height: 250 },
  },
  [AdFormat.LEADERBOARD]: {
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
  },
  [AdFormat.MOBILE_BANNER]: {
    desktop: { width: 320, height: 50 },
    mobile: { width: 320, height: 50 },
  },
  [AdFormat.LARGE_MOBILE_BANNER]: {
    desktop: { width: 320, height: 100 },
    mobile: { width: 320, height: 100 },
  },
  [AdFormat.BILLBOARD_VIDEO]: {
    desktop: { width: 970, height: 250 },
    mobile: { width: 320, height: 100 },
  },
  [AdFormat.LEADERBOARD_VIDEO]: {
    desktop: { width: 970, height: 350 },
    mobile: { width: 320, height: 150 },
  },
};

// Placement width constraints
const AD_PLACEMENT_MAX_WIDTH: Record<AdPlacement, number> = {
  [AdPlacement.HOMEPAGE_TOP]: Infinity,  // No limit
  [AdPlacement.DETAIL_TOP]: Infinity,    // No limit
  [AdPlacement.HOMEPAGE_MID]: 970,
  [AdPlacement.BETWEEN_LISTINGS]: 970,
  [AdPlacement.DETAIL_BEFORE_DESCRIPTION]: 970,
};

// Media type to format mapping
const BANNER_FORMATS: AdFormat[] = [
  AdFormat.BILLBOARD,
  AdFormat.SUPER_LEADERBOARD,
  AdFormat.LEADERBOARD,
  AdFormat.MOBILE_BANNER,
  AdFormat.LARGE_MOBILE_BANNER,
];

const VIDEO_FORMATS: AdFormat[] = [
  AdFormat.BILLBOARD_VIDEO,
  AdFormat.LEADERBOARD_VIDEO,
];

/**
 * Get allowed formats based on ad type and placement
 *
 * @param adType - 'banner' or 'video'
 * @param placement - Placement enum value (e.g., 'homepage_top')
 * @returns Array of allowed format enum values
 *
 * @example
 * getAllowedFormats('video', 'homepage_top')
 * // Returns: ['hd_player', 'square_video']
 *
 * getAllowedFormats('video', 'between_listings')
 * // Returns: ['square_video'] (hd_player too wide)
 *
 * getAllowedFormats('banner', 'homepage_mid')
 * // Returns: ['billboard', 'super_leaderboard', 'leaderboard', 'mobile_banner', 'large_mobile_banner']
 */
export function getAllowedFormats(adType: string, placement: string): string[] {
  // If either is empty, return empty array
  if (!adType || !placement) {
    return [];
  }

  // Step 1: Filter by media type (IMAGE vs VIDEO)
  let allowedFormats: AdFormat[];

  if (adType.toLowerCase() === 'image') {
    allowedFormats = [...BANNER_FORMATS];
  } else if (adType.toLowerCase() === 'video') {
    allowedFormats = [...VIDEO_FORMATS];
  } else {
    // Unknown ad type
    return [];
  }

  // Step 2: Filter by placement width constraints
  const maxWidth = AD_PLACEMENT_MAX_WIDTH[placement as AdPlacement];

  // If placement not found, return formats from step 1 without filtering
  if (maxWidth === undefined) {
    return allowedFormats;
  }

  // Filter out formats that exceed max width
  const filteredFormats = allowedFormats.filter(format => {
    const formatWidth = AD_FORMAT_DIMENSIONS[format].desktop.width;
    return formatWidth <= maxWidth;
  });

  return filteredFormats;
}

/**
 * Get dimensions for a specific format
 *
 * @param format - Format enum value
 * @returns Dimensions object with desktop and mobile sizes, or null if not found
 */
export function getFormatDimensions(format: string): { desktop: { width: number; height: number }; mobile: { width: number; height: number } } | null {
  const formatEnum = format as AdFormat;
  const dimensions = AD_FORMAT_DIMENSIONS[formatEnum];

  if (!dimensions) {
    return null;
  }

  // Return full dimensions (now includes both desktop and mobile)
  return {
    desktop: dimensions.desktop,
    mobile: dimensions.mobile,
  };
}

/**
 * Check if a specific format is allowed for a given ad type and placement
 *
 * @param format - Format enum value
 * @param adType - 'banner' or 'video'
 * @param placement - Placement enum value
 * @returns true if format is allowed, false otherwise
 */
export function isFormatAllowed(format: string, adType: string, placement: string): boolean {
  const allowedFormats = getAllowedFormats(adType, placement);
  return allowedFormats.includes(format);
}
