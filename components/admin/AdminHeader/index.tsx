'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, LogOut, User } from 'lucide-react';
import { useAdminAuthStore } from '@/stores/admin';
import { ThemeToggle, Button, Container } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import styles from './AdminHeader.module.scss';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function AdminHeader({
  onToggleSidebar,
  showSidebarToggle = true
}: AdminHeaderProps) {
  const { user, logout } = useAdminAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className={styles.header}>
      <Container padding={false}>
        <div className={styles.container}>
          {/* Right Side - Sidebar Toggle & Logo */}
          <div className={styles.leftSection}>

            <Link href="/admin" className={styles.logo}>
              <div className={styles.logoIcon}>🏛️</div>
            </Link>
          </div>

          {/* Left Side - Admin Info & Actions */}
          <div className={styles.rightSection}>
            {/* Admin Info */}
            <div className={styles.adminInfo}>

              <div className={styles.adminDetails}>
                <Text variant="small" className={styles.adminName}>
                  {user.name}
                </Text>
                <Text variant="small" className={styles.adminRole}>
                  {user.role}
                </Text>
              </div>
              <div className={styles.adminAvatar}>
                <User size={16} />
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <span className={styles.logout}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogOut size={16} />}
                  onClick={handleLogout}
                  className={styles.logoutButton}
                  aria-label="تسجيل الخروج"
                >
                  <span className={styles.logoutText}>خروج</span>
                </Button></span>
              <ThemeToggle />
            </div>
          </div>
        </div></Container>
    </header>
  );
}

export default AdminHeader;