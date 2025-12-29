import { create } from 'zustand';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { GET_ACTIVE_AD_PACKAGES_QUERY } from './adPackagesStore.gql';
import type { AdPackage } from './types';

interface AdPackagesStore {
  packages: AdPackage[];
  isLoading: boolean;
  error: string | null;

  fetchActivePackages: () => Promise<void>;
  getPackageById: (id: string) => AdPackage | undefined;
  reset: () => void;
}

export const useAdPackagesStore = create<AdPackagesStore>((set, get) => ({
  packages: [],
  isLoading: false,
  error: null,

  fetchActivePackages: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await cachedGraphQLRequest(
        GET_ACTIVE_AD_PACKAGES_QUERY,
        {},
        { ttl: 5 * 60 * 1000 } // Cache for 5 minutes
      );

      const packages = data.activeAdPackages || [];

      // Sort by basePrice DESC (most expensive first)
      packages.sort((a: AdPackage, b: AdPackage) => b.basePrice - a.basePrice);

      set({ packages, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'فشل في جلب حزم الإعلانات',
        isLoading: false,
      });
    }
  },

  getPackageById: (id: string) => {
    const { packages } = get();
    return packages.find((pkg) => pkg.id === id);
  },

  reset: () => set({ packages: [], error: null }),
}));
