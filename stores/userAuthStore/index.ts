import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser, UserAuthState, AccountType } from './types';
import { supabase } from '@/lib/supabase';
import { ME_QUERY, ACKNOWLEDGE_WARNING_MUTATION } from './userAuth.gql';
import { SIGNUP_MUTATION } from './userAuth.signup.gql';
import { useForceModalStore } from '@/stores/forceModalStore';
import { ReactivateContent } from '@/components/ForceModal/contents';

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
  refreshUserData: () => Promise<void>; // Fetch latest user data from API

  // Modal control
  openAuthModal: (view?: 'login' | 'signup' | 'magic-link') => void;
  closeAuthModal: () => void;
  switchAuthView: (view: 'login' | 'signup' | 'magic-link') => void;

  // Token expiration management
  extendSession: () => Promise<void>;
  checkTokenExpiration: () => boolean;
  getTimeUntilExpiration: () => number;
  startExpirationWarning: () => void;
  dismissExpirationWarning: () => void;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateUser: (userData: Partial<PublicUser>) => void;

  // Warning system
  acknowledgeWarning: () => Promise<void>;
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
      showExpirationWarning: false,

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
          let user, userPackage, tokenExpiresAt;

          try {
            const meData = await makeGraphQLCall(ME_QUERY, {}, token);
            user = meData?.me?.user;
            userPackage = meData?.myPackage;
            tokenExpiresAt = meData?.me?.tokenExpiresAt;

            if (!user) {
              throw new Error('المستخدم غير موجود');
            }

            // Step 3: Verify user has USER role only (not admin roles)
            if (user.role !== 'USER') {
              throw new Error('هذا الحساب مخصص للإدارة. يرجى استخدام لوحة الإدارة');
            }

            // Check user status before allowing login
            // IMPORTANT: Check BANNED first (most severe)
            if (user.status === 'BANNED' || user.status === 'banned') {
              // Sign out from Supabase immediately
              await supabase.auth.signOut();
              throw new Error('تم حظر حسابك نهائياً. يرجى زيارة صفحة اتصل بنا للتواصل مع الإدارة');
            }

            // Check for suspension (Strike 2 - 7-day ban)
            if (user.status === 'SUSPENDED' || user.status === 'suspended') {
              // Check if suspension has expired
              if (user.bannedUntil) {
                const suspensionEnd = new Date(user.bannedUntil);
                const now = new Date();

                if (now < suspensionEnd) {
                  // Still suspended - block login and sign out
                  await supabase.auth.signOut();
                  const daysRemaining = Math.ceil((suspensionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  throw new Error(`حسابك موقوف مؤقتاً حتى ${suspensionEnd.toLocaleDateString('ar-SA')} (${daysRemaining} أيام متبقية). السبب: ${user.banReason || 'مخالفة السياسات'}`);
                }
                // Suspension expired - allow login (backend should have auto-reactivated)
              }
            }

            console.log('✅ User data received:', user);
            console.log('✅ User package received:', userPackage);

            const finalTokenExpiresAt = tokenExpiresAt
              ? new Date(tokenExpiresAt).getTime()
              : (data.session.expires_at
                ? data.session.expires_at * 1000
                : Date.now() + (60 * 60 * 1000));

            // Determine if we should show inactive modal
            const isInactive = user.status === 'INACTIVE' || user.status === 'inactive';

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

            // ✅ Load user data after successful login
            try {
              const { useWishlistStore } = await import('@/stores/wishlistStore');
              useWishlistStore.getState().loadMyWishlist();
            } catch (wishlistError) {
              console.warn('Failed to load wishlist on login:', wishlistError);
            }

            // ✅ Fetch unread message count on login
            try {
              const { useChatStore } = await import('@/stores/chatStore');
              useChatStore.getState().fetchUnreadCount();
            } catch (chatError) {
              console.warn('Failed to fetch unread count on login:', chatError);
            }

            // Show force modal for INACTIVE users
            if (isInactive) {
              useForceModalStore.getState().showForceModal(
                React.createElement(ReactivateContent),
                { title: 'حسابك معطل', maxWidth: 'md' }
              );
            }

          } catch (backendError: any) {
            console.error('❌ Backend call failed:', backendError);

            // Check if error is about ban/suspension status
            const errorMessage = backendError?.message || '';
            const isBannedError = errorMessage.includes('حظر') || errorMessage.includes('موقوف');
            const isAdminError = errorMessage.includes('الإدارة');
            const isUserNotFoundError = errorMessage.includes('غير موجود');

            // Rethrow specific errors as-is
            if (isBannedError || isAdminError || isUserNotFoundError) {
              throw backendError;
            }

            // Other errors = generic server error
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

          // Step 1: Call backend signup mutation (creates in both auth and database)
          await makeGraphQLCall(SIGNUP_MUTATION, {
            input: { email, password, name, accountType }
          });

          console.log('✅ Backend signup successful');

          // Step 2: Login to get session token
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('❌ Login after signup error:', error);
            throw new Error('تم إنشاء الحساب ولكن فشل تسجيل الدخول. يرجى تسجيل الدخول يدوياً');
          }

          if (!data.session?.access_token) {
            throw new Error('No access token received');
          }

          const token = data.session.access_token;
          console.log('✅ Login successful');

          // Step 3: Get full user data from backend
          const meData = await makeGraphQLCall(ME_QUERY, {}, token);
          const user = meData?.me?.user;

          if (!user) {
            throw new Error('المستخدم غير موجود');
          }

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

        // ✅ Clear GraphQL cache on logout
        const { clearGraphQLCache } = await import('@/utils/graphql-cache');
        clearGraphQLCache();
        console.log('🧹 GraphQL Cache: Cleared on logout');

        // ✅ Reset all user-specific stores
        try {
          const { useChatStore } = await import('@/stores/chatStore');
          useChatStore.getState().unsubscribeFromThread(); // Clean up realtime subscription
          useChatStore.setState({
            threads: [],
            activeThreadId: null,
            messages: {},
            unreadCount: 0,
            isLoading: false,
            error: null,
            blockedUserIds: new Set<string>(),
            blockedUsers: [],
            realtimeChannel: null,
            typingUsers: {},
          });
          console.log('🧹 ChatStore: Reset on logout');
        } catch (err) {
          console.warn('Failed to reset chatStore:', err);
        }

        try {
          const { useWishlistStore } = await import('@/stores/wishlistStore');
          useWishlistStore.setState({
            wishlistIds: new Set<string>(),
            listings: [],
            isLoading: false,
            error: null,
          });
          console.log('🧹 WishlistStore: Reset on logout');
        } catch (err) {
          console.warn('Failed to reset wishlistStore:', err);
        }

        try {
          const { useUserListingsStore } = await import('@/stores/userListingsStore');
          useUserListingsStore.getState().reset(); // Use existing reset method
          console.log('🧹 UserListingsStore: Reset on logout');
        } catch (err) {
          console.warn('Failed to reset userListingsStore:', err);
        }

        set({
          user: null,
          userPackage: null,
          isAuthenticated: false,
          error: null,
          showAuthModal: false,
        });
      },

      // Refresh user data from API (called after profile updates)
      refreshUserData: async () => {
        const state = get();

        if (!state.user?.token) {
          return;
        }

        try {
          const { data } = await supabase.auth.getSession();

          if (data.session) {
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
          console.error('Refresh user data error:', error);
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
            });

            console.log('✅ Session extended successfully');
          } else {
            throw new Error('No session returned from refresh');
          }
        } catch (error) {
          console.error('Session extension error:', error);
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

      // Acknowledge warning (dismiss warning banner)
      acknowledgeWarning: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('No active session');
          }

          await makeGraphQLCall(
            ACKNOWLEDGE_WARNING_MUTATION,
            {},
            session.access_token
          );

          // Update local state
          set((state) => ({
            user: state.user
              ? { ...state.user, warningAcknowledged: true }
              : null,
          }));
        } catch (error: any) {
          console.error('Failed to acknowledge warning:', error);
        }
      },
    }),
    {
      name: 'user-auth-storage',
      partialize: (state) => ({
        user: state.user,
        userPackage: state.userPackage,
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
