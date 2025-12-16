import { create } from 'zustand';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY } from './subscriptionPlansStore.gql';
import type { SubscriptionPlan } from './types';

interface SubscriptionPlansStore {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;

  fetchPublicPlans: (forceRefresh?: boolean) => Promise<void>;
  getPlanByAccountType: (accountType: string) => SubscriptionPlan | undefined;
  reset: () => void;
}

export const useSubscriptionPlansStore = create<SubscriptionPlansStore>((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,

  fetchPublicPlans: async (forceRefresh = false) => {
    set({ isLoading: true, error: null });

    try {
      // Use shorter cache (1 minute) and allow force refresh
      const data = await cachedGraphQLRequest(
        GET_PUBLIC_SUBSCRIPTION_PLANS_QUERY,
        {},
        { ttl: forceRefresh ? 0 : 1 * 60 * 1000 } // 1 minute cache, or bypass on force refresh
      );

      const plans = data.userSubscriptions || [];

      // Sort by sortOrder
      plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder);

      set({ plans, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في جلب خطط الاشتراك',
        isLoading: false,
      });
    }
  },

  getPlanByAccountType: (accountType: string) => {
    const { plans } = get();
    return plans.find((plan) => plan.accountType === accountType);
  },

  reset: () => set({ plans: [], error: null }),
}));
