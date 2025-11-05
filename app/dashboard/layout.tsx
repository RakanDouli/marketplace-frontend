'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Aside, Button } from '@/components/slices';
import UserTokenMonitor from '@/components/UserTokenMonitor';
import { useUserAuthStore } from '@/stores/userAuthStore';
import type { AccountType } from '@/stores/userAuthStore/types';
import { User, Package, CreditCard, LogOut, BarChart3, Menu, Crown, Heart } from 'lucide-react';
import styles from './Dashboard.module.scss';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useUserAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Authentication guard - redirect to home if not authenticated (after hydration)
  useEffect(() => {
    if (hydrated && !user) {
      router.push('/');
    }
  }, [user, hydrated, router]);

  // Show nothing while waiting for hydration or if not authenticated
  if (!hydrated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Build menu items based on account type
  const menuItems = [
    {
      icon: <User size={20} />,
      label: 'معلومات الحساب',
      href: '/dashboard',
    },
    {
      icon: <Package size={20} />,
      label: 'إعلاناتي',
      href: '/dashboard/listings',
    },
    {
      icon: <Heart size={20} />,
      label: 'المفضلة',
      href: '/dashboard/wishlist',
    },
    {
      icon: <Crown size={20} />,
      label: 'الاشتراك',
      href: '/dashboard/subscription',
    },
    // Analytics only for dealers and business accounts
    ...(user?.accountType === 'DEALER' || user?.accountType === 'BUSINESS'
      ? [
        {
          icon: <BarChart3 size={20} />,
          label: 'الإحصائيات',
          href: '/dashboard/analytics',
        },
      ]
      : []),
    {
      icon: <CreditCard size={20} />,
      label: 'المدفوعات',
      href: '/dashboard/payments',
    },
  ];

  return (
    <>
      <UserTokenMonitor />

      <Container className={styles.dashboardContainer}>
        {!isSidebarOpen && (
          <Button
            variant='outline'
            className={styles.menuButton}
            onClick={() => setIsSidebarOpen(true)}
            icon={<Menu size={20} />}
          >
          </Button>
        )}

        <div className={styles.dashboard}>
          <Aside
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            fullHeight={true}
            className={styles.aside}
          >
            <nav className={styles.nav}>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.navItem}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </Aside>

          {/* Main content */}
          <main className={styles.content}>{children}</main>
        </div>
      </Container>
    </>
  );
}
