import { create } from 'zustand';
import { ListingsState, Listing } from './types';

// GraphQL queries
const LISTINGS_SEARCH_QUERY = `
  query ListingsSearch($filter: ListingFilterInput, $limit: Int, $offset: Int) {
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
      userId
      prices {
        currency
        value
      }
    }
  }
`;

// GraphQL client function
async function graphqlRequest(query: string, variables: any = {}) {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  setFilters: (filters: Partial<ListingsState['filters']>) => void;
  clearFilters: () => void;
  setPagination: (pagination: Partial<ListingsState['pagination']>) => void;
  resetPagination: () => void;
  // Data fetching methods
  fetchListings: (filters?: Partial<ListingsState['filters']>) => Promise<void>;
  fetchListingsByCategory: (categoryId: string, filters?: Partial<ListingsState['filters']>) => Promise<void>;
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
  lastFetchKey: null as string | null,

  // Actions
  setListings: (listings: Listing[]) => {
    set({ listings, error: null });
  },

  addListings: (newListings: Listing[]) => {
    const { listings } = get();
    const existingIds = new Set(listings.map(l => l.id));
    const uniqueNewListings = newListings.filter(l => !existingIds.has(l.id));
    
    set({ 
      listings: [...listings, ...uniqueNewListings],
      error: null 
    });
  },

  setCurrentListing: (listing: Listing | null) => {
    set({ currentListing: listing });
  },

  updateListing: (id: string, updates: Partial<Listing>) => {
    const { listings } = get();
    const updatedListings = listings.map(listing =>
      listing.id === id ? { ...listing, ...updates } : listing
    );
    
    set({ listings: updatedListings });
  },

  removeListing: (id: string) => {
    const { listings } = get();
    const filteredListings = listings.filter(listing => listing.id !== id);
    
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

  setFilters: (newFilters: Partial<ListingsState['filters']>) => {
    const { filters } = get();
    set({
      filters: { ...filters, ...newFilters },
      pagination: initialPagination, // Reset pagination when filters change
      lastFetchKey: null, // Clear cache when filters change
    });
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: initialPagination,
      lastFetchKey: null, // Clear cache when filters are cleared
    });
  },

  setPagination: (newPagination: Partial<ListingsState['pagination']>) => {
    const { pagination } = get();
    set({
      pagination: { ...pagination, ...newPagination },
    });
  },

  resetPagination: () => {
    set({ pagination: initialPagination });
  },

  // Data fetching methods
  fetchListings: async (filterOverrides = {}) => {
    const { filters, pagination, lastFetchKey } = get();
    const finalFilters = { ...filters, ...filterOverrides };
    
    // Create cache key to prevent duplicate requests
    const cacheKey = JSON.stringify({ 
      filters: finalFilters, 
      page: pagination.page,
      limit: pagination.limit 
    });
    
    // Skip if same request is already cached
    if (lastFetchKey === cacheKey) {
      return;
    }
    
    set({ isLoading: true, error: null, lastFetchKey: cacheKey });
    
    try {
      const currentPage = pagination.page || 1;
      const offset = (currentPage - 1) * pagination.limit;
      
      // Convert frontend filter format to backend GraphQL format
      const graphqlFilter: any = {
        status: 'ACTIVE' // Default filter for active listings only
      };

      // Category filter
      if (finalFilters.categoryId) {
        // Convert categoryId to category enum - need to fetch category slug
        // For now, assuming 'CAR' category since that's the main one
        graphqlFilter.category = 'CAR';
      }

      // Price filters (convert to minor currency)
      if (finalFilters.minPrice) {
        graphqlFilter.priceMinMinor = Math.round(finalFilters.minPrice * 100);
        graphqlFilter.priceCurrency = 'USD';
      }
      if (finalFilters.maxPrice) {
        graphqlFilter.priceMaxMinor = Math.round(finalFilters.maxPrice * 100);
        graphqlFilter.priceCurrency = 'USD';
      }

      // Location filters
      if (finalFilters.location) {
        // For now, treating location as city since backend expects exact match
        graphqlFilter.city = finalFilters.location;
      }

      // Dynamic specs filtering - map common specs to individual GraphQL fields
      if (finalFilters.specs && typeof finalFilters.specs === 'object') {
        // Map common dynamic specs to existing GraphQL fields
        Object.entries(finalFilters.specs).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            switch (key) {
              case 'make':
              case 'brand':
                graphqlFilter.make = value;
                break;
              case 'model':
                graphqlFilter.model = value;
                break;
              case 'fuel':
                graphqlFilter.fuel = value;
                break;
              case 'gearbox':
                graphqlFilter.gearbox = value;
                break;
              case 'year':
                // Handle year as exact match or range
                if (typeof value === 'number') {
                  graphqlFilter.yearMin = value;
                  graphqlFilter.yearMax = value;
                } else if (Array.isArray(value) && value.length === 2) {
                  graphqlFilter.yearMin = value[0];
                  graphqlFilter.yearMax = value[1];
                }
                break;
              case 'yearMin':
                graphqlFilter.yearMin = parseInt(value);
                break;
              case 'yearMax':
                graphqlFilter.yearMax = parseInt(value);
                break;
              case 'mileageKm':
              case 'mileageMax':
                graphqlFilter.mileageMax = parseInt(value);
                break;
              // For other dynamic attributes not directly supported by GraphQL,
              // we'll need to add them to the backend later
              default:
                console.log(`Dynamic filter attribute '${key}' not yet supported in GraphQL API`);
                break;
            }
          }
        });
      }

      // Legacy individual spec filters (for backward compatibility)
      if (finalFilters.make) {
        graphqlFilter.make = finalFilters.make;
      }
      if (finalFilters.model) {
        graphqlFilter.model = finalFilters.model;  
      }
      if (finalFilters.fuel) {
        graphqlFilter.fuel = finalFilters.fuel;
      }
      if (finalFilters.gearbox) {
        graphqlFilter.gearbox = finalFilters.gearbox;
      }
      if (finalFilters.yearMin) {
        graphqlFilter.yearMin = parseInt(finalFilters.yearMin);
      }
      if (finalFilters.yearMax) {
        graphqlFilter.yearMax = parseInt(finalFilters.yearMax);
      }
      if (finalFilters.mileageMax) {
        graphqlFilter.mileageMax = parseInt(finalFilters.mileageMax);
      }

      // Use GraphQL listingsSearch API
      const data = await graphqlRequest(LISTINGS_SEARCH_QUERY, {
        filter: graphqlFilter,
        limit: pagination.limit,
        offset: offset
      });

      const listings: Listing[] = (data.listingsSearch || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        titleAr: item.title, // Backend should provide Arabic version
        description: item.description,
        descriptionAr: item.description, // Backend should provide Arabic version
        price: item.priceMinor / 100, // Convert from minor currency
        currency: 'USD', // Primary currency, but we have multi-currency prices
        prices: item.prices, // Multi-currency prices from backend
        condition: 'USED' as const, // Default - backend should provide this
        status: item.status as any,
        images: item.imageKeys || [],
        location: `${item.city || ''}, ${item.province || ''}`.replace(/^, |, $/, ''),
        province: item.province,
        area: item.area,
        categoryId: item.categoryId,
        sellerId: item.userId,
        specs: {}, // Empty specs object since we removed from query
        viewCount: 0,
        isFeatured: false,
        isPromoted: false,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      }));

      // Since GraphQL listingsSearch doesn't return count, we approximate
      const hasMore = listings.length === pagination.limit;
      
      set({ 
        listings,
        isLoading: false, 
        error: null,
        pagination: {
          ...pagination,
          total: hasMore ? offset + pagination.limit + 1 : offset + listings.length,
          hasMore
        }
      });
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load listings',
        listings: [] 
      });
    }
  },

  fetchListingsByCategory: async (categoryId: string, filterOverrides = {}) => {
    await get().fetchListings({ ...filterOverrides, categoryId });
  },
}));

// Selectors
export const useListings = () => useListingsStore((state) => state.listings);
export const useCurrentListing = () => useListingsStore((state) => state.currentListing);
export const useListingsLoading = () => useListingsStore((state) => state.isLoading);
export const useListingsError = () => useListingsStore((state) => state.error);
export const useListingsFilters = () => useListingsStore((state) => state.filters);
export const useListingsPagination = () => useListingsStore((state) => state.pagination);