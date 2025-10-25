'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text, Input } from '@/components/slices';
import { useAdminAdCampaignsStore, type AdCampaign } from '@/stores/admin/adminAdCampaignsStore';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { ViewCampaignReportModal } from './modals';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Eye } from 'lucide-react';
import { invalidateGraphQLCache } from '@/utils/graphql-cache';
import styles from '../SharedDashboardPanel.module.scss';

export const AdReportsDashboardPanel: React.FC = () => {
  const {
    adCampaigns,
    loading,
    error,
    loadAdCampaignsWithCache,
    setSelectedAdCampaign,
    clearError
  } = useAdminAdCampaignsStore();

  const { canView } = useFeaturePermissions('ad_reports');
  const { addNotification } = useNotificationStore();

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCampaignData, setSelectedCampaignData] = useState<AdCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Invalidate cache on mount to ensure fresh data
    invalidateGraphQLCache('adCampaigns');
    loadAdCampaignsWithCache();
  }, [loadAdCampaignsWithCache]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في تحميل الحملات',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  const handleView = (campaign: AdCampaign) => {
    setSelectedCampaignData(campaign);
    setSelectedAdCampaign(campaign);
    setShowViewModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'مسودة',
      PAYMENT_SENT: 'تم إرسال رابط الدفع',
      PAID: 'تم الدفع',
      ACTIVE: 'نشطة',
      PAUSED: 'متوقفة مؤقتاً',
      COMPLETED: 'مكتملة',
      CANCELLED: 'ملغاة',
    };
    return labels[status.toUpperCase()] || status;
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      DRAFT: 'draft',
      PAYMENT_SENT: 'paymentSent',
      PAID: 'paid',
      ACTIVE: 'active',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    return classes[status.toUpperCase()] || 'draft';
  };

  // Filter campaigns based on search term
  const filteredCampaigns = adCampaigns.filter(campaign => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      campaign.campaignName.toLowerCase().includes(search) ||
      campaign.client.companyName.toLowerCase().includes(search) ||
      campaign.package.packageName.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>تقارير الإعلانات</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              عرض وتحليل أداء الحملات الإعلانية
            </Text>
          </div>
        </div>

        {/* Search Filter */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            type="search"
            placeholder="البحث حسب اسم الحملة، العميل، أو نوع الحزمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Ad Campaigns Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل الحملات...</Text>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا توجد حملات</Text>
            <Text variant="paragraph" color="secondary">
              {searchTerm ? 'لم يتم العثور على حملات مطابقة للبحث' : 'لم يتم العثور على حملات إعلانية'}
            </Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم الحملة</TableCell>
                <TableCell isHeader>العميل</TableCell>
                <TableCell isHeader>نوع الإعلان</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                <TableCell isHeader>تاريخ البدء</TableCell>
                <TableCell isHeader>تاريخ الانتهاء</TableCell>
                {canView && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCampaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Text variant="paragraph" weight="medium">{campaign.campaignName}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="paragraph">{campaign.client.companyName}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{campaign.package.packageName}</Text>
                  </TableCell>
                  <TableCell>
                    <span className={`${styles.statusBadge} ${styles[getStatusClass(campaign.status)]}`}>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{formatDate(campaign.startDate)}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small">{formatDate(campaign.endDate)}</Text>
                  </TableCell>
                  {canView && (
                    <TableCell>
                      <div className={styles.actions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(campaign)}
                          title="عرض التقرير الكامل"
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* View Campaign Report Modal */}
        <ViewCampaignReportModal
          isVisible={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCampaignData(null);
          }}
          campaign={selectedCampaignData}
        />
      </div>
    </>
  );
};
