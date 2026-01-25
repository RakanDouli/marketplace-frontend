/**
 * Category Routing Utility
 *
 * Handles smart routing for categories based on their supported listing types.
 * Categories can support: sale only, rent only, or both.
 *
 * URL Structure:
 * - /cars/sell - Sale listings for cars
 * - /cars/rent - Rent listings for cars
 * - /cars - Pre-loader page (if category supports both types)
 */

import { ListingType } from "@/common/enums";

// Type for category with supportedListingTypes
export interface CategoryWithTypes {
  slug: string;
  supportedListingTypes?: string[];
}

/**
 * Get the appropriate URL for a category based on its supported listing types.
 *
 * @param category - The category object with slug and supportedListingTypes
 * @param preferredType - Optional preferred listing type for direct navigation
 * @returns The URL path to navigate to
 *
 * @example
 * // Category supports only sale -> direct to /cars/sell
 * getCategoryUrl({ slug: 'electronics', supportedListingTypes: ['sale'] })
 * // Returns: '/electronics/sell'
 *
 * @example
 * // Category supports both -> go to pre-loader /cars
 * getCategoryUrl({ slug: 'cars', supportedListingTypes: ['sale', 'rent'] })
 * // Returns: '/cars'
 */
export function getCategoryUrl(
  category: CategoryWithTypes,
  preferredType?: ListingType
): string {
  const types = category.supportedListingTypes || ["sale"];

  // If preferred type provided and category supports it, use it
  // Compare case-insensitively since DB stores lowercase, enum is uppercase
  if (preferredType && types.some(t => t.toUpperCase() === preferredType)) {
    const typeSlug = listingTypeToUrlSegment(preferredType);
    return `/${category.slug}/${typeSlug}`;
  }

  // If category supports only one type, go directly to that type
  if (types.length === 1) {
    // Convert DB value (lowercase) to enum (uppercase)
    const listingType = types[0].toUpperCase() === "SALE" ? ListingType.SALE : ListingType.RENT;
    const typeSlug = listingTypeToUrlSegment(listingType);
    return `/${category.slug}/${typeSlug}`;
  }

  // If category supports both types, go to pre-loader page
  return `/${category.slug}`;
}

/**
 * Get listing detail URL with proper listing type segment.
 *
 * @param categorySlug - Category slug
 * @param listingId - Listing ID
 * @param listingType - The listing type (sale or rent)
 * @returns Full URL path to the listing detail page
 *
 * @example
 * getListingDetailUrl('cars', '123', ListingType.SALE)
 * // Returns: '/cars/sell/123'
 */
export function getListingDetailUrl(
  categorySlug: string,
  listingId: string,
  listingType: ListingType = ListingType.SALE
): string {
  const typeSlug = listingTypeToUrlSegment(listingType);
  return `/${categorySlug}/${typeSlug}/${listingId}`;
}

/**
 * Convert ListingType enum to URL segment.
 *
 * @param type - ListingType enum value (SALE/RENT) or DB value (sale/rent)
 * @returns URL-friendly segment ('sell' or 'rent')
 */
export function listingTypeToUrlSegment(type: string | ListingType): string {
  // Handle both uppercase enum (SALE) and lowercase DB value (sale)
  const normalized = type.toUpperCase();
  return normalized === "SALE" ? "sell" : "rent";
}

/**
 * Convert URL segment to ListingType enum.
 *
 * @param segment - URL segment ('sell' or 'rent')
 * @returns ListingType enum value or null if invalid
 */
export function urlSegmentToListingType(segment: string): ListingType | null {
  if (segment === "sell") return ListingType.SALE;
  if (segment === "rent") return ListingType.RENT;
  return null;
}

/**
 * Check if a category supports multiple listing types.
 *
 * @param category - Category with supportedListingTypes
 * @returns true if category supports both sale and rent
 */
export function categorySupportsMultipleTypes(
  category: CategoryWithTypes
): boolean {
  const types = category.supportedListingTypes || [ListingType.SALE];
  return types.length > 1;
}

/**
 * Get Arabic label for listing type.
 *
 * @param type - ListingType enum value (SALE/RENT) or DB value (sale/rent)
 * @returns Arabic label
 */
export function getListingTypeLabel(type: ListingType | string): string {
  // Handle both uppercase enum (SALE) and lowercase DB value (sale)
  const normalized = type.toUpperCase();
  return normalized === "SALE" ? "للبيع" : "للإيجار";
}

/**
 * Get the default listing type for a category.
 *
 * @param category - Category with supportedListingTypes
 * @returns The first supported listing type or SALE as default
 */
export function getDefaultListingType(
  category: CategoryWithTypes
): ListingType {
  const types = category.supportedListingTypes || ["sale"];
  // DB stores lowercase, compare case-insensitively
  return types[0].toUpperCase() === "RENT" ? ListingType.RENT : ListingType.SALE;
}
