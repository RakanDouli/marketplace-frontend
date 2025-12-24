import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser, UserAuthState, AccountType } from './types';
import { supabase } from '@/lib/supabase';
import { ME_QUERY, ACKNOWLEDGE_WARNING_MUTATION } from './userAuth.gql';
import { SIGNUP_MUTATION } from './userAuth.signup.gql';
import { useForceModalStore } from '@/stores/forceModalStore';
import { ReactivateContent } from '@/components/ForceModal/contents';
import { UserStatus } from '@/common/enums';

// Constants
const ONE_HOUR_MS = 60 * 60 * 1000;
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

// Helper function for GraphQL API calls
const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
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

// Calculate token expiration timestamp
const calculateTokenExpiration = (sessionExpiresAt?: number, customExpiry?: number): number => {
  if (customExpiry) {
    return new Date(customExpiry).getTime();
  }
  return sessionExpiresAt ? sessionExpiresAt * 1000 : Date.now() + ONE_HOUR_MS;
};

/**
 * Validate user status (banned/suspended) and throw appropriate error
 *
 * Strike System:
 * - Strike 1: warningCount=1, status=ACTIVE → User can login, sees WarningBanner
 * - Strike 2: warningCount=2, status=SUSPENDED → Blocked here until bannedUntil date
 * - Strike 3: warningCount>=3, status=BANNED → Permanently blocked here
 *
 * Note: Backend has SuspensionSchedulerService that auto-unsuspends users
 * when bannedUntil date passes (runs daily at midnight)
 */
const validateUserStatus = async (user: any): Promise<void> => {
  // Check BANNED first (most severe - permanent)
  if (user.status === UserStatus.BANNED) {
    await supabase.auth.signOut();
    throw new Error('تم حظر حسابك نهائياً. يرجى زيارة صفحة اتصل بنا للتواصل مع الإدارة');
  }

  // Check for suspension (Strike 2 - temporary ban)
  // Backend auto-unsuspends when bannedUntil passes, so if status is still SUSPENDED, user is blocked
  if (user.status === UserStatus.SUSPENDED) {
    await supabase.auth.signOut();
    const suspensionEnd = user.bannedUntil ? new Date(user.bannedUntil) : null;
    if (suspensionEnd) {
      const daysRemaining = Math.ceil((suspensionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      throw new Error(`حسابك موقوف مؤقتاً حتى ${suspensionEnd.toLocaleDateString('ar-SA')} (${daysRemaining > 0 ? daysRemaining : 1} أيام متبقية). السبب: ${user.banReason || 'مخالفة السياسات'}`);
    }
    throw new Error(`حسابك موقوف مؤقتاً. السبب: ${user.banReason || 'مخالفة السياسات'}`);
  }
};

// Hydrate user-specific stores after login
const hydrateUserStores = async (): Promise<void> => {
  try {
    const { useWishlistStore } = await import('@/stores/wishlistStore');
    useWishlistStore.getState().loadMyWishlist();
  } catch (error) {
    console.warn('Failed to load wishlist on login:', error);
  }

  try {
    const { useChatStore } = await import('@/stores/chatStore');
    useChatStore.getState().fetchUnreadCount();
  } catch (error) {
    console.warn('Failed to fetch unread count on login:', error);
  }
};

// Check subscription expiry and show notification
const checkSubscriptionExpiry = async (userPackage: any): Promise<void> => {
  if (!userPackage?.endDate) return;

  const subscription = userPackage.userSubscription;
  const isFree = subscription?.monthlyPrice === 0;
  if (isFree) return;

  const endDate = new Date(userPackage.endDate);
  const now = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 7 && daysRemaining > 0) {
    try {
      const { useNotificationStore } = await import('@/stores/notificationStore');
      useNotificationStore.getState().addNotification({
        type: 'warning',
        title: 'اشتراكك على وشك الانتهاء',
        message: `اشتراكك سينتهي خلال ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'}. قم بتجديده للاستمرار في الاستفادة من جميع الميزات.`,
        duration: 15000,
        action: {
          label: 'تجديد الاشتراك',
          onClick: () => { window.location.href = '/dashboard/subscription'; },
        },
      });
    } catch (error) {
      console.warn('Failed to show subscription expiry notification:', error);
    }
  } else if (daysRemaining <= 0) {
    try {
      const { useNotificationStore } = await import('@/stores/notificationStore');
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'انتهى اشتراكك',
        message: 'انتهت صلاحية اشتراكك. قم بتجديده للاستمرار في الاستفادة من جميع الميزات.',
        duration: 15000,
        action: {
          label: 'تجديد الاشتراك',
          onClick: () => { window.location.href = '/dashboard/subscription'; },
        },
      });
    } catch (error) {
      console.warn('Failed to show subscription expired notification:', error);
    }
  }
};

// Reset stores on logout - direct imports required for Next.js 16+
const resetAllStoresOnLogout = async (): Promise<void> => {
  try {
    // Reset chatStore
    const { useChatStore } = await import('@/stores/chatStore');
    useChatStore.getState().unsubscribeFromThread();
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
    console.log('GraphQL Cache: chatStore reset on logout');
  } catch (error) {
    console.warn('Failed to reset chatStore:', error);
  }

  try {
    // Reset wishlistStore
    const { useWishlistStore } = await import('@/stores/wishlistStore');
    useWishlistStore.setState({
      wishlistIds: new Set<string>(),
      listings: [],
      isLoading: false,
      error: null,
    });
    console.log('GraphQL Cache: wishlistStore reset on logout');
  } catch (error) {
    console.warn('Failed to reset wishlistStore:', error);
  }

  try {
    // Reset userListingsStore
    const { useUserListingsStore } = await import('@/stores/userListingsStore');
    useUserListingsStore.getState().reset();
    console.log('GraphQL Cache: userListingsStore reset on logout');
  } catch (error) {
    console.warn('Failed to reset userListingsStore:', error);
  }
};

