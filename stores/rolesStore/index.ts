import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for roles and permissions
export interface Permission {
  feature: string;
  action: string;
  scope?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  key: string;
  name: string;
  nameAr: string;
  description: string;
  actions: string[];
}

interface RolesState {
  roles: Role[];
  features: Feature[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface RolesStore extends RolesState {
  // Actions
  loadRoles: () => Promise<void>;
  loadFeatures: () => Promise<void>;
  refreshRoles: () => Promise<void>;

  // Role management
  createRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Role>;
  updateRole: (id: string, roleData: Partial<Role>) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  updateRolePermissions: (roleId: string, permissions: Permission[]) => Promise<Role>;

  // Getters
  getRoleById: (id: string) => Role | undefined;
  getRolesByPermission: (feature: string, action: string) => Role[];
  getPermissionsForRole: (roleId: string) => Permission[];

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// GraphQL queries
const GET_ROLES_QUERY = `
  query GetAllCustomRoles {
    getAllCustomRoles {
      id
      name
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_FEATURES_QUERY = `
  query GetAllFeatures {
    getAllFeatures {
      key
      name
      nameAr
      description
      actions
    }
  }
`;

const GET_ROLE_WITH_PERMISSIONS_QUERY = `
  query GetRoleWithPermissions($roleId: ID!) {
    getRoleWithPermissions(roleId: $roleId) {
      id
      name
      description
      permissions {
        feature
        action
        scope
      }
    }
  }
`;

// GraphQL request helper
const graphQLRequest = async (query: string, variables?: any, requireAuth = true) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if required
    if (requireAuth) {
      const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('Authentication required');
      }
    }

    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
};

const useRolesStore = create<RolesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      roles: [],
      features: [],
      isLoading: false,
      error: null,
      lastFetch: null,

      // Load roles from backend
      loadRoles: async () => {
        const { isLoading, lastFetch } = get();

        // Prevent duplicate requests and add basic caching (5 minutes)
        const now = Date.now();
        if (isLoading || (lastFetch && now - lastFetch < 5 * 60 * 1000)) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const data = await graphQLRequest(GET_ROLES_QUERY);

          if (data?.getAllCustomRoles) {
            set({
              roles: data.getAllCustomRoles,
              isLoading: false,
              lastFetch: now
            });
          } else {
            throw new Error('No roles data received');
          }
        } catch (error) {
          console.error('Failed to load roles:', error);
          set({
            error: error instanceof Error ? error.message : 'فشل في تحميل الأدوار',
            isLoading: false
          });
        }
      },

      // Load features from backend
      loadFeatures: async () => {
        try {
          const data = await graphQLRequest(GET_FEATURES_QUERY);

          if (data?.getAllFeatures) {
            set({ features: data.getAllFeatures });
          }
        } catch (error) {
          console.error('Failed to load features:', error);
          // Features are not critical, so don't show error to user
        }
      },

      // Force refresh roles
      refreshRoles: async () => {
        set({ lastFetch: null, roles: [] });
        await get().loadRoles();
      },

      // Create new role
      createRole: async (roleData) => {
        try {
          set({ isLoading: true, error: null });

          // This would be a mutation - placeholder for now
          // const data = await graphQLRequest(CREATE_ROLE_MUTATION, { input: roleData });

          // For now, refresh the roles list
          await get().refreshRoles();

          // Return placeholder - in real implementation, return the created role
          return {
            ...roleData,
            id: `temp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'فشل في إنشاء الدور', isLoading: false });
          throw error;
        }
      },

      // Update role
      updateRole: async (id, roleData) => {
        try {
          set({ isLoading: true, error: null });

          // This would be a mutation - placeholder for now
          // const data = await graphQLRequest(UPDATE_ROLE_MUTATION, { id, input: roleData });

          // For now, update locally and refresh
          const { roles } = get();
          const updatedRoles = roles.map(role =>
            role.id === id ? { ...role, ...roleData, updatedAt: new Date().toISOString() } : role
          );

          set({ roles: updatedRoles, isLoading: false });

          return updatedRoles.find(r => r.id === id)!;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'فشل في تحديث الدور', isLoading: false });
          throw error;
        }
      },

      // Delete role
      deleteRole: async (id) => {
        try {
          set({ isLoading: true, error: null });

          // This would be a mutation - placeholder for now
          // await graphQLRequest(DELETE_ROLE_MUTATION, { id });

          // For now, remove locally
          const { roles } = get();
          const filteredRoles = roles.filter(role => role.id !== id);

          set({ roles: filteredRoles, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'فشل في حذف الدور', isLoading: false });
          throw error;
        }
      },

      // Update role permissions
      updateRolePermissions: async (roleId, permissions) => {
        try {
          set({ isLoading: true, error: null });

          // This would be a mutation - placeholder for now
          // const data = await graphQLRequest(UPDATE_ROLE_PERMISSIONS_MUTATION, { roleId, permissions });

          // For now, update locally
          const { roles } = get();
          const updatedRoles = roles.map(role =>
            role.id === roleId
              ? { ...role, permissions, updatedAt: new Date().toISOString() }
              : role
          );

          set({ roles: updatedRoles, isLoading: false });

          return updatedRoles.find(r => r.id === roleId)!;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'فشل في تحديث صلاحيات الدور', isLoading: false });
          throw error;
        }
      },

      // Getters
      getRoleById: (id) => {
        const { roles } = get();
        return roles.find(role => role.id === id);
      },

      getRolesByPermission: (feature, action) => {
        const { roles } = get();
        return roles.filter(role =>
          role.permissions.some(perm =>
            perm.feature === feature && perm.action === action
          )
        );
      },

      getPermissionsForRole: (roleId) => {
        const role = get().getRoleById(roleId);
        return role?.permissions || [];
      },

      // State management
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'roles-storage',
      partialize: (state) => ({
        // Only persist roles and features, not loading/error states
        roles: state.roles,
        features: state.features,
        lastFetch: state.lastFetch
      })
    }
  )
);

export default useRolesStore;
export type { RolesStore };