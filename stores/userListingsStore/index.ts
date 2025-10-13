import { create } from 'zustand';
import { cachedGraphQLRequest, invalidateGraphQLCache } from '../../utils/graphql-cache';
import {
  MY_LISTINGS_QUERY,
  MY_LISTINGS_COUNT_QUERY,
  MY_LISTING_BY_ID_QUERY,
  UPDATE_MY_LISTING_MUTATION,
  DELETE_MY_LISTING_MUTATION,
} from './userListingsStore.gql';
import { Listing } from '../types';

export type ListingStatus = 'active' | 'draft' | 'sold' | 'hidden' | 'sold_via_platform';

interface UserListingsState {
  listings: Listing[];
  currentListing: Listing | null;
  loading: boolean;
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
  loadMyListingById: (id: string) => Promise<void>;

  // Update listing
  updateMyListing: (id: string, input: any) => Promise<void>;

  // Delete listing
  deleteMyListing: (id: string, soldViaPlatform?: boolean) => Promise<void>;

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
  loading: false,
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
    set({ loading: true, error: null });

    try {
      const state = get();
      const currentFilters = { ...state.filters, ...filters };
      const currentPage = page ?? state.pagination.page;
      const offset = (currentPage - 1) * state.pagination.limit;

      // Fetch listings
      const listingsData = await cachedGraphQLRequest(
        MY_LISTINGS_QUERY,
        {
          status: currentFilters.status || null,
          limit: state.pagination.limit,
          offset,
        }
      );

      // Fetch total count
      const countData = await cachedGraphQLRequest(
        MY_LISTINGS_COUNT_QUERY,
        {
          status: currentFilters.status || null,
        }
      );

      set({
        listings: listingsData.myListings,
        filters: currentFilters,
        pagination: {
          ...state.pagination,
          page: currentPage,
          total: countData.myListingsCount,
        },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load listings',
        loading: false,
      });
    }
  },

  loadMyListingById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        MY_LISTING_BY_ID_QUERY,
        { id }
      );

      set({
        currentListing: data.myListingById,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load listing',
        loading: false,
      });
    }
  },

  updateMyListing: async (id: string, input: any) => {
    set({ loading: true, error: null });

    try {
      await cachedGraphQLRequest(UPDATE_MY_LISTING_MUTATION, {
        id,
        input,
      });

      // Invalidate cache and refresh listings
      invalidateGraphQLCache('myListings');
      await get().refreshMyListings();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update listing',
        loading: false,
      });
      throw error; // Re-throw for modal error handling
    }
  },

  deleteMyListing: async (id: string, soldViaPlatform: boolean = false) => {
    set({ loading: true, error: null });

    try {
      await cachedGraphQLRequest(DELETE_MY_LISTING_MUTATION, {
        id,
        soldViaPlatform,
      });

      // Invalidate cache and refresh listings
      invalidateGraphQLCache('myListings');
      await get().refreshMyListings();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete listing',
        loading: false,
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
