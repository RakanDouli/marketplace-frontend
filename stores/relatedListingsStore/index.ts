import { create } from 'zustand';
import { RELATED_LISTINGS_QUERY, LISTING_BRAND_NAME_QUERY } from './relatedListings.gql';

// Helper function for GraphQL API calls
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

const makeGraphQLCall = async (query: string, variables: Record<string, unknown> = {}) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

export type RelatedType = 'SAME_BRAND' | 'SIMILAR_PRICE';

export interface RelatedListing {
  id: string;
  title: string;
  priceMinor: number;
  imageKeys?: string[];
  categoryId?: string;
  accountType?: string;
  location?: { province?: string; city?: string };
  specs?: Record<string, unknown>;
  specsDisplay?: Record<string, unknown>;
  user?: { id: string };
}

interface RelatedListingsCache {
  [key: string]: {
    listings: RelatedListing[];
    timestamp: number;
  };
}

interface BrandNameCache {
  [listingId: string]: {
    brandName: string | null;
    timestamp: number;
  };
}

interface RelatedListingsState {
  relatedCache: RelatedListingsCache;
  brandNameCache: BrandNameCache;
  loading: { [key: string]: boolean };
  errors: { [key: string]: string | null };
}

interface RelatedListingsActions {
  fetchRelatedListings: (listingId: string, type: RelatedType, limit?: number) => Promise<RelatedListing[]>;
  fetchBrandName: (listingId: string) => Promise<string | null>;
  getRelatedListings: (listingId: string, type: RelatedType) => RelatedListing[] | null;
  getBrandName: (listingId: string) => string | null;
  clearCache: () => void;
}

type RelatedListingsStore = RelatedListingsState & RelatedListingsActions;

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
const BRAND_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (listingId: string, type: RelatedType) => `${listingId}_${type}`;

export const useRelatedListingsStore = create<RelatedListingsStore>((set, get) => ({
  // Initial state
  relatedCache: {},
  brandNameCache: {},
  loading: {},
  errors: {},

  // Fetch related listings (with caching)
  fetchRelatedListings: async (listingId: string, type: RelatedType, limit = 8) => {
    const cacheKey = getCacheKey(listingId, type);
    const cached = get().relatedCache[cacheKey];

    // Return cached if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[RelatedListingsStore] Cache hit for ${type} (${listingId})`);
      return cached.listings;
    }

    // Set loading
    set((state) => ({
      loading: { ...state.loading, [cacheKey]: true },
      errors: { ...state.errors, [cacheKey]: null },
    }));

    try {
      console.log(`[RelatedListingsStore] Fetching ${type} for listing ${listingId}`);
      const data = await makeGraphQLCall(RELATED_LISTINGS_QUERY, {
        listingId,
        type,
        limit,
      });

      const listings = data.relatedListings || [];
      console.log(`[RelatedListingsStore] ${type} returned ${listings.length} listings`);

      // Update cache
      set((state) => ({
        relatedCache: {
          ...state.relatedCache,
          [cacheKey]: {
            listings,
            timestamp: Date.now(),
          },
        },
        loading: { ...state.loading, [cacheKey]: false },
      }));

      return listings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[RelatedListingsStore] Failed to fetch ${type}:`, error);

      set((state) => ({
        loading: { ...state.loading, [cacheKey]: false },
        errors: { ...state.errors, [cacheKey]: errorMessage },
      }));

      return [];
    }
  },

  // Fetch brand name for a listing
  fetchBrandName: async (listingId: string) => {
    const cached = get().brandNameCache[listingId];

    // Return cached if valid
    if (cached && Date.now() - cached.timestamp < BRAND_CACHE_DURATION) {
      return cached.brandName;
    }

    try {
      const data = await makeGraphQLCall(LISTING_BRAND_NAME_QUERY, { listingId });
      const brandName = data.listingBrandName || null;

      // Update cache
      set((state) => ({
        brandNameCache: {
          ...state.brandNameCache,
          [listingId]: {
            brandName,
            timestamp: Date.now(),
          },
        },
      }));

      return brandName;
    } catch (error) {
      console.error('[RelatedListingsStore] Failed to fetch brand name:', error);
      return null;
    }
  },

  // Get cached related listings (sync)
  getRelatedListings: (listingId: string, type: RelatedType) => {
    const cacheKey = getCacheKey(listingId, type);
    const cached = get().relatedCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.listings;
    }
    return null;
  },

  // Get cached brand name (sync)
  getBrandName: (listingId: string) => {
    const cached = get().brandNameCache[listingId];
    if (cached && Date.now() - cached.timestamp < BRAND_CACHE_DURATION) {
      return cached.brandName;
    }
    return null;
  },

  // Clear all cache
  clearCache: () => {
    set({
      relatedCache: {},
      brandNameCache: {},
      loading: {},
      errors: {},
    });
  },
}));
