'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/slices';
import AdminForm from '../AdminForm';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import useAdminModulesStore from '@/stores/adminModulesStore';
import { Button, Container, Text } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus } from 'lucide-react';
import styles from './adminCurd.module.scss';

interface AdminCRUDProps {
  moduleKey: string;
  data?: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDataChange?: () => void;

  // CRUD operations
  onCreate?: (data: any) => Promise<void>;
  onUpdate?: (id: string, data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onBulkAction?: (action: string, items: any[]) => Promise<void>;
  onCustomAction?: (action: string, item: any) => Promise<void>;

  // Pagination
  pagination?: {
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
}

type ViewMode = 'list' | 'create' | 'edit';

export function AdminCRUD({
  moduleKey,
  data = [],
  isLoading = false,
  onRefresh,
  onDataChange,
  onCreate,
  onUpdate,
  onDelete,
  onBulkAction,
  onCustomAction,
  pagination
}: AdminCRUDProps) {
  const { user, hasAnyPermission } = useAdminAuthStore();
  const { getAvailableModules } = useAdminModulesStore();
  const { addNotification } = useNotificationStore();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get module configuration
  const module = useMemo(() => {
    if (!user) return null;
    const availableModules = getAvailableModules(user.role, user.permissions);
    return availableModules.find((m: any) => m.key === moduleKey);
  }, [moduleKey, user, getAvailableModules]);

  // Check permissions for CRUD operations
  const permissions = useMemo(() => {
    if (!user) return { canCreate: false, canUpdate: false, canDelete: false };

    return {
      canCreate: hasAnyPermission([
        `${moduleKey}.create`,
        `${moduleKey}.manage`
      ]),
      canUpdate: hasAnyPermission([
        `${moduleKey}.update`,
        `${moduleKey}.manage`
      ]),
      canDelete: hasAnyPermission([
        `${moduleKey}.delete`,
        `${moduleKey}.manage`
      ])
    };
  }, [user, moduleKey, hasAnyPermission]);


  const handleCreateNew = () => {
    setSelectedItem(null);
    setViewMode('create');
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setViewMode('edit');
  };

  const handleDelete = async (item: any) => {
    if (!onDelete) return;

    const confirmMessage = `هل أنت متأكد من حذف "${item.name || item.title || item.id}"؟`;
    if (!confirm(confirmMessage)) return;

    setIsSubmitting(true);
    try {
      await onDelete(item.id);
      addNotification({
        type: 'success',
        title: 'تم الحذف بنجاح',
        message: `تم حذف "${item.name || item.title || item.id}" بنجاح`
      });
      onDataChange?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowAction = async (action: string, item: any) => {

    switch (action) {
      case 'edit':
        if (permissions.canUpdate) {
          handleEdit(item);
        }
        break;

      case 'delete':
        if (permissions.canDelete) {
          await handleDelete(item);
        }
        break;

      default:
        // Handle custom actions
        if (onCustomAction) {
          setIsSubmitting(true);
          try {
            await onCustomAction(action, item);
            addNotification({
              type: 'success',
              title: 'تم تنفيذ الإجراء بنجاح',
              message: `تم تنفيذ "${action}" بنجاح`
            });
            onDataChange?.();
          } catch (error) {
            addNotification({
              type: 'error',
              title: 'خطأ في تنفيذ الإجراء',
              message: error instanceof Error ? error.message : 'حدث خطأ أثناء تنفيذ الإجراء'
            });
          } finally {
            setIsSubmitting(false);
          }
        }
        break;
    }
  };

  const handleBulkAction = async (action: string, selectedItems: any[]) => {
    if (!onBulkAction) return;

    const confirmMessage = `هل أنت متأكد من تنفيذ "${action}" على ${selectedItems.length} عنصر؟`;
    if (!confirm(confirmMessage)) return;

    setIsSubmitting(true);
    try {
      await onBulkAction(action, selectedItems);

      addNotification({
        type: 'success',
        title: 'تم تنفيذ الإجراء المجمع بنجاح',
        message: `تم تنفيذ "${action}" على ${selectedItems.length} عنصر بنجاح`
      });

      onDataChange?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في تنفيذ الإجراء المجمع',
        message: error instanceof Error ? error.message : 'حدث خطأ أثناء تنفيذ الإجراء المجمع'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);

    try {
      if (viewMode === 'create' && onCreate) {
        await onCreate(formData);
        addNotification({
          type: 'success',
          title: 'تم إنشاء العنصر بنجاح',
          message: 'تم إضافة العنصر الجديد بنجاح'
        });
      } else if (viewMode === 'edit' && onUpdate && selectedItem) {
        await onUpdate(selectedItem.id, formData);
        addNotification({
          type: 'success',
          title: 'تم تحديث العنصر بنجاح',
          message: 'تم حفظ التغييرات بنجاح'
        });
      }

      setViewMode('list');
      setSelectedItem(null);
      onDataChange?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ'
      });
      throw error; // Re-throw so AdminForm can handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  if (!module) {
    return (
      <Container>
        <div className={styles.emptyState}>
          <Text>وحدة غير موجودة أو غير مسموح الوصول إليها</Text>
        </div>
      </Container>
    );
  }

  // Show form views
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className={styles.container}>
        <AdminForm
          moduleKey={moduleKey}
          mode={viewMode}
          initialData={selectedItem}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  // Show list view
  return (
    <div className={styles.container}>
      {/* Header with Create Button */}
      <Container>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <Text variant="h2">
                {module.nameAr || module.name}
              </Text>
              <Text variant="paragraph" color="secondary">
                إدارة {module.nameAr || module.name}
              </Text>
            </div>

            {permissions.canCreate && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleCreateNew}
                disabled={isSubmitting}
              >
                إضافة جديد
              </Button>
            )}
          </div>
        </div>
      </Container>

      {/* Data Table */}
      <DataTable
        moduleKey={moduleKey}
        data={data}
        isLoading={isLoading || isSubmitting}
        pagination={pagination}
        onRefresh={onRefresh}
        onRowAction={handleRowAction}
        onBulkAction={handleBulkAction}
      />

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <Text>جارٍ التحديث...</Text>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCRUD;