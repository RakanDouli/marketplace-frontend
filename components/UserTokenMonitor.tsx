'use client';

import React, { useEffect, useState } from 'react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { TokenExpirationModal } from '@/components/TokenExpirationModal';

/**
 * Token expiration monitor component
 * This component ONLY monitors token expiration, does NOT handle authentication or redirects
 * Use this in dashboard layout to show token expiration warning
 */
export default function UserTokenMonitor() {
  const {
    isAuthenticated,
    user,
    getTimeUntilExpiration,
    checkTokenExpiration,
    extendSession,
    logout,
    openAuthModal,
    startExpirationWarning,
    dismissExpirationWarning,
    showExpirationWarning
  } = useUserAuthStore();

  const [isExpirationModalVisible, setIsExpirationModalVisible] = useState(false);

  // Token expiration monitoring
  useEffect(() => {
    if (!isAuthenticated || !user || !user.tokenExpiresAt) {
      return;
    }

    const checkExpiration = () => {
      const timeLeft = getTimeUntilExpiration();
      const isExpired = checkTokenExpiration();

      // If token has expired, logout and show auth modal
      if (isExpired) {
        logout();
        // Open auth modal after short delay to allow logout to complete
        setTimeout(() => openAuthModal('login'), 100);
        return;
      }

      // Show warning modal when 5 minutes (300 seconds) or less remaining
      if (timeLeft <= 300 && !showExpirationWarning) {
        startExpirationWarning();
        setIsExpirationModalVisible(true);
      }

      // Hide modal if time is extended beyond warning threshold
      if (timeLeft > 300 && showExpirationWarning) {
        dismissExpirationWarning();
        setIsExpirationModalVisible(false);
      }
    };

    // Check immediately
    checkExpiration();

    // Check every 30 seconds (less aggressive than admin's 10 seconds)
    const interval = setInterval(checkExpiration, 30000);

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    user,
    showExpirationWarning,
    getTimeUntilExpiration,
    checkTokenExpiration,
    logout,
    openAuthModal,
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
      console.error('❌ Failed to extend session:', error);
      // Modal will stay open on failure
    }
  };

  const handleLogout = () => {
    logout();
    setIsExpirationModalVisible(false);
    // Open auth modal after short delay to allow logout to complete
    setTimeout(() => openAuthModal('login'), 100);
  };

  // Only render modal, no redirects or loading states
  if (!isAuthenticated || !user || !user.tokenExpiresAt) {
    return null;
  }

  return (
    <TokenExpirationModal
      isVisible={isExpirationModalVisible}
      expiresAt={user.tokenExpiresAt}
      onExtendSession={handleExtendSession}
      onLogout={handleLogout}
      warningThreshold={300}
    />
  );
}
