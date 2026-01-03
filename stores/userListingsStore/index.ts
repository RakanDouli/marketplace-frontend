import { create } from 'zustand';
import { cachedGraphQLRequest, invalidateGraphQLCache } from '../../utils/graphql-cache';
import {
  MY_LISTINGS_QUERY,
  MY_LISTINGS_COUNT_QUERY,
  MY_LISTING_BY_ID_QUERY,
  CREATE_MY_LISTING_MUTATION,
  UPDATE_MY_LISTING_MUTATION,
  DELETE_MY_LISTING_MUTATION,
} from './userListingsStore.gql';
import { Listing } from '../types';

export type ListingStatus = 'ACTIVE' | 'DRAFT' | 'SOLD' | 'HIDDEN' | 'PENDING_APPROVAL' | 'REJECTED' | 'SOLD_VIA_PLATFORM';

interface UserListingsState {
  listings: Listing[];
  currentListing: Listing | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    status?: ListingStatus;
    search?: string;
  };
}

interface UserListingsActions {
  // Load user's listings
  loadMyListings: (filters?: Partial<UserListingsState['filters']>, page?: number) => Promise<void>;

  // Load single listing by ID
  loadMyListingById: (id: string) => Promise<Listing>;

  // Create listing
  createMyListing: (input: any) => Promise<Listing>;

  // Update listing
  updateMyListing: (id: string, input: any) => Promise<void>;

  // Delete listing
  deleteMyListing: (id: string, archivalReason: 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale') => Promise<void>;

  // Refresh listings
  refreshMyListings: () => Promise<void>;

  // Set filters
  setFilters: (filters: Partial<UserListingsState['filters']>) => void;

  // Set pagination
  setPagination: (pagination: Partial<UserListingsState['pagination']>) => void;

  // Clear error
  clearError: () => void;

  // Reset store
  reset: () => void;
}

type UserListingsStore = UserListingsState & UserListingsActions;

const initialState: UserListingsState = {
  listings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  filters: {},
};

export const useUserListingsStore = create<UserListingsStore>((set, get) => ({
  ...initialState,

  loadMyListings: async (filters?: Partial<UserListingsState['filters']>, page?: number) => {
    set({ isLoading: true, error: null });

    try {
      const state = get();
      const currentFilters = { ...state.filters, ...filters };
      const currentPage = page ?? state.pagination.page;
      const offset = (currentPage - 1) * state.pagination.limit;

      // Fetch listings (user-specific, don't cache)
      const listingsData = await cachedGraphQLRequest(
        MY_LISTINGS_QUERY,
        {
          status: currentFilters.status || null,
          limit: state.pagination.limit,
          offset,
        },
        { ttl: 0 }
      );

      // Fetch total count (user-specific, don't cache)
      const countData = await cachedGraphQLRequest(
        MY_LISTINGS_COUNT_QUERY,
        {
          status: currentFilters.status || null,
        },
        { ttl: 0 }
      );

      set({
        listings: listingsData.myListings,
        filters: currentFilters,
        pagination: {
          ...state.pagination,
          page: currentPage,
          total: countData.myListingsCount,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load listings',
        isLoading: false,
      });
    }
  },

  loadMyListingById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        MY_LISTING_BY_ID_QUERY,
        { id },
        { ttl: 0 }
      );

      set({
        currentListing: data.myListingById,
        isLoading: false,
      });

      return data.myListingById;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load listing',
        isLoading: false,
      });
      throw error;
    }
  },

  createMyListing: async (input: any) => {
    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        CREATE_MY_LISTING_MUTATION,
        { input },
        { ttl: 0 }
      );

      // Invalidate cache and refresh listings
      invalidateGraphQLCache('myListings');
      await get().refreshMyListings();

      set({ isLoading: false });
      return data.createMyListing;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create listing',
        isLoading: false,
      });
      throw error;
    }
  },

  updateMyListing: async (id: string, input: any) => {
    set({ isLoading: true, error: null });

    try {
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id, input },
        { ttl: 0 }
      );

      // Invalidate cache and refresh listings
      invalidateGraphQLCache('myListings');
      await get().refreshMyListings();

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update listing',
        isLoading: false,
      });
      throw error; // Re-throw for modal error handling
    }
  },

  deleteMyListing: async (id: string, archivalReason: 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale') => {
    set({ isLoading: true, error: null });

    try {
      await cachedGraphQLRequest(
        DELETE_MY_LISTING_MUTATION,
        { id, archivalReason },
        { ttl: 0 }
      );

      // Invalidate cache and refresh listings
      invalidateGraphQLCache('myListings');
      await get().refreshMyListings();

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete listing',
        isLoading: false,
      });
      throw error; // Re-throw for modal error handling
    }
  },

  refreshMyListings: async () => {
    const state = get();
    await get().loadMyListings(state.filters, state.pagination.page);
  },

  setFilters: (filters: Partial<UserListingsState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page when filters change
    }));
  },

  setPagination: (pagination: Partial<UserListingsState['pagination']>) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
