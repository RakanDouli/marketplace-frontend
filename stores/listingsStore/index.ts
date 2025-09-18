import { create } from "zustand";
import { ListingsState, Listing } from "../types";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import {
  getQueryByViewType,
  LISTINGS_AGGREGATIONS_QUERY,
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
    set({
      pagination: { ...pagination, ...newPagination },
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
        status: "ACTIVE", // Default filter for active listings only
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
      if (finalFilters.city) {
        graphqlFilter.city = finalFilters.city;
      }
      if (finalFilters.sellerType) {
        graphqlFilter.sellerType = finalFilters.sellerType;
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

      // Get totalResults from aggregations for accurate count
      const aggregationsData = await cachedGraphQLRequest(
        LISTINGS_AGGREGATIONS_QUERY,
        {
          filter: graphqlFilter,
        },
        { ttl: 2 * 60 * 1000 }
      ); // Cache for 2 minutes

      const listings: Listing[] = (data.listingsSearch || []).map(
        (item: any) => {
          // Parse specs JSON string from backend
          let specs = {};
          try {
            specs = item.specs ? JSON.parse(item.specs) : {};
          } catch (error) {
            console.warn("Failed to parse specs JSON:", item.specs, error);
            specs = {};
          }

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            priceMinor: item.priceMinor,
            prices: item.prices || [
              { currency: "USD", value: (item.priceMinor / 100).toString() },
            ], // Use backend prices or create from priceMinor
            city: item.city || "",
            status: item.status as any,
            allowBidding: false, // Default - backend should provide this
            specs, // Now contains real specs data from backend!
            imageKeys: item.imageKeys || [], // Store raw keys, optimize per usage
            sellerType: item.sellerType as "PRIVATE" | "DEALER" | "BUSINESS",
            createdAt: item.createdAt,
            updatedAt: item.createdAt,
          };
        }
      );

      // Use real totalResults from backend aggregations
      const totalResults =
        aggregationsData.listingsAggregations?.totalResults || 0;
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
              sellerType: listings[0].sellerType,
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
      set({
        isLoading: false,
        error: error.message || "Failed to load listings",
        listings: [],
      });
    }
  },

  fetchListingsByCategory: async (
    categorySlug: string,
    filterOverrides = {},
    viewType?: "grid" | "list" | "detail"
  ) => {
    await get().fetchListings(
      { ...filterOverrides, categoryId: categorySlug },
      viewType
    );
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
