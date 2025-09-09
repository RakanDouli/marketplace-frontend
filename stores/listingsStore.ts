import { create } from 'zustand';
import { ListingsState, Listing } from './types';

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
}));

// Selectors
export const useListings = () => useListingsStore((state) => state.listings);
export const useCurrentListing = () => useListingsStore((state) => state.currentListing);
export const useListingsLoading = () => useListingsStore((state) => state.isLoading);
export const useListingsError = () => useListingsStore((state) => state.error);
export const useListingsFilters = () => useListingsStore((state) => state.filters);
export const useListingsPagination = () => useListingsStore((state) => state.pagination);