import { create } from 'zustand';
import { ListingsState, Listing } from './types';
import { supabase } from '../lib/supabase';

interface ListingsActions {
  setListings: (listings: Listing[]) => void;
  addListings: (listings: Listing[]) => void;
  setCurrentListing: (listing: Listing | null) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  removeListing: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<ListingsState['filters']>) => void;
  clearFilters: () => void;
  setPagination: (pagination: Partial<ListingsState['pagination']>) => void;
  resetPagination: () => void;
  // Data fetching methods
  fetchListings: (filters?: Partial<ListingsState['filters']>) => Promise<void>;
  fetchListingsByCategory: (categoryId: string, filters?: Partial<ListingsState['filters']>) => Promise<void>;
}

type ListingsStore = ListingsState & ListingsActions;

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: true,
};

export const useListingsStore = create<ListingsStore>((set, get) => ({
  // Initial state
  listings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: initialPagination,

  // Actions
  setListings: (listings: Listing[]) => {
    set({ listings, error: null });
  },

  addListings: (newListings: Listing[]) => {
    const { listings } = get();
    const existingIds = new Set(listings.map(l => l.id));
    const uniqueNewListings = newListings.filter(l => !existingIds.has(l.id));
    
    set({ 
      listings: [...listings, ...uniqueNewListings],
      error: null 
    });
  },

  setCurrentListing: (listing: Listing | null) => {
    set({ currentListing: listing });
  },

  updateListing: (id: string, updates: Partial<Listing>) => {
    const { listings } = get();
    const updatedListings = listings.map(listing =>
      listing.id === id ? { ...listing, ...updates } : listing
    );
    
    set({ listings: updatedListings });
  },

  removeListing: (id: string) => {
    const { listings } = get();
    const filteredListings = listings.filter(listing => listing.id !== id);
    
    set({ listings: filteredListings });
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

  setFilters: (newFilters: Partial<ListingsState['filters']>) => {
    const { filters } = get();
    set({
      filters: { ...filters, ...newFilters },
      pagination: initialPagination, // Reset pagination when filters change
    });
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: initialPagination,
    });
  },

  setPagination: (newPagination: Partial<ListingsState['pagination']>) => {
    const { pagination } = get();
    set({
      pagination: { ...pagination, ...newPagination },
    });
  },

  resetPagination: () => {
    set({ pagination: initialPagination });
  },

  // Data fetching methods
  fetchListings: async (filterOverrides = {}) => {
    const { filters, pagination } = get();
    const finalFilters = { ...filters, ...filterOverrides };
    
    set({ isLoading: true, error: null });
    
    try {
      const currentPage = pagination.page || 1;
      const offset = (currentPage - 1) * pagination.limit;
      
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          priceMinor,
          province,
          city,
          area,
          status,
          imageKeys,
          specs,
          createdAt,
          categoryId,
          userId
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('createdAt', { ascending: false })
        .range(offset, offset + pagination.limit - 1);

      // Apply filters
      if (finalFilters.categoryId) {
        query = query.eq('categoryId', finalFilters.categoryId);
      }
      if (finalFilters.minPrice) {
        query = query.gte('priceMinor', finalFilters.minPrice * 100);
      }
      if (finalFilters.maxPrice) {
        query = query.lte('priceMinor', finalFilters.maxPrice * 100);
      }
      if (finalFilters.location) {
        query = query.or(`city.ilike.%${finalFilters.location}%,province.ilike.%${finalFilters.location}%`);
      }
      if (finalFilters.search) {
        query = query.or(`title.ilike.%${finalFilters.search}%,description.ilike.%${finalFilters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const listings: Listing[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        titleAr: item.title, // Assuming same for now
        description: item.description,
        descriptionAr: item.description, // Assuming same for now
        price: item.priceMinor / 100, // Convert from cents
        currency: 'USD', // Backend always stores in USD
        condition: 'USED' as const, // Default
        status: item.status as any,
        images: item.imageKeys || [],
        location: `${item.city}, ${item.province}`,
        province: item.province,
        area: item.area,
        categoryId: item.categoryId,
        sellerId: item.userId,
        viewCount: 0,
        isFeatured: false,
        isPromoted: false,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      }));

      set({ 
        listings,
        isLoading: false, 
        error: null,
        pagination: {
          ...pagination,
          total: count || 0,
          hasMore: (count || 0) > offset + pagination.limit
        }
      });
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load listings',
        listings: [] 
      });
    }
  },

  fetchListingsByCategory: async (categoryId: string, filterOverrides = {}) => {
    await get().fetchListings({ ...filterOverrides, categoryId });
  },
}));

// Selectors
export const useListings = () => useListingsStore((state) => state.listings);
export const useCurrentListing = () => useListingsStore((state) => state.currentListing);
export const useListingsLoading = () => useListingsStore((state) => state.isLoading);
export const useListingsError = () => useListingsStore((state) => state.error);
export const useListingsFilters = () => useListingsStore((state) => state.filters);
export const useListingsPagination = () => useListingsStore((state) => state.pagination);