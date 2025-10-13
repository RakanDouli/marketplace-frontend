import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser, UserAuthState, AccountType } from './types';
import { supabase } from '@/lib/supabase';
import { ME_QUERY } from './userAuth.gql';

// Helper function for GraphQL API calls
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

interface UserAuthActions {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, accountType: AccountType) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;

  // Modal control
  openAuthModal: (view?: 'login' | 'signup' | 'magic-link') => void;
  closeAuthModal: () => void;
  switchAuthView: (view: 'login' | 'signup' | 'magic-link') => void;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateUser: (userData: Partial<PublicUser>) => void;
}

type UserAuthStore = UserAuthState & UserAuthActions;

export const useUserAuthStore = create<UserAuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      userPackage: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      showAuthModal: false,
      authModalView: 'login',

      // Login with email/password
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔐 Authenticating user with Supabase...', email);

          // Step 1: Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('❌ Supabase auth error:', error);
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }

          if (!data.session?.access_token) {
            throw new Error('No access token received');
          }

          const token = data.session.access_token;
          console.log('✅ Supabase authentication successful');

          // Step 2: Get user data from backend
          try {
            const meData = await makeGraphQLCall(ME_QUERY, {}, token);
            const user = meData?.me?.user;
            const userPackage = meData?.myPackage;
            const tokenExpiresAt = meData?.me?.tokenExpiresAt;

            if (!user) {
              throw new Error('المستخدم غير موجود');
            }

            // Step 3: Verify user has USER role only (not admin roles)
            if (user.role !== 'USER') {
              throw new Error('هذا الحساب مخصص للإدارة. يرجى استخدام لوحة الإدارة');
            }

            console.log('✅ User data received:', user);
            console.log('✅ User package received:', userPackage);

            const finalTokenExpiresAt = tokenExpiresAt
              ? new Date(tokenExpiresAt).getTime()
              : (data.session.expires_at
                ? data.session.expires_at * 1000
                : Date.now() + (60 * 60 * 1000));

            set({
              user: {
                ...user,
                token,
                tokenExpiresAt: finalTokenExpiresAt,
              },
              userPackage: userPackage || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              showAuthModal: false,
            });

          } catch (backendError) {
            console.error('❌ Backend call failed:', backendError);
            throw new Error('خطأ في الاتصال بالخادم');
          }

        } catch (error) {
          console.error('User login error:', error);
          set({
            user: null,
            userPackage: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'خطأ في تسجيل الدخول',
          });
          throw error;
        }
      },

      // Signup with email/password
      signup: async (email: string, password: string, name: string, accountType: AccountType) => {
        set({ isLoading: true, error: null });

        try {
          console.log('📝 Signing up user...', { email, name, accountType });

          // Step 1: Create auth user with Supabase
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                account_type: accountType,
              },
            },
          });

          if (error) {
            console.error('❌ Signup error:', error);
            throw new Error('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى');
          }

          console.log('✅ Supabase signup successful');

          // Step 2: Auto-login if email confirmation is disabled
          if (data.session?.access_token) {
            const token = data.session.access_token;

            // Get full user data from backend
            const meData = await makeGraphQLCall(ME_QUERY, {}, token);
            const user = meData?.me?.user;

            if (user) {
              const finalTokenExpiresAt = data.session.expires_at
                ? data.session.expires_at * 1000
                : Date.now() + (60 * 60 * 1000);

              set({
                user: {
                  ...user,
                  token,
                  tokenExpiresAt: finalTokenExpiresAt,
                },
                isAuthenticated: true,
                isLoading: false,
                error: null,
                showAuthModal: false,
              });
            }
          } else {
            // Email confirmation required
            set({
              isLoading: false,
              error: null,
              showAuthModal: false,
            });
          }

        } catch (error) {
          console.error('Signup error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'خطأ في إنشاء الحساب',
          });
          throw error;
        }
      },

      // Login with Google
      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
        } catch (error) {
          console.error('Google login error:', error);
          set({
            isLoading: false,
            error: 'فشل تسجيل الدخول باستخدام Google',
          });
        }
      },

      // Login with Facebook
      loginWithFacebook: async () => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
        } catch (error) {
          console.error('Facebook login error:', error);
          set({
            isLoading: false,
            error: 'فشل تسجيل الدخول باستخدام Facebook',
          });
        }
      },

      // Send magic link
      sendMagicLink: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;

          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Magic link error:', error);
          set({
            isLoading: false,
            error: 'فشل إرسال الرابط السحري',
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        }

        set({
          user: null,
          userPackage: null,
          isAuthenticated: false,
          error: null,
          showAuthModal: false,
        });
      },

      // Refresh auth state
      refreshAuth: async () => {
        const state = get();
        if (!state.user?.token) {
          set({ isAuthenticated: false, user: null, userPackage: null });
          return;
        }

        try {
          const { data } = await supabase.auth.getSession();

          if (data.session) {
            // Session is valid, refresh user data
            const meData = await makeGraphQLCall(ME_QUERY, {}, data.session.access_token);
            const user = meData?.me?.user;
            const userPackage = meData?.myPackage;

            if (user && user.role === 'USER') {
              set({
                user: {
                  ...user,
                  token: data.session.access_token,
                  tokenExpiresAt: data.session.expires_at ? data.session.expires_at * 1000 : undefined,
                },
                userPackage: userPackage || null,
                isAuthenticated: true,
              });
            } else {
              set({ isAuthenticated: false, user: null, userPackage: null });
            }
          } else {
            set({ isAuthenticated: false, user: null, userPackage: null });
          }
        } catch (error) {
          console.error('Refresh auth error:', error);
          set({ isAuthenticated: false, user: null, userPackage: null });
        }
      },

      // Modal control
      openAuthModal: (view = 'login') => {
        set({ showAuthModal: true, authModalView: view, error: null });
      },

      closeAuthModal: () => {
        set({ showAuthModal: false, error: null });
      },

      switchAuthView: (view) => {
        set({ authModalView: view, error: null });
      },

      // Utility actions
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (userData: Partial<PublicUser>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },
    }),
    {
      name: 'user-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for better performance
export const useUser = () => useUserAuthStore((state) => state.user);
export const useIsAuthenticated = () => useUserAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useUserAuthStore((state) => state.isLoading);
export const useAuthError = () => useUserAuthStore((state) => state.error);
export const useShowAuthModal = () => useUserAuthStore((state) => state.showAuthModal);
