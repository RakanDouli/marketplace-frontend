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

  // Account type filter (unified with User.accountType)
  accountType?: string;

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
  // Applied filters (used for API calls and listings)
  appliedFilters: SearchFilters;

  // Draft filters (UI input state before applying)
  draftFilters: SearchFilters;

  // Loading states
  isApplying: boolean;
}

// Store actions interface
interface SearchActions {
  // Applied filters (immediate effect, used by listings)
  setFilter: (key: keyof SearchFilters, value: any) => void;
  setSpecFilter: (specKey: string, value: any) => void;
  removeFilter: (key: keyof SearchFilters) => void;
  removeSpecFilter: (specKey: string) => void;
  clearAllFilters: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;

  // Draft filters (UI state, requires apply)
  setDraftFilter: (key: keyof SearchFilters, value: any) => void;
  setDraftSpecFilter: (specKey: string, value: any) => void;
  applyDrafts: () => void;
  resetDrafts: () => void;

  // Draft state helpers
  hasDraftChanges: () => boolean;
  hasPriceDraftChanges: () => boolean;
  hasRangeDraftChanges: (attributeKey: string) => boolean;
  hasSearchDraftChanges: () => boolean;

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

const initialState: SearchState = {
  appliedFilters: initialFilters,
  draftFilters: initialFilters,
  isApplying: false,
};

export const useSearchStore = create<SearchStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Set individual applied filter (immediate effect)
    setFilter: (key: keyof SearchFilters, value: any) => {
      const { appliedFilters } = get();
      const newFilters = { ...appliedFilters };

      if (value === null || value === undefined || value === "") {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }

      // Reset page when filters change (except when setting page itself)
      if (key !== "page") {
        newFilters.page = 1;
      }

      set({ appliedFilters: newFilters });
    },

    // Set spec filter (dynamic attributes) - immediate effect
    setSpecFilter: (specKey: string, value: any) => {
      const { appliedFilters } = get();
      const newSpecs = { ...appliedFilters.specs };

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
        ...appliedFilters,
        specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
        page: 1,
      };

