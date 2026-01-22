'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { User, LayoutDashboard, LogOut } from 'lucide-react';
import { Button, Text } from '@/components/slices';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import styles from './UserMenu.module.scss';

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, openAuthModal } = useUserAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push('/');
  };

  // Helper to get avatar URL
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar; // Full URL (Unsplash)
    return optimizeListingImage(avatar, 'small'); // Cloudflare asset key - use 'small' for better quality (300x200)
  };

  // Show nothing while waiting for hydration (prevents flash of login button)
  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <Button icon={<User size={20} />} onClick={() => openAuthModal('login')} className={styles.loginButton}>

        <span className={styles.title}>تسجيل الدخول</span>
      </Button>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <div className={styles.userMenu} ref={menuRef}>
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
              width={36}
              height={36}
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

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <Text variant="small" className={styles.userEmail}>
              {user.email}
            </Text>
          </div>

          <div className={styles.dropdownMenu}>
            <Link
              href="/dashboard"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard size={18} />
              <span>لوحة التحكم</span>
            </Link>

            <button onClick={handleLogout} className={styles.menuItem}>
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
