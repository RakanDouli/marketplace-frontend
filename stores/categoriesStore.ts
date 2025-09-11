import { create } from 'zustand';
import { CategoriesState, Category } from './types';
import { supabase } from '../lib/supabase';

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
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, nameAr, slug, isActive, biddingEnabled')
        .eq('isActive', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const categories: Category[] = (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr || cat.name,
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
      // Check if Supabase is properly configured
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, nameAr, slug, isActive, biddingEnabled')
        .eq('slug', slug)
        .eq('isActive', true)
        .single();

      if (error) {
        // Silently handle all errors - just return null for 404 handling
        return null;
      }

      if (!data) {
        return null;
      }
      
      return {
        id: data.id,
        name: data.name,
        nameAr: data.nameAr || data.name,
        slug: data.slug,
        isActive: data.isActive,
      };
    } catch (error: any) {
      // Silently handle all errors - just return null for 404 handling
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