      set({ appliedFilters: newFilters });
    },

    // Remove individual filter
    removeFilter: (key: keyof SearchFilters) => {
      const { appliedFilters } = get();
      const newFilters = { ...appliedFilters };
      delete newFilters[key];

      set({ appliedFilters: newFilters });
    },

    // Remove spec filter
    removeSpecFilter: (specKey: string) => {
      const { appliedFilters } = get();
      if (!appliedFilters.specs) return;

      const newSpecs = { ...appliedFilters.specs };
      delete newSpecs[specKey];

      const newFilters = {
        ...appliedFilters,
        specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
      };

      set({ appliedFilters: newFilters });
    },

    // Clear all filters
    clearAllFilters: () => {
      set({
        appliedFilters: initialFilters,
        draftFilters: initialFilters,
      });
    },

    // Set multiple filters at once
    setFilters: (filters: Partial<SearchFilters>) => {
      const { appliedFilters } = get();
      const newFilters = { ...appliedFilters, ...filters };

      set({ appliedFilters: newFilters });
    },

    // === DRAFT FILTER METHODS ===

    // Set draft filter (UI state only)
    setDraftFilter: (key: keyof SearchFilters, value: any) => {
      const { draftFilters } = get();
      const newDrafts = { ...draftFilters };

      if (value === null || value === undefined || value === "") {
        delete newDrafts[key];
      } else {
        newDrafts[key] = value;
      }

      set({ draftFilters: newDrafts });
    },

    // Set draft spec filter (UI state only)
    setDraftSpecFilter: (specKey: string, value: any) => {
      const { draftFilters } = get();
      const newSpecs = { ...draftFilters.specs };

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

      const newDrafts = {
        ...draftFilters,
        specs: Object.keys(newSpecs).length > 0 ? newSpecs : undefined,
      };

      set({ draftFilters: newDrafts });
    },

    // Apply draft filters to applied filters
    applyDrafts: () => {
      const { draftFilters } = get();
      const newApplied = { ...draftFilters, page: 1 }; // Reset page on apply

      set({ appliedFilters: newApplied });
    },

    // Reset drafts to match applied filters
    resetDrafts: () => {
      const { appliedFilters } = get();
      set({ draftFilters: { ...appliedFilters } });
    },

    // === DRAFT STATE HELPERS ===

    // Check if any draft changes exist
    hasDraftChanges: () => {
      const { appliedFilters, draftFilters } = get();
      return JSON.stringify(appliedFilters) !== JSON.stringify(draftFilters);
    },

    // Check if price drafts have changes
    hasPriceDraftChanges: () => {
      const { appliedFilters, draftFilters } = get();
      return (
        appliedFilters.priceMinMinor !== draftFilters.priceMinMinor ||
        appliedFilters.priceMaxMinor !== draftFilters.priceMaxMinor ||
        appliedFilters.priceCurrency !== draftFilters.priceCurrency
      );
    },

    // Check if range drafts have changes for specific attribute
    hasRangeDraftChanges: (attributeKey: string) => {
      const { appliedFilters, draftFilters } = get();
      const appliedValue = appliedFilters.specs?.[attributeKey];
      const draftValue = draftFilters.specs?.[attributeKey];
      return JSON.stringify(appliedValue) !== JSON.stringify(draftValue);
    },

    // Check if search draft has changes
    hasSearchDraftChanges: () => {
      const { appliedFilters, draftFilters } = get();
      return (
        (appliedFilters.search || "").trim() !==
        (draftFilters.search || "").trim()
      );
    },

    // === BACKEND CONVERSION ===

    // Convert filters for backend aggregation calls
    getBackendFilters: () => {
      const { appliedFilters } = get();
      const backendFilters: any = {};

      if (appliedFilters.categoryId) {
        backendFilters.categoryId = appliedFilters.categoryId;
      }

      // Handle location filter: province and city as top-level filters (new location JSONB structure)
      // Extract from specs.location if present, otherwise use top-level province
      const provinceValue = appliedFilters.specs?.location || appliedFilters.province;
      if (provinceValue) {
        backendFilters.province = provinceValue;
      }
      if (appliedFilters.city) {
        backendFilters.city = appliedFilters.city;
      }

      // Handle account type as top-level filter
      // Extract from specs.accountType if present, otherwise use top-level accountType
      const accountTypeValue = appliedFilters.specs?.accountType || appliedFilters.accountType;
      if (accountTypeValue) {
        backendFilters.accountType = accountTypeValue;
      }

      // Handle brandId and modelId (legacy top-level filters now moved to specs)
      if (appliedFilters.brandId) {
        if (!backendFilters.specs) backendFilters.specs = {};
        backendFilters.specs.brandId = appliedFilters.brandId;
      }
      if (appliedFilters.modelId) {
        if (!backendFilters.specs) backendFilters.specs = {};
        backendFilters.specs.modelId = appliedFilters.modelId;
      }

      // Convert specs to backend format (exclude location since it's sent as top-level province)
      if (
        appliedFilters.specs &&
        Object.keys(appliedFilters.specs).length > 0
      ) {
        const specs: Record<string, any> = { ...backendFilters.specs };

        Object.entries(appliedFilters.specs).forEach(([key, value]) => {
          // Skip location and accountType - they're already handled as top-level filters
          if (key !== 'location' && key !== 'accountType') {
            specs[key] = value;
          }
        });

        if (Object.keys(specs).length > 0) {
          backendFilters.specs = specs;
        }
      }

      // console.log("🔍 getBackendFilters returning:", backendFilters);
      return backendFilters;
    },

    // Convert filters for listings store
    getStoreFilters: () => {
      const { appliedFilters } = get();
      const storeFilters: any = {};

      if (appliedFilters.categoryId) {
        storeFilters.categoryId = appliedFilters.categoryId;
      }

      // Price filters
      if (appliedFilters.priceMinMinor) {
        storeFilters.priceMinMinor = appliedFilters.priceMinMinor;
      }
      if (appliedFilters.priceMaxMinor) {
        storeFilters.priceMaxMinor = appliedFilters.priceMaxMinor;
      }
      if (appliedFilters.priceCurrency) {
        storeFilters.priceCurrency = appliedFilters.priceCurrency;
      }

      // Location filters (top-level for new JSONB structure)
      // Extract from specs.location if present, otherwise use top-level province
      const provinceValue = appliedFilters.specs?.location || appliedFilters.province;
      if (provinceValue) {
        storeFilters.province = provinceValue;
      }
      if (appliedFilters.city) {
        storeFilters.city = appliedFilters.city;
      }

      // Account type (top-level filter)
      // Extract from specs.accountType if present, otherwise use top-level accountType
      const accountTypeValue = appliedFilters.specs?.accountType || appliedFilters.accountType;
      if (accountTypeValue) {
        storeFilters.accountType = accountTypeValue;
      }

      // Brand/Model
      if (appliedFilters.brandId) {
        if (!storeFilters.specs) storeFilters.specs = {};
        storeFilters.specs.brandId = appliedFilters.brandId;
      }
      if (appliedFilters.modelId) {
        if (!storeFilters.specs) storeFilters.specs = {};
        storeFilters.specs.modelId = appliedFilters.modelId;
      }

      // Sort
      if (appliedFilters.sort) {
        storeFilters.sort = appliedFilters.sort;
      }

      // Convert specs (exclude location since it's sent as top-level province)
      if (
        appliedFilters.specs &&
        Object.keys(appliedFilters.specs).length > 0
      ) {
        const specs: Record<string, any> = { ...storeFilters.specs };

        Object.entries(appliedFilters.specs).forEach(([key, value]) => {
          // Skip location and accountType - they're already handled as top-level filters
          if (key !== 'location' && key !== 'accountType') {
            specs[key] = value;
          }
        });

        if (Object.keys(specs).length > 0) {
          storeFilters.specs = specs;
        }
      }

      // console.log("🔍 getStoreFilters returning:", storeFilters);
      return storeFilters;
    },

    // Convert to URL search parameters
    getUrlParams: () => {
      const { appliedFilters } = get();
      const params = new URLSearchParams();

      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (appliedFilters.province)
        params.set("location", appliedFilters.province);
      if (appliedFilters.city) params.set("city", appliedFilters.city);
      if (appliedFilters.priceMinMinor)
        params.set("minPrice", (appliedFilters.priceMinMinor / 100).toString());
      if (appliedFilters.priceMaxMinor)
        params.set("maxPrice", (appliedFilters.priceMaxMinor / 100).toString());
      if (appliedFilters.page && appliedFilters.page > 1)
        params.set("page", appliedFilters.page.toString());

      // Add spec filters to URL
      if (appliedFilters.specs) {
        Object.entries(appliedFilters.specs).forEach(([key, value]) => {
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
      const newFilters: SearchFilters = { ...initialFilters };

      if (searchParams.get("search"))
        newFilters.search = searchParams.get("search")!;
      if (searchParams.get("location"))
        newFilters.province = searchParams.get("location")!;
      if (searchParams.get("province"))
        newFilters.province = searchParams.get("province")!;
      if (searchParams.get("city")) newFilters.city = searchParams.get("city")!;
      if (searchParams.get("minPrice"))
        newFilters.priceMinMinor =
          parseFloat(searchParams.get("minPrice")!) * 100;
      if (searchParams.get("maxPrice"))
        newFilters.priceMaxMinor =
          parseFloat(searchParams.get("maxPrice")!) * 100;
      if (searchParams.get("page"))
        newFilters.page = parseInt(searchParams.get("page")!);

      set({
        appliedFilters: newFilters,
        draftFilters: { ...newFilters },
      });
    },

    // Check if any filters are active
    hasActiveFilters: () => {
      const { appliedFilters } = get();
      return Object.keys(appliedFilters).some(
        (key) =>
          key !== "sort" &&
          key !== "page" &&
          key !== "limit" &&
          appliedFilters[key as keyof SearchFilters]
      );
    },

    // Reset to default values
    resetToDefaults: () => {
      set({
        appliedFilters: initialFilters,
        draftFilters: initialFilters,
      });
    },
  }))
);

// Selectors for easy component access
export const useAppliedFilters = () =>
  useSearchStore((state) => state.appliedFilters);
export const useDraftFilters = () =>
  useSearchStore((state) => state.draftFilters);
export const useSearchFiltersLoading = () =>
  useSearchStore((state) => state.isApplying);
export const useHasActiveFilters = () =>
  useSearchStore((state) => state.hasActiveFilters());
export const useHasDraftChanges = () =>
  useSearchStore((state) => state.hasDraftChanges());

// Legacy selector for compatibility
export const useActiveFilters = () =>
  useSearchStore((state) => state.appliedFilters);
