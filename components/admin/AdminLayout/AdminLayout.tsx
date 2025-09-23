'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { TokenExpirationModal } from '@/components/admin/TokenExpirationModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const {
    user,
    isAuthenticated,
    showExpirationWarning,
    getTimeUntilExpiration,
    checkTokenExpiration,
    extendSession,
    logout,
    startExpirationWarning,
    dismissExpirationWarning
  } = useAdminAuthStore();

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Debug: Log user state on mount and when it changes
  useEffect(() => {
    console.log('🔍 AdminLayout mounted/updated:', {
      isAuthenticated,
      hasUser: !!user,
      hasTokenExpiresAt: !!user?.tokenExpiresAt,
      tokenExpiresAt: user?.tokenExpiresAt,
      timeUntilExpiry: user?.tokenExpiresAt ? Math.floor((user.tokenExpiresAt - Date.now()) / 1000) : 'N/A'
    });
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user || !user.tokenExpiresAt) {
      return;
    }

    const checkExpiration = () => {
      const timeLeft = getTimeUntilExpiration();
      const isExpired = checkTokenExpiration();

      console.log('🕒 Token check:', {
        timeLeft,
        isExpired,
        tokenExpiresAt: user?.tokenExpiresAt,
        showExpirationWarning,
        isModalVisible
      });

      // If token has expired, logout immediately
      if (isExpired) {
        console.log('🔐 Token expired, logging out...');
        logout();
        return;
      }

      // Show warning modal when 25 seconds or less remaining (for testing)
      if (timeLeft <= 25 && !showExpirationWarning) {
        console.log('⚠️ Token expiring soon, showing warning modal...');
        startExpirationWarning();
        setIsModalVisible(true);
      }

      // Hide modal if time is extended beyond warning threshold
      if (timeLeft > 25 && showExpirationWarning) {
        dismissExpirationWarning();
        setIsModalVisible(false);
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

  const handleExtendSession = async () => {
    try {
      await extendSession();
      setIsModalVisible(false);
      dismissExpirationWarning();
    } catch (error) {
      console.error('Failed to extend session:', error);
      // Modal will stay open on failure
    }
  };

  const handleLogout = () => {
    logout();
    setIsModalVisible(false);
  };

  return (
    <>
      {children}

      {/* Token Expiration Modal */}
      {isAuthenticated && user && user.tokenExpiresAt && (
        <TokenExpirationModal
          isVisible={isModalVisible}
          expiresAt={user.tokenExpiresAt}
          onExtendSession={handleExtendSession}
          onLogout={handleLogout}
          warningThreshold={25} // 25 seconds for testing
        />
      )}
    </>
  );
};

export default AdminLayout;