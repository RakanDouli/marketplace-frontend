'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text, Input } from '@/components/slices';
import { useAdminAdPackagesStore, type AdPackage } from '@/stores/admin/adminAdPackagesStore';
import { useAdminAdNetworkSettingsStore, type AdNetworkSetting } from '@/stores/admin/adminAdNetworkSettingsStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { AD_MEDIA_TYPE_LABELS, getLabel } from '@/constants/metadata-labels';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { CreateAdPackageModal, EditAdPackageModal, DeleteAdPackageModal } from './modals';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { invalidateGraphQLCache } from '@/utils/graphql-cache';
import { formatPrice } from '@/utils/formatPrice';
import { formatNumberWithCommas } from '@/utils/formatNumber';
import styles from '../SharedDashboardPanel.module.scss';

export const AdPackagesDashboardPanel: React.FC = () => {
  const {
    adPackages,
    loading,
    error,
    selectedAdPackage,
    loadAdPackagesWithCache,
    createAdPackage,
    updateAdPackage,
    deleteAdPackage,
    setSelectedAdPackage,
    clearError
  } = useAdminAdPackagesStore();

  const {
    settings: adNetworkSettings,
    loading: settingsLoading,
    error: settingsError,
    loadSettings,
    updateSetting,
    clearError: clearSettingsError
  } = useAdminAdNetworkSettingsStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('ad_packages');
  const { addNotification } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<AdPackage | null>(null);

  // AdSense settings state
  const [adsenseFormData, setAdsenseFormData] = useState<Record<string, { value: string; isActive: boolean }>>({});

  useEffect(() => {
    // Invalidate cache on mount to ensure fresh data
    invalidateGraphQLCache('adPackages');
    loadAdPackagesWithCache();
    loadSettings();
  }, [loadAdPackagesWithCache, loadSettings]);

  // Initialize form data when settings load
  useEffect(() => {
    if (adNetworkSettings.length > 0) {
      const formData: Record<string, { value: string; isActive: boolean }> = {};
      adNetworkSettings.forEach(setting => {
        formData[setting.key] = {
          value: setting.value || '',
          isActive: setting.isActive
        };
      });
      setAdsenseFormData(formData);
    }
  }, [adNetworkSettings]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة حزم الإعلانات',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, clearError, addNotification]);

  useEffect(() => {
    if (settingsError) {
      addNotification({
        type: 'error',
        title: 'خطأ في إعدادات شبكة الإعلانات',
        message: settingsError,
        duration: 5000
      });
      clearSettingsError();
    }
  }, [settingsError, clearSettingsError, addNotification]);

  // Fetch metadata for ad types
  const { fetchAdMetadata } = useMetadataStore();

  useEffect(() => {
    fetchAdMetadata();
  }, [fetchAdMetadata]);

  // Helper functions for display
  const getAdTypeLabel = (adType: string) => {
    return getLabel(adType.toLowerCase(), AD_MEDIA_TYPE_LABELS);
  };

  // Action handlers
  const handleEdit = (pkg: AdPackage) => {
    setSelectedAdPackage(pkg);
    setShowEditModal(true);
  };

  const handleDelete = (pkg: AdPackage) => {
    setPackageToDelete(pkg);
    setShowDeleteModal(true);
  };

  const handleCreatePackage = () => {
    setSelectedAdPackage(null);
    setShowCreateModal(true);
  };

  // Handle create form submission
  const handleCreateSubmit = async (packageData: any) => {
    try {
      await createAdPackage(packageData);
      addNotification({
        type: 'success',
        title: 'تم إنشاء حزمة الإعلان بنجاح',
        message: `تم إنشاء الحزمة ${packageData.packageName} بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);
      setSelectedAdPackage(null);
    } catch (error) {
      console.error('Create ad package error:', error);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (packageData: any) => {
    try {
      await updateAdPackage(packageData);
      addNotification({
        type: 'success',
        title: 'تم تحديث حزمة الإعلان بنجاح',
        message: 'تم حفظ التغييرات بنجاح',
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedAdPackage(null);
    } catch (error) {
      console.error('Update ad package error:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (packageToDelete) {
      try {
        await deleteAdPackage(packageToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف حزمة الإعلان بنجاح',
          message: `تم حذف الحزمة ${packageToDelete.packageName} بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setPackageToDelete(null);
      } catch (error) {
        console.error('Delete ad package error:', error);
      }
    }
  };

  // AdSense settings handlers
  const handleAdsenseChange = (key: string, field: 'value' | 'isActive', newValue: string | boolean) => {
    setAdsenseFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: newValue
      }
    }));
  };

  const handleSaveAdsenseSetting = async (key: string) => {
    try {
      const settingData = adsenseFormData[key];
      await updateSetting(key, settingData.value, settingData.isActive);
      addNotification({
        type: 'success',
        title: 'تم حفظ الإعداد بنجاح',
        message: 'تم تحديث إعدادات جوجل أدسنس',
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving AdSense setting:', error);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'adsense_client_id': 'معرف عميل Google AdSense',
      'adsense_banner_slot': 'معرف إعلان البانر العلوي',
      'adsense_between_listings_slot': 'معرف إعلان بين القوائم',
      'adsense_video_slot': 'معرف إعلان الفيديو'
    };
    return labels[key] || key;
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إدارة حزم الإعلانات</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إدارة حزم الإعلانات المدفوعة وأسعارها وميزاتها
            </Text>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <Button
                onClick={handleCreatePackage}
                variant="primary"
                icon={<Plus size={16} />}
              >
                إضافة حزمة جديدة
              </Button>
            )}
          </div>
        </div>

        {/* Ad Packages Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل الحزم...</Text>
          </div>
        ) : adPackages.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا توجد حزم إعلانات</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على حزم إعلانات</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم الحزمة</TableCell>
                <TableCell isHeader>نوع الإعلان</TableCell>
                <TableCell isHeader>السعر</TableCell>
                <TableCell isHeader>المدة</TableCell>
                <TableCell isHeader>حد الظهور</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                {(canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {adPackages.map(pkg => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <Text variant="paragraph" weight="medium">{pkg.packageName}</Text>
                    {pkg.description && (
                      <Text variant="small" color="secondary">{pkg.description.slice(0, 50)}...</Text>
                    )}
                  </TableCell>
                  <TableCell>{getAdTypeLabel(pkg.adType)}</TableCell>
                  <TableCell>{formatPrice(pkg.basePrice)}</TableCell>
                  <TableCell>{pkg.durationDays} يوم</TableCell>
                  <TableCell>{formatNumberWithCommas(pkg.impressionLimit)}</TableCell>
                  <TableCell>
                    <span className={`${styles.statusBadge} ${pkg.isActive ? styles.active : styles.inactive}`}>
                      {pkg.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </TableCell>
                  {(canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {canModify && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pkg)}
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(pkg)}
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



        {/* Create Ad Package Modal */}
        <CreateAdPackageModal
          isVisible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedAdPackage(null);
          }}
          onSubmit={handleCreateSubmit}
          isLoading={loading}
        />

        {/* Edit Ad Package Modal */}
        <EditAdPackageModal
          isVisible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdPackage(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={selectedAdPackage}
          isLoading={loading}
        />

        {/* Delete Ad Package Modal */}
        <DeleteAdPackageModal
          isVisible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPackageToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          adPackage={packageToDelete}
          isLoading={loading}
        />
      </div>
      {/* Google AdSense Settings Section */}
      <div className={styles.settingsSection}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h3">إعدادات Google AdSense</Text>
            <Text variant="paragraph" color="secondary">
              تكوين إعلانات جوجل الاحتياطية التي تظهر عند انتهاء حملات الإعلانات المدفوعة
            </Text>
          </div>
        </div>

        {settingsLoading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل الإعدادات...</Text>
          </div>
        ) : adNetworkSettings.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="paragraph" color="secondary">لا توجد إعدادات متاحة</Text>
          </div>
        ) : (
          <div className={styles.settingsGrid}>
            {adNetworkSettings.map(setting => (
              <div key={setting.key} className={styles.settingRow}>
                <div className={styles.settingField}>
                  <Text variant="paragraph" weight="medium" className={styles.settingLabel}>
                    {getSettingLabel(setting.key)}
                  </Text>
                  <Input
                    type="text"
                    value={adsenseFormData[setting.key]?.value || ''}
                    onChange={(e) => handleAdsenseChange(setting.key, 'value', e.target.value)}
                    placeholder={setting.description || ''}
                    disabled={!canModify}
                  />
                </div>

                <label className={styles.settingToggle}>
                  <input
                    type="checkbox"
                    checked={adsenseFormData[setting.key]?.isActive || false}
                    onChange={(e) => handleAdsenseChange(setting.key, 'isActive', e.target.checked)}
                    disabled={!canModify}
                  />
                  <Text variant="small">مفعّل</Text>
                </label>

                {canModify && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveAdsenseSetting(setting.key)}
                    icon={<Save size={16} />}
                    disabled={settingsLoading}
                  >
                    حفظ
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
