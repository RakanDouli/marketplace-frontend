'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUserAuthStore } from '@/stores/userAuthStore';
import Header from "../Header/Header";
import { NotificationToast } from '../slices';
import { AuthModal } from '../AuthModal';
import { ForceModal } from '../ForceModal';
import { useForceModalStore } from '@/stores/forceModalStore';
import React from 'react';
import { ReactivateContent } from '../ForceModal/contents';

interface PublicLayoutClientProps {
  children: React.ReactNode;
}

export function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useUserAuthStore();

  // Check if INACTIVE user on mount and show ForceModal (only check, don't refetch)
  useEffect(() => {
    if (isAuthenticated && user && (user.status === 'INACTIVE' || user.status === 'inactive')) {
      useForceModalStore.getState().showForceModal(
        React.createElement(ReactivateContent),
        { title: 'حسابك معطل', maxWidth: 'md' }
      );
    }
  }, [isAuthenticated, user]);

  // Don't show public header for admin routes or public campaign reports
  const isAdminRoute = pathname?.startsWith('/admin');
  const isPublicReport = pathname?.startsWith('/public/campaign-report');

  if (isAdminRoute || isPublicReport) {
    return <>{children}</>;
  }

  return (
    <div>
      <Header />
      <NotificationToast />
      <AuthModal />
      <ForceModal />
      <main>{children}</main>
      {/* Footer will be added later */}
    </div>
  );
}