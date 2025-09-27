'use client';

import { useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/admin';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { AttributesDashboardPanel } from '@/components/admin/AdminDashboardPanel/AttributesDashboardPanel';
import { UsersDashboardPanel } from '@/components/admin/AdminDashboardPanel/UsersDashboardPanel';
import { ListingsDashboardPanel } from '@/components/admin/AdminDashboardPanel/ListingsDashboardPanel';
import { RolesDashboardPanel } from '@/components/admin/AdminDashboardPanel/RolesDashboardPanel';
import { BrandsDashboardPanel } from '@/components/admin/AdminDashboardPanel/BrandsDashboardPanel';
import { Button, Text, Container } from '@/components/slices';
import { ArrowLeft } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

// Admin Page Content - simplified without wrapper
const AdminPageContent = ({ children }: { children: React.ReactNode }) => (
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
    <div>
      {children}
    </div>
  </Container>
);

// Dynamic Feature Registry - Now uses backend feature names
// const ADMIN_FEATURES = {
//   // User Management
//   users: {
//     component: UsersDashboardPanel,
//     title: 'إدارة المستخدمين',
//     backendFeature: 'users', // matches backend feature name
//     requiredAction: 'view' as const // requires at least view permission
//   },

//   // Category & Attribute Management
//   categories: {
//     component: AttributesDashboardPanel,
//     title: 'إدارة التصنيفات',
//     backendFeature: 'categories',
//     requiredAction: 'view' as const
//   },

//   attributes: {
//     component: AttributesDashboardPanel,
//     title: 'إدارة الخصائص',
//     backendFeature: 'attributes',
//     requiredAction: 'view' as const
//   },

//   // Listing Management
//   listings: {
//     component: ListingsDashboardPanel,
//     title: 'إدارة الإعلانات',
//     backendFeature: 'listings',
//     requiredAction: 'view' as const
//   },

//   // Advertising System (for ADS_MANAGER role)
//   'ad-packages': {
//     component: AttributesDashboardPanel, // TODO: Replace with AdPackagesCRUD
//     title: 'حزم الإعلانات',
//     backendFeature: 'ad_packages',
//     requiredAction: 'view' as const
//   },

//   'ad-clients': {
//     component: AttributesDashboardPanel, // TODO: Replace with AdClientsCRUD
//     title: 'عملاء الإعلانات',
//     backendFeature: 'ad_clients',
//     requiredAction: 'view' as const
//   },

//   'ad-campaigns': {
//     component: AttributesDashboardPanel, // TODO: Replace with AdCampaignsCRUD
//     title: 'حملات الإعلانات',
//     backendFeature: 'ad_campaigns',
//     requiredAction: 'view' as const
//   },

//   'ad-reports': {
//     component: AttributesDashboardPanel, // TODO: Replace with AdReportsCRUD
//     title: 'تقارير الإعلانات',
//     backendFeature: 'ad_reports',
//     requiredAction: 'view' as const
//   },

//   // System Administration
//   roles: {
//     component: RolesDashboardPanel,
//     title: 'إدارة الأدوار',
//     backendFeature: 'roles',
//     requiredAction: 'view' as const
//   },

//   analytics: {
//     component: UsersDashboardPanel, // TODO: Replace with AnalyticsCRUD
//     title: 'التحليلات',
//     backendFeature: 'analytics',
//     requiredAction: 'view' as const
//   },

//   'audit-logs': {
//     component: UsersDashboardPanel, // TODO: Replace with AuditLogsCRUD
//     title: 'سجلات المراجعة',
//     backendFeature: 'audit_logs',
//     requiredAction: 'view' as const
//   },

// } as const;

interface AdminPageProps {
  params: {
    slug?: string[];
  };
}

function AdminPageInner({ params }: AdminPageProps) {
  const { user } = useAdminAuthStore();
  const permissions = usePermissions();
  const slug = params.slug || [];
  const featureName = slug[0];

  // Dynamic permission check using backend feature permissions
  const canAccess = useMemo(() => {
    if (!user || !featureName) return false;

    // Check permission directly using feature name from URL
    // Your backend will determine if this feature exists and if user has access
    return permissions.canView(featureName);
  }, [user, featureName, permissions]);

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