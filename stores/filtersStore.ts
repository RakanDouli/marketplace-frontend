import { create } from 'zustand';
import { createAsyncStore, BaseStore } from './base/createAsyncStore';
import { BaseStoreState } from './base/types';

// Types for filter data
interface AttributeOption {
  id: string;
  key: string;
  value: string; // Arabic value
  sortOrder: number;
  isActive: boolean;
}

interface Attribute {
  id: string;
  key: string;
  name: string; // Arabic name
  type: 'selector' | 'multi_selector' | 'range' | 'currency' | 'text' | 'textarea' | 'number' | 'date_range' | 'boolean';
  validation: 'required' | 'optional';
  sortOrder: number;
  group: string | null;
  isActive: boolean;
  options: AttributeOption[];
  // Processed options with counts for filtering
  processedOptions?: AttributeOptionWithCount[];
}

interface AttributeOptionWithCount {
  key: string;
  value: string; // Arabic value
  sortOrder?: number;
  count?: number; // Number of listings with this option
}

interface Brand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
  count?: number;
}

interface Model {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
  count?: number;
}

// Store state interface
interface FiltersState extends BaseStoreState {
  // Core filter data
  attributes: Attribute[];
  brands: Brand[];
  models: Model[];
  provinces: string[];
  cities: string[];
  
  // Cache management
  currentCategorySlug: string | null;
  lastFetchKey: string | null;
}

// Store actions interface
interface FiltersActions {
  // Main data fetching
  fetchFilterData: (categorySlug: string) => Promise<void>;
  fetchModels: (brandName: string) => Promise<void>;
  fetchCities: (province: string) => Promise<void>;
  
  // State management
  resetFilters: () => void;
}

type FiltersStore = FiltersState & FiltersActions & BaseStore;

// Initial state
const initialState: Omit<FiltersState, keyof BaseStoreState> = {
  attributes: [],
  brands: [],
  models: [],
  provinces: [],
  cities: [],
  currentCategorySlug: null,
  lastFetchKey: null,
};

