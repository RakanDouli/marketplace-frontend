'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text } from '@/components/slices';
import { useAdminAdCampaignsStore, type AdCampaign } from '@/stores/admin/adminAdCampaignsStore';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { CreateAdCampaignModal, EditAdCampaignModal, DeleteAdCampaignModal } from './modals';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, Edit, Trash2, Copy, Check } from 'lucide-react';
import { invalidateGraphQLCache } from '@/utils/graphql-cache';
import { formatAdPrice } from '@/utils/formatPrice';
import { formatDateShort } from '@/utils/formatDate';
import styles from '../SharedDashboardPanel.module.scss';

export const AdCampaignsDashboardPanel: React.FC = () => {
  const {
    adCampaigns,
    loading,
    error,
    selectedAdCampaign,
    loadAdCampaignsWithCache,
    createAdCampaign,
    updateAdCampaign,
    updateCampaignStatus,
    deleteAdCampaign,
    regeneratePublicReportToken,
    setSelectedAdCampaign,
    clearError
  } = useAdminAdCampaignsStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('ad_campaigns');
  const { addNotification } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    // Invalidate cache on mount to ensure fresh data
    invalidateGraphQLCache('adCampaigns');
    loadAdCampaignsWithCache();
  }, [loadAdCampaignsWithCache]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة الحملات الإعلانية',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, clearError, addNotification]);

  // Helper functions for display
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'مسودة',
      'AWAITING_PAYMENT': 'بانتظار الدفع',
      'AWAITING_ACTIVATION': 'بانتظار التفعيل',
      'ACTIVE': 'نشط',
      'PAUSED': 'متوقف مؤقتاً',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغى'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'gray',
      'AWAITING_PAYMENT': 'orange',
      'AWAITING_ACTIVATION': 'blue',
      'ACTIVE': 'green',
      'PAUSED': 'yellow',
      'COMPLETED': 'purple',
      'CANCELLED': 'red'
    };
    return colors[status] || 'gray';
  };

  // Get row background class based on payment urgency
  const getRowBackgroundClass = (campaign: AdCampaign): string => {
    // Only highlight if status is AWAITING_PAYMENT
    if (campaign.status !== 'AWAITING_PAYMENT') {
      return '';
    }

    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 🔴 ERROR: Start date has passed and still not paid
    if (startDate < now) {
      return styles.rowError;
    }

    // 🟡 WARNING: Start date within 3 days OR ASAP campaign
    if (startDate <= threeDaysFromNow || campaign.startPreference === 'ASAP') {
      return styles.rowWarning;
    }

    return '';
  };


  // Action handlers
  const handleEdit = (campaign: AdCampaign) => {
    setSelectedAdCampaign(campaign);
    setShowEditModal(true);
  };

  const handleDelete = (campaign: AdCampaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteModal(true);
  };

  const handleCreateCampaign = () => {
    setSelectedAdCampaign(null);
    setShowCreateModal(true);
  };

  // Handle create form submission
  const handleCreateSubmit = async (campaignData: any) => {
    try {
      await createAdCampaign(campaignData);
      addNotification({
        type: 'success',
        title: 'تم إنشاء الحملة الإعلانية بنجاح',
        message: `تم إنشاء الحملة ${campaignData.campaignName} بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);
      setSelectedAdCampaign(null);
    } catch (error) {
      console.error('Create ad campaign error:', error);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (campaignData: any) => {
    try {
      await updateAdCampaign(campaignData);
      addNotification({
        type: 'success',
        title: 'تم تحديث الحملة الإعلانية بنجاح',
        message: 'تم حفظ التغييرات بنجاح',
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedAdCampaign(null);
    } catch (error) {
      console.error('Update ad campaign error:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (campaignToDelete) {
      try {
        await deleteAdCampaign(campaignToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف الحملة الإعلانية بنجاح',
          message: `تم حذف الحملة ${campaignToDelete.campaignName} بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setCampaignToDelete(null);
      } catch (error) {
        console.error('Delete ad campaign error:', error);
      }
    }
  };

  // Handle copy public report link
  const handleCopyReportLink = async (token: string) => {
    const publicReportUrl = `${window.location.origin}/public/campaign-report/${token}`;
    try {
      await navigator.clipboard.writeText(publicReportUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      addNotification({
        type: 'success',
        title: 'تم نسخ الرابط',
        message: 'تم نسخ رابط التقرير العام بنجاح',
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle accept payment (mark campaign as paid)
  const handleAcceptPayment = async (campaign: AdCampaign) => {
    try {
      await updateCampaignStatus({
        id: campaign.id,
        status: 'PAID'
      });
      addNotification({
        type: 'success',
        title: 'تم قبول الدفع',
        message: `تم تأكيد الدفع للحملة ${campaign.campaignName}. تم إرسال بريد إلكتروني للعميل.`,
        duration: 5000
      });
    } catch (error) {
      console.error('Accept payment error:', error);
      addNotification({
        type: 'error',
        title: 'فشل في قبول الدفع',
        message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        duration: 5000
      });
    }
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إدارة الحملات الإعلانية</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إدارة الحملات الإعلانية للعملاء وتتبع حالتها وأدائها
            </Text>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <Button
                onClick={handleCreateCampaign}
                variant="primary"
                icon={<Plus size={16} />}
              >
                إضافة حملة جديدة
              </Button>
            )}
          </div>
        </div>

        {/* Ad Campaigns Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل الحملات...</Text>
          </div>
        ) : adCampaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا توجد حملات إعلانية</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على حملات إعلانية</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم الحملة</TableCell>
                <TableCell isHeader>العميل</TableCell>
                <TableCell isHeader>الحزمة</TableCell>
                <TableCell isHeader>مرات الظهور</TableCell>
                <TableCell isHeader>الأداء</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                <TableCell isHeader>الفترة</TableCell>
                <TableCell isHeader>السعر</TableCell>
                <TableCell isHeader>رابط التقرير</TableCell>
                {(canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {adCampaigns.map(campaign => (
                <TableRow key={campaign.id} className={getRowBackgroundClass(campaign)}>
                  <TableCell>
                    <Text variant="paragraph" weight="medium">{campaign.campaignName}</Text>
                    {campaign.description && (
                      <Text variant="small" color="secondary">{campaign.description.slice(0, 50)}...</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <Text variant="paragraph">{campaign.client.companyName}</Text>
                    {campaign.client.contactName && (
                      <Text variant="small" color="secondary">{campaign.client.contactName}</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <Text variant="paragraph">{campaign.package.packageName}</Text>
                  </TableCell>

                  {/* Impressions Progress */}
                  <TableCell>
                    {campaign.impressionsPurchased && campaign.impressionsPurchased > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Text variant="small" weight="medium">
                          {campaign.impressionsDelivered?.toLocaleString() || 0} / {campaign.impressionsPurchased.toLocaleString()}
                        </Text>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(((campaign.impressionsDelivered || 0) / campaign.impressionsPurchased) * 100, 100)}%`,
                            height: '100%',
                            backgroundColor: ((campaign.impressionsDelivered || 0) / campaign.impressionsPurchased) > 0.9 ? '#f44336' : '#4caf50',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <Text variant="small" color="secondary">
                          {(((campaign.impressionsDelivered || 0) / campaign.impressionsPurchased) * 100).toFixed(1)}%
                        </Text>
                      </div>
                    ) : (
                      <Text variant="small" color="secondary">-</Text>
                    )}
                  </TableCell>

                  {/* Performance (Pacing + Priority) */}
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {/* Priority indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text variant="small" color="secondary">أولوية:</Text>
                        <Text variant="small" weight="medium">
                          {campaign.priority || 3} / 5
                        </Text>
                        {(campaign.priority || 3) >= 4 && <span title="أولوية عالية">🥇</span>}
                        {(campaign.priority || 3) === 3 && <span title="أولوية متوسطة">🥈</span>}
                        {(campaign.priority || 3) <= 2 && <span title="أولوية منخفضة">🥉</span>}
                      </div>
                      {/* Pacing mode */}
                      <Text variant="small" color="secondary">
                        {campaign.pacingMode === 'EVEN' && '⚡ توزيع متساوي'}
                        {campaign.pacingMode === 'ASAP' && '🚀 أسرع ما يمكن'}
                        {campaign.pacingMode === 'MANUAL' && '⚙️ يدوي'}
                        {!campaign.pacingMode && '⚡ توزيع متساوي'}
                      </Text>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: `var(--color-${getStatusColor(campaign.status)}-light)`,
                        color: `var(--color-${getStatusColor(campaign.status)})`
                      }}
                    >
                      {getStatusLabel(campaign.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{formatDateShort(campaign.startDate)}</Text>
                    <Text variant="small" color="secondary">→ {formatDateShort(campaign.endDate)}</Text>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Text variant="paragraph" weight="medium">
                        {formatAdPrice(campaign.totalPrice, campaign.currency)}
                      </Text>
                      {campaign.packageBreakdown?.packages?.some((pkg: any) => pkg.customPrice) && (
                        <Text variant="small" color="secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>💰</span>
                          <span>خصم مطبق</span>
                        </Text>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {campaign.publicReportToken ? (
                      <Button
                        variant={copiedToken === campaign.publicReportToken ? 'success' : 'secondary'}
                        size="sm"
                        onClick={() => handleCopyReportLink(campaign.publicReportToken!)}
                        icon={copiedToken === campaign.publicReportToken ? <Check size={14} /> : <Copy size={14} />}
                      >
                        {copiedToken === campaign.publicReportToken ? 'تم النسخ' : 'نسخ الرابط'}
                      </Button>
                    ) : (
                      <Text variant="small" color="secondary">-</Text>
                    )}
                  </TableCell>
                  {(canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {/* Accept Payment button - only for AWAITING_PAYMENT status */}
                        {canModify && campaign.status === 'AWAITING_PAYMENT' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAcceptPayment(campaign)}
                            title="تأكيد الدفع"
                          >
                            <Check size={16} />
                          </Button>
                        )}
                        {canModify && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(campaign)}
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(campaign)}
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

        {/* Create Ad Campaign Modal */}
        <CreateAdCampaignModal
          isVisible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedAdCampaign(null);
          }}
          onSubmit={handleCreateSubmit}
          isLoading={loading}
        />

        {/* Edit Ad Campaign Modal */}
        <EditAdCampaignModal
          isVisible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdCampaign(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={selectedAdCampaign}
          isLoading={loading}
        />

        {/* Delete Ad Campaign Modal */}
        <DeleteAdCampaignModal
          isVisible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCampaignToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          adCampaign={campaignToDelete}
          isLoading={loading}
        />

      </div>
    </>
  );
};
