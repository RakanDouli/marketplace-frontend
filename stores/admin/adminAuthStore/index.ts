import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, AdminAuthState, UserRole } from '@/lib/admin/types';
import { supabase } from '@/lib/supabase';
import { ME_QUERY } from './adminAuth.gql';

// Types for GraphQL responses
interface RoleData {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
}

// Helper function to convert feature permissions to legacy permission strings
function convertFeaturePermissionsToLegacy(featurePermissions: any): string[] {
  const legacyPermissions: string[] = [];

  for (const [feature, permissions] of Object.entries(featurePermissions)) {
    const featurePerms = permissions as any;
    if (featurePerms.view) legacyPermissions.push(`${feature}.view`);
    if (featurePerms.create) legacyPermissions.push(`${feature}.create`);
    if (featurePerms.modify) legacyPermissions.push(`${feature}.modify`);
    if (featurePerms.delete) legacyPermissions.push(`${feature}.delete`);
  }

  return legacyPermissions;
}

// All permissions now come dynamically from backend - no hardcoded fallbacks

// Enhanced admin auth state interface
interface AdminAuthStore extends AdminAuthState {
  // Additional actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Token expiration management
  extendSession: () => Promise<void>;
  checkTokenExpiration: () => boolean;
  getTimeUntilExpiration: () => number;
  startExpirationWarning: () => void;
  dismissExpirationWarning: () => void;
  incrementExtensionAttempts: () => void;
  resetExtensionAttempts: () => void;
  triggerExpirationModal: () => void;
}

// Helper function for API calls with proper Supabase token
const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};


