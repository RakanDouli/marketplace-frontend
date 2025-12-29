import { create } from "zustand";
import { CategoriesState, Category } from "./types";
import { cachedGraphQLRequest } from "../utils/graphql-cache";

// GraphQL queries
const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      icon
    }
  }
`;

interface CategoriesActions {
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  setSelectedCategory: (category: Category | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  // Data fetching methods - ONLY FETCH ONCE ON APP INIT
  fetchCategories: () => Promise<void>;
  initializeCategories: () => Promise<void>; // One-time initialization
  // Helper methods - USE CACHED DATA ONLY
  getCategoryById: (id: string) => Category | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
}

type CategoriesStore = CategoriesState & CategoriesActions;

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  // Initial state
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
  isInitialized: false, // Track if categories have been fetched

  // Actions
  setCategories: (categories: Category[]) => {
    set({ categories, error: null });
  },

  addCategory: (category: Category) => {
    const { categories } = get();
    set({
      categories: [...categories, category],
      error: null,
    });
  },

  updateCategory: (id: string, updates: Partial<Category>) => {
    const { categories } = get();
    const updatedCategories = categories.map((category) =>
      category.id === id ? { ...category, ...updates } : category
    );

    set({ categories: updatedCategories });
  },

  removeCategory: (id: string) => {
    const { categories } = get();
    const filteredCategories = categories.filter(
      (category) => category.id !== id
    );

    set({ categories: filteredCategories });
  },

  setSelectedCategory: (selectedCategory: Category | null) => {
    set({ selectedCategory });
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

  // Data fetching methods - ONLY FETCH ONCE ON APP INIT
  fetchCategories: async () => {
    const { isInitialized } = get();

    // Skip if already initialized
    if (isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        CATEGORIES_QUERY,
        {},
        { ttl: 10 * 60 * 1000 }
      ); // Cache for 10 minutes

      const categories: Category[] = (data.categories || []).map(
        (cat: any) => ({
          id: cat.id,
          name: cat.name,
          nameAr: cat.nameAr || cat.name, // Use Arabic name from backend
          slug: cat.slug,
          isActive: cat.isActive,
          icon: cat.icon, // SVG icon from backend
        })
      );

      set({
        categories,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to load categories",
        categories: [],
        isInitialized: false,
      });
    }
  },

  // One-time initialization method
  initializeCategories: async () => {
    const { isInitialized } = get();

    if (isInitialized) {
      return;
    }

    await get().fetchCategories();
  },

  // Helper methods - USE CACHED DATA ONLY
  getCategoryById: (id: string) => {
    const { categories } = get();
    return categories.find((category) => category.id === id);
  },

  // NEW: Get category by slug from cached data (NO API CALL)
  getCategoryBySlug: (slug: string) => {
    const { categories } = get();
    return categories.find(
      (category) => category.slug === slug && category.isActive
    );
  },
}));

// Selectors
export const useCategories = () =>
  useCategoriesStore((state) => state.categories);
export const useSelectedCategory = () =>
  useCategoriesStore((state) => state.selectedCategory);
export const useCategoriesLoading = () =>
  useCategoriesStore((state) => state.isLoading);
export const useCategoriesError = () =>
  useCategoriesStore((state) => state.error);
