// 🎯 PROGRESSIVE FILTERS STORE - Enhanced for Syrian Internet
// Optimized filter loading and caching for slow connections

import { create } from "zustand";
import type { Attribute, AttributeOption } from "../../types/listing";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import { GET_CATEGORY_ATTRIBUTES_QUERY } from "./filtersStore.gql";

// 🎯 Enhanced filter types for progressive loading
interface ProgressiveFilterState {
  // Progressive loading phases
  isLoadingEssential: boolean;    // Core filter structure
  isLoadingCounts: boolean;       // Filter option counts
  isLoadingSecondary: boolean;    // Additional filter options

  // Smart caching with TTL
  attributesCache: Map<string, CachedAttributeData>;
  countsCache: Map<string, CachedCountData>;

  // Connection-aware optimization
  connectionSpeed: 'slow' | 'medium' | 'fast';
  limitOptionsForSlow: boolean;

  // Performance tracking
  loadingPhase: 'initial' | 'essential' | 'complete';
  lastLoadTime: number;
}

interface CachedAttributeData {
  attributes: Attribute[];
  timestamp: number;
  categorySlug: string;
}

interface CachedCountData {
  aggregations: any;
  timestamp: number;
  filtersSignature: string; // Hash of applied filters
}

// 🚀 Progressive Actions
interface ProgressiveFilterActions {
  // 🎯 Progressive loading methods
  loadEssentialFilters: (categorySlug: string) => Promise<void>;
  loadFilterCounts: (categorySlug: string, appliedFilters?: any) => Promise<void>;
  loadSecondaryFilters: (categorySlug: string) => Promise<void>;

  // ⚡ Smart filter updates
  updateFilterCountsProgressive: (appliedFilters: any) => Promise<void>;

  // 🧠 Intelligent filtering
  getEssentialFilters: () => Attribute[];
  getFiltersByImportance: () => { essential: Attribute[]; secondary: Attribute[] };

  // 📱 Connection optimization
  optimizeForConnection: (speed: 'slow' | 'medium' | 'fast') => void;

  // 🧹 Cache management
  clearExpiredFilterCache: () => void;
  preloadFiltersForCategory: (categorySlug: string) => Promise<void>;
}

type ProgressiveFiltersStore = ProgressiveFilterState & ProgressiveFilterActions;

// 🕰️ Cache durations optimized for filter usage patterns
const FILTER_CACHE_DURATIONS = {
  ATTRIBUTES: 30 * 60 * 1000,      // 30 minutes - attributes rarely change
  COUNTS: 2 * 60 * 1000,          // 2 minutes - counts change frequently
  SECONDARY: 10 * 60 * 1000,      // 10 minutes - secondary options
};

// 🎯 Essential filters for immediate display (prioritized by importance)
const ESSENTIAL_FILTER_KEYS = [
  'brandId',        // Most important for cars
  'price',          // Price is always essential
  'location',       // Location filtering
  'fuel_type',      // Key car attribute
  'year',           // Important for cars
  'transmission',   // Common filter
];

// 📱 Filters optimized for slow connections (limited options)
const SLOW_CONNECTION_LIMITS = {
  MAX_OPTIONS_PER_FILTER: 8,     // Limit options shown initially
  MAX_FILTERS_INITIAL: 6,        // Show only essential filters first
  MAX_SECONDARY_FILTERS: 4,      // Limit secondary filters
};

