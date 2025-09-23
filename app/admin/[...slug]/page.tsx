'use client';

import { useEffect, useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/admin';
import { AttributesDashboardPanel } from '@/components/admin/AdminDashboardPanel/AttributesDashboardPanel';
import { UsersDashboardPanel } from '@/components/admin/AdminDashboardPanel/UsersDashboardPanel';
import { ListingsDashboardPanel } from '@/components/admin/AdminDashboardPanel/ListingsDashboardPanel';
import { RolesDashboardPanel } from '@/components/admin/AdminDashboardPanel/RolesDashboardPanel';
import { Button, Text, Container } from '@/components/slices';
import { ArrowLeft } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

// Admin Page Wrapper Component
const AdminPageWrapper = ({ children, featureName }: { children: React.ReactNode; featureName: string }) => (
  <>
    {/* Universal Back Button */}
    <Container>
      <div style={{ padding: '1rem 0' }}>
        <Button
          variant='link'
          href='/admin'
          icon={<ArrowLeft size={18} />}
        >
          عودة إلى لوحة التحكم
        </Button>
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </Container>
  </>
);

// Dynamic Feature Registry - Now uses backend feature names
const ADMIN_FEATURES = {
  // User Management
  users: {
    component: UsersDashboardPanel,
    title: 'إدارة المستخدمين',
    backendFeature: 'users', // matches backend feature name
    requiredAction: 'view' as const // requires at least view permission
  },

  // Category & Attribute Management
  categories: {
    component: AttributesDashboardPanel,
    title: 'إدارة التصنيفات',
    backendFeature: 'categories',
    requiredAction: 'view' as const
  },

  attributes: {
    component: AttributesDashboardPanel,
    title: 'إدارة الخصائص',
    backendFeature: 'attributes',
    requiredAction: 'view' as const
  },

  // Listing Management
  listings: {
    component: ListingsDashboardPanel,
    title: 'إدارة الإعلانات',
    backendFeature: 'listings',
    requiredAction: 'view' as const
  },

  // Advertising System (for ADS_MANAGER role)
  'ad-packages': {
    component: AttributesDashboardPanel, // TODO: Replace with AdPackagesCRUD
    title: 'حزم الإعلانات',
    backendFeature: 'ad_packages',
    requiredAction: 'view' as const
  },

  'ad-clients': {
    component: AttributesDashboardPanel, // TODO: Replace with AdClientsCRUD
    title: 'عملاء الإعلانات',
    backendFeature: 'ad_clients',
    requiredAction: 'view' as const
  },

  'ad-campaigns': {
    component: AttributesDashboardPanel, // TODO: Replace with AdCampaignsCRUD
    title: 'حملات الإعلانات',
    backendFeature: 'ad_campaigns',
    requiredAction: 'view' as const
  },

  'ad-reports': {
    component: AttributesDashboardPanel, // TODO: Replace with AdReportsCRUD
    title: 'تقارير الإعلانات',
    backendFeature: 'ad_reports',
    requiredAction: 'view' as const
  },

  // System Administration
  roles: {
    component: RolesDashboardPanel,
    title: 'إدارة الأدوار',
    backendFeature: 'roles',
    requiredAction: 'view' as const
  },

  analytics: {
    component: UsersDashboardPanel, // TODO: Replace with AnalyticsCRUD
    title: 'التحليلات',
    backendFeature: 'analytics',
    requiredAction: 'view' as const
  },

  'audit-logs': {
    component: UsersDashboardPanel, // TODO: Replace with AuditLogsCRUD
    title: 'سجلات المراجعة',
    backendFeature: 'audit_logs',
    requiredAction: 'view' as const
  },

} as const;

interface AdminPageProps {
  params: {
    slug?: string[];
  };
}

export default function AdminPage({ params }: AdminPageProps) {
  const { isAuthenticated, refreshAuth, isLoading, user } = useAdminAuthStore();
  const permissions = usePermissions();
  const slug = params.slug || [];
  const featureName = slug[0];

  useEffect(() => {
    if (!isAuthenticated) {
      refreshAuth();
    }
  }, [isAuthenticated, refreshAuth]);

  // Dynamic permission check using backend feature permissions
  const canAccess = useMemo(() => {
    if (!user || !featureName) return false;

    const feature = ADMIN_FEATURES[featureName as keyof typeof ADMIN_FEATURES];
    if (!feature) return false; // Unknown feature

    // Check permission using backend feature system
    return permissions.canAccess(feature.backendFeature, feature.requiredAction);
  }, [user, featureName, permissions]);

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
      <AdminPageWrapper featureName={featureName}>


        <Text variant="h2" color="error">❌ وصول مرفوض</Text>
        <Text variant="paragraph" color="secondary">
          ليس لديك صلاحية للوصول إلى ميزة "{featureName}"
        </Text>


      </AdminPageWrapper>
    );
  }

  // Dynamic route rendering using registry
  const feature = ADMIN_FEATURES[featureName as keyof typeof ADMIN_FEATURES];

  if (feature) {
    // Feature exists - render it with wrapper
    const FeatureComponent = feature.component;
    return (
      <AdminPageWrapper featureName={featureName}>

        <FeatureComponent />

      </AdminPageWrapper>
    );
  } else {
    // Feature doesn't exist - show under development
    return (
      <AdminPageWrapper featureName={featureName}>


        <Text variant="h2">🚧 قيد التطوير</Text>
        <Text variant="paragraph" color="secondary">
          صفحة إدارة "{featureName}" قيد التطوير
        </Text>


      </AdminPageWrapper>
    );
  }
}