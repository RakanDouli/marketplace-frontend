import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminModule, AdminModulesState, ResolvedAdminRoute } from '@/lib/admin/types';
import { simpleGraphQLRequest, GET_ADMIN_MODULES } from './adminModules.gql';
import { ADMIN_MODULES_CONFIG, getModulesForRole, getModuleByKey, canUserAccessModule } from '@/lib/admin/config/admin-modules.config';
import { AdminRouteResolver } from '@/lib/admin/core/routing';

interface AdminModulesStore extends AdminModulesState {
  // Router instance
  router: AdminRouteResolver | null;

  // Actions
  loadModules: () => Promise<void>;
  refreshModules: () => Promise<void>;
  getAvailableModules: (userRole: string, userPermissions: string[]) => AdminModule[];
  resolveRoute: (slug: string[]) => ResolvedAdminRoute | null;
  canAccessModule: (moduleKey: string, userPermissions: string[]) => boolean;
  getNavigationItems: (userPermissions: string[]) => Array<{
    key: string;
    label: string;
    labelAr: string;
    icon: string;
    url: string;
    isActive: boolean;
  }>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeRouter: () => void;
}

const useAdminModulesStore = create<AdminModulesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      modules: [],
      availableModules: [],
      isLoading: false,
      error: null,
      router: null,

      // Initialize router with current modules
      initializeRouter: () => {
        const { modules } = get();
        const router = new AdminRouteResolver(modules);
        set({ router });
      },

      // Load modules (hybrid approach: config + backend)
      loadModules: async () => {
        const { isLoading } = get();
        if (isLoading) return; // Prevent duplicate requests

        set({ isLoading: true, error: null });

        try {
          // Start with configuration modules
          let modules = [...ADMIN_MODULES_CONFIG];

          // Try to fetch from backend for dynamic updates
          try {
            const data = await simpleGraphQLRequest(GET_ADMIN_MODULES);
            if (data?.adminModules && Array.isArray(data.adminModules)) {
              // Merge backend modules with config modules
              modules = data.adminModules;
            }
          } catch (backendError) {
            console.warn('Backend modules unavailable, using config:', backendError);
            // Continue with config modules if backend fails
          }

          // Initialize router with loaded modules
          const router = new AdminRouteResolver(modules);

          set({
            modules,
            router,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to load admin modules:', error);
          set({
            error: error instanceof Error ? error.message : 'فشل في تحميل وحدات الإدارة. Failed to load admin modules',
            isLoading: false
          });
        }
      },

      refreshModules: async () => {
        // Force refresh by clearing cache and reloading
        const { loadModules } = get();
        set({ modules: [], availableModules: [], router: null });
        await loadModules();
      },

      getAvailableModules: (userRole: string, userPermissions: string[]) => {
        const { modules } = get();

        // Use helper function from config
        const available = getModulesForRole(userRole, userPermissions);

        // Update availableModules state
        set({ availableModules: available });

        return available;
      },

      resolveRoute: (slug: string[]) => {
        const { router } = get();
        if (!router) {
          // If router not initialized, try to initialize it
          const { initializeRouter } = get();
          initializeRouter();
          const { router: newRouter } = get();
          if (!newRouter) return null;
          return newRouter.resolveRoute(slug);
        }
        return router.resolveRoute(slug);
      },

      canAccessModule: (moduleKey: string, userPermissions: string[]) => {
        return canUserAccessModule(moduleKey, userPermissions);
      },

      getNavigationItems: (userPermissions: string[]) => {
        const { router, availableModules } = get();
        if (!router) return [];

        const userModules = availableModules.length > 0
          ? availableModules
          : getModulesForRole('USER', userPermissions);

        return router.getNavigationItems(userModules);
      },

      // State management helpers
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'admin-modules-storage',
      partialize: (state) => ({
        // Only persist modules data, not loading/error states or router instance
        modules: state.modules
      })
    }
  )
);

export default useAdminModulesStore;

// Export types for convenience
export type { AdminModulesStore };