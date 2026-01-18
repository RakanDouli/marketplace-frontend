'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Button } from '@/components/slices';
import UserTokenMonitor from '@/components/UserTokenMonitor';
import { WarningBanner } from '@/components/WarningBanner';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './Dashboard.module.scss';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openAuthModal, closeAuthModal } = useUserAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Check if we're on a first-level sub-page (e.g., /dashboard/profile, /dashboard/analytics)
  // but NOT deeper nested pages (e.g., /dashboard/analytics/[listingId])
  // Those pages handle their own back navigation
  const pathSegments = pathname.split('/').filter(Boolean); // ['dashboard', 'profile'] or ['dashboard', 'analytics', 'abc123']
  const isFirstLevelSubPage = pathSegments.length === 2 && pathSegments[0] === 'dashboard';

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Show non-closable auth modal if not authenticated (after hydration)
  // User must login or use browser back button to leave
  useEffect(() => {
    if (hydrated && !user) {
      openAuthModal('login', false);
    }

    // Close modal and reset closeable state when leaving dashboard
    return () => {
      if (!user) {
        closeAuthModal();
      }
    };
  }, [user, hydrated, openAuthModal, closeAuthModal]);

  // Show placeholder while waiting for hydration or if not authenticated
  if (!hydrated || !user) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Auth modal is triggered by useEffect */}
      </div>
    );
  }

  return (
    <>
      <UserTokenMonitor />

      <Container className={styles.dashboardContainer}>
        {/* Warning Banner - shows if user has active warning */}
        <WarningBanner />

        {/* Back button for first-level sub-pages only - desktop only (mobile uses MobileBackButton) */}
        {isFirstLevelSubPage && (<div className={styles.backButton}>


          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            arrow
          >عودة إلى لوحة التحكم
          </Button>
        </div>
        )}

        {/* Main content - no sidebar, card-based navigation */}
        <main className={styles.content}>
          {children}
        </main>
      </Container>
    </>
  );
}
