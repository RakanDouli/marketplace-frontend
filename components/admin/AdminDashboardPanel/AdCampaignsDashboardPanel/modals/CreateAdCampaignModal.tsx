'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  validateCreateAdCampaignForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/admin/validation/adCampaignValidation';
import { uploadToCloudflare, validateImageFile } from '@/utils/cloudflare-upload';
import styles from './AdCampaignModals.module.scss';

interface CreateAdCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
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

export const CreateAdCampaignModal: React.FC<CreateAdCampaignModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { user } = useAdminAuthStore();
  const { addNotification } = useNotificationStore();
  const [clients, setClients] = useState<AdClient[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
    clientId: '',
    packageId: '',
    isCustomPackage: false,
    startPreference: 'SPECIFIC_DATE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalPrice: 0,
    currency: 'USD',
    notes: '',
    desktopMediaFile: null as File | null,
    mobileMediaFile: null as File | null,
    clickUrl: '',
    openInNewTab: true,
  });

  const [selectedPackage, setSelectedPackage] = useState<AdPackage | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

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

  // Auto-calculate price and set selected package when package is selected
  useEffect(() => {
    if (formData.packageId) {
      const pkg = packages.find(p => p.id === formData.packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        if (!formData.isCustomPackage) {
          setFormData(prev => ({
            ...prev,
            totalPrice: pkg.basePrice,
            currency: pkg.currency
          }));
        }
      }
    } else {
      setSelectedPackage(null);
    }
  }, [formData.packageId, formData.isCustomPackage, packages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using Zod
    const errors = validateCreateAdCampaignForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Ad Campaign validation failed:', errors);
      setError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return; // STOP - do not submit
    }

    // Validate media files are uploaded
    if (!formData.desktopMediaFile) {
      setError('يرجى رفع وسائط الإعلان');
      return;
    }

    if (selectedPackage?.adType === 'video' && !formData.mobileMediaFile) {
      setError('يرجى رفع فيديو الموبايل (مطلوب لإعلانات الفيديو)');
      return;
    }

    console.log('✅ Ad Campaign validation passed, submitting...');

    try {
      setIsUploadingMedia(true);

      // Upload media files to Cloudflare
      let desktopMediaUrl = '';
      let mobileMediaUrl = '';

      if (formData.desktopMediaFile) {
        console.log('📤 Uploading desktop media...');
        desktopMediaUrl = await uploadToCloudflare(formData.desktopMediaFile, 'image');
        console.log('✅ Desktop media uploaded:', desktopMediaUrl);
      }

      if (formData.mobileMediaFile) {
        console.log('📤 Uploading mobile media...');
        mobileMediaUrl = await uploadToCloudflare(formData.mobileMediaFile, 'image');
        console.log('✅ Mobile media uploaded:', mobileMediaUrl);
      }

      setIsUploadingMedia(false);

      // Submit campaign with media URLs
      await onSubmit({
        ...formData,
        desktopMediaUrl,
        mobileMediaUrl,
        clickUrl: formData.clickUrl,
        openInNewTab: formData.openInNewTab,
      });

      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم إنشاء الحملة الإعلانية بنجاح',
        duration: 5000,
      });

      // Reset form
      setFormData({
        campaignName: '',
        description: '',
        clientId: '',
        packageId: '',
        isCustomPackage: false,
        startPreference: 'SPECIFIC_DATE',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalPrice: 0,
        currency: 'USD',
        notes: '',
        desktopMediaFile: null,
        mobileMediaFile: null,
        clickUrl: '',
        openInNewTab: true,
      });
      setSelectedPackage(null);
    } catch (err) {
      setIsUploadingMedia(false);
      setError(err instanceof Error ? err.message : 'فشل في إنشاء الحملة الإعلانية');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="إضافة حملة إعلانية جديدة"
      description="أنشئ حملة إعلانية جديدة لأحد العملاء"
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
                <option value="SAR">SAR</option>
              </select>
            </div>
          </div>
        </div>

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

        {/* Media Upload Section - Show only if package is selected */}
        {selectedPackage && (
          <div className={styles.section}>
            <Text variant="h4">وسائط الإعلان</Text>

            {/* Show media requirements */}
            <div className={styles.requirements}>
              <Text variant="small" style={{ fontWeight: 600 }}>المتطلبات:</Text>
              <ul style={{ marginTop: '0.5rem', paddingRight: '1.5rem' }}>
                {selectedPackage.mediaRequirements.map((req, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{req}</li>
                ))}
              </ul>
            </div>

            {/* Desktop media upload */}
            <Input
              label={selectedPackage.adType === 'video' ? 'فيديو سطح المكتب (16:9) *' : 'صورة الإعلان *'}
              type="file"
              accept={selectedPackage.adType === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp'}
              onChange={(e) => handleChange('desktopMediaFile', e.target.files?.[0] || null)}
              required
            />

            {/* Mobile media upload (VIDEO ads only) */}
            {selectedPackage.adType === 'video' && (
              <Input
                label="فيديو الموبايل (1:1) *"
                type="file"
                accept="video/mp4"
                onChange={(e) => handleChange('mobileMediaFile', e.target.files?.[0] || null)}
                required
              />
            )}

            {/* Click URL */}
            <Input
              label="رابط الإعلان (URL) *"
              type="url"
              value={formData.clickUrl}
              onChange={(e) => handleChange('clickUrl', e.target.value)}
              placeholder="https://example.com/promotion"
              required
            />

            {/* Open in new tab */}
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.openInNewTab}
                onChange={(e) => handleChange('openInNewTab', e.target.checked)}
              />
              <span>فتح في نافذة جديدة</span>
            </label>
          </div>
        )}

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
            loading={isLoading || loadingData || isUploadingMedia}
          >
            {isUploadingMedia ? 'جاري رفع الوسائط...' : 'إنشاء الحملة'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
