import { create } from "zustand";
import type { Attribute, AttributeOption } from "../../types/listing";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import {
  GET_CATEGORY_ATTRIBUTES_QUERY,
  GET_LISTING_AGGREGATIONS_QUERY,
} from "./filtersStore.gql";

// Filter-specific types
interface AttributeOptionWithCount extends AttributeOption {
  count?: number; // Number of listings with this option
}

interface AttributeWithProcessedOptions extends Attribute {
  processedOptions?: AttributeOptionWithCount[]; // Processed options with counts for filtering
}

// Dynamic aggregation result types (from backend)
interface DynamicFilterOption {
  value: string; // Brand name, model name, etc.
  count: number; // Number of listings
}

// Cache structure for filter data per category
interface CategoryCache {
  baseAttributes: Attribute[]; // Original attributes structure (cached)
  cachedAt: number; // Timestamp for cache expiration
}

// Store state interface
interface FiltersState {
  // Core filter data - ALL filters are handled dynamically through attributes
  attributes: AttributeWithProcessedOptions[];
  // Legacy fields removed - everything is now in attributes array

  // Total results count from backend
  totalResults: number;

  // Cache management
  categoryCache: Record<string, CategoryCache>; // Cache per category slug
  currentCategorySlug: string | null;
  lastFetchKey: string | null;

  // Loading states
  isLoading: boolean; // Full initial load
  isLoadingCounts: boolean; // Only count updates during filtering
  error: string | null;
}

// Store actions interface
interface FiltersActions {
  // State management
  setLoading: (loading: boolean) => void;
  setLoadingCounts: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FiltersState>) => void;

  // Main data fetching
  fetchFilterData: (categorySlug: string, listingType?: string) => Promise<void>;
  // fetchCities removed - cities handled through unified attributes

  // SSR Hydration - populate store with server-fetched data (no API call)
  hydrateFromSSR: (
    categorySlug: string,
    attributes: Attribute[],
    totalResults: number
  ) => void;

  // Cascading filter support
  updateFiltersWithCascading: (
    categorySlug: string,
    appliedFilters: any
  ) => Promise<void>;

  // Cache management
  clearCacheForCategory: (categorySlug: string) => void;
  clearAllCache: () => void;

  // State management
  resetFilters: () => void;
}

type FiltersStore = FiltersState & FiltersActions;

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

// Initial state
const initialState: FiltersState = {
  attributes: [],
  totalResults: 0,
  categoryCache: {},
  currentCategorySlug: null,
  lastFetchKey: null,
  isLoading: false,
  isLoadingCounts: false,
  error: null,
};

// GraphQL requests now use cachedGraphQLRequest for better performance

// Get listing aggregations for counts
async function getListingAggregations(
  categorySlug?: string,
  additionalFilter?: any
): Promise<{
  attributes: Record<string, Record<string, number>>;
  rawAggregations?: any; // Keep raw data for brandId/modelId
}> {
  const query = GET_LISTING_AGGREGATIONS_QUERY;

  const variables: any = {};
  if (categorySlug || additionalFilter) {
    variables.filter = {
      ...(categorySlug && { categoryId: categorySlug }),
      ...additionalFilter,
    };
  }

  const response = await cachedGraphQLRequest(query, variables, {
    ttl: 2 * 60 * 1000,
  }); // Cache aggregations for 2 minutes
  const aggregations = response.listingsAggregations;

  if (!aggregations) {
    console.warn("No aggregations returned from backend");
    return { attributes: {} };
  }

  // console.log("✅ Backend aggregations working:", {
  //   totalResults: aggregations.totalResults,
  //   attributesFound: aggregations.attributes?.length || 0,
  // });

  // Transform attributes to the format we need (regular attributes only)
  const attributes: Record<string, Record<string, number>> = {};
  (aggregations.attributes || []).forEach((attr: any) => {
    attributes[attr.field] = {};
    (attr.options || []).forEach((option: any) => {
      // Always use option.key for consistency (English keys like "damascus", "dealer", etc.)
      // This matches with backendOption.key used in line 251
      const lookupKey = option.key || option.value;
      attributes[attr.field][lookupKey] = option.count;
    });
  });

  // Everything is now in attributes array - no separate extraction needed
  // All attributes (location, accountType, etc.) are processed uniformly
  (aggregations.attributes || []).forEach((attr: any) => {
    if (!attributes[attr.field]) {
      attributes[attr.field] = {};
      (attr.options || []).forEach((option: any) => {
        attributes[attr.field][option.key || option.value] = option.count;
      });
    }
  });

  // Add provinces aggregation as "location" attribute
  // Provinces come from JSONB location column, not from attributes table
  if (aggregations.provinces && aggregations.provinces.length > 0) {
    attributes["location"] = {};
    aggregations.provinces.forEach((province: any) => {
      attributes["location"][province.value] = province.count;
    });
  }

  // console.log(
  //   "🚀 Using optimized backend aggregations with direct field queries"
  // );

  // Return unified attributes structure
  return {
    attributes, // All filters including location, accountType, brands, models, and category attributes
    rawAggregations: aggregations, // Keep raw data for additional processing
  };
}

