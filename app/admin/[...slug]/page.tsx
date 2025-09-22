'use client';

import { useEffect, useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/admin';
import { AttributesCRUD } from '@/components/admin/AdminCRUD/AttributesCRUD';
import { UsersCRUD } from '@/components/admin/AdminCRUD/UsersCRUD';
import { ListingsCRUD } from '@/components/admin/AdminCRUD/ListingsCRUD';
import { Button, Text, Container } from '@/components/slices';
import { ArrowLeft } from 'lucide-react';

interface AdminPageProps {
  params: {
    slug?: string[];
  };
}

export default function AdminPage({ params }: AdminPageProps) {
  const { isAuthenticated, refreshAuth, isLoading, user } = useAdminAuthStore();
  const slug = params.slug || [];
  const featureName = slug[0];

  useEffect(() => {
    if (!isAuthenticated) {
      refreshAuth();
    }
  }, [isAuthenticated, refreshAuth]);

  // Simple permission check
  const canAccess = useMemo(() => {
    if (!user || !featureName) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  }, [user, featureName]);

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
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div>جاري تحميل صفحة الإدارة...</div>
        </div>
      </Container>
    );
  }

  // Redirect to main dashboard if no slug
  if (slug.length === 0) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
    return null;
  }

  // Show access denied if user can't access this feature
  if (!canAccess) {
    return (
      <Container>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Button
            variant='link'
            href='/admin'
            icon={<ArrowLeft size={18} />}
          >
            عودة إلى لوحة التحكم
          </Button>
          <div style={{ marginTop: '2rem' }}>
            <Text variant="h2" color="error">❌ وصول مرفوض</Text>
            <Text variant="paragraph" color="secondary">
              ليس لديك صلاحية للوصول إلى ميزة "{featureName}"
            </Text>
          </div>
        </div>
      </Container>
    );
  }

  // Route to specific CRUD components
  switch (featureName) {
    case 'users':
      return <UsersCRUD />;

    case 'categories':
      return <AttributesCRUD />;

    case 'attributes':
      return <AttributesCRUD />;

    case 'listings':
      return <ListingsCRUD />;

    default:
      return (
        <Container>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Button
              variant='link'
              href='/admin'
              icon={<ArrowLeft size={18} />}
            >
              عودة إلى لوحة التحكم
            </Button>
            <div style={{ marginTop: '2rem' }}>
              <Text variant="h2">🚧 قيد التطوير</Text>
              <Text variant="paragraph" color="secondary">
                صفحة إدارة "{featureName}" قيد التطوير
              </Text>
            </div>
          </div>
        </Container>
      );
  }
}