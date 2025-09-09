'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import styles from './AdminSidebar.module.scss';

interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  permission?: string; // For role-based access
  children?: SidebarItem[];
}

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t, language } = useI18n();

  // Mock user role - will be from auth context later
  const userRole = 'admin'; // 'super_admin', 'admin', 'moderator'
  
  const sidebarItems: SidebarItem[] = [
    {
      key: 'overview',
      label: language === 'ar' ? 'نظرة عامة' : 'Overview',
      icon: '📊',
      href: '/admin',
    },
    {
      key: 'listings',
      label: language === 'ar' ? 'إدارة الإعلانات' : 'Manage Listings',
      icon: '🚗',
      href: '/admin/listings',
      permission: 'listings.manage',
    },
    {
      key: 'users',
      label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
      icon: '👥',
      href: '/admin/users',
      permission: 'users.manage',
    },
    {
      key: 'categories',
      label: language === 'ar' ? 'إدارة الفئات' : 'Categories',
      icon: '📂',
      href: '/admin/categories',
      permission: 'categories.manage',
    },
    {
      key: 'reports',
      label: language === 'ar' ? 'التقارير' : 'Reports',
      icon: '📈',
      href: '/admin/reports',
      permission: 'reports.view',
    },
    {
      key: 'settings',
      label: language === 'ar' ? 'إعدادات النظام' : 'System Settings',
      icon: '⚙️',
      href: '/admin/settings',
      permission: 'system.manage',
    },
  ];

  // Filter items based on user permissions (mock implementation)
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    
    // Mock permission check - will use real RBAC later
    const rolePermissions = {
      super_admin: ['listings.manage', 'users.manage', 'categories.manage', 'reports.view', 'system.manage'],
      admin: ['listings.manage', 'categories.manage', 'reports.view'],
      moderator: ['listings.manage', 'reports.view'],
    };
    
    return rolePermissions[userRole as keyof typeof rolePermissions]?.includes(permission) || false;
  };

  const filteredItems = sidebarItems.filter(item => hasPermission(item.permission));

  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
            </span>
            <span className={styles.logoSub}>Syrian Marketplace</span>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {filteredItems.map((item) => (
            <li key={item.key} className={styles.navItem}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${isActiveLink(item.href) ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>A</div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>Admin User</div>
            <div className={styles.userRole}>
              {language === 'ar' ? 'مدير' : 'Administrator'}
            </div>
          </div>
        </div>
        
        <Link 
          href="/" 
          className={styles.backToSite}
        >
          ← {language === 'ar' ? 'العودة للموقع' : 'Back to Site'}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;