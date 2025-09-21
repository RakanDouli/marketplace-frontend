'use client';

import { useEffect } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Button, Text } from '@/components/slices';
import { ArrowLeft } from 'lucide-react';

interface AdminPageProps {
  params: {
    slug?: string[];
  };
}

export default function AdminPage({ params }: AdminPageProps) {
  const { isAuthenticated, refreshAuth, isLoading } = useAdminAuthStore();
  const slug = params.slug || [];

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
        <div>جاري تحميل لوحة الإدارة...</div>
      </div>
    );
  }

  // This page only handles feature pages (slug has content)
  // Main dashboard is handled by /admin/page.tsx

  if (slug.length === 0) {
    // This shouldn't happen anymore, but redirect just in case
    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
    return null;
  }

  // Feature pages only
  const feature = slug[0];

  return (
    <div style={{ padding: '2rem' }}>
      <Button
        variant='link'
        href='/admin'
        icon={<ArrowLeft size={18} />}
      >
        عوده الى لوحة التحكم
      </Button>
      <Text variant="h1">{feature} Feature Page</Text>
      <Text variant="paragraph">
        This is the {feature} management area. Content specific to {feature} goes here.
      </Text>

      {/* Placeholder content - later replace with actual feature components */}
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <Text variant="h3">Feature Content Area</Text>
        <Text variant="small" color="secondary">
          Path: /admin/{slug.join('/')}
        </Text>
      </div>
    </div>
  );
}