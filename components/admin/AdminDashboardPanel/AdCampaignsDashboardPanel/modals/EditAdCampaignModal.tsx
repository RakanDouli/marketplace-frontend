'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAdminAdCampaignsStore, type AdCampaign } from '@/stores/admin/adminAdCampaignsStore';
import { Copy, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  validateEditAdCampaignForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/admin/validation/adCampaignValidation';
import { AddPackageModal, type CampaignPackage } from './AddPackageModal';
import styles from './AdCampaignModals.module.scss';

interface EditAdCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: AdCampaign | null;
  isLoading: boolean;
}

interface AdClient {
  id: string;
  companyName: string;
}

interface AdPackage {
  id: string;
  packageName: string;
  basePrice: number;
  currency: string;
  adType: string;
  placement: string;
  format: string;
  dimensions: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  mediaRequirements: string[];
}

const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
};

export const EditAdCampaignModal: React.FC<EditAdCampaignModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  initialData,
  isLoading
}) => {
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { user } = useAdminAuthStore();
  const { addNotification } = useNotificationStore();
  const { regeneratePublicReportToken } = useAdminAdCampaignsStore();
  const [clients, setClients] = useState<AdClient[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);
  const [campaignPackages, setCampaignPackages] = useState<CampaignPackage[]>([]);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    campaignName: '',
    description: '',
    clientId: '',
    packageId: '',
    isCustomPackage: false,
    startPreference: 'SPECIFIC_DATE',
    startDate: '',
    endDate: '',
    totalPrice: 0,
    currency: 'USD',
    notes: '',
    paymentLink: '',
  });

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        campaignName: initialData.campaignName,
        description: initialData.description || '',
        clientId: initialData.clientId,
        packageId: initialData.packageId,
        isCustomPackage: initialData.isCustomPackage,
        startPreference: initialData.startPreference,
        startDate: initialData.startDate.split('T')[0],
        endDate: initialData.endDate.split('T')[0],
        totalPrice: initialData.totalPrice,
        currency: initialData.currency,
        notes: initialData.notes || '',
        paymentLink: initialData.paymentLink || '',
      });

      // Parse packageBreakdown if exists
      if (initialData.packageBreakdown?.packages) {
        setCampaignPackages(initialData.packageBreakdown.packages);
      } else {
        setCampaignPackages([]);
      }
    }
  }, [initialData]);

  // Fetch clients and packages
  useEffect(() => {
    if (isVisible && user?.token) {
      fetchClientsAndPackages();
    }
  }, [isVisible, user?.token]);

  const fetchClientsAndPackages = async () => {
    setLoadingData(true);
    try {
      // Fetch clients
      const clientsQuery = `
        query GetAdClients {
          adClients {
            id
            companyName
          }
        }
      `;
      const clientsData = await makeGraphQLCall(clientsQuery, {}, user?.token);
      setClients(clientsData.adClients || []);

      // Fetch packages
      const packagesQuery = `
        query GetActiveAdPackages {
          activeAdPackages {
            id
            packageName
            basePrice
            currency
            adType
            placement
            format
            dimensions {
              desktop {
                width
                height
              }
              mobile {
                width
                height
              }
            }
            mediaRequirements
          }
        }
      `;
      const packagesData = await makeGraphQLCall(packagesQuery, {}, user?.token);
      setPackages(packagesData.activeAdPackages || []);
    } catch (err) {
      console.error('Failed to fetch clients/packages:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using Zod
    const errors = validateEditAdCampaignForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Ad Campaign validation failed:', errors);
      setError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return; // STOP - do not submit
    }

    console.log('✅ Ad Campaign validation passed, submitting...');

    try {
      await onSubmit(formData);
      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم تحديث الحملة الإعلانية بنجاح',
        duration: 5000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث الحملة الإعلانية');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyReportLink = async () => {
    if (!initialData?.publicReportToken) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'لا يوجد رابط تقرير عام متاح',
        duration: 3000
      });
      return;
    }

    const reportLink = `${window.location.origin}/public/campaign-report/${initialData.publicReportToken}`;

    try {
      await navigator.clipboard.writeText(reportLink);
      addNotification({
        type: 'success',
        title: 'تم النسخ',
        message: 'تم نسخ رابط التقرير العام بنجاح',
        duration: 3000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في نسخ الرابط',
        duration: 3000
      });
    }
  };

  const handleRegenerateToken = async () => {
    if (!initialData?.id) return;

    setRegeneratingToken(true);
    try {
      await regeneratePublicReportToken(initialData.id);
      addNotification({
        type: 'success',
        title: 'تم إعادة إنشاء الرابط',
        message: 'تم إعادة إنشاء رابط التقرير العام بنجاح',
        duration: 3000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في إعادة إنشاء الرابط',
        duration: 3000
      });
    } finally {
      setRegeneratingToken(false);
    }
  };

  // Package management handlers
  const handleAddPackage = (pkg: CampaignPackage) => {
    if (editingPackageIndex !== null) {
      // Update existing package
      const updated = [...campaignPackages];
      updated[editingPackageIndex] = pkg;
      setCampaignPackages(updated);
      setEditingPackageIndex(null);
    } else {
      // Add new package
      setCampaignPackages([...campaignPackages, pkg]);
    }
    setShowAddPackageModal(false);
  };

  const handleEditPackage = (index: number) => {
    setEditingPackageIndex(index);
    setShowAddPackageModal(true);
  };

  const handleDeletePackage = (index: number) => {
    const updated = campaignPackages.filter((_, i) => i !== index);
    setCampaignPackages(updated);
  };

  // Calculate total price from all packages
  const calculateTotalPrice = (): number => {
    if (campaignPackages.length === 0) return formData.totalPrice;
    return campaignPackages.reduce((sum, pkg) => sum + (pkg.customPrice || pkg.packageData.basePrice), 0);
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تعديل الحملة الإعلانية"
      description="قم بتحديث معلومات الحملة الإعلانية"
      maxWidth="xl"
    >
      <Form onSubmit={handleSubmit} error={error || undefined} className={styles.form}>
        {/* Campaign Information */}
        <div className={styles.section}>
          <Text variant="h4">معلومات الحملة</Text>
          <div className={styles.formGrid}>
            <Input
              label="اسم الحملة"
              type="text"
              value={formData.campaignName}
              onChange={(e) => handleChange('campaignName', e.target.value)}
              placeholder="حملة صيف 2025"
              required
            />
          </div>
          <Input
            label="الوصف (اختياري)"
            type="textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="وصف مختصر للحملة..."
            rows={3}
          />
        </div>

        {/* Client and Package Selection */}
        <div className={styles.section}>
          <Text variant="h4">العميل والحزمة</Text>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>العميل *</label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={styles.select}
                required
                disabled={loadingData}
              >
                <option value="">-- اختر العميل --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={styles.label}>الحزمة *</label>
              <select
                value={formData.packageId}
                onChange={(e) => handleChange('packageId', e.target.value)}
                className={styles.select}
                required
                disabled={loadingData}
              >
                <option value="">-- اختر الحزمة --</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.packageName} - ${pkg.basePrice}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.isCustomPackage}
              onChange={(e) => handleChange('isCustomPackage', e.target.checked)}
            />
            <span>حزمة مخصصة (سعر مخصص)</span>
          </label>
        </div>

        {/* Packages Table (for custom packages) */}
        {formData.isCustomPackage && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Text variant="h4">الحزم المضافة</Text>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setShowAddPackageModal(true)}
              >
                إضافة حزمة
              </Button>
            </div>

            {campaignPackages.length > 0 ? (
              <div className={styles.packagesTable}>
                <table>
                  <thead>
                    <tr>
                      <th>اسم الحزمة</th>
                      <th>صورة سطح المكتب</th>
                      <th>صورة الموبايل</th>
                      <th>السعر</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPackages.map((pkg, index) => (
                      <tr key={index}>
                        <td>{pkg.packageData.packageName}</td>
                        <td>
                          {pkg.desktopMediaUrl ? (
                            <img
                              src={pkg.desktopMediaUrl}
                              alt="Desktop"
                              className={styles.packageImage}
                            />
                          ) : (
                            <Text variant="small" color="secondary">لم يتم الرفع</Text>
                          )}
                        </td>
                        <td>
                          {pkg.mobileMediaUrl ? (
                            <img
                              src={pkg.mobileMediaUrl}
                              alt="Mobile"
                              className={styles.packageImage}
                            />
                          ) : (
                            <Text variant="small" color="secondary">لم يتم الرفع</Text>
                          )}
                        </td>
                        <td>${pkg.customPrice || pkg.packageData.basePrice}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              onClick={() => handleEditPackage(index)}
                              className={styles.iconButton}
                              title="تعديل"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePackage(index)}
                              className={styles.iconButton}
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Price */}
                <div className={styles.totalPrice}>
                  <Text variant="h4">السعر الإجمالي:</Text>
                  <Text variant="h3">${calculateTotalPrice()}</Text>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Text variant="paragraph" color="secondary">
                  لم يتم إضافة أي حزم بعد. اضغط على "إضافة حزمة" للبدء.
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Campaign Period */}
        <div className={styles.section}>
          <Text variant="h4">فترة الحملة</Text>
          <div className={styles.formGrid}>
            <Input
              label="تاريخ البداية"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
            <Input
              label="تاريخ الانتهاء"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={formData.startDate}
              required
            />
          </div>
        </div>

        {/* Pricing */}
        <div className={styles.section}>
          <Text variant="h4">التسعير</Text>
          <div className={styles.formGrid}>
            <Input
              label="السعر الإجمالي"
              type="number"
              value={formData.totalPrice}
              onChange={(e) => handleChange('totalPrice', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
              disabled={!formData.isCustomPackage}
            />
            <div>
              <label className={styles.label}>العملة</label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={styles.select}
                disabled={!formData.isCustomPackage}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SYR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment Link */}
        <div className={styles.section}>
          <Input
            label="رابط الدفع (اختياري)"
            type="text"
            value={formData.paymentLink}
            onChange={(e) => handleChange('paymentLink', e.target.value)}
            placeholder="https://stripe.com/payment/..."
          />
        </div>

        {/* Public Report Link */}
        {initialData?.publicReportToken && (
          <div className={styles.section}>
            <Text variant="h4">رابط التقرير العام</Text>
            <Text variant="small" color="secondary" className={styles.description}>
              يمكن للعميل الوصول إلى تقرير الأداء عبر هذا الرابط بدون تسجيل دخول
            </Text>
            <div className={styles.reportLinkActions}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy size={16} />}
                onClick={handleCopyReportLink}
              >
                نسخ رابط التقرير
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<RefreshCw size={16} />}
                onClick={handleRegenerateToken}
                loading={regeneratingToken}
              >
                إعادة إنشاء الرابط
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className={styles.section}>
          <Input
            label="ملاحظات (اختياري)"
            type="textarea"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="ملاحظات داخلية للفريق..."
            rows={3}
          />
        </div>

        {/* Submit Buttons */}
        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading || loadingData}
          >
            حفظ التغييرات
          </Button>
        </div>
      </Form>

      {/* Add Package Modal */}
      <AddPackageModal
        isVisible={showAddPackageModal}
        onClose={() => {
          setShowAddPackageModal(false);
          setEditingPackageIndex(null);
        }}
        onAdd={handleAddPackage}
        availablePackages={packages}
        editingPackage={editingPackageIndex !== null ? campaignPackages[editingPackageIndex] : undefined}
      />
    </Modal>
  );
};
