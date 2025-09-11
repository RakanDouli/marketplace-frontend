import { useEffect } from 'react';
import { useCategoriesStore, useListingsStore } from '../stores';

/**
 * Hook to initialize app data on first load
 * Using real Supabase API calls
 */
export function useInitializeData() {
  const { 
    categories, 
    isLoading: categoriesLoading,
    fetchCategories
  } = useCategoriesStore();

  // Load categories on mount using real API
  useEffect(() => {
    const loadCategories = async () => {
      if (categories.length > 0) return; // Already loaded
      
      try {
        await fetchCategories();
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, [categories.length, fetchCategories]);

  return {
    categoriesLoaded: categories.length > 0,
    categoriesLoading,
  };
}

/**
 * Hook to load listings for a specific category
 */
export function useCategoryListings(categoryId: string | null) {
  const {
    listings,
    isLoading,
    fetchListingsByCategory,
    filters,
    pagination,
  } = useListingsStore();

  // Load listings when category changes
  useEffect(() => {
    const loadListings = async () => {
      if (!categoryId) return;
      
      try {
        // Use real API call
        await fetchListingsByCategory(categoryId, filters);
      } catch (error) {
        console.error('Failed to load listings:', error);
      }
    };

    loadListings();
  }, [categoryId, filters, fetchListingsByCategory]);

  return {
    listings,
    isLoading,
    pagination,
  };
}