// Removed unused GraphQL queries - now using only aggregations for efficiency

// Get all filter data for a category
async function getAllFilterData(categorySlug: string, listingType?: string) {
  // Note: Categories are now hydrated in the store from root layout
  // No need to fetch here - we use categorySlug directly in queries

  // Use GraphQL to get dynamic category attributes directly by slug with caching
  const data = await cachedGraphQLRequest(
    GET_CATEGORY_ATTRIBUTES_QUERY,
    {
      categorySlug,
    },
    { ttl: 5 * 60 * 1000 }
  ); // Cache for 5 minutes

  const rawAttributes: Attribute[] = data.getAttributesByCategorySlug || [];

  // All specs (including brandId, modelId) are handled through dynamic attributes with counts from aggregations

  // Get aggregations from backend (excludes zero counts)
  // Include listingType filter if provided
  const aggregationFilter = listingType ? { listingType } : undefined;
  const aggregations = await getListingAggregations(categorySlug, aggregationFilter);

  // Process dynamic attributes and add counts from aggregations
  const attributesWithCounts: AttributeWithProcessedOptions[] =
    rawAttributes.map((attr) => {
      let processedOptions: AttributeOptionWithCount[] = [];

      // Special handling for brandId, modelId, and variantId - create options from aggregation data
      if (attr.key === "brandId" || attr.key === "modelId" || attr.key === "variantId") {
        // For brandId/modelId/variantId, get options directly from raw aggregation since seeder has empty options
        const rawAttributeData = aggregations.rawAggregations?.attributes?.find(
          (a: any) => a.field === attr.key
        );
        if (rawAttributeData?.options) {
          processedOptions = rawAttributeData.options.map((option: any) => ({
            id: option.key || option.value, // Use key (UUID) as id, fallback to value
            key: option.key || option.value, // Use key (UUID) for filtering
            value: option.value, // Use readable name for display
            sortOrder: 0,
            isActive: true,
            count: option.count,
            // For variants: include model grouping for optgroup display
            ...(attr.key === "variantId" && option.modelId && {
              groupKey: option.modelId,
              groupLabel: option.modelName,
            }),
            // For models: include hasVariants flag for non-clickable header display
            ...(attr.key === "modelId" && option.hasVariants !== undefined && {
              hasVariants: option.hasVariants,
            }),
          }));
        } else {
          processedOptions = [];
        }
      } else {
        // Regular attributes - use existing options with counts from aggregation
        // Use backendOption.key (English key like "damascus") to match aggregation keys
        processedOptions = (attr.options || []).map((backendOption) => ({
          ...backendOption, // Include all required fields from AttributeOption
          count:
            aggregations.attributes?.[attr.key]?.[backendOption.key] || 0, // Add count from backend aggregation, fallback to 0
        }));
      }

      return {
        ...attr,
        processedOptions,
      };
    });

  // All specs (including brandId, modelId) are handled through the dynamic attributes system
  // No separate brand/model arrays needed - everything is in attributes with counts

  return {
    attributes: attributesWithCounts,
    totalResults: aggregations.rawAggregations?.totalResults || 0, // Include totalResults from rawAggregations
  };
}

// Models are now handled through dynamic attributes - no separate function needed

