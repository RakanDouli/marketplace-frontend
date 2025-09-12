import { create } from 'zustand';
import { CategoriesState, Category } from './types';

// GraphQL queries
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

// GraphQL client function
async function graphqlRequest(query: string, variables: any = {}) {
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

interface CategoriesActions {
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  setSelectedCategory: (category: Category | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  // Data fetching methods
  fetchCategories: () => Promise<void>;
  fetchCategoryBySlug: (slug: string) => Promise<Category | null>;
  // Helper methods
  getCategoryById: (id: string) => Category | undefined;
}

type CategoriesStore = CategoriesState & CategoriesActions;

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  // Initial state
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,

  // Actions
  setCategories: (categories: Category[]) => {
    set({ categories, error: null });
  },

  addCategory: (category: Category) => {
    const { categories } = get();
    set({ 
      categories: [...categories, category],
      error: null 
    });
  },

  updateCategory: (id: string, updates: Partial<Category>) => {
    const { categories } = get();
    const updatedCategories = categories.map(category =>
      category.id === id ? { ...category, ...updates } : category
    );
    
    set({ categories: updatedCategories });
  },

  removeCategory: (id: string) => {
    const { categories } = get();
    const filteredCategories = categories.filter(category => category.id !== id);
    
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

  // Data fetching methods
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await graphqlRequest(CATEGORIES_QUERY);

      const categories: Category[] = (data.categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        nameAr: cat.name, // Backend should provide Arabic version
        slug: cat.slug,
        isActive: cat.isActive,
      }));

      set({ categories, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load categories',
        categories: [] 
      });
    }
  },

  fetchCategoryBySlug: async (slug: string) => {
    try {
      // Fetch all categories using GraphQL
      const data = await graphqlRequest(CATEGORIES_QUERY);
      
      // Find the category with matching slug
      const category = (data.categories || []).find((cat: any) => cat.slug === slug && cat.isActive);
      
      if (!category) {
        return null;
      }
      
      return {
        id: category.id,
        name: category.name,
        nameAr: category.name, // Backend should provide Arabic version
        slug: category.slug,
        isActive: category.isActive,
      };
    } catch (error: any) {
      console.error('Failed to fetch category by slug:', error);
      return null;
    }
  },

  // Helper methods
  getCategoryById: (id: string) => {
    const { categories } = get();
    return categories.find(category => category.id === id);
  },
}));

// Selectors
export const useCategories = () => useCategoriesStore((state) => state.categories);
export const useSelectedCategory = () => useCategoriesStore((state) => state.selectedCategory);
export const useCategoriesLoading = () => useCategoriesStore((state) => state.isLoading);
export const useCategoriesError = () => useCategoriesStore((state) => state.error);