// GraphQL client function
async function graphqlRequest(query: string, variables: any = {}): Promise<any> {
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

// Get listing aggregations for counts
async function getListingAggregations(categorySlug?: string, additionalFilter?: any): Promise<{
  attributes: Record<string, Record<string, number>>;
  brands: Record<string, number>;
  models: Record<string, number>;
}> {
  try {
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
            }
          }
          brands {
            value
            count
          }
          models {
            value
            count
          }
        }
      }
    `;

    const variables: any = {};
    if (categorySlug || additionalFilter) {
      variables.filter = {
        ...(categorySlug && { category: categorySlug.toUpperCase() }),
        ...additionalFilter
      };
    }

    const response = await graphqlRequest(query, variables);
    const aggregations = response.listingsAggregations;

    if (!aggregations) {
      return { attributes: {}, brands: {}, models: {} };
    }

    // Transform attributes to the format we need
    const attributes: Record<string, Record<string, number>> = {};
    aggregations.attributes.forEach((attr: any) => {
      attributes[attr.field] = {};
      attr.options.forEach((option: any) => {
        attributes[attr.field][option.value] = option.count;
      });
    });

    // Transform brands
    const brands: Record<string, number> = {};
    (aggregations.brands || []).forEach((brand: any) => {
      brands[brand.value] = brand.count;
    });

    // Transform models
    const models: Record<string, number> = {};
    (aggregations.models || []).forEach((model: any) => {
      models[model.value] = model.count;
    });

    return { attributes, brands, models };
  } catch (error) {
    console.warn('Failed to get listing aggregations (filter counts disabled):', error.message);
    return { attributes: {}, brands: {}, models: {} };
  }
}

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

  // Use GraphQL to get dynamic category attributes directly by slug
  const data = await graphqlRequest(GET_CATEGORY_ATTRIBUTES_QUERY, { categorySlug });
  
  const rawAttributes: Attribute[] = data.getAttributesByCategorySlug || [];

  // Get aggregations from backend (excludes zero counts)
  const aggregations = await getListingAggregations(categorySlug);

  // Process dynamic attributes and add counts from aggregations
  const attributesWithCounts: Attribute[] = rawAttributes.map(attr => {
    // Convert backend options to processed options with counts
    const processedOptions: AttributeOptionWithCount[] = (attr.options || []).map((backendOption) => ({
      key: backendOption.key, // Use backend key directly
      value: backendOption.value, // Arabic value from backend
      sortOrder: backendOption.sortOrder,
      count: aggregations.attributes[attr.key]?.[backendOption.value] || 0 // Add count from backend aggregation
    }));

    return {
      ...attr,
      processedOptions
    };
  });

  // Create brands directly from aggregations (backend now excludes zero counts)
  const brandsWithCounts: Brand[] = Object.entries(aggregations.brands || {}).map(([brandName, count]) => ({
    id: brandName, // Use brand name as ID for filtering purposes
    categoryId: categorySlug, // Use categorySlug
    name: brandName,
    slug: brandName.toLowerCase().replace(/\s+/g, '-'),
    status: 'active',
    isActive: true,
    count
  }));

  return {
    attributes: attributesWithCounts,
    brands: brandsWithCounts,
    provinces: [] // Will be fetched separately if needed
  };
}

// Get models with aggregation counts for filtering
async function getModelsWithCounts(categorySlug: string, brandName: string): Promise<Model[]> {
  try {
    // Get aggregations with brand filter applied
    const aggregations = await getListingAggregations(categorySlug, { make: brandName });
    
    // Create models directly from aggregations (backend excludes zero counts)
    const modelsWithCounts: Model[] = Object.entries(aggregations.models || {}).map(([modelName, count]) => ({
      id: modelName, // Use model name as ID for filtering purposes
      brandId: brandName,
      name: modelName,
      slug: modelName.toLowerCase().replace(/\s+/g, '-'),
      status: 'active',
      isActive: true,
      count
    }));

    return modelsWithCounts;
  } catch (error) {
    console.error('Failed to fetch models with counts:', error);
    return [];
  }
}

// Create the store with base async functionality
export const useFiltersStore = create<FiltersStore>()(
  createAsyncStore<FiltersStore>((set, get) => ({
    ...initialState,

    // Main fetch function - gets attributes, brands, and their counts
    fetchFilterData: async (categorySlug: string) => {
      const { lastFetchKey } = get();
      const cacheKey = `filters-${categorySlug}`;
      
      // Skip if same request is cached
      if (lastFetchKey === cacheKey) {
        return;
      }

      const result = await get().handleAsyncAction(
        async () => {
          // Get all filter data with counts in one API call
          const filterData = await getAllFilterData(categorySlug);
          
          set({
            attributes: filterData.attributes,
            brands: filterData.brands,
            provinces: filterData.provinces,
            currentCategorySlug: categorySlug,
            lastFetchKey: cacheKey,
            // Clear models when category changes
            models: [],
            cities: []
          });

          return filterData;
        },
        {
          operation: 'fetchFilterData',
          errorMessage: 'Failed to load filters',
          showNotification: false, // Don't show notification for background fetches
        }
      );

      return result;
    },

    // Fetch models for selected brand (for filtering with counts)
    fetchModels: async (brandName: string) => {
      const { currentCategorySlug } = get();
      
      if (!currentCategorySlug) {
        set({ models: [] });
        return;
      }

      await get().handleAsyncAction(
        async () => {
          const models = await getModelsWithCounts(currentCategorySlug, brandName);
          set({ models });
          return models;
        },
        {
          operation: 'fetchModels',
          errorMessage: 'Failed to load models',
          showNotification: false,
        }
      );
    },

    // Fetch cities for selected province - placeholder for now
    fetchCities: async (province: string) => {
      await get().handleAsyncAction(
        async () => {
          // For now, return empty array since we don't have city data in the current backend
          const cities: string[] = [];
          set({ cities });
          return cities;
        },
        {
          operation: 'fetchCities',
          errorMessage: 'Failed to load cities',
          showNotification: false,
        }
      );
    },

    // Reset filters to initial state
    resetFilters: () => {
      set(initialState);
    },
  }))
);

// Selectors for easy component access
export const useFilterAttributes = () => useFiltersStore((state) => state.attributes);
export const useFilterBrands = () => useFiltersStore((state) => state.brands);
export const useFilterModels = () => useFiltersStore((state) => state.models);
export const useFilterProvinces = () => useFiltersStore((state) => state.provinces);
export const useFilterCities = () => useFiltersStore((state) => state.cities);
export const useFiltersLoading = () => useFiltersStore((state) => state.isLoading);
export const useFiltersError = () => useFiltersStore((state) => state.error);
export const useFiltersOperations = () => useFiltersStore((state) => state.operations || {});