import { create } from "zustand";
import { ListingsState, Listing } from "../types";
import { cachedGraphQLRequest, invalidateGraphQLCache } from "../../utils/graphql-cache";
import { useFiltersStore } from "../filtersStore";
import {
  getQueryByViewType,
  LISTING_BY_ID_QUERY,
} from "./listingsStore.gql";

interface ListingsActions {
  setListings: (listings: Listing[]) => void;
  addListings: (listings: Listing[]) => void;
  setCurrentListing: (listing: Listing | null) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  removeListing: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<ListingsState["filters"]>) => void;
  clearFilters: () => void;
  setPagination: (pagination: Partial<ListingsState["pagination"]>) => void;
  resetPagination: () => void;
  setSortFilter: (sort: string) => void;
  setViewType: (viewType: "grid" | "list" | "detail") => void;
  // Data fetching methods
  fetchListings: (
    filters?: Partial<ListingsState["filters"]>,
    viewType?: "grid" | "list" | "detail"
  ) => Promise<void>;
  fetchListingsByCategory: (
    categorySlug: string,
    filters?: Partial<ListingsState["filters"]>,
    viewType?: "grid" | "list" | "detail"
  ) => Promise<void>;
  fetchListingById: (id: string) => Promise<void>;
}

type ListingsStore = ListingsState & ListingsActions;

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: true,
};

