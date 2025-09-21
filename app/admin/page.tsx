'use client';

import { useEffect } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Loading } from '@/components';

export default function AdminMainPage() {
  const { isAuthenticated, refreshAuth, isLoading } = useAdminAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      refreshAuth();
    }
  }, [isAuthenticated, refreshAuth]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading type='svg' />
      </div>
    );
  }

  // Main dashboard only
  return <AdminDashboard />;
}