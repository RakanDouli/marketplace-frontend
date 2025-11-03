import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cachedGraphQLRequest, invalidateGraphQLCache } from '@/utils/graphql-cache';
import {
  ADD_TO_WISHLIST_MUTATION,
  REMOVE_FROM_WISHLIST_MUTATION,
  MY_WISHLIST_QUERY,
  IS_IN_MY_WISHLIST_QUERY,
} from './wishlistStore.gql';

interface Listing {
  id: string;
  title: string;
  priceMinor: number;
  status: string;
  imageKeys: string[];
  wishlistCount: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
  };
  prices: Array<{
    currency: string;
    value: number;
  }>;
  user: {
    id: string;
    name: string | null;
    accountType: string;
    accountBadge: string;
    companyName: string | null;
    businessVerified: boolean;
  };
}

interface WishlistStore {
  // State
  wishlistIds: Set<string>;
  listings: Listing[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMyWishlist: () => Promise<void>;
  addToWishlist: (listingId: string, isArchived?: boolean) => Promise<void>;
  removeFromWishlist: (listingId: string, isArchived?: boolean) => Promise<void>;
  toggleWishlist: (listingId: string, isArchived?: boolean) => Promise<void>;
  isInWishlist: (listingId: string) => boolean;
  clearError: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      // Initial state
      wishlistIds: new Set<string>(),
      listings: [],
      isLoading: false,
      error: null,

      // Load user's wishlist
      loadMyWishlist: async () => {
        set({ isLoading: true, error: null });

        try {
          const data = await cachedGraphQLRequest(
            MY_WISHLIST_QUERY,
            {},
            { ttl: 2 * 60 * 1000 } // Cache for 2 minutes
          );

          const listings = data.myWishlist || [];
          const wishlistIds = new Set(listings.map((l: Listing) => l.id));

          set({
            listings,
            wishlistIds,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Error loading wishlist:', error);
          set({
            error: error.message || 'فشل تحميل المفضلة',
            isLoading: false,
          });
        }
      },

      // Add listing to wishlist
      addToWishlist: async (listingId: string, isArchived: boolean = false) => {
        set({ isLoading: true, error: null });

        try {
          await cachedGraphQLRequest(
            ADD_TO_WISHLIST_MUTATION,
            { listingId, isArchived },
            { ttl: 0 } // No cache for mutations
          );

          // Update local state optimistically
          set((state) => ({
            wishlistIds: new Set([...state.wishlistIds, listingId]),
            isLoading: false,
          }));

          // Invalidate wishlist cache
          invalidateGraphQLCache('myWishlist');
        } catch (error: any) {
          console.error('Error adding to wishlist:', error);
          set({
            error: error.message || 'فشل إضافة الإعلان إلى المفضلة',
            isLoading: false,
          });
          throw error;
        }
      },

      // Remove listing from wishlist
      removeFromWishlist: async (listingId: string, isArchived: boolean = false) => {
        set({ isLoading: true, error: null });

        try {
          await cachedGraphQLRequest(
            REMOVE_FROM_WISHLIST_MUTATION,
            { listingId, isArchived },
            { ttl: 0 } // No cache for mutations
          );

          // Update local state optimistically
          set((state) => {
            const newWishlistIds = new Set(state.wishlistIds);
            newWishlistIds.delete(listingId);

            return {
              wishlistIds: newWishlistIds,
              listings: state.listings.filter((l) => l.id !== listingId),
              isLoading: false,
            };
          });

          // Invalidate wishlist cache
          invalidateGraphQLCache('myWishlist');
        } catch (error: any) {
          console.error('Error removing from wishlist:', error);
          set({
            error: error.message || 'فشل إزالة الإعلان من المفضلة',
            isLoading: false,
          });
          throw error;
        }
      },

      // Toggle wishlist (add if not in wishlist, remove if in wishlist)
      toggleWishlist: async (listingId: string, isArchived: boolean = false) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();

        if (isInWishlist(listingId)) {
          await removeFromWishlist(listingId, isArchived);
        } else {
          await addToWishlist(listingId, isArchived);
        }
      },

      // Check if listing is in wishlist (fast lookup using Set)
      isInWishlist: (listingId: string) => {
        return get().wishlistIds.has(listingId);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'wishlist-storage',
      // Only persist wishlistIds (Set needs custom serialization)
      partialize: (state) => ({
        wishlistIds: Array.from(state.wishlistIds), // Convert Set to Array for storage
      }),
      // Convert Array back to Set on hydration
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.wishlistIds)) {
          state.wishlistIds = new Set(state.wishlistIds as unknown as string[]);
        }
      },
    }
  )
);
