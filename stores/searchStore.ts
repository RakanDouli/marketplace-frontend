import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Types for search filters
export interface SearchFilters {
  // Category
  categoryId?: string;

  // Brand and Model (now part of dynamic system)
  brandId?: string;
  modelId?: string;

  // Price filters
  priceMinMinor?: number;
  priceMaxMinor?: number;
  priceCurrency?: string;

  // Location filters (now handled as global attributes in specs)
  province?: string; // Deprecated - use specs.location instead
  city?: string; // Deprecated - use specs.location instead
  area?: string; // Deprecated - not used in current system

  // Search query
  search?: string;

  // Seller type filter
  sellerType?: string;

  // Sort option
  sort?: string;

  // Dynamic specs (all attribute filters)
  specs?: Record<string, any>;

  // Pagination
  page?: number;
  limit?: number;
}

// Store state interface
interface SearchState {
  // Current active filters
  activeFilters: SearchFilters;

  // Loading states
  isApplying: boolean;

  // Debounce timer
  debounceTimer: NodeJS.Timeout | null;
}

// Store actions interface
interface SearchActions {
  // Core filter management
  setFilter: (key: keyof SearchFilters, value: any) => void;
  setSpecFilter: (specKey: string, value: any) => void;
  removeFilter: (key: keyof SearchFilters) => void;
  removeSpecFilter: (specKey: string) => void;
  clearAllFilters: () => void;

  // Batch operations
  setFilters: (filters: Partial<SearchFilters>) => void;

  // Backend conversion
  getBackendFilters: () => any;
  getStoreFilters: () => any;

  // URL management
  getUrlParams: () => URLSearchParams;
  setFromUrlParams: (searchParams: URLSearchParams) => void;

  // Utility
  hasActiveFilters: () => boolean;
  resetToDefaults: () => void;
}

type SearchStore = SearchState & SearchActions;

const initialFilters: SearchFilters = {
  page: 1,
  limit: 20,
};

// Session storage helpers for filter persistence
const SESSION_FILTERS_KEY = 'marketplace_search_filters';
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

const loadFiltersFromSession = (): SearchFilters => {
  if (typeof window === 'undefined') return initialFilters;

  try {
    const stored = sessionStorage.getItem(SESSION_FILTERS_KEY);
    if (!stored) return initialFilters;

    const { filters, timestamp } = JSON.parse(stored);

    // Check if session data is still valid
    if (Date.now() - timestamp > SESSION_TTL) {
      sessionStorage.removeItem(SESSION_FILTERS_KEY);
      return initialFilters;
    }

    console.log('🔄 Restored search filters from session storage');
    return { ...initialFilters, ...filters };
  } catch (error) {
    console.warn('Failed to load search filters from session storage:', error);
    return initialFilters;
  }
};

const saveFiltersToSession = (filters: SearchFilters): void => {
  if (typeof window === 'undefined') return;

  try {
    // Only save non-default filters to reduce storage usage
    const filtersToSave = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => {
        if (key === 'page' || key === 'limit') return false; // Don't persist pagination
        return value !== null && value !== undefined && value !== '';
      })
    );

    if (Object.keys(filtersToSave).length === 0) {
      sessionStorage.removeItem(SESSION_FILTERS_KEY);
      return;
    }

    sessionStorage.setItem(SESSION_FILTERS_KEY, JSON.stringify({
      filters: filtersToSave,
      timestamp: Date.now(),
    }));

    console.log('💾 Saved search filters to session storage');
  } catch (error) {
    console.warn('Failed to save search filters to session storage:', error);
  }
};

const initialState: SearchState = {
  activeFilters: loadFiltersFromSession(),
  isApplying: false,
  debounceTimer: null,
};

