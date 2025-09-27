'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NotificationToast } from '../../components/slices/NotificationToast/NotificationToast';
import AdminHeader from '../../components/admin/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Helper function to get feature key from pathname
const getFeatureFromPath = (pathname: string): string | null => {
  if (pathname === '/admin' || pathname === '/admin/') return null;

  const pathParts = pathname.split('/');
  if (pathParts.length >= 3 && pathParts[1] === 'admin') {
    return pathParts[2];
  }
  return null;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  // Don't apply layout to login page
  const isLoginPage = pathname === '/admin/login';

  // Check if we're on a feature page (not main dashboard)
  const currentFeature = getFeatureFromPath(pathname);
  const isFeaturePage = currentFeature !== null;

  // If it's the login page, render without layout
  if (isLoginPage) {
    return (
      <>
        <NotificationToast />
        {children}
      </>
    );
  }

  // Render appropriate layout based on page type
  if (isFeaturePage) {
    // Feature page with AdminHeader
    return (
      <>
        <AdminHeader />
        <NotificationToast />
        <main>{children}</main>
      </>
    );
  } else {
    // Main dashboard - no header, children handle their own layout
    return (
      <>
        <NotificationToast />
        {children}
      </>
    );
  }
}