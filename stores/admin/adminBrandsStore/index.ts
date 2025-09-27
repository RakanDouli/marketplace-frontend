import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_CATEGORIES_QUERY,
  GET_BRANDS_QUERY,
  GET_BRANDS_COUNT_QUERY,
  GET_MODELS_QUERY,
  CREATE_BRAND_MUTATION,
  UPDATE_BRAND_MUTATION,
  DELETE_BRAND_MUTATION,
  CREATE_MODEL_MUTATION,
  UPDATE_MODEL_MUTATION,
  DELETE_MODEL_MUTATION,
  SYNC_CATALOG_MUTATION,
  ADD_BRAND_ALIAS_MUTATION,
  ADD_MODEL_ALIAS_MUTATION,
} from "./adminBrandsStore.gql";

interface Category {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

interface Brand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modelsCount?: number;
}

interface Model {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBrandInput {
  categoryId: string;
  name: string;
  externalId?: string;
  source?: string;
  status?: string;
  aliases?: string[];
}

interface UpdateBrandInput {
  id: string;
  name?: string;
  externalId?: string;
  source?: string;
  status?: string;
  aliases?: string[];
}

interface CreateModelInput {
  brandId: string;
  name: string;
  externalId?: string;
  source?: string;
  status?: string;
  aliases?: string[];
}

interface UpdateModelInput {
  id: string;
  brandId: string;
  name?: string;
  externalId?: string;
  source?: string;
  status?: string;
  aliases?: string[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SyncResult {
  brands: number;
  models: number;
}

interface BrandsStore {
  // Data
  categories: Category[];
  brands: Brand[];
  models: Model[];
  selectedBrand: Brand | null;
  selectedModel: Model | null;
  selectedCategoryId: string | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationData;

  // Cache management
  categoriesCache: { data: Category[]; timestamp: number } | null;
  brandsCache: Map<string, { data: Brand[]; timestamp: number }>;

  // Actions
  loadCategories: () => Promise<void>;
  loadBrands: (categoryId: string, query?: string, forceRefresh?: boolean, page?: number) => Promise<void>;
  loadModels: (brandId: string, query?: string, forceRefresh?: boolean) => Promise<void>;
  createBrand: (input: CreateBrandInput) => Promise<Brand>;
  updateBrand: (input: UpdateBrandInput) => Promise<Brand>;
  deleteBrand: (id: string) => Promise<boolean>;
  createModel: (input: CreateModelInput) => Promise<Model>;
  updateModel: (input: UpdateModelInput) => Promise<Model>;
  deleteModel: (id: string) => Promise<boolean>;
  syncCatalogNow: () => Promise<SyncResult>;
  addBrandAlias: (brandId: string, alias: string) => Promise<boolean>;
  addModelAlias: (modelId: string, alias: string) => Promise<boolean>;

  // Selection management
  setSelectedCategory: (categoryId: string | null) => void;
  setSelectedBrand: (brand: Brand | null) => void;
  setSelectedModel: (model: Model | null) => void;

  // Pagination navigation
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

// Helper function for API calls with authentication
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const { user } = useAdminAuthStore.getState();
  if (!user?.token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

// Cache utilities
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const isCacheValid = (timestamp: number) => Date.now() - timestamp < CACHE_TTL;

export const useBrandsStore = create<BrandsStore>((set, get) => ({
  // Initial state
  categories: [],
  brands: [],
  models: [],
  selectedBrand: null,
  selectedModel: null,
  selectedCategoryId: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Cache
  categoriesCache: null,
  brandsCache: new Map(),

  // Load categories
  loadCategories: async () => {
    const state = get();

    // Check cache first
    if (state.categoriesCache && isCacheValid(state.categoriesCache.timestamp)) {
      set({ categories: state.categoriesCache.data });
      return;
    }

    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_CATEGORIES_QUERY);
      const categories = data.categories || [];

      set({
        categories,
        loading: false,
        categoriesCache: { data: categories, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Load categories error:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'خطأ في تحميل الفئات'
      });
    }
  },

  // Load brands for a category
  loadBrands: async (categoryId: string, query = '', forceRefresh = false, page = 1) => {
    const state = get();
    const limit = state.pagination.limit;
    const offset = (page - 1) * limit;
    const cacheKey = `${categoryId}-${query}-${page}`;

    // Check cache first (unless force refresh)
    if (!forceRefresh && state.brandsCache.has(cacheKey)) {
      const cached = state.brandsCache.get(cacheKey)!;
      if (isCacheValid(cached.timestamp)) {
        set({ brands: cached.data });
        return;
      }
    }

    set({ loading: true, error: null });

    try {
      // Get brands and total count in parallel
      const [brandsData, countData] = await Promise.all([
        makeGraphQLCall(GET_BRANDS_QUERY, {
          categoryId,
          q: query || undefined,
          limit,
          offset
        }),
        makeGraphQLCall(GET_BRANDS_COUNT_QUERY, {
          categoryId,
          q: query || undefined
        })
      ]);

      const brands = brandsData.brands || [];
      const total = countData.brandsCount || 0;
      const totalPages = Math.ceil(total / limit);

      // Update cache
      const newCache = new Map(state.brandsCache);
      newCache.set(cacheKey, { data: brands, timestamp: Date.now() });

      set({
        brands,
        loading: false,
        brandsCache: newCache,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      });
    } catch (error) {
      console.error('Load brands error:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'خطأ في تحميل العلامات التجارية'
      });
    }
  },

  // Load models for a brand
  loadModels: async (brandId: string, query = '', forceRefresh = false) => {
    set({ loading: true, error: null });

    try {
      const variables = { brandId, q: query };
      const data = await makeGraphQLCall(GET_MODELS_QUERY, variables);
      const models = data.models || [];

      set({ models, loading: false });
    } catch (error) {
      console.error('Load models error:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'خطأ في تحميل الموديلات'
      });
    }
  },

  // Create brand
  createBrand: async (input: CreateBrandInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_BRAND_MUTATION, { input });
      const brand = data.upsertBrand;

      // Update local state
      set({
        brands: [...state.brands, brand],
        loading: false
      });

      // Clear cache for this category
      const newCache = new Map(state.brandsCache);
      for (const [key] of newCache) {
        if (key.startsWith(input.categoryId)) {
          newCache.delete(key);
        }
      }
      set({ brandsCache: newCache });

      return brand;
    } catch (error) {
      console.error('Create brand error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء العلامة التجارية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update brand
  updateBrand: async (input: UpdateBrandInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_BRAND_MUTATION, { input });
      const updatedBrand = data.upsertBrand;

      // Update local state
      const updatedBrands = state.brands.map(brand =>
        brand.id === updatedBrand.id ? updatedBrand : brand
      );

      set({
        brands: updatedBrands,
        selectedBrand: state.selectedBrand?.id === updatedBrand.id ? updatedBrand : state.selectedBrand,
        loading: false
      });

      // Clear relevant cache entries
      const newCache = new Map(state.brandsCache);
      for (const [key] of newCache) {
        if (key.startsWith(updatedBrand.categoryId)) {
          newCache.delete(key);
        }
      }
      set({ brandsCache: newCache });

      return updatedBrand;
    } catch (error) {
      console.error('Update brand error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث العلامة التجارية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete brand
  deleteBrand: async (id: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(DELETE_BRAND_MUTATION, { id });

      // Remove from local state
      const updatedBrands = state.brands.filter(brand => brand.id !== id);

      // Clear models if deleted brand was selected
      const clearModels = state.selectedBrand?.id === id;

      set({
        brands: updatedBrands,
        selectedBrand: state.selectedBrand?.id === id ? null : state.selectedBrand,
        models: clearModels ? [] : state.models,
        loading: false
      });

      // Clear brands cache
      set({ brandsCache: new Map() });

      return data.deleteBrand;
    } catch (error) {
      console.error('Delete brand error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف العلامة التجارية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Create model
  createModel: async (input: CreateModelInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_MODEL_MUTATION, { input });
      const model = data.upsertModel;

      // Update local state
      set({
        models: [...state.models, model],
        loading: false
      });

      return model;
    } catch (error) {
      console.error('Create model error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء الموديل';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update model
  updateModel: async (input: UpdateModelInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_MODEL_MUTATION, { input });
      const updatedModel = data.upsertModel;

      // Update local state
      const updatedModels = state.models.map(model =>
        model.id === updatedModel.id ? updatedModel : model
      );

      set({
        models: updatedModels,
        selectedModel: state.selectedModel?.id === updatedModel.id ? updatedModel : state.selectedModel,
        loading: false
      });

      return updatedModel;
    } catch (error) {
      console.error('Update model error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث الموديل';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete model
  deleteModel: async (id: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(DELETE_MODEL_MUTATION, { id });

      // Remove from local state
      const updatedModels = state.models.filter(model => model.id !== id);

      set({
        models: updatedModels,
        selectedModel: state.selectedModel?.id === id ? null : state.selectedModel,
        loading: false
      });

      return data.deleteModel;
    } catch (error) {
      console.error('Delete model error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف الموديل';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Sync catalog with external API
  syncCatalogNow: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(SYNC_CATALOG_MUTATION);
      // Backend returns boolean, but we'll simulate the result format
      const result = { brands: 0, models: 0 };

      set({ loading: false });

      // Clear all caches after sync
      set({ brandsCache: new Map() });

      return result;
    } catch (error) {
      console.error('Sync catalog error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في مزامنة الكتالوج';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Add brand alias
  addBrandAlias: async (brandId: string, alias: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(ADD_BRAND_ALIAS_MUTATION, {
        input: { targetId: brandId, alias }
      });

      set({ loading: false });
      return data.addBrandAlias;
    } catch (error) {
      console.error('Add brand alias error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إضافة اسم بديل للعلامة التجارية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Add model alias
  addModelAlias: async (modelId: string, alias: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(ADD_MODEL_ALIAS_MUTATION, {
        input: { targetId: modelId, alias }
      });

      set({ loading: false });
      return data.addModelAlias;
    } catch (error) {
      console.error('Add model alias error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إضافة اسم بديل للموديل';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Selection management
  setSelectedCategory: (categoryId: string | null) => {
    set({
      selectedCategoryId: categoryId,
      brands: [], // Clear brands when changing category
      selectedBrand: null,
      models: [],
      selectedModel: null
    });
  },

  setSelectedBrand: (brand: Brand | null) => {
    set({
      selectedBrand: brand,
      models: [], // Clear models when changing brand
      selectedModel: null
    });
  },

  setSelectedModel: (model: Model | null) => {
    set({ selectedModel: model });
  },

  // Pagination navigation
  nextPage: async () => {
    const state = get();
    if (state.pagination.hasNext && state.selectedCategoryId) {
      await get().loadBrands(state.selectedCategoryId, '', false, state.pagination.page + 1);
    }
  },

  prevPage: async () => {
    const state = get();
    if (state.pagination.hasPrev && state.selectedCategoryId) {
      await get().loadBrands(state.selectedCategoryId, '', false, state.pagination.page - 1);
    }
  },

  goToPage: async (page: number) => {
    const state = get();
    if (page >= 1 && page <= state.pagination.totalPages && state.selectedCategoryId) {
      await get().loadBrands(state.selectedCategoryId, '', false, page);
    }
  },

  // Error handling
  clearError: () => {
    set({ error: null });
  },

  setError: (error: string) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));