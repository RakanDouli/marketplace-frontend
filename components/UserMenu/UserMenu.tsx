'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { User, LayoutDashboard, LogOut } from 'lucide-react';
import { Button, Text, Dropdown, DropdownMenuItem } from '@/components/slices';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import styles from './UserMenu.module.scss';

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, openAuthModal } = useUserAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/');
  };

  const handleDashboardClick = () => {
    setIsOpen(false);
    router.push('/dashboard');
  };

  // Helper to get avatar URL
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar; // Full URL (Unsplash)
    return optimizeListingImage(avatar, 'small'); // Cloudflare asset key - use 'small' for better quality (300x200)
  };

  // Show placeholder with same dimensions during hydration (prevents CLS)
  if (!hydrated) {
    return (
      <div className={styles.loginButton} style={{ minWidth: '120px', height: '36px', visibility: 'hidden' }} aria-hidden="true" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" icon={<User size={16} />} onClick={() => openAuthModal('login')} className={styles.loginButton}>
        <span className={styles.title}>تسجيل الدخول</span>
      </Button>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  const triggerButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={styles.userButton}
      aria-expanded={isOpen}
    >
      {avatarUrl ? (
        <div className={styles.avatarImage}>
          <img
            src={avatarUrl}
            alt={user.name || 'Avatar'}
            width={28}
            height={28}
            className={styles.avatar}
          />
        </div>
      ) : (
        <div
          className={styles.avatarInitials}
          style={{
            backgroundColor: getAvatarColor(user.name, user.email),
          }}
        >
          {getInitials(user.name, user.email)}
        </div>
      )}
      <span className={styles.userName}>{user.name || user.email}</span>
    </button>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={triggerButton}
      align="right"
      usePortal
    >
      <div className={styles.dropdownHeader}>
        <Text variant="small" className={styles.userEmail}>
          {user.email}
        </Text>
      </div>

      <DropdownMenuItem
        icon={<LayoutDashboard size={18} />}
        label="لوحة التحكم"
        onClick={handleDashboardClick}
      />

      <DropdownMenuItem
        icon={<LogOut size={18} />}
        label="تسجيل الخروج"
        onClick={handleLogout}
        variant="danger"
      />
    </Dropdown>
  );
};

export default UserMenu;
