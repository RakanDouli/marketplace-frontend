import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types matching our backend
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AdminAuthState {
  // Auth state
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

// Flexible admin login - accepts any credentials for development
const mockAdminLogin = async (email: string, password: string) => {
  return new Promise<{
    success: boolean;
    token?: string;
    user?: AdminUser;
    error?: string;
  }>((resolve) => {
    setTimeout(() => {
      // Accept any credentials for development - replace with actual backend auth later
      if (email && password) {
        resolve({
          success: true,
          token: 'admin_token_' + Date.now(),
          user: {
            id: '1',
            email: email,
            name: email.includes('superadmin') ? 'Super Admin' : 'Admin User',
            role: 'SUPER_ADMIN',
            permissions: [
              'roles.manage',
              'subscriptions.manage',
              'analytics.view',
              'email_templates.manage',
              'campaigns.manage',
              'categories.manage',
              'listings.manage'
            ]
          }
        });
      } else {
        resolve({
          success: false,
          error: 'Please enter both email and password.'
        });
      }
    }, 1000);
  });
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Replace with actual Supabase authentication
          const response = await mockAdminLogin(email, password);

          if (response.success && response.token && response.user) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: response.error || 'Login failed'
            });
          }
        } catch (error) {
          console.error('Admin login error:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Login failed. Please check your credentials.'
          });
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Permission checking
      checkPermission: (permission: string) => {
        const { user } = get();
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
      },

      // Refresh authentication (check if token is still valid)
      refreshAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          // TODO: Replace with actual token validation against backend
          // For now, just verify the mock token format
          if (token.startsWith('mock_admin_token_')) {
            set({ isAuthenticated: true });
          } else {
            set({ isAuthenticated: false, user: null, token: null });
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          set({ isAuthenticated: false, user: null, token: null });
        }
      },

      // Clear error
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