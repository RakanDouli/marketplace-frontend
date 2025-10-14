'use client';

import React, { useEffect, useState } from 'react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { TokenExpirationModal } from '@/components/admin/TokenExpirationModal';

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

      // If token has expired, logout immediately
      if (isExpired) {
        console.log('🔴 Token expired, logging out...');
        logout();
        return;
      }

      // Show warning modal when 5 minutes (300 seconds) or less remaining
      if (timeLeft <= 300 && !showExpirationWarning) {
        console.log(`⚠️ Token expires in ${timeLeft} seconds, showing warning`);
        startExpirationWarning();
        setIsExpirationModalVisible(true);
      }

      // Hide modal if time is extended beyond warning threshold
      if (timeLeft > 300 && showExpirationWarning) {
        console.log('✅ Token extended, hiding warning');
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
    startExpirationWarning,
    dismissExpirationWarning
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
    console.log('👋 User manually logged out from token modal');
    logout();
    setIsExpirationModalVisible(false);
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