export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      showExpirationWarning: false,
      sessionExtensionAttempts: 0,
      lastExtensionAt: undefined,

      // Supabase authentication with backend role validation
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔐 Authenticating with Supabase...', email);

          // Step 1: Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('❌ Supabase auth error:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'خطأ في تسجيل الدخول. يرجى التحقق من بيانات الاعتماد. Login failed. Please check your credentials.'
            });
            throw new Error(error.message);
          }

          if (!data.session?.access_token) {
            throw new Error('No access token received from Supabase');
          }

          const token = data.session.access_token;
          console.log('✅ Supabase authentication successful');

          // Step 2: Call backend "me" query with Supabase token
          try {
            const meData = await makeGraphQLCall(ME_QUERY, {}, token);
            console.log('🔍 Backend "me" response:', meData);

            const user = meData?.me?.user;
            const tokenExpiresAt = meData?.me?.tokenExpiresAt;

            if (!user) {
              throw new Error('المستخدم غير موجود. User not found.');
            }

            console.log('✅ Backend user data received:', { user, tokenExpiresAt });

            // Step 3: Extract permissions directly from roleEntity (no separate API call needed!)
            let userPermissions = {};
            let permissions: string[] = [];

            if (user.roleEntity && user.roleEntity.featurePermissions) {
              // Parse permissions directly from the roleEntity
              try {
                userPermissions = JSON.parse(user.roleEntity.featurePermissions);
                permissions = convertFeaturePermissionsToLegacy(userPermissions);

                // Check if super admin (has all permissions)
                const featureCount = Object.keys(userPermissions).length;
                const hasAllPermissions = Object.values(userPermissions).every((perms: any) =>
                  perms.view && perms.create && perms.modify && perms.delete
                );

                if (featureCount > 10 && hasAllPermissions) {
                  permissions = ['*']; // Super admin
                }

                console.log(`✅ Permissions loaded directly from roleEntity for role ${user.role}:`, { userPermissions, permissions });
              } catch (parseError) {
                console.error('❌ Error parsing roleEntity.featurePermissions:', parseError);
                userPermissions = {};
                permissions = [];
              }
            } else {
              console.warn(`⚠️ User has role '${user.role}' but no roleEntity or featurePermissions. Using fallback permissions.`);

              // Provide fallback permissions based on role string
              switch (user.role) {
                case 'SUPER_ADMIN':
                  permissions = ['*'];
                  userPermissions = { users: { view: true, create: true, modify: true, delete: true } };
                  break;
                case 'ADMIN':
                  permissions = ['users.view', 'users.modify', 'listings.view', 'listings.modify'];
                  userPermissions = {
                    users: { view: true, modify: true },
                    listings: { view: true, modify: true }
                  };
                  break;
                case 'EDITOR':
                  permissions = ['listings.view', 'listings.modify', 'users.view'];
                  userPermissions = {
                    listings: { view: true, modify: true },
                    users: { view: true }
                  };
                  break;
                case 'ADS_MANAGER':
                  permissions = ['campaigns.view', 'campaigns.create', 'campaigns.modify'];
                  userPermissions = {
                    campaigns: { view: true, create: true, modify: true }
                  };
                  break;
                default:
                  permissions = [];
                  userPermissions = {};
              }

              console.log(`✅ Using fallback permissions for role ${user.role}:`, { userPermissions, permissions });
            }

            // Use token expiration from backend if available, otherwise fallback to Supabase expiration
            const finalTokenExpiresAt = tokenExpiresAt
              ? new Date(tokenExpiresAt).getTime() // Convert ISO string to timestamp
              : (data.session.expires_at
                ? data.session.expires_at * 1000 // Convert to milliseconds
                : Date.now() + (60 * 60 * 1000)); // 1 hour fallback

            set({
              user: {
                id: user.id,
                email: user.email,
                name: user.name || user.email, // Use name from backend or fallback to email
                role: user.role as UserRole,
                permissions,
                featurePermissions: userPermissions, // Store the feature-based permissions
                isActive: true, // Default to active since no isActive field
                createdAt: new Date().toISOString(),
                tokenExpiresAt: finalTokenExpiresAt,
                token
              },
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

          } catch (backendError) {
            console.error('❌ Backend call failed:', backendError);
            throw new Error('خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم الخلفي. Backend connection failed. Please ensure the backend server is running.');
          }

        } catch (error) {
          console.error('Admin login error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'خطأ في تسجيل الدخول. يرجى التحقق من بيانات الاعتماد. Login failed. Please check your credentials.'
          });
          throw error;
        }
      },

      // Enhanced logout action
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });

        // Clear any persisted admin data
        localStorage.removeItem('admin-modules-storage');
        localStorage.removeItem('admin-permissions-storage');
      },

      // Enhanced permission checking
      checkPermission: (permission: string) => {
        const { user } = get();
        if (!user || !user.permissions) return false;

        // Super admin has all permissions
        if (user.permissions.includes('*')) return true;

        return user.permissions.includes(permission);
      },

      // Check if user has any of the specified permissions
      hasAnyPermission: (permissions: string[]) => {
        const { user } = get();
        if (!user || !user.permissions) return false;

        // Super admin has all permissions
        if (user.permissions.includes('*')) return true;

        return permissions.some(permission => user.permissions.includes(permission));
      },

      // Check if user has all of the specified permissions
      hasAllPermissions: (permissions: string[]) => {
        const { user } = get();
        if (!user || !user.permissions) return false;

        // Super admin has all permissions
        if (user.permissions.includes('*')) return true;

        return permissions.every(permission => user.permissions.includes(permission));
      },

      // Enhanced authentication refresh
      refreshAuth: async () => {
        const state = get();
        if (!state.user) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          // TODO: Replace with actual token validation against backend
          // For now, just verify we have a valid user object
          if (state.user.id && state.user.email && state.user.role) {
            set({ isAuthenticated: true });
          } else {
            set({ isAuthenticated: false, user: null });
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          set({ isAuthenticated: false, user: null });
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Token expiration management
      extendSession: async () => {
        const state = get();
        if (!state.user || !state.user.token) {
          throw new Error('No active session to extend');
        }

        try {
          console.log('🔄 Extending Supabase session...');

          // Refresh the Supabase session
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error('❌ Session extension failed:', error);
            throw new Error('Failed to extend session');
          }

          if (data.session) {
            const newExpiresAt = data.session.expires_at
              ? data.session.expires_at * 1000
              : Date.now() + (60 * 60 * 1000);

            set({
              user: {
                ...state.user,
                token: data.session.access_token,
                tokenExpiresAt: newExpiresAt
              },
              showExpirationWarning: false,
              sessionExtensionAttempts: state.sessionExtensionAttempts + 1,
              lastExtensionAt: Date.now()
            });

            console.log('✅ Session extended successfully');
          } else {
            throw new Error('No session returned from refresh');
          }
        } catch (error) {
          console.error('Session extension error:', error);
          set({
            sessionExtensionAttempts: state.sessionExtensionAttempts + 1
          });
          throw error;
        }
      },

      checkTokenExpiration: () => {
        const { user } = get();
        if (!user || !user.tokenExpiresAt) return false;

        const now = Date.now();
        const timeUntilExpiry = user.tokenExpiresAt - now;

        // Return true if token has expired
        return timeUntilExpiry <= 0;
      },

      getTimeUntilExpiration: () => {
        const { user } = get();
        if (!user || !user.tokenExpiresAt) return 0;

        const now = Date.now();
        const timeUntilExpiry = user.tokenExpiresAt - now;

        // Return seconds until expiration (or 0 if already expired)
        return Math.max(0, Math.floor(timeUntilExpiry / 1000));
      },

      startExpirationWarning: () => {
        set({ showExpirationWarning: true });
      },

      dismissExpirationWarning: () => {
        set({ showExpirationWarning: false });
      },

      incrementExtensionAttempts: () => {
        const state = get();
        set({
          sessionExtensionAttempts: state.sessionExtensionAttempts + 1
        });
      },

      resetExtensionAttempts: () => {
        set({
          sessionExtensionAttempts: 0,
          lastExtensionAt: undefined
        });
      },

      // Manual trigger for when we detect token expiration
      triggerExpirationModal: () => {
        const state = get();
        console.log('🚨 Manually triggering expiration modal');

        // Set a very short expiration time to trigger the modal
        if (state.user) {
          set({
            user: {
              ...state.user,
              tokenExpiresAt: Date.now() + 20 * 1000 // 20 seconds
            },
            showExpirationWarning: true
          });
        }
      }
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);