// Create the store with standard Zustand pattern
export const useFiltersStore = create<FiltersStore>((set, get) => ({
  ...initialState,

  // State management actions
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setLoadingCounts: (isLoadingCounts: boolean) => set({ isLoadingCounts }),
  setError: (error: string | null) => set({ error }),
  setFilters: (filters: Partial<FiltersState>) => set(filters),

  // Main fetch function - gets attributes and their counts
  fetchFilterData: async (categorySlug: string, listingType?: string) => {
    const { categoryCache } = get();

    // Check if we have cached data for this category
    const cachedData = categoryCache[categorySlug];
    const now = Date.now();

    // Use cache if valid and not expired
    if (cachedData && now - cachedData.cachedAt < CACHE_EXPIRATION_MS) {

      // Get fresh counts for the cached structure
      // Include listingType filter if provided
      const aggregationFilter = listingType ? { listingType } : undefined;
      const aggregations = await getListingAggregations(categorySlug, aggregationFilter);

      // Process cached attributes with fresh counts
      const attributesWithCounts: AttributeWithProcessedOptions[] =
        cachedData.baseAttributes.map((attr) => {
          let processedOptions: AttributeOptionWithCount[] = [];

          // Special handling for brandId, modelId, and variantId - create options from aggregation data
          if (attr.key === "brandId" || attr.key === "modelId" || attr.key === "variantId") {
            const rawAttributeData =
              aggregations.rawAggregations?.attributes?.find(
                (a: any) => a.field === attr.key
              );
            if (rawAttributeData?.options) {
              processedOptions = rawAttributeData.options.map(
                (option: any) => ({
                  id: option.key || option.value,
                  key: option.key || option.value,
                  value: option.value,
                  sortOrder: 0,
                  isActive: true,
                  count: option.count,
                  // For variants: include model grouping for optgroup display
                  ...(attr.key === "variantId" && option.modelId && {
                    groupKey: option.modelId,
                    groupLabel: option.modelName,
                  }),
                  // For models: include hasVariants flag for non-clickable header display
                  ...(attr.key === "modelId" && option.hasVariants !== undefined && {
                    hasVariants: option.hasVariants,
                  }),
                })
              );
            } else {
              processedOptions = [];
            }
          } else {
            // Regular attributes - use existing options with fresh counts
            // Use backendOption.key (English key like "damascus") to match aggregation keys
            processedOptions = (attr.options || []).map((backendOption) => ({
              ...backendOption,
              count:
                aggregations.attributes?.[attr.key]?.[backendOption.key] || 0,
            }));
          }

          return {
            ...attr,
            processedOptions,
          };
        });

      set({
        attributes: attributesWithCounts,
        totalResults: aggregations.rawAggregations?.totalResults || 0, // Store totalResults from rawAggregations
        currentCategorySlug: categorySlug,
        isLoading: false,
        error: null,
      });
      return;
    }

    // No valid cache - do full fetch
    // console.log(`🔄 Fetching fresh filter data for category: ${categorySlug}`);
    set({ isLoading: true, error: null });

    try {
      // Get all filter data with counts in one API call
      const filterData = await getAllFilterData(categorySlug, listingType);

      // Cache the base attributes structure (without counts)
      const baseAttributes: Attribute[] = filterData.attributes.map((attr) => ({
        id: attr.id,
        key: attr.key,
        name: attr.name,
        type: attr.type,
        validation: attr.validation,
        sortOrder: attr.sortOrder,
        group: attr.group,
        groupOrder: attr.groupOrder,
        isActive: attr.isActive,
        config: attr.config || null,
        showInGrid: attr.showInGrid,
        showInList: attr.showInList,
        showInDetail: attr.showInDetail,
        showInFilter: attr.showInFilter,
        options: attr.options || [],
      }));

      // Update cache
      const newCache = {
        ...get().categoryCache,
        [categorySlug]: {
          baseAttributes,
          cachedAt: now,
        },
      };

      // console.log("🏛️ All filters handled through unified attributes array");
      set({
        attributes: filterData.attributes,
        totalResults: filterData.totalResults || 0, // Store totalResults from getAllFilterData
        currentCategorySlug: categorySlug,
        categoryCache: newCache,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message || "Failed to load filters",
      });
    }
  },

  // Models are handled through dynamic attributes - no separate fetch needed

  // Cities are now handled through unified attributes - no separate fetch needed

  // SSR Hydration - populate store with server-fetched data (no API call needed!)
  // This is called when page is rendered with SSR data, skipping the initial fetch
  hydrateFromSSR: (
    categorySlug: string,
    attributes: Attribute[],
    totalResults: number
  ) => {
    const now = Date.now();

    // Extract base attributes for cache (without processedOptions counts)
    const baseAttributes: Attribute[] = attributes.map((attr) => ({
      id: attr.id,
      key: attr.key,
      name: attr.name,
      type: attr.type,
      validation: attr.validation,
      sortOrder: attr.sortOrder,
      group: attr.group,
      groupOrder: attr.groupOrder,
      isActive: attr.isActive,
      config: attr.config || null,
      showInGrid: attr.showInGrid,
      showInList: attr.showInList,
      showInDetail: attr.showInDetail,
      showInFilter: attr.showInFilter,
      options: attr.options || [],
    }));

    // Update cache with SSR data
    const newCache = {
      ...get().categoryCache,
      [categorySlug]: {
        baseAttributes,
        cachedAt: now,
      },
    };

    // Set store state immediately with SSR data - no loading state needed!
    set({
      attributes: attributes as AttributeWithProcessedOptions[],
      totalResults,
      currentCategorySlug: categorySlug,
      categoryCache: newCache,
      isLoading: false,
      isLoadingCounts: false,
      error: null,
    });
  },

  // Update filters with cascading logic (when user selects a brand, update other filters)
  updateFiltersWithCascading: async (
    categorySlug: string,
    appliedFilters: any
  ) => {
    // Use separate loading state for count updates (not full reload)
    set({ isLoadingCounts: true, error: null });

    try {
      // Get fresh attribute definitions (unchanged)

      const data = await cachedGraphQLRequest(
        GET_CATEGORY_ATTRIBUTES_QUERY,
        {
          categorySlug,
        },
        { ttl: 5 * 60 * 1000 }
      ); // Cache category attributes for 5 minutes
      const rawAttributes: Attribute[] = data.getAttributesByCategorySlug || [];

      // 🎯 KEY CASCADING LOGIC: Get aggregations with applied filters
      const cascadingAggregations = await getListingAggregations(
        categorySlug,
        appliedFilters
      );
      // Update attributes with cascading counts
      const attributesWithCascadingCounts: AttributeWithProcessedOptions[] =
        rawAttributes.map((attr) => {
          let processedOptions: AttributeOptionWithCount[] = [];

          // Special handling for brandId, modelId, and variantId - create options from cascading aggregation data
          if (attr.key === "brandId" || attr.key === "modelId" || attr.key === "variantId") {
            // For brandId/modelId/variantId, get options directly from raw cascading aggregation
            const rawAttributeData =
              cascadingAggregations.rawAggregations?.attributes?.find(
                (a: any) => a.field === attr.key
              );
            if (rawAttributeData?.options) {
              processedOptions = rawAttributeData.options.map(
                (option: any) => ({
                  id: option.key || option.value, // Use key (UUID) as id, fallback to value
                  key: option.key || option.value, // Use key (UUID) for filtering
                  value: option.value, // Use readable name for display
                  sortOrder: 0,
                  isActive: true,
                  count: option.count,
                  // For variants: include model grouping for optgroup display
                  ...(attr.key === "variantId" && option.modelId && {
                    groupKey: option.modelId,
                    groupLabel: option.modelName,
                  }),
                  // For models: include hasVariants flag for non-clickable header display
                  ...(attr.key === "modelId" && option.hasVariants !== undefined && {
                    hasVariants: option.hasVariants,
                  }),
                })
              );
            } else {
              processedOptions = [];
            }
          } else {
            // Regular attributes - use existing options with counts from cascading aggregation
            // Use backendOption.key (English key like "damascus") to match aggregation keys
            processedOptions = (attr.options || []).map((backendOption) => ({
              ...backendOption, // Include all required fields from AttributeOption
              count:
                cascadingAggregations.attributes?.[attr.key]?.[
                  backendOption.key
                ] || 0,
            }));
          }

          // Show all options (including those with count 0) for better UX
          // Users can still select options with 0 count, which will update the filter
          const filteredOptions = processedOptions;

          return {
            ...attr,
            processedOptions: filteredOptions,
          };
        });

      // All specs (including brands/models) are handled through attributes - no separate arrays

      set({
        attributes: attributesWithCascadingCounts,
        totalResults: cascadingAggregations.rawAggregations?.totalResults || 0,
        currentCategorySlug: categorySlug,
        isLoadingCounts: false,
        error: null,
      });

    } catch (error) {
      set({
        isLoadingCounts: false,
        error: (error as Error).message || "Failed to update cascading filters",
      });
    }
  },

  // Cache management methods
  clearCacheForCategory: (categorySlug: string) => {
    const { categoryCache } = get();
    const newCache = { ...categoryCache };
    delete newCache[categorySlug];
    set({ categoryCache: newCache });
  },

  clearAllCache: () => {
    set({ categoryCache: {} });
  },

  // Reset filters to initial state
  resetFilters: () => {
    set(initialState);
  },
}));

// Selectors for easy component access - simplified for unified attributes
export const useFilterAttributes = () =>
  useFiltersStore((state) => state.attributes);
export const useFilterTotalResults = () =>
  useFiltersStore((state) => state.totalResults);
export const useFiltersLoading = () =>
  useFiltersStore((state) => state.isLoading);
export const useFiltersCountsLoading = () =>
  useFiltersStore((state) => state.isLoadingCounts);
export const useFiltersError = () => useFiltersStore((state) => state.error);

// Helper selectors for common attributes (extracted from unified attributes array)
export const useLocationAttribute = () =>
  useFiltersStore((state) =>
    state.attributes.find((attr) => attr.key === "location")
  );
export const useAccountTypeAttribute = () =>
  useFiltersStore((state) =>
    state.attributes.find((attr) => attr.key === "accountType")
  );
