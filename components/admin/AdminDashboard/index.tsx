'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import useAdminModulesStore from '@/stores/adminModulesStore';
import { Container, Text, Button } from '@/components/slices';
import AdminHeader from '../AdminHeader';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Package,
  FolderTree,
  BarChart3,
  Search
} from 'lucide-react';
import styles from './AdminDashboard.module.scss';

// Icon mapping for modules
const getModuleIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'LayoutDashboard': <LayoutDashboard size={32} />,
    'Users': <Users size={32} />,
    'FileText': <FileText size={32} />,
    'Shield': <Shield size={32} />,
    'Package': <Package size={32} />,
    'FolderTree': <FolderTree size={32} />,
    'BarChart3': <BarChart3 size={32} />,
    'Search': <Search size={32} />
  };
  return icons[iconName] || <LayoutDashboard size={32} />;
};

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAdminAuthStore();
  const { getAvailableModules, loadModules, isLoading, error } = useAdminModulesStore();

  // Load modules from backend on component mount
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Get modules available to current user
  const availableModules = useMemo(() => {
    if (!user) return [];
    return getAvailableModules(user.role, user.permissions);
  }, [user, getAvailableModules]);

  const handleModuleClick = (module: any) => {
    // Navigate to module page
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

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <Text variant="small" color="secondary">جاري تحميل الوحدات...</Text>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles.errorState}>
              <Text variant="small" color="error">خطأ في تحميل الوحدات: {error}</Text>
              <Button
                variant="outline"
                onClick={() => loadModules()}
                style={{ marginTop: '1rem' }}
              >
                إعادة المحاولة
              </Button>
            </div>
          )}

          {/* Modules Grid */}
          {!isLoading && !error && (
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
                        إدارة {module.nameAr || module.name}
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
          )}
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