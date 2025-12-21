'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Package, Heart, Ban, Crown, BarChart3, CreditCard, LogOut } from 'lucide-react';
import { Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './UserDashboardCards.module.scss';

interface DashboardMenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  show?: boolean;
}

export const UserDashboardCards: React.FC = () => {
  const router = useRouter();
  const { userPackage, logout } = useUserAuthStore();

  // Build menu items based on account type / subscription
  const menuItems: DashboardMenuItem[] = [
    {
      icon: <User size={28} />,
      label: 'معلومات الحساب',
      href: '/dashboard/profile',
      show: true,
    },
    {
      icon: <Package size={28} />,
      label: 'إعلاناتي',
      href: '/dashboard/listings',
      show: true,
    },
    {
      icon: <Heart size={28} />,
      label: 'المفضلة',
      href: '/dashboard/wishlist',
      show: true,
    },
    {
      icon: <Ban size={28} />,
      label: 'قائمه الحظر',
      href: '/dashboard/blocked-users',
      show: true,
    },
    {
      icon: <Crown size={28} />,
      label: 'الاشتراك',
      href: '/dashboard/subscription',
      show: true,
    },
    // Analytics - based on subscription plan's analyticsAccess
    {
      icon: <BarChart3 size={28} />,
      label: 'الإحصائيات',
      href: '/dashboard/analytics',
      show: !!userPackage?.userSubscription?.analyticsAccess,
    },
    {
      icon: <CreditCard size={28} />,
      label: 'المدفوعات',
      href: '/dashboard/payments',
      show: true,
    },
  ];

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div className={styles.cardsContainer}>
      <Text variant="h2" className={styles.title}>لوحة التحكم</Text>

      <div className={styles.cardsGrid}>
        {visibleItems.map((item) => (
          <div
            key={item.href}
            className={styles.card}
            onClick={() => handleCardClick(item.href)}
          >
            <div className={styles.cardIcon}>
              {item.icon}
            </div>
            <Text variant="h4" className={styles.cardLabel}>{item.label}</Text>
          </div>
        ))}

        {/* Logout Card */}
        <div
          className={`${styles.card} ${styles.logoutCard}`}
          onClick={handleLogout}
        >
          <div className={styles.cardIcon}>
            <LogOut size={28} />
          </div>
          <Text variant="h4" className={styles.cardLabel}>تسجيل الخروج</Text>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardCards;
