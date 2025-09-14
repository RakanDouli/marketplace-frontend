import { create } from "zustand";
import type { Attribute, AttributeOption } from "../types/listing";

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
  // Core filter data - ALL specs are handled dynamically through attributes
  attributes: AttributeWithProcessedOptions[];
  // Only non-spec filters
  sellerTypes: DynamicFilterOption[];
  provinces: string[];
  cities: string[];

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

  // Main data fetching
  fetchFilterData: (categorySlug: string) => Promise<void>;
  fetchCities: (province: string) => Promise<void>;

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
  sellerTypes: [],
  provinces: [],
  cities: [],
  categoryCache: {},
  currentCategorySlug: null,
  lastFetchKey: null,
  isLoading: false,
  isLoadingCounts: false,
  error: null,
};

// GraphQL client function
async function graphqlRequest(
  query: string,
  variables: any = {}
): Promise<any> {
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

// Get listing aggregations for counts
async function getListingAggregations(
  categorySlug?: string,
  additionalFilter?: any
): Promise<{
  attributes: Record<string, Record<string, number>>;
  rawAggregations?: any; // Keep raw data for brandId/modelId
}> {
  console.log(
    "🎯 Getting backend aggregations for:",
    categorySlug,
    additionalFilter
  );

  const query = `
    query GetListingAggregations($filter: ListingFilterInput) {
      listingsAggregations(filter: $filter) {
        totalResults
        attributes {
          field
          totalCount
          options {
            value
            count
            key
          }
        }
      }
    }
  `;

  const variables: any = {};
  if (categorySlug || additionalFilter) {
    variables.filter = {
      ...(categorySlug && { categoryId: categorySlug }),
      ...additionalFilter,
    };
  }

  const response = await graphqlRequest(query, variables);
  const aggregations = response.listingsAggregations;

  if (!aggregations) {
    console.warn("No aggregations returned from backend");
    return { attributes: {} };
  }

  console.log("✅ Backend aggregations working:", {
    totalResults: aggregations.totalResults,
    attributesFound: aggregations.attributes?.length || 0,
  });

  // Transform attributes to the format we need (regular attributes only)
  const attributes: Record<string, Record<string, number>> = {};
  (aggregations.attributes || []).forEach((attr: any) => {
    attributes[attr.field] = {};
    (attr.options || []).forEach((option: any) => {
      // For brandId/modelId, use key field; for others, use value field
      const lookupKey = (attr.field === 'brandId' || attr.field === 'modelId') 
        ? option.key || option.value 
        : option.value;
      attributes[attr.field][lookupKey] = option.count;
    });
  });

  // Return only attributes - brands/models are now regular specs
  return { 
    attributes, // All specs including brandId/modelId are now in attributes
    rawAggregations: aggregations // Keep raw data for brandId/modelId processing
  };
}

// Removed unused GraphQL queries - now using only aggregations for efficiency

// Get all filter data for a category
async function getAllFilterData(categorySlug: string) {
  // GraphQL query to get dynamic category attributes
  const GET_CATEGORY_ATTRIBUTES_QUERY = `
    query GetAttributesByCategorySlug($categorySlug: String!) {
      getAttributesByCategorySlug(categorySlug: $categorySlug) {
        id
        key
        name
        type
        validation
        sortOrder
        group
        isActive
        options {
          id
          key
          value
          sortOrder
          isActive
        }
      }
    }
  `;

  // First, get the category by slug to get the categoryId
  const CATEGORIES_QUERY = `
    query GetCategories {
      categories {
        id
        name
        slug
        isActive
      }
    }
  `;

  const categoriesData = await graphqlRequest(CATEGORIES_QUERY);
  const category = (categoriesData.categories || []).find(
    (cat: any) => cat.slug === categorySlug
  );
  const categoryId = category?.id;

  // Use GraphQL to get dynamic category attributes directly by slug
  const data = await graphqlRequest(GET_CATEGORY_ATTRIBUTES_QUERY, {
    categorySlug,
  });

  const rawAttributes: Attribute[] = data.getAttributesByCategorySlug || [];

  // All specs (including brandId, modelId) are handled through dynamic attributes with counts from aggregations

  // Get aggregations from backend (excludes zero counts)
  const aggregations = await getListingAggregations(categorySlug);

  // Process dynamic attributes and add counts from aggregations
  const attributesWithCounts: AttributeWithProcessedOptions[] =
    rawAttributes.map((attr) => {
      let processedOptions: AttributeOptionWithCount[] = [];

      // Special handling for brandId and modelId - create options from aggregation data
      if (attr.key === 'brandId' || attr.key === 'modelId') {
        // For brandId/modelId, get options directly from raw aggregation since seeder has empty options
        const rawAttributeData = aggregations.rawAggregations?.attributes?.find((a: any) => a.field === attr.key);
        if (rawAttributeData?.options) {
          processedOptions = rawAttributeData.options.map((option: any) => ({
            id: option.key || option.value, // Use key (UUID) as id, fallback to value
            key: option.key || option.value, // Use key (UUID) for filtering
            value: option.value, // Use readable name for display
            sortOrder: 0,
            isActive: true,
            count: option.count,
          }));
        } else {
          processedOptions = [];
        }
      } else {
        // Regular attributes - use existing options with counts from aggregation
        processedOptions = (attr.options || []).map((backendOption) => ({
          ...backendOption, // Include all required fields from AttributeOption
          count:
            aggregations.attributes?.[attr.key]?.[backendOption.value] || 0, // Add count from backend aggregation, fallback to 0
        }));
      }
      
      console.log(`🔍 Processing attribute: ${attr.key}`, {
        optionsCount: processedOptions.length,
        hasAggregationData: !!aggregations.attributes?.[attr.key],
        sampleOptions: processedOptions.slice(0, 2)
      });

      return {
        ...attr,
        processedOptions,
      };
    });

  // All specs (including brandId, modelId) are handled through the dynamic attributes system
  // No separate brand/model arrays needed - everything is in attributes with counts

  return {
    attributes: attributesWithCounts,
    sellerTypes: [], // Will be populated from aggregations.sellerTypes
    provinces: [], // Will be fetched separately if needed
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

  // Main fetch function - gets attributes and their counts
  fetchFilterData: async (categorySlug: string) => {
    const { categoryCache } = get();
    
    // Check if we have cached data for this category
    const cachedData = categoryCache[categorySlug];
    const now = Date.now();
    
    // Use cache if valid and not expired
    if (cachedData && (now - cachedData.cachedAt) < CACHE_EXPIRATION_MS) {
      console.log(`🎯 Using cached filter data for category: ${categorySlug}`);
      
      // Get fresh counts for the cached structure
      const aggregations = await getListingAggregations(categorySlug);
      
      // Process cached attributes with fresh counts
      const attributesWithCounts: AttributeWithProcessedOptions[] =
        cachedData.baseAttributes.map((attr) => {
          let processedOptions: AttributeOptionWithCount[] = [];

          // Special handling for brandId and modelId - create options from aggregation data
          if (attr.key === 'brandId' || attr.key === 'modelId') {
            const rawAttributeData = aggregations.rawAggregations?.attributes?.find((a: any) => a.field === attr.key);
            if (rawAttributeData?.options) {
              processedOptions = rawAttributeData.options.map((option: any) => ({
                id: option.key || option.value,
                key: option.key || option.value,
                value: option.value,
                sortOrder: 0,
                isActive: true,
                count: option.count,
              }));
            } else {
              processedOptions = [];
            }
          } else {
            // Regular attributes - use existing options with fresh counts
            processedOptions = (attr.options || []).map((backendOption) => ({
              ...backendOption,
              count: aggregations.attributes?.[attr.key]?.[backendOption.value] || 0,
            }));
          }

          return {
            ...attr,
            processedOptions,
          };
        });

      set({
        attributes: attributesWithCounts,
        currentCategorySlug: categorySlug,
        isLoading: false,
        error: null,
      });
      return;
    }

    // No valid cache - do full fetch
    console.log(`🔄 Fetching fresh filter data for category: ${categorySlug}`);
    set({ isLoading: true, error: null });

    try {
      // Get all filter data with counts in one API call
      const filterData = await getAllFilterData(categorySlug);

      // Cache the base attributes structure (without counts)
      const baseAttributes: Attribute[] = filterData.attributes.map(attr => ({
        id: attr.id,
        key: attr.key,
        name: attr.name,
        type: attr.type,
        validation: attr.validation,
        sortOrder: attr.sortOrder,
        group: attr.group,
        isActive: attr.isActive,
        options: attr.options || []
      }));

      // Update cache
      const newCache = {
        ...get().categoryCache,
        [categorySlug]: {
          baseAttributes,
          cachedAt: now,
        },
      };

      set({
        attributes: filterData.attributes,
        provinces: filterData.provinces,
        currentCategorySlug: categorySlug,
        categoryCache: newCache,
        cities: [],
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

  // Fetch cities for selected province - placeholder for now
  fetchCities: async (province: string) => {
    set({ isLoading: true, error: null });

    try {
      // For now, return empty array since we don't have city data in the current backend
      const cities: string[] = [];
      set({ cities, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message || "Failed to load cities",
      });
    }
  },

  // Update filters with cascading logic (when user selects a brand, update other filters)
  updateFiltersWithCascading: async (
    categorySlug: string,
    appliedFilters: any
  ) => {
    console.log(
      "🔄 Updating cascading filters for:",
      categorySlug,
      appliedFilters
    );

    // Use separate loading state for count updates (not full reload)
    set({ isLoadingCounts: true, error: null });

    try {
      // Get fresh attribute definitions (unchanged)
      const GET_CATEGORY_ATTRIBUTES_QUERY = `
        query GetAttributesByCategorySlug($categorySlug: String!) {
          getAttributesByCategorySlug(categorySlug: $categorySlug) {
            id
            key
            name
            type
            validation
            sortOrder
            group
            isActive
            options {
              id
              key
              value
              sortOrder
              isActive
            }
          }
        }
      `;

      const data = await graphqlRequest(GET_CATEGORY_ATTRIBUTES_QUERY, {
        categorySlug,
      });
      const rawAttributes: Attribute[] = data.getAttributesByCategorySlug || [];

      // 🎯 KEY CASCADING LOGIC: Get aggregations with applied filters
      const cascadingAggregations = await getListingAggregations(
        categorySlug,
        appliedFilters
      );
      console.log("🎯 Cascading aggregations received:", {
        totalResults: cascadingAggregations
          ? Object.keys(cascadingAggregations.attributes).length
          : 0,
        sampleAttributes: Object.keys(
          cascadingAggregations?.attributes || {}
        ).slice(0, 3),
        attributeKeys: Object.keys(cascadingAggregations?.attributes || {}),
        sampleAttributeData: Object.entries(
          cascadingAggregations?.attributes || {}
        ).slice(0, 2),
      });

      // Update attributes with cascading counts
      const attributesWithCascadingCounts: AttributeWithProcessedOptions[] =
        rawAttributes.map((attr) => {
          let processedOptions: AttributeOptionWithCount[] = [];

          // Special handling for brandId and modelId - create options from cascading aggregation data
          if (attr.key === 'brandId' || attr.key === 'modelId') {
            // For brandId/modelId, get options directly from raw cascading aggregation
            const rawAttributeData = cascadingAggregations.rawAggregations?.attributes?.find((a: any) => a.field === attr.key);
            if (rawAttributeData?.options) {
              processedOptions = rawAttributeData.options.map((option: any) => ({
                id: option.key || option.value, // Use key (UUID) as id, fallback to value
                key: option.key || option.value, // Use key (UUID) for filtering
                value: option.value, // Use readable name for display
                sortOrder: 0,
                isActive: true,
                count: option.count,
              }));
            } else {
              processedOptions = [];
            }
          } else {
            // Regular attributes - use existing options with counts from cascading aggregation
            processedOptions = (attr.options || []).map((backendOption) => ({
              ...backendOption, // Include all required fields from AttributeOption
              count:
                cascadingAggregations.attributes?.[attr.key]?.[
                  backendOption.value
                ] || 0,
            }));
          }
          
          console.log(`🔄 Cascading attribute: ${attr.key}`, {
            optionsCount: processedOptions.length,
            hasAggregationData: !!cascadingAggregations.attributes?.[attr.key],
            sampleOptions: processedOptions.slice(0, 2)
          });

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
        currentCategorySlug: categorySlug,
        cities: [],
        isLoadingCounts: false,
        error: null,
      });

      console.log("✅ Cascading filters updated!", {
        attributesWithOptions: attributesWithCascadingCounts.filter(
          (a) => a.processedOptions && a.processedOptions.length > 0
        ).length,
        totalAttributes: attributesWithCascadingCounts.length,
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
    console.log(`🗑️ Cleared cache for category: ${categorySlug}`);
  },

  clearAllCache: () => {
    set({ categoryCache: {} });
    console.log("🗑️ Cleared all filter cache");
  },

  // Reset filters to initial state
  resetFilters: () => {
    set(initialState);
  },
}));

// Selectors for easy component access
export const useFilterAttributes = () =>
  useFiltersStore((state) => state.attributes);
export const useFilterProvinces = () =>
  useFiltersStore((state) => state.provinces);
export const useFilterCities = () => useFiltersStore((state) => state.cities);
export const useFiltersLoading = () =>
  useFiltersStore((state) => state.isLoading);
export const useFiltersCountsLoading = () =>
  useFiltersStore((state) => state.isLoadingCounts);
export const useFiltersError = () => useFiltersStore((state) => state.error);