export const useListingsStore = create<ListingsStore>((set, get) => ({
  // Initial state
  listings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  viewType: "grid", // Default to grid view for performance
  filters: {},
  pagination: initialPagination,
  currentCategoryId: null, // Track current category for cache invalidation
  // Simple cache to prevent redundant requests

  // Actions
  setListings: (listings: Listing[]) => {
    set({ listings, error: null });
  },

  addListings: (newListings: Listing[]) => {
    const { listings } = get();
    const existingIds = new Set(listings.map((l) => l.id));
    const uniqueNewListings = newListings.filter((l) => !existingIds.has(l.id));

    set({
      listings: [...listings, ...uniqueNewListings],
      error: null,
    });
  },

  setCurrentListing: (listing: Listing | null) => {
    set({ currentListing: listing });
  },

  updateListing: (id: string, updates: Partial<Listing>) => {
    const { listings } = get();
    const updatedListings = listings.map((listing) =>
      listing.id === id ? { ...listing, ...updates } : listing
    );

    set({ listings: updatedListings });
  },

  removeListing: (id: string) => {
    const { listings } = get();
    const filteredListings = listings.filter((listing) => listing.id !== id);

    set({ listings: filteredListings });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  clearError: () => {
    set({ error: null });
  },

  setFilters: (newFilters: Partial<ListingsState["filters"]>) => {
    const { filters } = get();

    // Invalidate cache when filters change
    invalidateGraphQLCache('listingsSearch');
    invalidateGraphQLCache('listingsAggregations');
    invalidateGraphQLCache('ListingsGrid'); // Clear view-specific caches
    invalidateGraphQLCache('ListingsList');
    invalidateGraphQLCache('ListingsDetail');
    console.log('🗑️ ListingsStore: Cache invalidated for filter change:', Object.keys(newFilters));

    set({
      filters: { ...filters, ...newFilters },
      pagination: initialPagination, // Reset pagination when filters change
    });
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: initialPagination,
    });
  },

  setPagination: (newPagination: Partial<ListingsState["pagination"]>) => {
    const { pagination } = get();
    const updatedPagination = { ...pagination, ...newPagination };

    // Invalidate cache when pagination changes (especially page changes)
    if (newPagination.page && newPagination.page !== pagination.page) {
      invalidateGraphQLCache('listingsSearch');
      console.log(`🗑️ ListingsStore: Cache invalidated for page change: ${pagination.page} → ${newPagination.page}`);
    }

    set({
      pagination: updatedPagination,
    });
  },

  resetPagination: () => {
    set({ pagination: initialPagination });
  },

  setSortFilter: (sort: string) => {
    const { filters } = get();
    set({
      filters: { ...filters, sort },
    });
  },

  setViewType: (viewType: "grid" | "list" | "detail") => {
    const { viewType: currentViewType } = get();

    // Only invalidate cache if view type actually changes
    if (viewType !== currentViewType) {
      invalidateGraphQLCache('listingsSearch');
      console.log(`🗑️ ListingsStore: Cache invalidated for view type change: ${currentViewType} → ${viewType}`);
    }

    set({ viewType });
  },

  // Data fetching methods
  fetchListings: async (
    filterOverrides = {},
    viewType?: "grid" | "list" | "detail"
  ) => {
    const { filters, pagination, viewType: currentViewType } = get();
    const finalFilters = { ...filters, ...filterOverrides };
    const selectedViewType = viewType || currentViewType;

    // console.log("🚗 ===== LISTINGS STORE: fetchListings START =====");
    // console.log("📋 ListingsStore: Input filters", {
    //   existingFilters: filters,
    //   filterOverrides: filterOverrides,
    //   finalFilters: finalFilters,
    //   pagination: pagination
    // });

    set({ isLoading: true, error: null });

    try {
      const currentPage = pagination.page || 1;
      const offset = (currentPage - 1) * pagination.limit;

      // Convert frontend filter format to backend GraphQL format
      const graphqlFilter: any = {
        status: "ACTIVE", // Default filter for active listings only (uppercase for GraphQL enum)
      };

      // Category filter - use categoryId string instead of category enum
      if (finalFilters.categoryId) {
        graphqlFilter.categoryId = finalFilters.categoryId;
      }

      // Price filters
      if (finalFilters.priceMinMinor) {
        graphqlFilter.priceMinMinor = finalFilters.priceMinMinor;
      }
      if (finalFilters.priceMaxMinor) {
        graphqlFilter.priceMaxMinor = finalFilters.priceMaxMinor;
      }
      if (finalFilters.priceCurrency) {
        graphqlFilter.priceCurrency = finalFilters.priceCurrency;
        graphqlFilter.displayCurrency = finalFilters.priceCurrency;
      }

      // Location filters
      if (finalFilters.province) {
        graphqlFilter.province = finalFilters.province;
      }
      if (finalFilters.city) {
        graphqlFilter.city = finalFilters.city;
      }

      // Seller type filter
      if (finalFilters.accountType) {
        graphqlFilter.accountType = finalFilters.accountType;
      }

      // Dynamic attribute filters - use specs object directly (now using backend format)
      if (finalFilters.specs && Object.keys(finalFilters.specs).length > 0) {
        graphqlFilter.specs = finalFilters.specs;
      }

      // Search filter
      if (finalFilters.search) {
        graphqlFilter.search = finalFilters.search;
      }

      // Sort parameter (add to filter for backend processing)
      if (finalFilters.sort) {
        graphqlFilter.sort = finalFilters.sort;
      }

      // Add viewType to filter for backend specs filtering
      graphqlFilter.viewType = selectedViewType;

      // Select appropriate query based on view type for optimal payload
      const query = getQueryByViewType(selectedViewType);

      // Use view-specific GraphQL query for optimized payload
      const data = await cachedGraphQLRequest(
        query,
        {
          filter: graphqlFilter,
          limit: pagination.limit,
          offset: offset,
        },
        { ttl: 2 * 60 * 1000 }
      ); // Cache for 2 minutes

      // Get totalResults from the query response (accurate and up-to-date)
      const totalResultsFromQuery = data.listingsAggregations?.totalResults;

      const listings: Listing[] = (data.listingsSearch || []).map(
        (item: any) => {
          // Parse specs JSON string from backend (English keys for backend processing)
          let specs = {};
          try {
            specs = item.specs ? JSON.parse(item.specs) : {};
          } catch (error) {
            console.warn("Failed to parse specs JSON:", item.specs, error);
            specs = {};
          }

          // Parse specsDisplay JSON string from backend (Arabic keys and values for display)
          let specsDisplay = {};
          try {
            specsDisplay = item.specsDisplay ? JSON.parse(item.specsDisplay) : {};
          } catch (error) {
            console.warn("Failed to parse specsDisplay JSON:", item.specsDisplay, error);
            specsDisplay = {};
          }

          // Extract location from specs for backward compatibility
          const location = (specs as any).location || "";
          const city = (specs as any).location || item.city || "";

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            priceMinor: item.priceMinor,
            prices: item.prices || [
              { currency: "USD", value: (item.priceMinor / 100).toString() },
            ], // Use backend prices or create from priceMinor
            city, // Now comes from specs.location
            status: item.status as any,
            allowBidding: false, // Default - backend should provide this
            specs, // English keys for backend processing and filtering
            specsDisplay, // Arabic keys and values for frontend display
            imageKeys: item.imageKeys || [], // Store raw keys, optimize per usage
            accountType: item.accountType as "individual" | "dealer" | "business",
            createdAt: item.createdAt,
            updatedAt: item.createdAt,
          };
        }
      );

      // Use totalResults from the query response for accurate pagination
      const totalResults = totalResultsFromQuery || listings.length; // Fallback to listings count if not available
      const hasMore = offset + listings.length < totalResults;

      // console.log("🚗 ===== LISTINGS STORE: fetchListings SUCCESS =====");
      console.log("📊 ListingsStore: Final results", {
        listingsCount: listings.length,
        totalResults: totalResults,
        pagination: { ...pagination, total: totalResults, hasMore },
        firstListing: listings[0]
          ? {
              id: listings[0].id,
              title: listings[0].title,
              specs: listings[0].specs,
              prices: listings[0].prices,
              accountType: listings[0].accountType,
            }
          : null,
        sampleSpecs: listings[0]?.specs
          ? Object.keys(listings[0].specs).slice(0, 5)
          : [],
      });

      set({
        listings,
        isLoading: false,
        error: null,
        pagination: {
          ...pagination,
          total: totalResults,
          hasMore,
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch listings:", error);
      const { pagination } = get();
      set({
        isLoading: false,
        error: error.message || "Failed to load listings",
        listings: [],
        pagination: {
          ...pagination,
          total: 0,
          hasMore: false,
        },
      });
    }
  },

  fetchListingsByCategory: async (
    categorySlug: string,
    filterOverrides = {},
    viewType?: "grid" | "list" | "detail"
  ) => {
    const { currentCategoryId } = get();

    // Clear listings and invalidate cache when category changes
    if (currentCategoryId !== categorySlug) {
      console.log(`🔄 Category changed: ${currentCategoryId} → ${categorySlug}. Clearing listings and cache.`);

      // Clear current listings immediately to prevent showing wrong category data
      set({
        listings: [],
        currentCategoryId: categorySlug,
        pagination: initialPagination
      });

      // Invalidate all cached data for fresh fetch
      invalidateGraphQLCache('listingsSearch');
      invalidateGraphQLCache('listingsAggregations');
      invalidateGraphQLCache('ListingsGrid');
      invalidateGraphQLCache('ListingsList');
      invalidateGraphQLCache('ListingsDetail');
    }

    await get().fetchListings(
      { ...filterOverrides, categoryId: categorySlug },
      viewType
    );
  },

  fetchListingById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        LISTING_BY_ID_QUERY,
        { id },
        { ttl: 5 * 60 * 1000 } // Cache for 5 minutes
      );

      if (!data.listing) {
        throw new Error("Listing not found");
      }

      const item = data.listing;

      // Parse specs JSON string from backend
      let specs = {};
      try {
        specs = item.specs ? JSON.parse(item.specs) : {};
      } catch (error) {
        console.warn("Failed to parse specs JSON:", item.specs, error);
        specs = {};
      }

      // Parse specsDisplay JSON string from backend
      let specsDisplay = {};
      try {
        specsDisplay = item.specsDisplay ? JSON.parse(item.specsDisplay) : {};
      } catch (error) {
        console.warn("Failed to parse specsDisplay JSON:", item.specsDisplay, error);
        specsDisplay = {};
      }

      const city = (specs as any).location || item.location?.city || "";

      const listing: Listing = {
        id: item.id,
        title: item.title,
        description: item.description,
        priceMinor: item.priceMinor,
        prices: item.prices || [
          { currency: "USD", value: (item.priceMinor / 100).toString() },
        ],
        city,
        status: item.status as any,
        allowBidding: false,
        specs,
        specsDisplay,
        imageKeys: item.imageKeys || [],
        accountType: item.accountType as "individual" | "dealer" | "business",
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        location: item.location,
        category: item.category ? {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
        } : undefined,
        user: item.user ? {
          id: item.user.id,
          name: item.user.name,
          email: '',
          role: '',
          status: 'active' as const,
          accountType: item.user.accountType as "individual" | "dealer" | "business",
          companyName: undefined,
          accountBadge: 'none' as const,
          businessVerified: false,
          phone: item.user.phone,
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
        } : undefined,
      };

      console.log("📋 ListingsStore: Fetched listing by ID", {
        id: listing.id,
        title: listing.title,
        seller: listing.user?.name,
      });

      set({
        currentListing: listing,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to fetch listing by ID:", error);
      set({
        isLoading: false,
        error: error.message || "Failed to load listing",
        currentListing: null,
      });
    }
  },
}));

// Selectors
export const useListings = () => useListingsStore((state) => state.listings);
export const useCurrentListing = () =>
  useListingsStore((state) => state.currentListing);
export const useListingsLoading = () =>
  useListingsStore((state) => state.isLoading);
export const useListingsError = () => useListingsStore((state) => state.error);
export const useListingsFilters = () =>
  useListingsStore((state) => state.filters);
export const useListingsPagination = () =>
  useListingsStore((state) => state.pagination);
export const useListingsViewType = () =>
  useListingsStore((state) => state.viewType);
