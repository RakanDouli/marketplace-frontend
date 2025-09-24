import { create } from 'zustand';
import { GET_ALL_FEATURES_QUERY } from '../adminRolesStore/adminRolesStore.gql';

export interface AdminFeature {
  id: string;
  name: string;
  description: string;
  displayName: string;
  icon: string;
  defaultPermissions: string;
  isActive: boolean;
}

export interface AdminModule {
  key: string;
  name: string;
  nameAr: string;
  icon: string;
  basePath: string;
  feature: string;
  isActive: boolean;
}

interface AdminFeaturesState {
  // Data
  features: AdminFeature[];
  modules: AdminModule[];

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  loadFeatures: () => Promise<void>;
  getAvailableModules: (permissions: any) => AdminModule[];
  clearError: () => void;
}

// Helper function for GraphQL calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  try {
    const authData = typeof window !== 'undefined' ? localStorage.getItem('admin-auth-storage') : null;
    const token = authData ? JSON.parse(authData).state?.user?.token : null;

    console.log('🔑 AdminFeaturesStore: Auth token exists:', !!token);

    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth token if available
        ...(token && {
          Authorization: `Bearer ${token}`
        }),
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log('📡 AdminFeaturesStore: Response status:', response.status);
    const result = await response.json();
    console.log('📦 AdminFeaturesStore: Response result:', result);

    if (result.errors) {
      console.error('❌ AdminFeaturesStore: GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data;
  } catch (error) {
    console.error('❌ AdminFeaturesStore: GraphQL call failed:', error);
    throw error;
  }
};

// Convert backend feature to frontend admin module
const featureToModule = (feature: AdminFeature): AdminModule => {
  // Convert feature name to URL slug (e.g., 'ad_packages' -> 'ad-packages')
  const urlSlug = feature.name.replace(/_/g, '-');

  return {
    key: feature.name,
    name: feature.description || feature.name,
    nameAr: feature.displayName || feature.description || feature.name,
    icon: feature.icon || 'Package',
    basePath: `/admin/${urlSlug}`,
    feature: feature.name,
    isActive: feature.isActive
  };
};

export const useAdminFeaturesStore = create<AdminFeaturesState>((set, get) => ({
  // Initial state
  features: [],
  modules: [],
  loading: false,
  error: null,

  // Load all features from backend
  loadFeatures: async () => {
    const { loading } = get();
    if (loading) return;

    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_ALL_FEATURES_QUERY);
      const features = (data.getAllFeatures || []) as AdminFeature[];

      console.log('🎯 AdminFeaturesStore: Loaded', features.length, 'features from backend');

      // Convert features to modules
      const modules = features
        .filter(f => f.isActive)
        .map(featureToModule)
        .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));

      set({ features, modules, loading: false });
    } catch (error) {
      console.error('Failed to load admin features:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في تحميل الميزات',
        loading: false
      });
    }
  },

  // Get available modules filtered by user permissions
  getAvailableModules: (permissions: any) => {
    const { modules } = get();
    console.log('🔐 AdminFeaturesStore: getAvailableModules called');
    console.log('📊 Total modules loaded:', modules.length);
    console.log('👤 Permissions object:', permissions);

    const filteredModules = modules.filter(module => {
      const hasAccess = permissions?.canAccess?.(module.feature, 'view') || false;
      console.log(`🔍 Module ${module.feature}: ${hasAccess ? '✅' : '❌'}`);
      return hasAccess;
    });

    console.log('🎯 Filtered modules count:', filteredModules.length);
    return filteredModules;
  },

  clearError: () => set({ error: null })
}));