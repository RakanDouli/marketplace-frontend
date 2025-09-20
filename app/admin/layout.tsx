'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { Aside, Container, Text } from '../../components/slices';
import AdminSidebarContent from '../../components/admin/AdminSidebarContent/AdminSidebarContent';
import { Header } from '../../components/admin/Header/Header';
import styles from './AdminLayout.module.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, refreshAuth } = useAdminAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Don't apply layout to login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkAuth = async () => {
      await refreshAuth();
      setIsLoading(false);
    };

    checkAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router, isLoginPage]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // If it's the login page, render without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <Container
        size="full"
        outerBackgroundColor="#f5f5f5"
        className="min-h-screen flex items-center justify-center"
      >
        <Container
          size="sm"
          backgroundColor="white"
          className="shadow-md rounded-lg"
        >
          <Text variant="paragraph">Verifying admin access...</Text>
        </Container>
      </Container>
    );
  }

  // If not authenticated and not on login page, don't render anything (redirect will happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Render admin layout with same structure as category page
  return (
    <
    >
      {/* Header with menu toggle */}
      <Header
        onToggleSidebar={toggleSidebar}
        showMenuButton={true}
      />

      {/* Main Container - same as category page */}
      <Container>
        <div className={styles.content}>
          {/* Sidebar using Aside slice - same as filters */}
          <div className={styles.sideNavSection}>
            <Aside
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              position="left"
            >
              <AdminSidebarContent onClose={() => setIsSidebarOpen(false)} />
            </Aside>
          </div>

          {/* Main Content - same as listings */}
          <div className={styles.listingsSection}>
            <Container>
              {children}
            </Container>
          </div>
        </div>
      </Container>
    </>
  );
}