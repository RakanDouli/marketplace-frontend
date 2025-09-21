import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, AdminAuthState, UserRole } from '@/lib/admin/types';

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

// Temporary simplified authentication - TODO: Implement full Supabase flow
const mockAdminLogin = async (email: string, password: string) => {
  return new Promise<{
    success: boolean;
    token?: string;
    user?: AdminUser;
    error?: string;
  }>((resolve) => {
    setTimeout(() => {
      // Check against known seeded admin accounts from backend
      const adminAccounts = [
        { email: 'superadmin@marketplace.com', role: 'SUPER_ADMIN', name: 'Super Admin' },
        { email: 'admin@marketplace.com', role: 'ADMIN', name: 'Platform Admin' },
        { email: 'editor@marketplace.com', role: 'EDITOR', name: 'Content Editor' },
        { email: 'adsmanager@marketplace.com', role: 'ADS_MANAGER', name: 'Ads Manager' }
      ];

      const account = adminAccounts.find(acc => acc.email === email);

      if (!account) {
        resolve({
          success: false,
          error: 'هذا الحساب ليس له صلاحيات إدارية. يرجى استخدام حساب مدير. This account does not have admin privileges.'
        });
        return;
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

      resolve({
        success: true,
        token: 'mock_admin_token_' + Date.now(),
        user: {
          id: Date.now().toString(),
          email: account.email,
          name: account.name,
          role: account.role as UserRole,
          permissions,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      });
    }, 1000);
  });
};

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Enhanced login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Replace with actual backend authentication
          const response = await mockAdminLogin(email, password);

          if (response.success && response.token && response.user) {
            set({
              user: response.user,
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
            // Let the component handle the notification
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
          // Let the component handle the notification
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
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);