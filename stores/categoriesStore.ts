import { create } from 'zustand';
import { CategoriesState, Category } from './types';

interface CategoriesActions {
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  setSelectedCategory: (category: Category | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  // Helper methods
  getCategoryById: (id: string) => Category | undefined;
  getSubCategories: (parentId: string) => Category[];
  getRootCategories: () => Category[];
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

  // Helper methods
  getCategoryById: (id: string) => {
    const { categories } = get();
    return categories.find(category => category.id === id);
  },

  getSubCategories: (parentId: string) => {
    const { categories } = get();
    return categories.filter(category => category.parentId === parentId);
  },

  getRootCategories: () => {
    const { categories } = get();
    return categories.filter(category => !category.parentId);
  },
}));

// Selectors
export const useCategories = () => useCategoriesStore((state) => state.categories);
export const useSelectedCategory = () => useCategoriesStore((state) => state.selectedCategory);
export const useCategoriesLoading = () => useCategoriesStore((state) => state.isLoading);
export const useCategoriesError = () => useCategoriesStore((state) => state.error);
export const useRootCategories = () => useCategoriesStore((state) => state.getRootCategories());
export const useSubCategories = (parentId: string) => 
  useCategoriesStore((state) => state.getSubCategories(parentId));