import { create } from 'zustand';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { GET_MY_LISTING_ANALYTICS_QUERY, GET_MY_ANALYTICS_SUMMARY_QUERY } from './listingAnalyticsStore.gql';
import type { ListingAnalytics, AnalyticsSummary } from './types';
import { useUserAuthStore } from '@/stores/userAuthStore';

interface ListingAnalyticsStore {
  // State
  listingAnalytics: ListingAnalytics | null;
  analyticsSummary: AnalyticsSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchListingAnalytics: (listingId: string, days?: number) => Promise<void>;
  fetchAnalyticsSummary: (days?: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useListingAnalyticsStore = create<ListingAnalyticsStore>((set) => ({
  // Initial state
  listingAnalytics: null,
  analyticsSummary: null,
  isLoading: false,
  error: null,

  // Fetch analytics for a specific listing
  fetchListingAnalytics: async (listingId: string, days = 30) => {
    // Check access at store level
    const { userPackage } = useUserAuthStore.getState();
    if (!userPackage?.userSubscription?.analyticsAccess) {
      console.warn('⚠️ No analytics access - skipping fetch');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        GET_MY_LISTING_ANALYTICS_QUERY,
        { listingId, days },
        { ttl: 0 } // No cache, always fetch fresh data
      );

      set({
        listingAnalytics: data.getMyListingAnalytics,
        isLoading: false,
      });
    } catch (err) {
      console.error('❌ Error fetching listing analytics:', err);
      set({
        error: err instanceof Error ? err.message : 'فشل في تحميل الإحصائيات',
        isLoading: false,
      });
    }
  },

  // Fetch analytics summary for all user's listings
  fetchAnalyticsSummary: async (days = 30) => {
    // Check access at store level
    const { userPackage } = useUserAuthStore.getState();
    if (!userPackage?.userSubscription?.analyticsAccess) {
      console.warn('⚠️ No analytics access - skipping fetch');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        GET_MY_ANALYTICS_SUMMARY_QUERY,
        { days },
        { ttl: 0 } // No cache, always fetch fresh data
      );

      set({
        analyticsSummary: data.getMyAnalyticsSummary,
        isLoading: false,
      });
    } catch (err) {
      console.error('❌ Error fetching analytics summary:', err);
      set({
        error: err instanceof Error ? err.message : 'فشل في تحميل ملخص الإحصائيات',
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    listingAnalytics: null,
    analyticsSummary: null,
    isLoading: false,
    error: null,
  }),
}));
