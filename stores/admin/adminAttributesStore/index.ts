import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_CATEGORIES_QUERY,
  GET_CATEGORY_ATTRIBUTES_QUERY,
  GET_ALL_ATTRIBUTES_QUERY,
  CREATE_CATEGORY_MUTATION,
  UPDATE_CATEGORY_MUTATION,
  DELETE_CATEGORY_MUTATION,
  CREATE_ATTRIBUTE_MUTATION,
  UPDATE_ATTRIBUTE_MUTATION,
  DELETE_ATTRIBUTE_MUTATION,
  REORDER_ATTRIBUTES_MUTATION,
  UPDATE_ATTRIBUTE_FILTER_VISIBILITY_MUTATION,
  CREATE_ATTRIBUTE_OPTION_MUTATION,
  UPDATE_ATTRIBUTE_OPTION_MUTATION,
  DELETE_ATTRIBUTE_OPTION_MUTATION,
} from "./adminAttributesStore.gql";

// Type definitions
export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  isActive: boolean;
  biddingEnabled?: boolean;
}

export interface AttributeOption {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  showInGrid: boolean;
  showInList: boolean;
  showInDetail: boolean;
  showInFilter: boolean;
}

export interface Attribute {
  id: string;
  key: string;
  name: string;
  type: 'text' | 'textarea' | 'selector' | 'multi_selector' | 'range' | 'currency' | 'boolean' | 'date';
  validation: 'required' | 'optional';
  sortOrder: number;
  group?: string;
  groupOrder?: number;
  categoryId?: string;
  isActive: boolean;
  isGlobal: boolean;
  isSystemCore: boolean;
  canBeCustomized: boolean;
  canBeDeleted: boolean;
  requiredPermission?: string;
  showInGrid: boolean;
  showInList: boolean;
  showInDetail: boolean;
  showInFilter: boolean;
  options: AttributeOption[];
}

// Input types
export interface CreateCategoryInput {
  name: string;
  nameAr?: string;
  slug: string;
  isActive?: boolean;
  biddingEnabled?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  nameAr?: string;
  slug?: string;
  isActive?: boolean;
  biddingEnabled?: boolean;
}

export interface CreateAttributeInput {
  categoryId?: string;
  key: string;
  name: string;
  type: string;
  validation?: string;
  sortOrder?: number;
  group?: string;
  groupOrder?: number;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  showInFilter?: boolean;
  options?: Array<{
    key: string;
    value: string;
    sortOrder: number;
  }>;
}

export interface UpdateAttributeInput {
  key?: string;
  name?: string;
  type?: string;
  validation?: string;
  sortOrder?: number;
  group?: string;
  groupOrder?: number;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  showInFilter?: boolean;
  options?: Array<{
    id?: string;
    key: string;
    value: string;
    sortOrder: number;
    isActive?: boolean;
    showInGrid?: boolean;
    showInList?: boolean;
    showInDetail?: boolean;
    showInFilter?: boolean;
  }>;
}

export interface AttributeOrderUpdate {
  id: string;
  sortOrder: number;
  groupOrder?: number;
  group?: string;
}

export interface CreateAttributeOptionInput {
  attributeId: string;
  key: string;
  value: string;
  sortOrder?: number;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  showInFilter?: boolean;
}

export interface UpdateAttributeOptionInput {
  key?: string;
  value?: string;
  sortOrder?: number;
  isActive?: boolean;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  showInFilter?: boolean;
}

// Store interface
interface AttributesStore {
  // Data
  categories: Category[];
  attributes: Attribute[];
  selectedCategory: Category | null;
  selectedAttribute: Attribute | null;
  loading: boolean;
  error: string | null;

  // Cache management
  categoriesCache: { data: Category[]; timestamp: number } | null;
  attributesCache: Map<string, { data: Attribute[]; timestamp: number }>;

  // Actions - Categories
  loadCategories: () => Promise<void>;
  createCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Actions - Attributes
  loadAttributes: (categorySlug?: string) => Promise<void>;
  loadAllAttributes: () => Promise<void>;
  createAttribute: (input: CreateAttributeInput) => Promise<Attribute>;
  updateAttribute: (id: string, input: UpdateAttributeInput) => Promise<Attribute>;
  deleteAttribute: (id: string) => Promise<boolean>;
  updateAttributeOrder: (categorySlug: string, attributeOrders: AttributeOrderUpdate[]) => Promise<void>;
  updateAttributeFilterVisibility: (id: string, showInFilter: boolean) => Promise<void>;

