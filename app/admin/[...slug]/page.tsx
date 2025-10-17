'use client';

import { useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/admin';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { AttributesDashboardPanel } from '@/components/admin/AdminDashboardPanel/AttributesDashboardPanel';
import { UsersDashboardPanel } from '@/components/admin/AdminDashboardPanel/UsersDashboardPanel';
import { ListingsDashboardPanel } from '@/components/admin/AdminDashboardPanel/ListingsDashboardPanel';
import { RolesDashboardPanel } from '@/components/admin/AdminDashboardPanel/RolesDashboardPanel';
import { BrandsDashboardPanel } from '@/components/admin/AdminDashboardPanel/BrandsDashboardPanel';
import { SubscriptionsDashboardPanel } from '@/components/admin/AdminDashboardPanel/SubscriptionsDashboardPanel';
import { Button, Text, Container } from '@/components/slices';
import { ArrowLeft } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

// Admin Page Content - simplified without wrapper
const AdminPageContent = ({ children }: { children: React.ReactNode }) => (
  <Container>
    <div style={{ padding: '1rem 0', display: "flex", justifyContent: "flex-end" }}>
      <Button
        variant='link'
        href='/admin'
        icon={<ArrowLeft size={18} />}
      >
        عودة إلى لوحة التحكم
      </Button>
    </div>
    <div>
      {children}
    </div>
  </Container>
);

interface AdminPageProps {
  params: {
    slug?: string[];
  };
}

function AdminPageInner({ params }: AdminPageProps) {
  const { user } = useAdminAuthStore();
  const permissions = usePermissions();
  const slug = params.slug || [];
  const urlSlug = slug[0];

  // Convert URL slug back to backend feature name (e.g., 'user-subscriptions' -> 'user_subscriptions')
  const featureName = urlSlug?.replace(/-/g, '_');

  // Dynamic permission check using backend feature permissions
  const canAccess = useMemo(() => {
    if (!user || !featureName) return false;

    // Debug logging
    console.log('🔍 Permission Check:', {
      urlSlug,
      featureName,
      userRole: user.role,
      userPermissions: user.permissions,
      featurePermissions: user.featurePermissions,
      canView: permissions.canView(featureName)
    });

    // Check permission directly using feature name (converted from URL)
    // Your backend will determine if this feature exists and if user has access
    return permissions.canView(featureName);
  }, [user, featureName, permissions, urlSlug]);

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
      <AdminPageContent>
        <Text variant="h2" color="error">❌ وصول مرفوض</Text>
        <Text variant="paragraph" color="secondary">
          ليس لديك صلاحية للوصول إلى ميزة "{featureName}"
        </Text>
      </AdminPageContent>
    );
  }

  // Dynamic component mapping
  const getComponentForFeature = (featureName: string) => {
    switch (featureName) {
      case 'users':
        return UsersDashboardPanel;
      case 'roles':
        return RolesDashboardPanel;
      case 'listings':
        return ListingsDashboardPanel;
      case 'brands':
        return BrandsDashboardPanel;
      case 'categories':
      case 'attributes':
        return AttributesDashboardPanel;
      case 'subscriptions':
      case 'user-subscriptions':
      case 'user_subscriptions':
        return SubscriptionsDashboardPanel;
      default:
        return null;
    }
  };

  const FeatureComponent = getComponentForFeature(featureName);

  if (FeatureComponent) {
    // Feature exists - render it with content wrapper
    return (
      <AdminPageContent>
        <FeatureComponent />
      </AdminPageContent>
    );
  } else {
    // Feature doesn't exist - show under development
    return (
      <AdminPageContent>
        <Text variant="h2">🚧 قيد التطوير</Text>
        <Text variant="paragraph" color="secondary">
          صفحة إدارة "{featureName}" قيد التطوير
        </Text>
      </AdminPageContent>
    );
  }
}

export default function AdminPage({ params }: AdminPageProps) {
  return (
    <AdminAuthGuard>
      <AdminPageInner params={params} />
    </AdminAuthGuard>
  );
}