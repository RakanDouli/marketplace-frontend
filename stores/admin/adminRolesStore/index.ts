import { create } from 'zustand';
import {
  GET_ALL_ROLES_QUERY,
  GET_ROLE_WITH_PERMISSIONS_QUERY,
  CREATE_ROLE_MUTATION,
  UPDATE_ROLE_PERMISSIONS_MUTATION,
  DELETE_ROLE_MUTATION,
  GET_ALL_FEATURES_QUERY,
  ASSIGN_ROLE_TO_USER_MUTATION
} from './adminRolesStore.gql';

export interface Role {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  featurePermissions?: string; // JSON string of feature permissions
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export interface FeaturePermissions {
  view: boolean;
  create: boolean;
  modify: boolean;
  delete: boolean;
}

export interface RoleWithPermissions extends Role {
  featurePermissionsObject: Record<string, FeaturePermissions>;
}

interface AdminRolesState {
  // Data
  roles: Role[];
  features: Feature[];
  selectedRole: Role | null;

  // UI State
  loading: boolean;
  error: string | null;

  // CRUD Operations
  loadRoles: () => Promise<void>;
  loadFeatures: () => Promise<void>;
  loadRoleWithPermissions: (roleId: string) => Promise<RoleWithPermissions | null>;
  createRole: (roleData: { name: string; description: string; featurePermissions: Record<string, FeaturePermissions> }) => Promise<void>;
  updateRolePermissions: (roleId: string, featurePermissions: Record<string, FeaturePermissions>) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRoleToUser: (userId: string, roleId: string) => Promise<void>;

  // UI Actions
  setSelectedRole: (role: Role | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Helper function for GraphQL calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  try {
    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth token if available
        ...(typeof window !== 'undefined' && localStorage.getItem('admin-auth-storage') && {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('admin-auth-storage') || '{}').state?.user?.token}`
        }),
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL call failed:', error);
    throw error;
  }
};

export const useAdminRolesStore = create<AdminRolesState>((set, get) => ({
  // Initial state
  roles: [],
  features: [],
  selectedRole: null,
  loading: false,
  error: null,

  // Load all roles
  loadRoles: async () => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_ALL_ROLES_QUERY);
      const roles = data.getAllCustomRoles || [];
      set({ roles, loading: false });
    } catch (error) {
      console.error('Failed to load roles:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في تحميل الأدوار',
        loading: false
      });
    }
  },

  // Load all features
  loadFeatures: async () => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_ALL_FEATURES_QUERY);
      const features = data.getAllFeatures || [];
      set({ features, loading: false });
    } catch (error) {
      console.error('Failed to load features:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في تحميل الميزات',
        loading: false
      });
    }
  },

  // Load role with permissions
  loadRoleWithPermissions: async (roleId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_ROLE_WITH_PERMISSIONS_QUERY, { roleId });
      const role = data.getRoleWithPermissions;

      if (role) {
        const featurePermissionsObject = role.featurePermissions
          ? JSON.parse(role.featurePermissions)
          : {};

        set({ loading: false });
        return { ...role, featurePermissionsObject };
      }

      set({ loading: false });
      return null;
    } catch (error) {
      console.error('Failed to load role permissions:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في تحميل صلاحيات الدور',
        loading: false
      });
      return null;
    }
  },

  // Create new role
  createRole: async (roleData) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(CREATE_ROLE_MUTATION, {
        input: {
          name: roleData.name,
          description: roleData.description,
          featurePermissions: JSON.stringify(roleData.featurePermissions)
        }
      });

      if (data.createCustomRole) {
        // Reload roles after creation
        await get().loadRoles();
      }

      set({ loading: false });
    } catch (error) {
      console.error('Failed to create role:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في إنشاء الدور',
        loading: false
      });
      throw error;
    }
  },

  // Update role permissions
  updateRolePermissions: async (roleId: string, featurePermissions: Record<string, FeaturePermissions>) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(UPDATE_ROLE_PERMISSIONS_MUTATION, {
        roleId,
        featurePermissions: JSON.stringify(featurePermissions)
      });

      if (data.updateRolePermissions) {
        // Reload roles after update
        await get().loadRoles();
      }

      set({ loading: false });
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في تحديث صلاحيات الدور',
        loading: false
      });
      throw error;
    }
  },

  // Delete role
  deleteRole: async (roleId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(DELETE_ROLE_MUTATION, { roleId });

      if (data.deleteCustomRole) {
        // Remove role from local state
        const currentRoles = get().roles;
        const updatedRoles = currentRoles.filter(role => role.id !== roleId);
        set({ roles: updatedRoles });
      }

      set({ loading: false });
    } catch (error) {
      console.error('Failed to delete role:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في حذف الدور',
        loading: false
      });
      throw error;
    }
  },

  // Assign role to user
  assignRoleToUser: async (userId: string, roleId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(ASSIGN_ROLE_TO_USER_MUTATION, {
        userId,
        roleId
      });

      set({ loading: false });
    } catch (error) {
      console.error('Failed to assign role to user:', error);
      set({
        error: error instanceof Error ? error.message : 'فشل في تعيين الدور للمستخدم',
        loading: false
      });
      throw error;
    }
  },

  // UI Actions
  setSelectedRole: (role) => set({ selectedRole: role }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));