// 🚀 PROGRESSIVE LOADING STORE - Enhanced for Syrian Internet Conditions
// Builds on existing listingsStore with smart caching and progressive loading

import { create } from "zustand";
import { ListingsState, Listing } from "../types";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import {
  PROGRESSIVE_LOADING_QUERIES,
  getOptimalQuery,
  getCacheKey,
} from "./listingsStore.progressive.gql";

// 🎯 Progressive Loading Types
interface ProgressiveLoadingState {
  // Multi-stage loading states
  isInitialLoading: boolean;      // First paint data
  isGridLoading: boolean;         // Grid view data
  isListLoading: boolean;         // List view data
  isDetailLoading: boolean;       // Detail view data
  isAggregationsLoading: boolean; // Filter counts only

  // Smart caching
  listingCache: Map<string, CachedListingData>;
  detailsCache: Map<string, Listing>;        // Full listing details
  aggregationsCache: Map<string, any>;      // Filter aggregations

  // Connection optimization
  connectionSpeed: 'slow' | 'medium' | 'fast';
  dataUsage: number; // Track data consumption

  // Progressive loading phases
  loadingPhase: 'initial' | 'grid' | 'list' | 'detail' | 'complete';

  // Performance metrics
  lastLoadTime: number;
  averageLoadTime: number;
}

interface CachedListingData {
  listings: Listing[];
  total: number;
  aggregations?: any;
  timestamp: number;
  cacheKey: string;
  viewType: 'grid' | 'list' | 'detail';
}

// 🚀 Enhanced Actions for Progressive Loading
interface ProgressiveActions {
  // 🎯 Smart Progressive Loading
  loadCategoryPageProgressive: (categorySlug: string) => Promise<void>;

  // 📱 Connection-aware fetching
  fetchListingsProgressive: (
    filters?: any,
    viewType?: 'grid' | 'list' | 'detail',
    forceRefresh?: boolean
  ) => Promise<void>;

  // ⚡ Ultra-fast filter updates
  updateFiltersProgressive: (filters: any) => Promise<void>;

  // 🔍 Lazy detail loading
  loadListingDetail: (listingId: string) => Promise<Listing>;

  // 📊 Aggregations only
  refreshAggregations: (filters: any) => Promise<void>;

  // 🎯 View switching optimization
  switchView: (newViewType: 'grid' | 'list') => Promise<void>;

  // 🧹 Cache management
  clearExpiredCache: () => void;
  estimateDataUsage: () => number;

  // 📶 Connection detection
  setConnectionSpeed: (speed: 'slow' | 'medium' | 'fast') => void;
  detectConnectionSpeed: () => Promise<'slow' | 'medium' | 'fast'>;
}

type ProgressiveListingsStore = ListingsState & ProgressiveLoadingState & ProgressiveActions;

// 🕰️ Cache settings optimized for Syrian internet
const CACHE_DURATIONS = {
  LISTINGS_GRID: 5 * 60 * 1000,      // 5 minutes - grid changes less
  LISTINGS_LIST: 3 * 60 * 1000,      // 3 minutes - list needs freshness
  LISTING_DETAIL: 10 * 60 * 1000,    // 10 minutes - details rarely change
  AGGREGATIONS: 2 * 60 * 1000,       // 2 minutes - filter counts change
  ATTRIBUTES: 30 * 60 * 1000,        // 30 minutes - attributes rarely change
};

// 📊 Data size limits for slow connections
const DATA_LIMITS = {
  GRID_ITEMS_SLOW: 10,     // Show fewer items on slow connections
  LIST_ITEMS_SLOW: 8,      // Even fewer for list view
  IMAGES_PER_ITEM: 1,      // Only thumbnail on slow connections
};

