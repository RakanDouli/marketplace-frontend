'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuthStore } from '../../stores/admin';
import { NotificationToast } from '../../components/slices/NotificationToast/NotificationToast';
import AdminHeader from '../../components/admin/AdminHeader';
import { TokenExpirationModal } from '@/components/admin/TokenExpirationModal';
import { Button, Container, Loading, Text } from '@/components';
// import AdminAside from '../../components/admin/AdminAside';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Helper function to get feature key from pathname
const getFeatureFromPath = (pathname: string): string | null => {
  if (pathname === '/admin' || pathname === '/admin/') return null;

  const pathParts = pathname.split('/');
  if (pathParts.length >= 3 && pathParts[1] === 'admin') {
    return pathParts[2];
  }
  return null;
};

// Helper function to get feature navigation based on actual modules
const getFeatureNavigation = (featureKey: string) => {
  // Map frontend paths to module keys
  const pathToModuleKey: Record<string, string> = {
    'users': 'user-management',
    'listings': 'listing-management',
    'roles': 'role-management',
    'campaigns': 'campaign-management',
    'analytics': 'analytics',
    'audit': 'audit-logs'
  };

  const moduleKey = pathToModuleKey[featureKey];
  if (!moduleKey) return [];

  // Return basic navigation - can be enhanced with module config later
  const navigationMap: Record<string, Array<{
    key: string;
    label: string;
    path: string;
  }>> = {
    'user-management': [
      { key: 'users-list', label: 'قائمة المستخدمين', path: '/admin/users' }
    ],
    'listing-management': [
      { key: 'listings-list', label: 'قائمة الإعلانات', path: '/admin/listings' }
    ],
    'role-management': [
      { key: 'roles-list', label: 'إدارة الأدوار', path: '/admin/roles' }
    ],
    'campaign-management': [
      { key: 'campaigns-list', label: 'إدارة الحملات', path: '/admin/campaigns' }
    ],
    'analytics': [
      { key: 'analytics-dashboard', label: 'لوحة التحليلات', path: '/admin/analytics' }
    ],
    'audit-logs': [
      { key: 'audit-list', label: 'سجلات المراجعة', path: '/admin/audit' }
    ]
  };

  return navigationMap[moduleKey] || [];
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    user,
    refreshAuth,
    isLoading,
    showExpirationWarning,
    getTimeUntilExpiration,
    checkTokenExpiration,
    extendSession,
    logout,
    startExpirationWarning,
    dismissExpirationWarning
  } = useAdminAuthStore();

  const [isExpirationModalVisible, setIsExpirationModalVisible] = useState(false);

  // Don't apply layout to login page
  const isLoginPage = pathname === '/admin/login';

  // Check if we're on a feature page (not main dashboard)
  const currentFeature = getFeatureFromPath(pathname);
  const isFeaturePage = currentFeature !== null;

  useEffect(() => {
    if (!isAuthenticated) {
      refreshAuth();
    }
  }, [isAuthenticated, refreshAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router, isLoginPage]);

  // Token expiration monitoring
  useEffect(() => {
    if (!isAuthenticated || !user || !user.tokenExpiresAt) {
      return;
    }

    const checkExpiration = () => {
      const timeLeft = getTimeUntilExpiration();
      const isExpired = checkTokenExpiration();

      // If token has expired, logout immediately
      if (isExpired) {
        logout();
        return;
      }

      // Show warning modal when 25 seconds or less remaining
      if (timeLeft <= 25 && !showExpirationWarning) {
        startExpirationWarning();
        setIsExpirationModalVisible(true);
      }

      // Hide modal if time is extended beyond warning threshold
      if (timeLeft > 25 && showExpirationWarning) {
        dismissExpirationWarning();
        setIsExpirationModalVisible(false);
      }
    };

    // Check immediately
    checkExpiration();

    // Check every 10 seconds
    const interval = setInterval(checkExpiration, 10000);

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    user,
    showExpirationWarning,
    getTimeUntilExpiration,
    checkTokenExpiration,
    logout,
    startExpirationWarning,
    dismissExpirationWarning
  ]);

  // Token expiration modal handlers
  const handleExtendSession = async () => {
    try {
      await extendSession();
      setIsExpirationModalVisible(false);
      dismissExpirationWarning();
    } catch (error) {
      console.error('Failed to extend session:', error);
      // Modal will stay open on failure
    }
  };

  const handleLogout = () => {
    logout();
    setIsExpirationModalVisible(false);
  };

  // If it's the login page, render without layout
  if (isLoginPage) {
    return (
      <>
        {children}
        <NotificationToast />
      </>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading type='svg' />
        <NotificationToast />
      </div>
    );
  }

  // If not authenticated and not on login page, don't render anything (redirect will happen)
  if (!isAuthenticated || !user) {
    return <NotificationToast />;
  }

  // Check if user has admin privileges (not just a regular user)
  const isAdminUser = user && (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN' ||
    user.role === 'EDITOR' ||
    user.role === 'ADS_MANAGER'
  );

  // If user is not an admin, show access denied
  if (!isAdminUser) {
    return (
      <Container>
        <Text variant='h4'>وصول مرفوض</Text>
        <Text variant='paragraph'>
          ليس لديك صلاحيات للوصول إلى لوحة الإدارة. هذه المنطقة مخصصة للمديرين فقط.
        </Text>
        <Text variant='paragraph'>
          Access Denied - Admin privileges required
        </Text>
        <Button href={'/'}>
          العودة للصفحة الرئيسية
        </Button>
      </Container>
    );
  }

  // Render appropriate layout based on page type
  if (isFeaturePage) {
    // Feature page with AdminHeader
    return (
      <>
        <AdminHeader />
        <main>{children}</main>
        <NotificationToast />

        {/* Token Expiration Modal */}
        {isAuthenticated && user && user.tokenExpiresAt && (
          <TokenExpirationModal
            isVisible={isExpirationModalVisible}
            expiresAt={user.tokenExpiresAt}
            onExtendSession={handleExtendSession}
            onLogout={handleLogout}
            warningThreshold={25}
          />
        )}
      </>
    );
  } else {
    // Main dashboard - no aside, children handle their own layout
    return (
      <>
        {children}
        <NotificationToast />

        {/* Token Expiration Modal */}
        {isAuthenticated && user && user.tokenExpiresAt && (
          <TokenExpirationModal
            isVisible={isExpirationModalVisible}
            expiresAt={user.tokenExpiresAt}
            onExtendSession={handleExtendSession}
            onLogout={handleLogout}
            warningThreshold={25}
          />
        )}
      </>
    );
  }
}