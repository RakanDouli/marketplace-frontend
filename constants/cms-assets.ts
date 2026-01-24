/**
 * CMS-Managed Assets Configuration
 *
 * This file centralizes all images/assets that will be managed via CMS.
 * When CMS is implemented, these values will be fetched dynamically.
 * For now, they reference static files in /public/images/
 *
 * Usage:
 *   import { CMS_ASSETS } from '@/constants/cms-assets';
 *   <PromoBanner imageSrc={CMS_ASSETS.home.promoBanner.car} />
 */

export const CMS_ASSETS = {
  /**
   * Homepage Assets
   */
  home: {
    // Main CTA - "Sell Your Car" banner
    promoBanner: {
      car: '/images/car.png',
    },

    // Secondary CTA cards
    promoCards: {
      realEstate: '/images/building.png',
      electronics: '/images/phone.png',
    },

    // Hero/Search section background (placeholder for future use)
    searchBar: {
      background: null as string | null, // Will be set when CMS provides it
    },
  },

  /**
   * Category-specific Assets
   * Map category slugs to their promo images
   */
  categories: {
    cars: '/images/car.png',
    'real-estate': '/images/building.png',
    electronics: '/images/phone.png',
  } as Record<string, string>,

  /**
   * Placeholder/Fallback Images
   */
  placeholders: {
    listing: '/images/placeholder-listing.png',
    avatar: '/images/placeholder-avatar.png',
    category: '/images/placeholder-category.png',
  },

  /**
   * Brand/Logo Assets
   */
  brand: {
    logo: '/images/logo.png',
    logoLight: '/images/logo-light.png',
    favicon: '/favicon.ico',
  },
};

/**
 * Helper to get category promo image
 * Falls back to a default if category not found
 */
export const getCategoryImage = (categorySlug: string): string => {
  return CMS_ASSETS.categories[categorySlug] || CMS_ASSETS.placeholders.category;
};

export default CMS_ASSETS;