  // Actions - Attribute Options
  createAttributeOption: (input: CreateAttributeOptionInput) => Promise<AttributeOption>;
  updateAttributeOption: (id: string, input: UpdateAttributeOptionInput) => Promise<AttributeOption>;
  deleteAttributeOption: (id: string) => Promise<boolean>;

  // Selection management
  setSelectedCategory: (category: Category | null) => void;
  setSelectedAttribute: (attribute: Attribute | null) => void;

  // Utility actions
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

export const useAttributesStore = create<AttributesStore>((set, get) => ({
  // Initial state
  categories: [],
  attributes: [],
  selectedCategory: null,
  selectedAttribute: null,
  loading: false,
  error: null,

  // Cache
  categoriesCache: null,
  attributesCache: new Map(),

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
        error: error instanceof Error ? error.message : 'خطأ في تحميل التصنيفات'
      });
    }
  },

  // Create category
  createCategory: async (input: CreateCategoryInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_CATEGORY_MUTATION, { input });
      const category = data.createCategory;

      // Update local state
      set({
        categories: [...state.categories, category],
        loading: false,
        categoriesCache: null // Clear cache
      });

      return category;
    } catch (error) {
      console.error('Create category error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء التصنيف';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update category
  updateCategory: async (id: string, input: UpdateCategoryInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_CATEGORY_MUTATION, { id, input });
      const updatedCategory = data.updateCategory;

      // Update local state
      const updatedCategories = state.categories.map(category =>
        category.id === updatedCategory.id ? updatedCategory : category
      );

      set({
        categories: updatedCategories,
        selectedCategory: state.selectedCategory?.id === updatedCategory.id ? updatedCategory : state.selectedCategory,
        loading: false,
        categoriesCache: null // Clear cache
      });

      return updatedCategory;
    } catch (error) {
      console.error('Update category error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث التصنيف';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(DELETE_CATEGORY_MUTATION, { id });

      // Remove from local state
      const updatedCategories = state.categories.filter(category => category.id !== id);

      set({
        categories: updatedCategories,
        selectedCategory: state.selectedCategory?.id === id ? null : state.selectedCategory,
        loading: false,
        categoriesCache: null // Clear cache
      });

      return data.deleteCategory;
    } catch (error) {
      console.error('Delete category error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف التصنيف';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Load attributes for a category
  loadAttributes: async (categorySlug?: string) => {
    if (!categorySlug) {
      set({ attributes: [] });
      return;
    }

    const state = get();
    const cacheKey = categorySlug;

    // Check cache first
    if (state.attributesCache.has(cacheKey)) {
      const cached = state.attributesCache.get(cacheKey)!;
      if (isCacheValid(cached.timestamp)) {
        set({ attributes: cached.data });
        return;
      }
    }

    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_CATEGORY_ATTRIBUTES_QUERY, { categorySlug });
      const attributes = data.getAttributesByCategorySlug || [];

      // Update cache
      const newCache = new Map(state.attributesCache);
      newCache.set(cacheKey, { data: attributes, timestamp: Date.now() });

      set({
        attributes,
        loading: false,
        attributesCache: newCache
      });
    } catch (error) {
      console.error('Load attributes error:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'خطأ في تحميل الخصائص'
      });
    }
  },

  // Load all attributes
  loadAllAttributes: async () => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(GET_ALL_ATTRIBUTES_QUERY);
      const attributes = data.getAllAttributes || [];

      set({ attributes, loading: false });
    } catch (error) {
      console.error('Load all attributes error:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'خطأ في تحميل جميع الخصائص'
      });
    }
  },

  // Create attribute
  createAttribute: async (input: CreateAttributeInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_ATTRIBUTE_MUTATION, { input });
      const attribute = data.createAttribute;

      // Update local state
      set({
        attributes: [...state.attributes, attribute],
        loading: false
      });

      // Clear cache
      set({ attributesCache: new Map() });

      return attribute;
    } catch (error) {
      console.error('Create attribute error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء الخاصية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update attribute
  updateAttribute: async (id: string, input: UpdateAttributeInput) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      // Include id in the input object as backend expects
      const data = await makeGraphQLCall(UPDATE_ATTRIBUTE_MUTATION, {
        input: { ...input, id }
      });
      const updatedAttribute = data.updateAttribute;

      // Update local state
      const updatedAttributes = state.attributes.map(attribute =>
        attribute.id === updatedAttribute.id ? updatedAttribute : attribute
      );

      set({
        attributes: updatedAttributes,
        selectedAttribute: state.selectedAttribute?.id === updatedAttribute.id ? updatedAttribute : state.selectedAttribute,
        loading: false
      });

      // Clear cache
      set({ attributesCache: new Map() });

      return updatedAttribute;
    } catch (error) {
      console.error('Update attribute error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث الخاصية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete attribute
  deleteAttribute: async (id: string) => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(DELETE_ATTRIBUTE_MUTATION, { id });

      // Remove from local state
      const updatedAttributes = state.attributes.filter(attribute => attribute.id !== id);

      set({
        attributes: updatedAttributes,
        selectedAttribute: state.selectedAttribute?.id === id ? null : state.selectedAttribute,
        loading: false
      });

      // Clear cache
      set({ attributesCache: new Map() });

      return data.deleteAttribute;
    } catch (error) {
      console.error('Delete attribute error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف الخاصية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update attribute order
  updateAttributeOrder: async (categorySlug: string, attributeOrders: AttributeOrderUpdate[]) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(REORDER_ATTRIBUTES_MUTATION, {
        input: {
          updates: attributeOrders
        }
      });

      // Clear cache to force refresh
      set({ attributesCache: new Map(), loading: false });

      // Reload attributes for the category
      await get().loadAttributes(categorySlug);
    } catch (error) {
      console.error('Update attribute order error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث ترتيب الخصائص';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update attribute filter visibility
  updateAttributeFilterVisibility: async (id: string, showInFilter: boolean) => {
    const state = get();

    try {
      await makeGraphQLCall(UPDATE_ATTRIBUTE_FILTER_VISIBILITY_MUTATION, { id, showInFilter });

      // Update local state immediately for better UX
      const updatedAttributes = state.attributes.map(attribute =>
        attribute.id === id ? { ...attribute, showInFilter } : attribute
      );

      set({ attributes: updatedAttributes });
    } catch (error) {
      console.error('Update attribute filter visibility error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث عرض الخاصية في الفلاتر';
      set({ error: errorMessage });
      throw error;
    }
  },

  // Create attribute option
  createAttributeOption: async (input: CreateAttributeOptionInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_ATTRIBUTE_OPTION_MUTATION, { input });
      const option = data.createAttributeOption;

      // Update local state - add option to the appropriate attribute
      const state = get();
      const updatedAttributes = state.attributes.map(attribute =>
        attribute.id === input.attributeId
          ? { ...attribute, options: [...attribute.options, option] }
          : attribute
      );

      set({ attributes: updatedAttributes, loading: false });

      return option;
    } catch (error) {
      console.error('Create attribute option error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء خيار الخاصية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update attribute option
  updateAttributeOption: async (id: string, input: UpdateAttributeOptionInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(UPDATE_ATTRIBUTE_OPTION_MUTATION, { id, input });
      const updatedOption = data.updateAttributeOption;

      // Update local state
      const state = get();
      const updatedAttributes = state.attributes.map(attribute => ({
        ...attribute,
        options: attribute.options.map(option =>
          option.id === updatedOption.id ? updatedOption : option
        )
      }));

      set({ attributes: updatedAttributes, loading: false });

      return updatedOption;
    } catch (error) {
      console.error('Update attribute option error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث خيار الخاصية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete attribute option
  deleteAttributeOption: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(DELETE_ATTRIBUTE_OPTION_MUTATION, { id });

      // Remove from local state
      const state = get();
      const updatedAttributes = state.attributes.map(attribute => ({
        ...attribute,
        options: attribute.options.filter(option => option.id !== id)
      }));

      set({ attributes: updatedAttributes, loading: false });

      return data.deleteAttributeOption;
    } catch (error) {
      console.error('Delete attribute option error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف خيار الخاصية';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Selection management
  setSelectedCategory: (category: Category | null) => {
    set({
      selectedCategory: category,
      attributes: [], // Clear attributes when changing category
      selectedAttribute: null
    });
  },

  setSelectedAttribute: (attribute: Attribute | null) => {
    set({ selectedAttribute: attribute });
  },

  // Utility actions
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