import { create } from "zustand";
import { ListingsState, Listing } from "./types";

// GraphQL queries
const LISTINGS_SEARCH_QUERY = `
  query ListingsSearch($filter: ListingFilterInput, $limit: Float, $offset: Float) {
    listingsSearch(filter: $filter, limit: $limit, offset: $offset) {
      id
      title
      description
      priceMinor
      province
      city
      area
      status
      imageKeys
      createdAt
      categoryId
    }
  }
`;

// GraphQL client function
async function graphqlRequest(query: string, variables: any = {}) {
  const endpoint =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

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
  // Data fetching methods
  fetchListings: (filters?: Partial<ListingsState["filters"]>) => Promise<void>;
  fetchListingsByCategory: (
    categorySlug: string,
    filters?: Partial<ListingsState["filters"]>
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

  // Data fetching methods
  fetchListings: async (filterOverrides = {}) => {
    const { filters, pagination } = get();
    const finalFilters = { ...filters, ...filterOverrides };

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
      if (finalFilters.province) {
        graphqlFilter.country = finalFilters.province;
      }
      if (finalFilters.sellerType) {
        graphqlFilter.sellerType = finalFilters.sellerType;
      }

      // Dynamic attribute filters - use specs object instead of hardcoded fields
      if (finalFilters.specs && Object.keys(finalFilters.specs).length > 0) {
        graphqlFilter.specs = finalFilters.specs;
      }

      // Search filter (if needed)
      if (finalFilters.search) {
        // Note: Backend doesn't have search in filter yet, might need to be added
        console.log(
          "Search filter not yet supported by backend:",
          finalFilters.search
        );
      }

      // Sort parameter (add to filter for backend processing)
      if (finalFilters.sort) {
        graphqlFilter.sort = finalFilters.sort;
      }

      // Use GraphQL listingsSearch API
      const data = await graphqlRequest(LISTINGS_SEARCH_QUERY, {
        filter: graphqlFilter,
        limit: pagination.limit,
        offset: offset,
      });

      const listings: Listing[] = (data.listingsSearch || []).map(
        (item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.priceMinor / 100, // Convert from minor currency
          currency: "USD", // Primary currency
          prices: [{ currency: "USD", value: item.priceMinor / 100 }], // Create price array from priceMinor
          condition: "USED" as const, // Default - backend should provide this
          status: item.status as any,
          images: item.imageKeys || [],
          location: `${item.city || ""}, ${item.province || ""}`.replace(
            /^, |, $/,
            ""
          ),
          province: item.province,
          area: item.area,
          categoryId: item.categoryId,
          sellerId: "", // No sellerId available in current query
          specs: {}, // TODO: Re-enable when specs field is exposed in GraphQL
          viewCount: 0,
          isFeatured: false,
          isPromoted: false,
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
        })
      );

      // Since GraphQL listingsSearch doesn't return count, we approximate
      const hasMore = listings.length === pagination.limit;

      set({
        listings,
        isLoading: false,
        error: null,
        pagination: {
          ...pagination,
          total: hasMore
            ? offset + pagination.limit + 1
            : offset + listings.length,
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
    filterOverrides = {}
  ) => {
    await get().fetchListings({ ...filterOverrides, categoryId: categorySlug });
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
