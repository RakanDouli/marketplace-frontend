'use client';

import React, { useEffect, useState } from 'react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { TokenExpirationModal } from '@/components/TokenExpirationModal';

interface UserAuthGuardProps {
  children: React.ReactNode;
}

export default function UserAuthGuard({ children }: UserAuthGuardProps) {
  const {
    isAuthenticated,
    user,
    getTimeUntilExpiration,
    extendSession,
    logout,
    startExpirationWarning,
    dismissExpirationWarning,
    openAuthModal,
    closeAuthModal
  } = useUserAuthStore();

  const [hydrated, setHydrated] = useState(false);
  const [isExpirationModalVisible, setIsExpirationModalVisible] = useState(false);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Show non-closable auth modal if not authenticated (after hydration)
  // User must login or use browser back button to leave
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      openAuthModal('login', false);
    }

    // Close modal and reset closeable state when leaving protected page
    return () => {
      if (!isAuthenticated) {
        closeAuthModal();
      }
    };
  }, [hydrated, isAuthenticated, openAuthModal, closeAuthModal]);

  // Token expiration monitoring with smart setTimeout
  useEffect(() => {
    if (!isAuthenticated || !user || !user.tokenExpiresAt) {
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiration(); // in seconds

    // If already expired, logout
    if (timeUntilExpiry <= 0) {
      logout();
      return;
    }

    const WARNING_THRESHOLD = 300; // 5 minutes in seconds

    // If within warning threshold, show modal immediately
    if (timeUntilExpiry <= WARNING_THRESHOLD) {
      startExpirationWarning();
      setIsExpirationModalVisible(true);

      // Set timeout to logout when actually expired
      const logoutTimeout = setTimeout(() => {
        logout();
      }, timeUntilExpiry * 1000);

      return () => clearTimeout(logoutTimeout);
    }

    // Schedule warning modal to appear at WARNING_THRESHOLD before expiry
    const timeUntilWarning = (timeUntilExpiry - WARNING_THRESHOLD) * 1000;

    const warningTimeout = setTimeout(() => {
      startExpirationWarning();
      setIsExpirationModalVisible(true);

      // Schedule logout for when token actually expires
      const logoutTimeout = setTimeout(() => {
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
      await extendSession();
      setIsExpirationModalVisible(false);
      dismissExpirationWarning();
    } catch (error) {
      console.error('❌ Failed to extend session:', error);
      // Modal will stay open on failure
    }
  };

  const handleLogout = () => {
    logout();
    setIsExpirationModalVisible(false);
  };

  // Show nothing while waiting for hydration
  if (!hydrated) {
    return null;
  }

  // If not authenticated, show empty page (auth modal will be shown via useEffect)
  if (!isAuthenticated || !user) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Auth modal is already triggered by useEffect */}
      </div>
    );
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
