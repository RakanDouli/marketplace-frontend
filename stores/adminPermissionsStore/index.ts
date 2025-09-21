import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminPermissionsState } from '@/lib/admin/types';

interface AdminPermissionsStore extends AdminPermissionsState {
  loadModulePermissions: (moduleKey: string) => Promise<void>;
  checkModulePermission: (module: string, resource: string, action: string, field?: string) => Promise<boolean>;
  loadUserPermissions: (userId?: string) => Promise<void>;
  canAccessField: (module: string, resource: string, field: string, action: 'read' | 'write') => Promise<boolean>;
  canEditField: (module: string, resource: string, field: string) => boolean;
  canReadField: (module: string, resource: string, field: string) => boolean;
  canCreate: (module: string, resource: string) => boolean;
  canRead: (module: string, resource: string) => boolean;
  canUpdate: (module: string, resource: string) => boolean;
  canDelete: (module: string, resource: string) => boolean;
  canPerformAction: (module: string, resource: string, action: string) => boolean;
  getAllowedActions: (module: string, resource: string) => string[];
  getEditableFields: (module: string, resource: string) => string[];
  getReadableFields: (module: string, resource: string) => string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearPermissions: () => void;
}

const useAdminPermissionsStore = create<AdminPermissionsStore>()(
  persist(
    (set, get) => ({
      permissions: [],
      userRole: null,
      isLoading: false,
      error: null,

      loadModulePermissions: async (moduleKey: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Loading permissions for module:', moduleKey);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load permissions',
            isLoading: false
          });
        }
      },

      checkModulePermission: async () => true,

      loadUserPermissions: async (userId?: string) => {
        if (!userId) return;
        set({ isLoading: true, error: null });
        try {
          set({ userRole: 'ADMIN', permissions: [], isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load user permissions',
            isLoading: false
          });
        }
      },

      canAccessField: async () => true,

      canEditField: () => true,
      canReadField: () => true,
      canCreate: () => true,
      canRead: () => true,
      canUpdate: () => true,
      canDelete: () => true,
      canPerformAction: () => true,
      getAllowedActions: () => ['*'],
      getEditableFields: () => ['*'],
      getReadableFields: () => ['*'],
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      clearPermissions: () => set({ permissions: [], userRole: null })
    }),
    {
      name: 'admin-permissions-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        permissions: state.permissions
      })
    }
  )
);

export default useAdminPermissionsStore;
export { useAdminPermissionsStore };
export type { AdminPermissionsStore };