export const useProgressiveListingsStore = create<ProgressiveListingsStore>((set, get) => ({
  // 📦 Base state from existing store
  listings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: { page: 1, limit: 20, total: 0, hasMore: true },
  sortFilter: "createdAt_desc",
  viewType: "grid",

  // 🚀 Progressive loading state
  isInitialLoading: false,
  isGridLoading: false,
  isListLoading: false,
  isDetailLoading: false,
  isAggregationsLoading: false,

  listingCache: new Map(),
  detailsCache: new Map(),
  aggregationsCache: new Map(),

  connectionSpeed: 'slow', // Default for Syria
  dataUsage: 0,
  loadingPhase: 'initial',
  lastLoadTime: 0,
  averageLoadTime: 0,

  // 🎯 MAIN PROGRESSIVE LOADING METHOD
  loadCategoryPageProgressive: async (categorySlug: string) => {
    const state = get();
    const startTime = Date.now();

    try {
      set({ isInitialLoading: true, loadingPhase: 'initial' });

      // 🚀 PHASE 1: Ultra-fast initial load (< 3KB)
      console.log("🚀 [Progressive] Phase 1: Loading initial content...");

      const initialResult = await cachedGraphQLRequest(
        PROGRESSIVE_LOADING_QUERIES.IMMEDIATE,
        { categorySlug },
        'listings-initial-' + categorySlug,
        CACHE_DURATIONS.LISTINGS_GRID
      );

      // Immediately show featured listings
      if (initialResult?.featuredListings) {
        set({
          listings: initialResult.featuredListings,
          loadingPhase: 'grid',
          isInitialLoading: false,
        });
      }

      // 🏃‍♂️ PHASE 2: Grid content (< 5KB) - Background load
      console.log("🏃‍♂️ [Progressive] Phase 2: Loading grid content...");

      const gridQuery = getOptimalQuery('grid', state.connectionSpeed, false);
      const gridResult = await cachedGraphQLRequest(
        gridQuery,
        {
          filter: { categorySlug },
          limit: state.connectionSpeed === 'slow' ? DATA_LIMITS.GRID_ITEMS_SLOW : 20,
          offset: 0
        },
        getCacheKey('grid', { categorySlug }, { page: 1 }),
        CACHE_DURATIONS.LISTINGS_GRID
      );

      if (gridResult?.listingsSearch) {
        set({
          listings: gridResult.listingsSearch,
          pagination: {
            ...state.pagination,
            total: gridResult.listingsAggregations?.totalResults || 0
          },
          loadingPhase: 'complete'
        });

        // Cache aggregations separately
        if (gridResult.listingsAggregations) {
          state.aggregationsCache.set(
            'agg-' + categorySlug,
            {
              data: gridResult.listingsAggregations,
              timestamp: Date.now()
            }
          );
        }
      }

      // 📊 Update performance metrics
      const loadTime = Date.now() - startTime;
      set({
        lastLoadTime: loadTime,
        averageLoadTime: (state.averageLoadTime + loadTime) / 2,
        dataUsage: state.dataUsage + estimateResponseSize(gridResult)
      });

      console.log(`✅ [Progressive] Category loaded in ${loadTime}ms`);

    } catch (error) {
      console.error("❌ [Progressive] Category load failed:", error);
      set({
        error: "Failed to load listings. Please check your connection.",
        isInitialLoading: false,
        loadingPhase: 'complete'
      });
    }
  },

  // ⚡ SMART FILTER UPDATES - Only fetch what changed
  updateFiltersProgressive: async (newFilters: any) => {
    const state = get();

    try {
      set({ isAggregationsLoading: true });

      // Check if we have cached aggregations for these filters
      const cacheKey = 'agg-' + JSON.stringify(newFilters);
      const cached = state.aggregationsCache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATIONS.AGGREGATIONS) {
        console.log("📊 [Progressive] Using cached aggregations");
        // Apply cached aggregations to FiltersStore
        set({ isAggregationsLoading: false });
        return;
      }

      // Fetch only aggregations for fast filter response
      const aggResult = await cachedGraphQLRequest(
        PROGRESSIVE_LOADING_QUERIES.FILTERS,
        { filter: newFilters },
        cacheKey,
        CACHE_DURATIONS.AGGREGATIONS
      );

      // Cache the aggregations
      state.aggregationsCache.set(cacheKey, {
        data: aggResult?.listingsAggregations,
        timestamp: Date.now()
      });

      // Now fetch updated listings in background
      get().fetchListingsProgressive(newFilters, state.viewType, false);

    } catch (error) {
      console.error("❌ [Progressive] Filter update failed:", error);
      set({ isAggregationsLoading: false });
    }
  },

  // 🔍 LAZY DETAIL LOADING
  loadListingDetail: async (listingId: string): Promise<Listing> => {
    const state = get();

    // Check cache first
    const cached = state.detailsCache.get(listingId);
    if (cached) {
      console.log("🔍 [Progressive] Using cached listing detail");
      return cached;
    }

    try {
      set({ isDetailLoading: true });

      const result = await cachedGraphQLRequest(
        PROGRESSIVE_LOADING_QUERIES.DETAIL,
        { id: listingId },
        'detail-' + listingId,
        CACHE_DURATIONS.LISTING_DETAIL
      );

      const listing = result?.listing;

      if (listing) {
        // Cache the full listing
        state.detailsCache.set(listingId, listing);
        set({ currentListing: listing, isDetailLoading: false });
        return listing;
      }

      throw new Error("Listing not found");

    } catch (error) {
      set({ isDetailLoading: false });
      throw error;
    }
  },

  // 📱 VIEW SWITCHING OPTIMIZATION
  switchView: async (newViewType: 'grid' | 'list') => {
    const state = get();

    set({ viewType: newViewType });

    // Check if we have cached data for this view
    const cacheKey = getCacheKey(newViewType, state.filters, state.pagination);
    const cached = state.listingCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATIONS.LISTINGS_GRID) {
      console.log(`📱 [Progressive] Using cached ${newViewType} data`);
      set({ listings: cached.listings });
      return;
    }

    // Fetch data for new view type
    await get().fetchListingsProgressive(state.filters, newViewType, false);
  },

  // 📶 CONNECTION SPEED DETECTION
  detectConnectionSpeed: async (): Promise<'slow' | 'medium' | 'fast'> => {
    // Simple connection test
    const startTime = Date.now();

    try {
      // Test with a small GraphQL query
      await cachedGraphQLRequest(
        'query TestConnection { __typename }',
        {},
        'connection-test',
        1000 // 1 second cache
      );

      const responseTime = Date.now() - startTime;

      let speed: 'slow' | 'medium' | 'fast';
      if (responseTime > 3000) {
        speed = 'slow';
      } else if (responseTime > 1000) {
        speed = 'medium';
      } else {
        speed = 'fast';
      }

      set({ connectionSpeed: speed });
      console.log(`📶 [Progressive] Detected ${speed} connection (${responseTime}ms)`);

      return speed;

    } catch (error) {
      set({ connectionSpeed: 'slow' });
      return 'slow';
    }
  },

  // 🧹 CACHE MANAGEMENT
  clearExpiredCache: () => {
    const state = get();
    const now = Date.now();

    // Clear expired listing cache
    for (const [key, cached] of state.listingCache.entries()) {
      if (now - cached.timestamp > CACHE_DURATIONS.LISTINGS_GRID) {
        state.listingCache.delete(key);
      }
    }

    // Clear expired aggregations cache
    for (const [key, cached] of state.aggregationsCache.entries()) {
      if (now - cached.timestamp > CACHE_DURATIONS.AGGREGATIONS) {
        state.aggregationsCache.delete(key);
      }
    }

    console.log("🧹 [Progressive] Cleared expired cache");
  },

  // 📊 DATA USAGE ESTIMATION
  estimateDataUsage: () => {
    return get().dataUsage;
  },

  // Direct setters for compatibility with existing code
  setConnectionSpeed: (speed) => set({ connectionSpeed: speed }),

  // Fetch methods that build on existing patterns
  fetchListingsProgressive: async (filters = {}, viewType = 'grid', forceRefresh = false) => {
    const state = get();
    const cacheKey = getCacheKey(viewType, filters, state.pagination);

    // Check cache unless forcing refresh
    if (!forceRefresh) {
      const cached = state.listingCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATIONS.LISTINGS_GRID) {
        console.log(`📦 [Progressive] Using cached ${viewType} listings`);
        set({ listings: cached.listings });
        return;
      }
    }

    try {
      set({ isLoading: true });

      const query = getOptimalQuery(viewType, state.connectionSpeed);
      const result = await cachedGraphQLRequest(
        query,
        {
          filter: filters,
          limit: state.pagination.limit,
          offset: (state.pagination.page - 1) * state.pagination.limit
        },
        cacheKey,
        CACHE_DURATIONS.LISTINGS_GRID
      );

      if (result?.listingsSearch) {
        const cachedData: CachedListingData = {
          listings: result.listingsSearch,
          total: result.listingsAggregations?.totalResults || 0,
          aggregations: result.listingsAggregations,
          timestamp: Date.now(),
          cacheKey,
          viewType
        };

        state.listingCache.set(cacheKey, cachedData);

        set({
          listings: result.listingsSearch,
          pagination: {
            ...state.pagination,
            total: cachedData.total
          },
          isLoading: false
        });
      }

    } catch (error) {
      console.error(`❌ [Progressive] Failed to fetch ${viewType} listings:`, error);
      set({ error: "Failed to load listings", isLoading: false });
    }
  },

  // Placeholder methods for compatibility
  setListings: (listings) => set({ listings }),
  addListings: (listings) => set(state => ({ listings: [...state.listings, ...listings] })),
  setCurrentListing: (listing) => set({ currentListing: listing }),
  updateListing: (id, updates) => set(state => ({
    listings: state.listings.map(l => l.id === id ? { ...l, ...updates } : l)
  })),
  removeListing: (id) => set(state => ({
    listings: state.listings.filter(l => l.id !== id)
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  setPagination: (pagination) => set(state => ({ pagination: { ...state.pagination, ...pagination } })),
  resetPagination: () => set({ pagination: { page: 1, limit: 20, total: 0, hasMore: true } }),
  setSortFilter: (sort) => set({ sortFilter: sort }),
  setViewType: (viewType) => set({ viewType }),
  fetchListings: async (filters, viewType) => get().fetchListingsProgressive(filters, viewType),
  fetchListingsByCategory: async (categorySlug, filters, viewType) => {
    await get().loadCategoryPageProgressive(categorySlug);
  },
  refreshAggregations: async (filters) => get().updateFiltersProgressive(filters),
}));

// 📊 Helper function to estimate response size
function estimateResponseSize(response: any): number {
  try {
    return JSON.stringify(response).length;
  } catch {
    return 1000; // Fallback estimate
  }
}