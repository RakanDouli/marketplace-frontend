import { create } from 'zustand';
import { cachedGraphQLRequest, invalidateGraphQLCache } from '../../utils/graphql-cache';
import { uploadToCloudflareWithProgress, uploadVideoToR2, type ProgressCallback } from '@/utils/cloudflare-upload';
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

  // Image operations
  uploadListingImage: (listingId: string, file: File, currentImageKeys: string[], onProgress?: ProgressCallback) => Promise<string>;
  updateListingImages: (listingId: string, imageKeys: string[]) => Promise<void>;
  removeListingImage: (listingId: string, imageKeyToRemove: string, currentImageKeys: string[]) => Promise<void>;

  // Video operations
  uploadListingVideo: (listingId: string, file: File, onProgress?: ProgressCallback) => Promise<string>;
  updateListingVideoUrl: (listingId: string, videoUrl: string | null) => Promise<void>;
  removeListingVideo: (listingId: string) => Promise<void>;

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

  // ===== IMAGE OPERATIONS =====

  // Upload single image and update listing (use for single image upload)
  uploadListingImage: async (listingId: string, file: File, currentImageKeys: string[], onProgress?: ProgressCallback) => {
    try {
      const imageKey = await uploadToCloudflareWithProgress(file, 'image', onProgress);
      const newImageKeys = [...currentImageKeys, imageKey];
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id: listingId, input: { imageKeys: newImageKeys } },
        { ttl: 0 }
      );
      return imageKey;
    } catch (error: any) {
      throw new Error(error.message || 'فشل رفع الصورة');
    }
  },

  // Update listing with new image keys (use after bulk upload)
  updateListingImages: async (listingId: string, imageKeys: string[]) => {
    try {
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id: listingId, input: { imageKeys } },
        { ttl: 0 }
      );
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الصور');
    }
  },

  removeListingImage: async (listingId: string, imageKeyToRemove: string, currentImageKeys: string[]) => {
    try {
      const newImageKeys = currentImageKeys.filter(key => key !== imageKeyToRemove);
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id: listingId, input: { imageKeys: newImageKeys } },
        { ttl: 0 }
      );
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف الصورة');
    }
  },

  // ===== VIDEO OPERATIONS =====

  // Upload video and update listing
  uploadListingVideo: async (listingId: string, file: File, onProgress?: ProgressCallback) => {
    try {
      const videoUrl = await uploadVideoToR2(file, onProgress);
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id: listingId, input: { videoUrl } },
        { ttl: 0 }
      );
      return videoUrl;
    } catch (error: any) {
      throw new Error(error.message || 'فشل رفع الفيديو');
    }
  },

  // Update listing with video URL (use after external upload)
  updateListingVideoUrl: async (listingId: string, videoUrl: string | null) => {
    try {
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id: listingId, input: { videoUrl } },
        { ttl: 0 }
      );
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الفيديو');
    }
  },

  removeListingVideo: async (listingId: string) => {
    try {
      await cachedGraphQLRequest(
        UPDATE_MY_LISTING_MUTATION,
        { id: listingId, input: { videoUrl: null } },
        { ttl: 0 }
      );
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف الفيديو');
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
