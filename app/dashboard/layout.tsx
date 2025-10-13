'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Aside, Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { User, Package, CreditCard, LogOut, BarChart3, Menu } from 'lucide-react';
import styles from './Dashboard.module.scss';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Protect dashboard - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
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
    // Analytics only for dealers and business accounts
    ...(user.accountType === 'dealer' || user.accountType === 'business'
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
              <a
                key={item.href}
                href={item.href}
                className={styles.navItem}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
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
  );
}
