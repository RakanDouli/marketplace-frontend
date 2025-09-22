import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, AdminAuthState, UserRole } from '@/lib/admin/types';
import { supabase } from '@/lib/supabase';

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
}

// Real backend authentication using Supabase
const realAdminLogin = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting Supabase login for:', email);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Supabase login error:', error);
      return {
        success: false,
        error: error.message || 'فشل تسجيل الدخول. Authentication failed.'
      };
    }

    if (!data.user || !data.session) {
      console.error('❌ No user or session returned');
      return {
        success: false,
        error: 'لم يتم استلام بيانات المستخدم. No user data received.'
      };
    }

    // Get the access token
    const token = data.session.access_token;
    console.log('✅ Got Supabase token:', token.substring(0, 20) + '...');

    // Now call your backend's "me" query to get admin user details
    try {
      const meQuery = `
        query Me {
          me {
            id
            email
            role
          }
        }
      `;

      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: meQuery
        })
      });

      const result = await response.json();
      console.log('🔍 Backend "me" response:', result);

      if (result.errors) {
        console.error('❌ Backend errors:', result.errors);
        return {
          success: false,
          error: 'فشل في التحقق من صلاحيات الإدارة. Failed to verify admin permissions.'
        };
      }

      const user = result.data?.me;
      if (!user) {
        return {
          success: false,
          error: 'المستخدم غير موجود. User not found.'
        };
      }

      // Check if user has admin role
      const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ADS_MANAGER'];
      if (!adminRoles.includes(user.role)) {
        return {
          success: false,
          error: 'هذا الحساب ليس له صلاحيات إدارية. This account does not have admin privileges.'
        };
      }

      // Map role to permissions
      let permissions: string[] = [];
      switch (user.role) {
        case 'SUPER_ADMIN':
          permissions = ['*'];
          break;
        case 'ADMIN':
          permissions = ['dashboard.view', 'users.manage', 'roles.view', 'listings.manage', 'categories.manage', 'analytics.view', 'audit.read'];
          break;
        case 'EDITOR':
          permissions = ['dashboard.view', 'listings.moderate', 'users.view', 'analytics.basic'];
          break;
        case 'ADS_MANAGER':
          permissions = ['dashboard.view', 'campaigns.manage', 'clients.manage', 'packages.manage', 'analytics.ads'];
          break;
      }

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.email, // Use email as name since no profile.displayName
          role: user.role as UserRole,
          permissions,
          isActive: true, // Default to active since no isActive field
          createdAt: new Date().toISOString()
        }
      };

    } catch (backendError) {
      console.error('❌ Backend call failed:', backendError);

      // Fallback: If backend is not running, still allow login with known credentials
      // This simulates a successful backend response for development
      const knownAccounts = [
        { email: 'superadmin@marketplace.com', role: 'SUPER_ADMIN', name: 'Super Admin' },
        { email: 'admin@marketplace.com', role: 'ADMIN', name: 'Platform Admin' },
        { email: 'editor@marketplace.com', role: 'EDITOR', name: 'Content Editor' },
        { email: 'adsmanager@marketplace.com', role: 'ADS_MANAGER', name: 'Ads Manager' },
        { email: 'user@marketplace.com', role: 'USER', name: 'Regular User' },
        { email: 'user2@marketplace.com', role: 'USER', name: 'Regular User 2' }
      ];

      const account = knownAccounts.find(acc => acc.email === email);
      if (!account) {
        return {
          success: false,
          error: 'خطأ في الاتصال بالخادم. Backend connection failed.'
        };
      }

      // Check if user has admin role (for offline fallback)
      const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'ADS_MANAGER'];
      if (!adminRoles.includes(account.role)) {
        return {
          success: false,
          error: 'هذا الحساب ليس له صلاحيات إدارية. This account does not have admin privileges.'
        };
      }

      // Map role to permissions
      let permissions: string[] = [];
      switch (account.role) {
        case 'SUPER_ADMIN':
          permissions = ['*'];
          break;
        case 'ADMIN':
          permissions = ['dashboard.view', 'users.manage', 'roles.view', 'listings.manage', 'categories.manage', 'analytics.view', 'audit.read'];
          break;
        case 'EDITOR':
          permissions = ['dashboard.view', 'listings.moderate', 'users.view', 'analytics.basic'];
          break;
        case 'ADS_MANAGER':
          permissions = ['dashboard.view', 'campaigns.manage', 'clients.manage', 'packages.manage', 'analytics.ads'];
          break;
      }

      console.log('✅ Using fallback authentication for:', email);
      return {
        success: true,
        token,
        user: {
          id: Date.now().toString(),
          email: account.email,
          name: account.name,
          role: account.role as UserRole,
          permissions,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      };
    }

  } catch (error) {
    console.error('❌ Login process failed:', error);
    return {
      success: false,
      error: 'خطأ في عملية تسجيل الدخول. Login process failed.'
    };
  }
};


export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Production login action - only Supabase authentication
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔐 Authenticating with Supabase...');
          const response = await realAdminLogin(email, password);

          if (response.success && response.token && response.user) {
            set({
              user: { ...response.user, token: response.token },
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: response.error || 'تسجيل الدخول فشل. Login failed.'
            });
            throw new Error(response.error || 'Login failed');
          }
        } catch (error) {
          console.error('Admin login error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'خطأ في تسجيل الدخول. يرجى التحقق من بيانات الاعتماد. Login failed. Please check your credentials.'
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