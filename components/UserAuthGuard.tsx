'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { TokenExpirationModal } from '@/components/admin/TokenExpirationModal';
import { Loading } from '@/components';

interface UserAuthGuardProps {
  children: React.ReactNode;
}

export default function UserAuthGuard({ children }: UserAuthGuardProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    getTimeUntilExpiration,
    extendSession,
    logout,
    startExpirationWarning,
    dismissExpirationWarning
  } = useUserAuthStore();

  const [hydrated, setHydrated] = useState(false);
  const [isExpirationModalVisible, setIsExpirationModalVisible] = useState(false);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect to home if not authenticated (after hydration)
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [hydrated, isAuthenticated, router]);

  // Token expiration monitoring with smart setTimeout
  useEffect(() => {
    if (!isAuthenticated || !user || !user.tokenExpiresAt) {
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiration(); // in seconds

    // If already expired, logout
    if (timeUntilExpiry <= 0) {
      console.log('🔴 Token expired, logging out...');
      logout();
      return;
    }

    const WARNING_THRESHOLD = 300; // 5 minutes in seconds

    // If within warning threshold, show modal immediately
    if (timeUntilExpiry <= WARNING_THRESHOLD) {
      console.log(`⚠️ Token expires in ${timeUntilExpiry} seconds, showing warning`);
      startExpirationWarning();
      setIsExpirationModalVisible(true);

      // Set timeout to logout when actually expired
      const logoutTimeout = setTimeout(() => {
        console.log('🔴 Token expired after warning, logging out...');
        logout();
      }, timeUntilExpiry * 1000);

      return () => clearTimeout(logoutTimeout);
    }

    // Schedule warning modal to appear at WARNING_THRESHOLD before expiry
    const timeUntilWarning = (timeUntilExpiry - WARNING_THRESHOLD) * 1000;
    console.log(`⏰ Token expires in ${timeUntilExpiry} seconds. Warning scheduled in ${Math.floor(timeUntilWarning / 1000)} seconds`);

    const warningTimeout = setTimeout(() => {
      console.log('⚠️ Showing token expiration warning');
      startExpirationWarning();
      setIsExpirationModalVisible(true);

      // Schedule logout for when token actually expires
      const logoutTimeout = setTimeout(() => {
        console.log('🔴 Token expired, logging out...');
        logout();
      }, WARNING_THRESHOLD * 1000);

      return () => clearTimeout(logoutTimeout);
    }, timeUntilWarning);

    return () => clearTimeout(warningTimeout);
  }, [
    isAuthenticated,
    user,
    getTimeUntilExpiration,
    logout,
    startExpirationWarning
  ]);

  // Token expiration modal handlers
  const handleExtendSession = async () => {
    try {
      console.log('🔄 Extending session...');
      await extendSession();
      setIsExpirationModalVisible(false);
      dismissExpirationWarning();
      console.log('✅ Session extended successfully');
    } catch (error) {
      console.error('❌ Failed to extend session:', error);
      // Modal will stay open on failure
    }
  };

  const handleLogout = () => {
    console.log('👋 User manually logged out');
    logout();
    setIsExpirationModalVisible(false);
  };

  // Show nothing while waiting for hydration or if not authenticated
  if (!hydrated || !isAuthenticated || !user) {
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
          warningThreshold={300}
        />
      )}
    </>
  );
}
