'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { NotificationToast } from '../../components/slices/NotificationToast/NotificationToast';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminAside from '../../components/admin/AdminAside';

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

// Helper function to get feature navigation based on actual modules
const getFeatureNavigation = (featureKey: string) => {
  // Map frontend paths to module keys
  const pathToModuleKey: Record<string, string> = {
    'users': 'user-management',
    'listings': 'listing-management',
    'roles': 'role-management',
    'campaigns': 'campaign-management',
    'categories': 'category-management',
    'analytics': 'analytics',
    'audit': 'audit-logs'
  };

  const moduleKey = pathToModuleKey[featureKey];
  if (!moduleKey) return [];

  // Return basic navigation - can be enhanced with module config later
  const navigationMap: Record<string, Array<{
    key: string;
    label: string;
    path: string;
  }>> = {
    'user-management': [
      { key: 'users-list', label: 'قائمة المستخدمين', path: '/admin/users' }
    ],
    'listing-management': [
      { key: 'listings-list', label: 'قائمة الإعلانات', path: '/admin/listings' }
    ],
    'role-management': [
      { key: 'roles-list', label: 'إدارة الأدوار', path: '/admin/roles' }
    ],
    'campaign-management': [
      { key: 'campaigns-list', label: 'إدارة الحملات', path: '/admin/campaigns' }
    ],
    'category-management': [
      { key: 'categories-list', label: 'إدارة الفئات', path: '/admin/categories' }
    ],
    'analytics': [
      { key: 'analytics-dashboard', label: 'لوحة التحليلات', path: '/admin/analytics' }
    ],
    'audit-logs': [
      { key: 'audit-list', label: 'سجلات المراجعة', path: '/admin/audit' }
    ]
  };

  return navigationMap[moduleKey] || [];
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, refreshAuth, isLoading } = useAdminAuthStore();

  // Don't apply layout to login page
  const isLoginPage = pathname === '/admin/login';

  // Check if we're on a feature page (not main dashboard)
  const currentFeature = getFeatureFromPath(pathname);
  const isFeaturePage = currentFeature !== null;

  useEffect(() => {
    if (!isAuthenticated) {
      refreshAuth();
    }
  }, [isAuthenticated, refreshAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router, isLoginPage]);

  // If it's the login page, render without layout
  if (isLoginPage) {
    return (
      <>
        {children}
        <NotificationToast />
      </>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div>جاري التحقق من صلاحيات المدير...</div>
        </div>
        <NotificationToast />
      </div>
    );
  }

  // If not authenticated and not on login page, don't render anything (redirect will happen)
  if (!isAuthenticated || !user) {
    return <NotificationToast />;
  }

  // Check if user has admin privileges (not just a regular user)
  const isAdminUser = user && (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN' ||
    user.role === 'EDITOR' ||
    user.role === 'ADS_MANAGER'
  );

  // If user is not an admin, show access denied
  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-600 text-xl font-bold mb-4">❌ وصول مرفوض</div>
          <div className="text-gray-700 mb-4">
            ليس لديك صلاحيات للوصول إلى لوحة الإدارة. هذه المنطقة مخصصة للمديرين فقط.
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Access Denied - Admin privileges required
          </div>
          <button
            onClick={() => {
              router.push('/');
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
        <NotificationToast />
      </div>
    );
  }

  // Render appropriate layout based on page type
  if (isFeaturePage) {
    // Feature page with new AdminAside
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AdminHeader />

        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <AdminAside
            featureKey={currentFeature}
            onBackToDashboard={() => router.push('/admin')}
          />

          <main style={{
            flex: 1,
            overflow: 'auto',
            marginRight: '60px', // Space for collapsed aside
            transition: 'margin-right 0.3s ease'
          }}>
            {children}
          </main>
        </div>

        <NotificationToast />
      </div>
    );
  } else {
    // Main dashboard - no aside, children handle their own layout
    return (
      <>
        {children}
        <NotificationToast />
      </>
    );
  }
}