// OAuth login helper (reduces duplication for Google/Facebook)
const loginWithOAuth = async (
  provider: 'google' | 'facebook',
  setFn: (state: Partial<UserAuthState>) => void
): Promise<void> => {
  setFn({ isLoading: true, error: null });

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error(`${provider} login error:`, error);
    setFn({
      isLoading: false,
      error: `فشل تسجيل الدخول باستخدام ${provider === 'google' ? 'Google' : 'Facebook'}`,
    });
  }
};

interface UserAuthActions {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, accountType: AccountType) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;

  // Modal control
  openAuthModal: (view?: 'login' | 'signup' | 'magic-link', closeable?: boolean) => void;
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
      authModalCloseable: true,
      showExpirationWarning: false,

      // Login with email/password
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('Authenticating user with Supabase...', email);

          // Step 1: Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Supabase auth error:', error);
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }

          if (!data.session?.access_token) {
            throw new Error('No access token received');
          }

          const token = data.session.access_token;
          console.log('Supabase authentication successful');

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

            // Verify user has USER role only (not admin roles)
            if (user.role !== 'USER') {
              throw new Error('هذا الحساب مخصص للإدارة. يرجى استخدام لوحة الإدارة');
            }

            // Validate user status (throws error if banned/suspended)
            await validateUserStatus(user);

            console.log('User data received:', user);
            console.log('User package received:', userPackage);

            const finalTokenExpiresAt = calculateTokenExpiration(data.session.expires_at, tokenExpiresAt);
            const isInactive = user.status === UserStatus.INACTIVE;

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
              authModalCloseable: true,
            });

            // Load user data after successful login
            await hydrateUserStores();

            // Check subscription expiry and show notification
            await checkSubscriptionExpiry(userPackage);

            // Show force modal for INACTIVE users
            if (isInactive) {
              useForceModalStore.getState().showForceModal(
                React.createElement(ReactivateContent),
                { title: 'حسابك معطل', maxWidth: 'md' }
              );
            }

          } catch (backendError: any) {
            console.error('Backend call failed:', backendError);

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
          console.log('Signing up user...', { email, name, accountType });

          // Step 1: Call backend signup mutation
          await makeGraphQLCall(SIGNUP_MUTATION, {
            input: { email, password, name, accountType }
          });

          console.log('Backend signup successful');

          // Step 2: Login to get session token
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Login after signup error:', error);
            throw new Error('تم إنشاء الحساب ولكن فشل تسجيل الدخول. يرجى تسجيل الدخول يدوياً');
          }

          if (!data.session?.access_token) {
            throw new Error('No access token received');
          }

          const token = data.session.access_token;
          console.log('Login successful');

          // Step 3: Get full user data from backend
          const meData = await makeGraphQLCall(ME_QUERY, {}, token);
          const user = meData?.me?.user;

          if (!user) {
            throw new Error('المستخدم غير موجود');
          }

          const finalTokenExpiresAt = calculateTokenExpiration(data.session.expires_at);

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
            authModalCloseable: true,
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
      loginWithGoogle: () => loginWithOAuth('google', set),

      // Login with Facebook
      loginWithFacebook: () => loginWithOAuth('facebook', set),

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

        // Clear GraphQL cache on logout
        const { clearGraphQLCache } = await import('@/utils/graphql-cache');
        clearGraphQLCache();
        console.log('GraphQL Cache: Cleared on logout');

        // Reset all user-specific stores
        await resetAllStoresOnLogout();

        set({
          user: null,
          userPackage: null,
          isAuthenticated: false,
          error: null,
          showAuthModal: false,
          authModalCloseable: true,
        });
      },

      // Refresh user data from API
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
      openAuthModal: (view = 'login', closeable = true) => {
        set({ showAuthModal: true, authModalView: view, authModalCloseable: closeable, error: null });
      },

      closeAuthModal: () => {
        set({ showAuthModal: false, authModalCloseable: true, error: null });
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
          console.log('Extending Supabase session...');

          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error('Session extension failed:', error);
            throw new Error('Failed to extend session');
          }

          if (data.session) {
            const newExpiresAt = calculateTokenExpiration(data.session.expires_at);

            set({
              user: {
                ...state.user,
                token: data.session.access_token,
                tokenExpiresAt: newExpiresAt
              },
              showExpirationWarning: false,
            });

            console.log('Session extended successfully');
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

        return timeUntilExpiry <= 0;
      },

      getTimeUntilExpiration: () => {
        const { user } = get();
        if (!user || !user.tokenExpiresAt) return 0;

        const now = Date.now();
        const timeUntilExpiry = user.tokenExpiresAt - now;

        return Math.max(0, Math.floor(timeUntilExpiry / 1000));
      },

      startExpirationWarning: () => {
        set({ showExpirationWarning: true });
      },

      dismissExpirationWarning: () => {
        set({ showExpirationWarning: false });
      },

      // Acknowledge warning
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
