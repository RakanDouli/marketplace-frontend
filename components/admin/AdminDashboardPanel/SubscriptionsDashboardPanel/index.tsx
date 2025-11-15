'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text } from '@/components/slices';
import { useAdminSubscriptionsStore } from '@/stores/admin';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { CreateSubscriptionModal, EditSubscriptionModal, DeleteSubscriptionModal } from './modals';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { invalidateGraphQLCache } from '@/utils/graphql-cache';
import { formatPrice } from '@/utils/formatPrice';
import styles from '../SharedDashboardPanel.module.scss';

interface Subscription {
  id: string;
  name: string;
  title: string;
  description?: string;
  price: number;
  billingCycle: string;
  maxListings: number;
  maxImagesPerListing: number;
  videoAllowed: boolean;
  priorityPlacement: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
  featuredListings: boolean;
  status: string;
  sortOrder: number;
  isPublic: boolean;
  isDefault: boolean;
  accountType: string;
  createdAt?: string;
  updatedAt?: string;
}

export const SubscriptionsDashboardPanel: React.FC = () => {
  const {
    subscriptions,
    loading,
    error,
    selectedSubscription,
    loadSubscriptionsWithCache,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    setSelectedSubscription,
    clearError
  } = useAdminSubscriptionsStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('user_subscriptions');
  const { addNotification } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);

  useEffect(() => {
    // Invalidate subscriptions cache on mount to ensure fresh data
    invalidateGraphQLCache('allUserSubscriptions');
    loadSubscriptionsWithCache();
  }, [loadSubscriptionsWithCache]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة الخطط',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, clearError, addNotification]);

  // Helper functions for display
  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      'MONTHLY': 'شهري',
    };
    return labels[cycle] || cycle;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ACTIVE': 'نشط',
      'INACTIVE': 'غير نشط'
    };
    return labels[status] || status;
  };

  // Format price with special handling for free plans
  const displayPrice = (priceMinorUSD: number) => {
    if (priceMinorUSD === 0) return 'مجاني';
    return formatPrice(priceMinorUSD);
  };

  // Action handlers
  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowEditModal(true);
  };

  const handleDelete = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setShowDeleteModal(true);
  };

  const handleCreateSubscription = () => {
    setSelectedSubscription(null);
    setShowCreateModal(true);
  };

  // Handle create form submission
  const handleCreateSubmit = async (subscriptionData: any) => {
    try {
      await createSubscription(subscriptionData);
      addNotification({
        type: 'success',
        title: 'تم إنشاء الخطة بنجاح',
        message: `تم إنشاء الخطة ${subscriptionData.title} بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Create subscription error:', error);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (subscriptionData: any) => {
    try {
      await updateSubscription(subscriptionData);
      addNotification({
        type: 'success',
        title: 'تم تحديث الخطة بنجاح',
        message: 'تم حفظ التغييرات بنجاح',
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Update subscription error:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (subscriptionToDelete) {
      try {
        await deleteSubscription(subscriptionToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف الخطة بنجاح',
          message: `تم حذف الخطة ${subscriptionToDelete.title} بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setSubscriptionToDelete(null);
      } catch (error) {
        console.error('Delete subscription error:', error);
      }
    }
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إدارة خطط الاشتراك</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إدارة خطط الاشتراك وميزات كل خطة
            </Text>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <Button
                onClick={handleCreateSubscription}
                variant="primary"
                icon={<Plus size={16} />}
              >
                إضافة خطة جديدة
              </Button>
            )}
          </div>
        </div>

        {/* Subscriptions Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل الخطط...</Text>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا توجد خطط</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على خطط اشتراك</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم الخطة</TableCell>
                <TableCell isHeader>السعر</TableCell>
                <TableCell isHeader>دورة الفوترة</TableCell>
                <TableCell isHeader>حد الإعلانات</TableCell>
                <TableCell isHeader>حد الصور</TableCell>
                <TableCell isHeader>الميزات</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                {(canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map(subscription => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <Text variant="paragraph" weight="medium">{subscription.title}</Text>
                    {subscription.isDefault && (
                      <Text variant="small" color="secondary"> (افتراضي)</Text>
                    )}
                  </TableCell>
                  <TableCell>{displayPrice(subscription.price)}</TableCell>
                  <TableCell>{getBillingCycleLabel(subscription.billingCycle)}</TableCell>
                  <TableCell>
                    {subscription.maxListings === 0 ? 'غير محدود' : subscription.maxListings}
                  </TableCell>
                  <TableCell>
                    {subscription.maxImagesPerListing === 0 ? 'غير محدود' : subscription.maxImagesPerListing}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {subscription.videoAllowed && (
                        <span title="الفيديو مسموح"><Check size={16} color="var(--success)" /></span>
                      )}
                      {subscription.priorityPlacement && (
                        <span title="الأولوية في البحث"><Check size={16} color="var(--success)" /></span>
                      )}
                      {subscription.customBranding && (
                        <span title="علامة تجارية مخصصة"><Check size={16} color="var(--success)" /></span>
                      )}
                      {subscription.featuredListings && (
                        <span title="إعلانات مميزة"><Check size={16} color="var(--success)" /></span>
                      )}
                      {subscription.analyticsAccess && (
                        <span title="الوصول للتحليلات"><Check size={16} color="var(--success)" /></span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusLabel(subscription.status)}</TableCell>
                  {(canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {canModify && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subscription)}
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && !subscription.isDefault && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(subscription)}
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Create Subscription Modal */}
        <CreateSubscriptionModal
          isVisible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSubscription(null);
          }}
          onSubmit={handleCreateSubmit}
          isLoading={loading}
        />

        {/* Edit Subscription Modal */}
        <EditSubscriptionModal
          isVisible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSubscription(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={selectedSubscription}
          isLoading={loading}
        />

        {/* Delete Subscription Modal */}
        <DeleteSubscriptionModal
          isVisible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSubscriptionToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          subscription={subscriptionToDelete}
          isLoading={loading}
        />
      </div>
    </>
  );
};