export const useSearchStore = create<SearchStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Set individual filter
    setFilter: (key: keyof SearchFilters, value: any) => {
      // console.log(`🔧 SearchStore: Setting ${key} =`, value);

      const { activeFilters } = get();
      const newFilters = { ...activeFilters };

      if (value === null || value === undefined || value === "") {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }

      // Reset page when filters change (except when setting page itself)
      if (key !== "page") {
        newFilters.page = 1;
      }

      set({ activeFilters: newFilters });

      // Save to session storage for persistence
      saveFiltersToSession(newFilters);

      // console.log("📦 SearchStore: Updated filters", {
      //   previous: activeFilters,
      //   new: newFilters,
      //   changed: key,
      //   value: value
      // });
    },

    // Set spec filter (dynamic attributes)
    setSpecFilter: (specKey: string, value: any) => {
      console.log(`🎯 SearchStore: Setting spec ${specKey} =`, value);

      const { activeFilters } = get();
      const newSpecs = { ...activeFilters.specs };

      // Simplified logic - store values directly
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete newSpecs[specKey];
      } else {
        newSpecs[specKey] = value;
      }

      const newFilters = {
        ...activeFilters,
        specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
        page: 1, // Reset page when filters change
      };

      set({ activeFilters: newFilters });

      // Save to session storage for persistence
      saveFiltersToSession(newFilters);

      console.log("🎯 SearchStore: Updated spec filters", {
        specKey,
        value,
        newSpecs,
        finalFilters: newFilters,
      });
    },

    // Remove individual filter
    removeFilter: (key: keyof SearchFilters) => {
      console.log(`🗑️ SearchStore: Removing ${key}`);

      const { activeFilters } = get();
      const newFilters = { ...activeFilters };

      // Just delete the filter (no special handling needed for sort)
      delete newFilters[key];

      set({ activeFilters: newFilters });

      // Save to session storage for persistence
      saveFiltersToSession(newFilters);
    },

    // Remove spec filter
    removeSpecFilter: (specKey: string) => {
      console.log(`🗑️ SearchStore: Removing spec ${specKey}`);

      const { activeFilters } = get();
      if (!activeFilters.specs) return;

      const newSpecs = { ...activeFilters.specs };
      delete newSpecs[specKey];

      const newFilters = {
        ...activeFilters,
        specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
      };

      set({ activeFilters: newFilters });

      // Save to session storage for persistence
      saveFiltersToSession(newFilters);
    },

    // Clear all filters
    clearAllFilters: () => {
      // console.log("🧹 SearchStore: Clearing all filters");
      set({ activeFilters: initialFilters });

      // Clear session storage as well
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_FILTERS_KEY);
      }
    },

    // Set multiple filters at once
    setFilters: (filters: Partial<SearchFilters>) => {
      // console.log("📋 SearchStore: Setting multiple filters", filters);

      const { activeFilters } = get();
      const newFilters = { ...activeFilters, ...filters };

      set({ activeFilters: newFilters });

      // Save to session storage for persistence
      saveFiltersToSession(newFilters);
    },

    // Convert filters for backend aggregation calls
    getBackendFilters: () => {
      const { activeFilters } = get();
      console.log("🔄 SearchStore: Converting for backend", activeFilters);

      const backendFilters: any = {};

      if (activeFilters.categoryId) {
        backendFilters.categoryId = activeFilters.categoryId;
      }

      // Handle location filter: province (frontend) maps to location (backend specs)
      if (activeFilters.province) {
        if (!backendFilters.specs) backendFilters.specs = {};
        backendFilters.specs.location = activeFilters.province;
      }

      // Handle brandId and modelId (legacy top-level filters now moved to specs)
      if (activeFilters.brandId) {
        if (!backendFilters.specs) backendFilters.specs = {};
        backendFilters.specs.brandId = activeFilters.brandId;
      }
      if (activeFilters.modelId) {
        if (!backendFilters.specs) backendFilters.specs = {};
        backendFilters.specs.modelId = activeFilters.modelId;
      }

      // Convert specs to backend format - simplified since we store values directly
      if (activeFilters.specs && Object.keys(activeFilters.specs).length > 0) {
        const specs: Record<string, any> = { ...backendFilters.specs }; // Merge with location if set

        Object.entries(activeFilters.specs).forEach(([key, value]) => {
          console.log(`🔍 Backend conversion - Processing spec: ${key}`, {
            value,
            isArray: Array.isArray(value),
            valueType: typeof value,
          });

          // Store values directly - no complex object handling needed
          specs[key] = value;
        });

        if (Object.keys(specs).length > 0) {
          backendFilters.specs = specs;
        }
      }

      console.log("✅ Backend filters:", backendFilters);
      return backendFilters;
    },

    // Convert filters for listings store
    getStoreFilters: () => {
      const { activeFilters } = get();
      // console.log("📊 SearchStore: Converting for store", activeFilters);

      const storeFilters: any = {};

      if (activeFilters.categoryId) {
        storeFilters.categoryId = activeFilters.categoryId;
      }

      // Price filters
      if (activeFilters.priceMinMinor) {
        storeFilters.priceMinMinor = activeFilters.priceMinMinor;
      }
      if (activeFilters.priceMaxMinor) {
        storeFilters.priceMaxMinor = activeFilters.priceMaxMinor;
      }
      if (activeFilters.priceCurrency) {
        storeFilters.priceCurrency = activeFilters.priceCurrency;
      }

      // Location filters - now handled through specs.location (global attribute)
      // Keep backward compatibility for deprecated province/city fields
      if (activeFilters.province) {
        if (!storeFilters.specs) storeFilters.specs = {};
        storeFilters.specs.location = activeFilters.province;
      }
      if (activeFilters.city) {
        storeFilters.city = activeFilters.city; // Still supported for city-level filtering
      }

      // Handle brandId and modelId (legacy top-level filters now moved to specs)
      if (activeFilters.brandId) {
        if (!storeFilters.specs) storeFilters.specs = {};
        storeFilters.specs.brandId = activeFilters.brandId;
      }
      if (activeFilters.modelId) {
        if (!storeFilters.specs) storeFilters.specs = {};
        storeFilters.specs.modelId = activeFilters.modelId;
      }

      // Search
      if (activeFilters.search) {
        storeFilters.search = activeFilters.search;
      }

      // Seller type
      if (activeFilters.sellerType) {
        storeFilters.sellerType = activeFilters.sellerType;
      }

      // Sort
      if (activeFilters.sort) {
        storeFilters.sort = activeFilters.sort;
      }

      // Convert specs - simplified since we store values directly
      if (activeFilters.specs && Object.keys(activeFilters.specs).length > 0) {
        const specs: Record<string, any> = {};

        Object.entries(activeFilters.specs).forEach(([key, value]) => {
          // Store values directly - no complex object handling needed
          specs[key] = value;
        });

        if (Object.keys(specs).length > 0) {
          storeFilters.specs = specs;
        }
      }

      console.log("✅ Store filters:", storeFilters);
      return storeFilters;
    },

    // Convert to URL search parameters
    getUrlParams: () => {
      const { activeFilters } = get();
      const params = new URLSearchParams();

      // Add basic filters to URL
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.province)
        params.set("location", activeFilters.province); // Use 'location' instead of 'province' for URL
      if (activeFilters.city) params.set("city", activeFilters.city);
      if (activeFilters.priceMinMinor)
        params.set("minPrice", (activeFilters.priceMinMinor / 100).toString());
      if (activeFilters.priceMaxMinor)
        params.set("maxPrice", (activeFilters.priceMaxMinor / 100).toString());
      if (activeFilters.page && activeFilters.page > 1)
        params.set("page", activeFilters.page.toString());

      // Add spec filters to URL (flattened) - simplified
      if (activeFilters.specs) {
        Object.entries(activeFilters.specs).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            params.set(key, value.join(","));
          } else if (value) {
            params.set(key, value.toString());
          }
        });
      }

      return params;
    },

    // Set filters from URL parameters
    setFromUrlParams: (searchParams: URLSearchParams) => {
      // console.log("🔗 SearchStore: Setting from URL params");

      const newFilters: SearchFilters = { ...initialFilters };

      // Parse basic filters
      if (searchParams.get("search"))
        newFilters.search = searchParams.get("search")!;
      if (searchParams.get("location"))
        newFilters.province = searchParams.get("location")!; // Map 'location' URL param to province
      if (searchParams.get("province"))
        newFilters.province = searchParams.get("province")!; // Backward compatibility
      if (searchParams.get("city")) newFilters.city = searchParams.get("city")!;
      if (searchParams.get("minPrice"))
        newFilters.priceMinMinor =
          parseFloat(searchParams.get("minPrice")!) * 100;
      if (searchParams.get("maxPrice"))
        newFilters.priceMaxMinor =
          parseFloat(searchParams.get("maxPrice")!) * 100;
      if (searchParams.get("page"))
        newFilters.page = parseInt(searchParams.get("page")!);

      // Parse spec filters (these would need to be reconstructed based on attribute types)
      // For now, we'll skip this as it requires knowledge of attribute types

      set({ activeFilters: newFilters });
    },

    // Check if any filters are active
    hasActiveFilters: () => {
      const { activeFilters } = get();
      return Object.keys(activeFilters).some(
        (key) =>
          key !== "sort" &&
          key !== "page" &&
          key !== "limit" &&
          activeFilters[key as keyof SearchFilters]
      );
    },

    // Reset to default values
    resetToDefaults: () => {
      // console.log("🔄 SearchStore: Resetting to defaults");
      set({ activeFilters: initialFilters });
    },
  }))
);

// Selectors for easy component access
export const useActiveFilters = () =>
  useSearchStore((state) => state.activeFilters);
export const useSearchFiltersLoading = () =>
  useSearchStore((state) => state.isApplying);
export const useHasActiveFilters = () =>
  useSearchStore((state) => state.hasActiveFilters());
