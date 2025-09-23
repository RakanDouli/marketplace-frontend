'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin';
import { usePermissions } from '@/hooks/usePermissions';
import { Container, Button } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import AdminHeader from '../AdminHeader';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Package,
  FolderTree,
  BarChart3,
  Search,
  Settings,
  Tags,
  Award,
  DollarSign,
  Megaphone,
  Gavel,
  User,
  UserCircle,
  MessageCircle,
  Eye
} from 'lucide-react';
import styles from './AdminDashboard.module.scss';

// Smart icon component that handles both icon names and SVG strings
const getModuleIcon = (iconString: string) => {
  // Check if it's an SVG string
  if (iconString?.startsWith('<svg')) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: iconString }}
        style={{ width: 32, height: 32 }}
      />
    );
  }

  // Icon name mapping for Lucide icons
  const icons: Record<string, React.ReactNode> = {
    'LayoutDashboard': <LayoutDashboard size={32} />,
    'Users': <Users size={32} />,
    'FileText': <FileText size={32} />,
    'Shield': <Shield size={32} />,
    'Package': <Package size={32} />,
    'FolderTree': <FolderTree size={32} />,
    'BarChart3': <BarChart3 size={32} />,
    'Search': <Search size={32} />,
    'Settings': <Settings size={32} />,
    'Tags': <Tags size={32} />,
    'Award': <Award size={32} />,
    'DollarSign': <DollarSign size={32} />,
    'Megaphone': <Megaphone size={32} />,
    'Gavel': <Gavel size={32} />,
    'User': <User size={32} />,
    'UserCircle': <UserCircle size={32} />,
    'MessageCircle': <MessageCircle size={32} />,
    'Eye': <Eye size={32} />
  };

  return icons[iconString] || <LayoutDashboard size={32} />;
};

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAdminAuthStore();
  const permissions = usePermissions();

  // Dynamic permission-based modules
  const availableModules = useMemo(() => {
    if (!user) return [];

    const allModules = [
      {
        key: 'users',
        name: 'Users Management',
        nameAr: 'إدارة المستخدمين',
        icon: 'Users',
        basePath: '/admin/users',
        feature: 'users'
      },
      {
        key: 'categories',
        name: 'Categories Management',
        nameAr: 'إدارة الفئات',
        icon: 'FolderTree',
        basePath: '/admin/categories',
        feature: 'categories'
      },
      {
        key: 'attributes',
        name: 'Attributes Management',
        nameAr: 'إدارة الخصائص',
        icon: 'Tags',
        basePath: '/admin/attributes',
        feature: 'attributes'
      },
      {
        key: 'listings',
        name: 'Listings Management',
        nameAr: 'إدارة الإعلانات',
        icon: 'FileText',
        basePath: '/admin/listings',
        feature: 'listings'
      },
      {
        key: 'roles',
        name: 'Roles Management',
        nameAr: 'إدارة الأدوار',
        icon: 'Shield',
        basePath: '/admin/roles',
        feature: 'roles'
      },
      {
        key: 'ad-packages',
        name: 'Ad Packages',
        nameAr: 'حزم الإعلانات',
        icon: 'Package',
        basePath: '/admin/ad-packages',
        feature: 'ad_packages'
      },
      {
        key: 'ad-clients',
        name: 'Ad Clients',
        nameAr: 'عملاء الإعلانات',
        icon: 'UserCircle',
        basePath: '/admin/ad-clients',
        feature: 'ad_clients'
      },
      {
        key: 'ad-campaigns',
        name: 'Ad Campaigns',
        nameAr: 'حملات الإعلانات',
        icon: 'Megaphone',
        basePath: '/admin/ad-campaigns',
        feature: 'ad_campaigns'
      },
      {
        key: 'analytics',
        name: 'Analytics',
        nameAr: 'التحليلات',
        icon: 'BarChart3',
        basePath: '/admin/analytics',
        feature: 'analytics'
      },
      {
        key: 'audit-logs',
        name: 'Audit Logs',
        nameAr: 'سجلات المراجعة',
        icon: 'Eye',
        basePath: '/admin/audit-logs',
        feature: 'audit_logs'
      }
    ];

    // Filter modules based on user permissions
    return allModules.filter(module =>
      permissions.canAccess(module.feature, 'view')
    );
  }, [user, permissions]);

  const handleModuleClick = (module: any) => {
    router.push(module.basePath);
  };


  if (!user) {
    return (
      <div className={styles.authRequired}>
        <Container>
          <div className={styles.emptyState}>
            <Text>يجب تسجيل الدخول أولاً</Text>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Admin Header */}
      <AdminHeader />

      {/* Main Dashboard Content - No Aside */}
      <main className={styles.mainContent}>
        <div className={styles.dashboard}>
          <Container>
            {/* Modules Grid */}
            <div className={styles.modulesSection}>
              <Text variant="h2"> لوحة التحكم</Text>

              {/* Modules Grid */}
              <div className={styles.modulesGrid}>
                {availableModules.length > 0 ? (
                  availableModules.map((module: any) => (
                    <div
                      key={module.key}
                      className={styles.moduleCard}
                      onClick={() => handleModuleClick(module)}
                    >
                      <div className={styles.moduleIcon}>
                        {getModuleIcon(module.icon)}
                      </div>

                      <div className={styles.moduleContent}>
                        <Text variant="h3">{module.nameAr || module.name}</Text>
                        <Text variant="paragraph" color="secondary">
                          {module.name}
                        </Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <Text variant="paragraph" color="secondary">
                      لا توجد وحدات متاحة لهذا المستخدم
                    </Text>
                  </div>
                )}
              </div>
            </div>
            {/* Stats Summary */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <Text variant="h4">المستخدمون</Text>
                <Text variant="h3" color="primary">1,234</Text>
              </div>
              <div className={styles.statCard}>
                <Text variant="h4">المستخدمون الجدد في الشهر الحالي </Text>
                <Text variant="h3" color="primary">234</Text></div>
              <div className={styles.statCard}>
                <Text variant="h4">الإعلانات الفعاله حاليا</Text>
                <Text variant="h3" color="primary">678</Text>
              </div>
              <div className={styles.statCard}>
                <Text variant="h4">الحملات</Text>
                <Text variant="h3" color="primary">23</Text>
              </div>
              <div className={styles.statCard}>
                <Text variant="h4"> الإيرادات من الاشتراكات</Text>
                <Text variant="h3" color="primary">$10,345</Text>
              </div>
              <div className={styles.statCard}>
                <Text variant="h4"> الإيرادات من الاعلانات</Text>
                <Text variant="h3" color="primary">$12,345</Text>
              </div>
            </div>
          </Container>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;