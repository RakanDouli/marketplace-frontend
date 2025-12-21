'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
  const { user } = useUserAuthStore();
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
            icon={<ArrowLeft size={20} />}
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
