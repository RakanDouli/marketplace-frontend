'use client';

import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { AdminTable, AdminTableColumn, AdminTableFilter, AdminTableAction } from '../../AdminTable/AdminTable';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAdminListingsStore } from '@/stores/admin/adminListingsStore';
import { Listing } from '@/types/listing';

export const ListingsTable: React.FC = () => {
  const { canView, canModify, canDelete } = useFeaturePermissions('listings');
  const { addNotification } = useNotificationStore();

  const {
    listings,
    loading,
    error,
    pagination,
    loadListings,
    updateListingStatus,
    deleteListing,
    setFilters,
    clearError,
  } = useAdminListingsStore();

  React.useEffect(() => {
    loadListings();
  }, []);

  // Handle error notifications
  React.useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة العروض',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  if (!canView) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-error)' }}>وصول مرفوض</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          ليس لديك صلاحية لعرض إدارة العروض
        </p>
      </div>
    );
  }

  // Status labels in Arabic
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'DRAFT': 'مسودة',
      'PENDING_APPROVAL': 'في انتظار الموافقة',
      'ACTIVE': 'نشط',
      'SOLD': 'مباع',
      'SOLD_VIA_PLATFORM': 'مباع عبر المنصة',
      'HIDDEN': 'مخفي',
      'draft': 'مسودة',
      'pending_approval': 'في انتظار الموافقة',
      'active': 'نشط',
      'sold': 'مباع',
      'sold_via_platform': 'مباع عبر المنصة',
      'hidden': 'مخفي'
    };
    return statusLabels[status] || status;
  };

  // Format price - using English numbers to match user-facing listings
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  // Format date - using English dates for consistency
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  // Define table columns
  const columns: AdminTableColumn[] = [
    {
      key: 'title',
      label: 'العنوان',
      render: (title) => (
        <div style={{ fontWeight: '500' }}>{title}</div>
      )
    },
    {
      key: 'priceMinor',
      label: 'السعر',
      render: (priceMinor) => formatPrice(priceMinor)
    },
    {
      key: 'category',
      label: 'الفئة',
      render: () => 'سيارات' // Default category
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (status) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: status === 'ACTIVE' ? '#dcfce7' :
                           status === 'DRAFT' ? '#fef3c7' :
                           status === 'PENDING_APPROVAL' ? '#dbeafe' : '#f3f4f6',
          color: status === 'ACTIVE' ? '#166534' :
                 status === 'DRAFT' ? '#92400e' :
                 status === 'PENDING_APPROVAL' ? '#1e40af' : '#6b7280'
        }}>
          {getStatusLabel(status)}
        </span>
      )
    },
    {
      key: 'user',
      label: 'المستخدم',
      render: () => 'غير محدد'
    },
    {
      key: 'createdAt',
      label: 'تاريخ الإنشاء',
      render: (createdAt) => formatDate(createdAt)
    }
  ];

  // Define filters
  const filters: AdminTableFilter[] = [
    {
      key: 'search',
      label: 'البحث',
      type: 'text',
      placeholder: 'البحث في العروض...'
    },
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: [
        { value: '', label: 'جميع الحالات' },
        { value: 'PENDING_APPROVAL', label: 'في انتظار الموافقة' },
        { value: 'ACTIVE', label: 'نشط' },
        { value: 'DRAFT', label: 'مسودة' },
        { value: 'HIDDEN', label: 'مخفي' },
        { value: 'SOLD', label: 'مباع' },
      ]
    }
  ];

  // Define actions
  const actions: AdminTableAction[] = [
    ...(canModify ? [{
      key: 'edit',
      label: 'تعديل',
      icon: <Edit size={14} />,
      variant: 'primary' as const,
      onClick: (listing: Listing) => {
        // Handle edit listing
        console.log('Edit listing:', listing);
      }
    }] : []),
    ...(canDelete ? [{
      key: 'delete',
      label: 'حذف',
      icon: <Trash2 size={14} />,
      variant: 'danger' as const,
      onClick: (listing: Listing) => {
        // Handle delete listing
        console.log('Delete listing:', listing);
      }
    }] : [])
  ];

  // Handle filters change
  const handleFiltersChange = (filters: Record<string, string>) => {
    setFilters({
      search: filters.search || undefined,
      status: filters.status || undefined,
    });
    loadListings(1); // Reset to page 1 when filters change
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadListings(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadListings();
  };

  return (
    <AdminTable
      data={listings}
      loading={loading}
      error={error}
      title="إدارة العروض"
      description="إدارة ومراجعة جميع عروض المنصة"
      columns={columns}
      actions={actions}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      pagination={pagination}
      onPageChange={handlePageChange}
      onRefresh={handleRefresh}
      canModify={canModify}
      canDelete={canDelete}
      emptyIcon={<Eye size={48} />}
      emptyTitle="لا توجد عروض"
      emptyDescription="لم يتم العثور على أي عروض"
    />
  );
};