export const useProgressiveFiltersStore = create<ProgressiveFiltersStore>((set, get) => ({
  // 📦 Progressive loading state
  isLoadingEssential: false,
  isLoadingCounts: false,
  isLoadingSecondary: false,

  attributesCache: new Map(),
  countsCache: new Map(),

  connectionSpeed: 'slow', // Default for Syria
  limitOptionsForSlow: true,

  loadingPhase: 'initial',
  lastLoadTime: 0,

  // 🎯 MAIN PROGRESSIVE LOADING METHOD
  loadEssentialFilters: async (categorySlug: string) => {
    const state = get();
    const startTime = Date.now();

    // Check cache first
    const cached = state.attributesCache.get(categorySlug);
    if (cached && (Date.now() - cached.timestamp) < FILTER_CACHE_DURATIONS.ATTRIBUTES) {
      console.log("🎯 [Progressive Filters] Using cached attributes");

      const essentialFilters = cached.attributes.filter(attr =>
        ESSENTIAL_FILTER_KEYS.includes(attr.key) && attr.showInFilter
      );

      // Apply essential filters immediately
      set({ loadingPhase: 'essential' });
      return;
    }

    try {
      set({ isLoadingEssential: true, loadingPhase: 'initial' });

      console.log("🎯 [Progressive Filters] Loading essential filters...");

      // Fetch attributes with minimal data for fast loading
      const result = await cachedGraphQLRequest(
        GET_CATEGORY_ATTRIBUTES_QUERY,
        { categorySlug },
        'attributes-' + categorySlug,
        FILTER_CACHE_DURATIONS.ATTRIBUTES
      );

      if (result?.getAttributesByCategorySlug) {
        const allAttributes = result.getAttributesByCategorySlug;

        // Cache all attributes
        state.attributesCache.set(categorySlug, {
          attributes: allAttributes,
          timestamp: Date.now(),
          categorySlug
        });

        // Immediately show essential filters
        const essentialFilters = allAttributes.filter(attr =>
          ESSENTIAL_FILTER_KEYS.includes(attr.key) && attr.showInFilter
        );

        // Optimize for slow connections
        if (state.connectionSpeed === 'slow') {
          essentialFilters.forEach(filter => {
            if (filter.options && filter.options.length > SLOW_CONNECTION_LIMITS.MAX_OPTIONS_PER_FILTER) {
              filter.options = filter.options
                .slice(0, SLOW_CONNECTION_LIMITS.MAX_OPTIONS_PER_FILTER)
                .concat([{
                  id: 'show-more',
                  key: 'show-more',
                  value: 'عرض المزيد...',
                  sortOrder: 999
                } as AttributeOption]);
            }
          });
        }

        set({
          isLoadingEssential: false,
          loadingPhase: 'essential'
        });

        // Background load secondary filters
        setTimeout(() => {
          get().loadSecondaryFilters(categorySlug);
        }, 500);

        console.log(`✅ [Progressive Filters] Essential filters loaded in ${Date.now() - startTime}ms`);
      }

    } catch (error) {
      console.error("❌ [Progressive Filters] Failed to load essential filters:", error);
      set({ isLoadingEssential: false });
    }
  },

  // 📊 LOAD FILTER COUNTS (for displaying available options)
  loadFilterCounts: async (categorySlug: string, appliedFilters = {}) => {
    const state = get();
    const filtersSignature = JSON.stringify(appliedFilters);
    const cacheKey = `counts-${categorySlug}-${filtersSignature}`;

    // Check counts cache
    const cached = state.countsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < FILTER_CACHE_DURATIONS.COUNTS) {
      console.log("📊 [Progressive Filters] Using cached filter counts");
      return;
    }

    try {
      set({ isLoadingCounts: true });

      // This would integrate with the listings aggregation query
      // For now, we'll simulate the structure
      const aggregationQuery = `
        query GetFilterCounts($filter: ListingFilterInput) {
          listingsAggregations(filter: $filter) {
            totalResults
            attributes {
              field
              options {
                value
                count
                key
              }
            }
          }
        }
      `;

      const result = await cachedGraphQLRequest(
        aggregationQuery,
        { filter: { categorySlug, ...appliedFilters } },
        cacheKey,
        FILTER_CACHE_DURATIONS.COUNTS
      );

      if (result?.listingsAggregations) {
        // Cache the counts
        state.countsCache.set(cacheKey, {
          aggregations: result.listingsAggregations,
          timestamp: Date.now(),
          filtersSignature
        });

        // Apply counts to filters (this would integrate with main filters store)
        console.log("📊 [Progressive Filters] Filter counts updated");
      }

      set({ isLoadingCounts: false });

    } catch (error) {
      console.error("❌ [Progressive Filters] Failed to load filter counts:", error);
      set({ isLoadingCounts: false });
    }
  },

  // 🔄 LOAD SECONDARY FILTERS (background loading)
  loadSecondaryFilters: async (categorySlug: string) => {
    const state = get();

    try {
      set({ isLoadingSecondary: true });

      console.log("🔄 [Progressive Filters] Loading secondary filters...");

      // Get all attributes from cache
      const cached = state.attributesCache.get(categorySlug);
      if (!cached) return;

      const secondaryFilters = cached.attributes.filter(attr =>
        !ESSENTIAL_FILTER_KEYS.includes(attr.key) &&
        attr.showInFilter
      );

      // For slow connections, limit secondary filters
      let filteredSecondary = secondaryFilters;
      if (state.connectionSpeed === 'slow') {
        filteredSecondary = secondaryFilters
          .slice(0, SLOW_CONNECTION_LIMITS.MAX_SECONDARY_FILTERS);
      }

      set({
        isLoadingSecondary: false,
        loadingPhase: 'complete'
      });

      console.log(`✅ [Progressive Filters] Secondary filters loaded (${filteredSecondary.length} filters)`);

    } catch (error) {
      console.error("❌ [Progressive Filters] Failed to load secondary filters:", error);
      set({ isLoadingSecondary: false });
    }
  },

  // ⚡ SMART FILTER COUNT UPDATES
  updateFilterCountsProgressive: async (appliedFilters: any) => {
    const state = get();

    // Use debouncing to avoid excessive requests
    if (state.isLoadingCounts) return;

    try {
      set({ isLoadingCounts: true });

      // This would call the aggregation endpoint to get updated counts
      // Implementation would depend on your GraphQL schema

      // For now, simulate fast count update
      await new Promise(resolve => setTimeout(resolve, 200));

      set({ isLoadingCounts: false });

    } catch (error) {
      console.error("❌ [Progressive Filters] Failed to update filter counts:", error);
      set({ isLoadingCounts: false });
    }
  },

  // 🧠 INTELLIGENT FILTER ORGANIZATION
  getEssentialFilters: () => {
    const state = get();
    // This would return cached essential filters
    // Implementation depends on how you store the current filters
    return [];
  },

  getFiltersByImportance: () => {
    const state = get();
    // This would organize filters by importance/usage patterns
    return { essential: [], secondary: [] };
  },

  // 📱 CONNECTION OPTIMIZATION
  optimizeForConnection: (speed: 'slow' | 'medium' | 'fast') => {
    set({
      connectionSpeed: speed,
      limitOptionsForSlow: speed === 'slow'
    });

    console.log(`📱 [Progressive Filters] Optimized for ${speed} connection`);
  },

  // 🧹 CACHE MANAGEMENT
  clearExpiredFilterCache: () => {
    const state = get();
    const now = Date.now();

    // Clear expired attributes cache
    for (const [key, cached] of state.attributesCache.entries()) {
      if (now - cached.timestamp > FILTER_CACHE_DURATIONS.ATTRIBUTES) {
        state.attributesCache.delete(key);
      }
    }

    // Clear expired counts cache
    for (const [key, cached] of state.countsCache.entries()) {
      if (now - cached.timestamp > FILTER_CACHE_DURATIONS.COUNTS) {
        state.countsCache.delete(key);
      }
    }

    console.log("🧹 [Progressive Filters] Cleared expired cache");
  },

  // 🚀 PRELOAD FILTERS FOR CATEGORY
  preloadFiltersForCategory: async (categorySlug: string) => {
    // Background preload for better UX
    console.log(`🚀 [Progressive Filters] Preloading filters for ${categorySlug}`);

    setTimeout(() => {
      get().loadEssentialFilters(categorySlug);
    }, 100);
  },
}));

// 🎯 Helper function to determine filter importance
export function getFilterImportance(attributeKey: string): 'essential' | 'secondary' {
  return ESSENTIAL_FILTER_KEYS.includes(attributeKey) ? 'essential' : 'secondary';
}

// 📊 Helper function to optimize filter options for connection speed
export function optimizeFilterOptions(
  options: AttributeOption[],
  connectionSpeed: 'slow' | 'medium' | 'fast'
): AttributeOption[] {
  if (connectionSpeed === 'slow' && options.length > SLOW_CONNECTION_LIMITS.MAX_OPTIONS_PER_FILTER) {
    return options
      .slice(0, SLOW_CONNECTION_LIMITS.MAX_OPTIONS_PER_FILTER)
      .concat([{
        id: 'show-more',
        key: 'show-more',
        value: 'عرض المزيد...',
        sortOrder: 999
      } as AttributeOption]);
  }

  return options;
}