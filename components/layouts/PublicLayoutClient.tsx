'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUserAuthStore } from '@/stores/userAuthStore';
import Header from "../Header/Header";
import { Footer } from '../Footer';
import { BottomNav } from '../BottomNav';
import { NotificationToast } from '../slices';
import { AuthModal } from '../AuthModal';
import { ForceModal } from '../ForceModal';
import { useForceModalStore } from '@/stores/forceModalStore';
import React from 'react';
import { ReactivateContent } from '../ForceModal/contents';
import { UserStatus } from '@/common/enums';
import styles from './PublicLayoutClient.module.scss';

interface PublicLayoutClientProps {
  children: React.ReactNode;
}

export function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useUserAuthStore();

  // Check if INACTIVE user on mount and show ForceModal (only check, don't refetch)
  useEffect(() => {
    if (isAuthenticated && user && user.status === UserStatus.INACTIVE) {
      useForceModalStore.getState().showForceModal(
        React.createElement(ReactivateContent),
        { title: 'حسابك معطل', maxWidth: 'md' }
      );
    }
  }, [isAuthenticated, user]);

  // Don't show public header for public campaign reports
  const isPublicReport = pathname?.startsWith('/public/campaign-report');

  // Don't show footer on messages page or create listing wizard
  const isMessagesPage = pathname?.startsWith('/messages');
  const isCreateListingWizard = pathname?.startsWith('/dashboard/listings/create');

  if (isPublicReport) {
    return <>{children}</>;
  }

  return (
    <div className={styles.layout}>
      <Header />
      <NotificationToast />
      <AuthModal />
      <ForceModal />
      <main className={styles.main}>{children}</main>
      {!isMessagesPage && !isCreateListingWizard && <Footer />}
      <BottomNav />
    </div>
  );
}