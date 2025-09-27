'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin';
import { TokenExpirationModal } from '@/components/admin/TokenExpirationModal';
import { Loading } from '@/components';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
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

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      refreshAuth();
    }
  }, [isAuthenticated, refreshAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

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

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loading type='svg' />
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {children}

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