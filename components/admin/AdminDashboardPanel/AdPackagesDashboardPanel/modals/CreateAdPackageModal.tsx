'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { AD_MEDIA_TYPE_LABELS, mapToOptions } from '@/constants/metadata-labels';
import {
  validateCreateAdPackageForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/admin/validation/adPackageValidation';
import styles from './AdPackageModals.module.scss';

interface CreateAdPackageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const CreateAdPackageModal: React.FC<CreateAdPackageModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { addNotification } = useNotificationStore();
  const { adMediaTypes, fetchAdMetadata } = useMetadataStore();

  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    adType: '',
    durationDays: 30,
    impressionLimit: 10000,
    basePrice: 0,
    currency: 'USD',
    isActive: true,
    mediaRequirements: ['1200x200px', 'max 2MB'],
  });

  // Fetch ad metadata on mount
  useEffect(() => {
    if (adMediaTypes.length === 0) {
      fetchAdMetadata();
    }
  }, [adMediaTypes.length, fetchAdMetadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using Zod
    const errors = validateCreateAdPackageForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Ad Package validation failed:', errors);
      setError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return; // STOP - do not submit
    }

    console.log('✅ Ad Package validation passed, submitting...');

    try {
      await onSubmit(formData);
      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم إنشاء حزمة الإعلان بنجاح',
        duration: 5000,
      });
      // Reset form
      setFormData({
        packageName: '',
        description: '',
        adType: '',
        durationDays: 30,
        impressionLimit: 10000,
        basePrice: 0,
        currency: 'USD',
        isActive: true,
        mediaRequirements: ['1200x200px', 'max 2MB'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء حزمة الإعلان');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="إضافة حزمة إعلان جديدة"
      description="أضف حزمة إعلان جديدة مع تحديد السعر والميزات"
      maxWidth="xl"
    >
      <Form onSubmit={handleSubmit} error={error || undefined} className={styles.form}>
        {/* Basic Information */}
        <div className={styles.section}>
          <Text variant="h4">المعلومات الأساسية</Text>
          <div className={styles.formGrid}>
            <Input
              label="اسم الحزمة"
              type="text"
              value={formData.packageName}
              onChange={(e) => handleChange('packageName', e.target.value)}
              placeholder="حزمة البانر المتميزة - 30 يوم"
              required
            />
          </div>
          <Input
            label="الوصف"
            type="textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="وصف مختصر للحزمة..."
            rows={3}
            required
          />
        </div>

        {/* Ad Type */}
        <div className={styles.section}>
          <Text variant="h4">نوع الإعلان</Text>
          <Input
            label="نوع الإعلان"
            type="select"
            value={formData.adType}
            onChange={(e) => handleChange('adType', e.target.value)}
            options={[
              { value: '', label: '-- اختر نوع الإعلان --' },
              ...mapToOptions(adMediaTypes, AD_MEDIA_TYPE_LABELS)
            ]}
            required
          />
          <Text variant="small" color="secondary">
            {formData.adType === 'VIDEO' && 'يتطلب فيديو بنسبة 16:9 للسطح المكتب و 1:1 للموبايل'}
            {formData.adType === 'BETWEEN_LISTINGS_BANNER' && 'بانر عريض كامل بين صفوف القوائم'}
            {formData.adType === 'BANNER' && 'بانر علوي بعرض 1200x200 بكسل'}
          </Text>
        </div>

        {/* Duration & Impressions */}
        <div className={styles.section}>
          <Text variant="h4">المدة وحد الظهور</Text>
          <div className={styles.formGrid}>
            <Input
              label="المدة (بالأيام)"
              type="number"
              value={formData.durationDays}
              onChange={(e) => handleChange('durationDays', parseInt(e.target.value) || 0)}
              min={1}
              required
            />
            <Input
              label="حد الظهور (عدد المرات)"
              type="number"
              value={formData.impressionLimit}
              onChange={(e) => handleChange('impressionLimit', parseInt(e.target.value) || 0)}
              min={0}
              required
            />
          </div>
        </div>

        {/* Pricing */}
        <div className={styles.section}>
          <Text variant="h4">التسعير</Text>
          <Input
            label="السعر"
            type="price"
            value={formData.basePrice}
            onChange={(e) => handleChange('basePrice', parseFloat(e.target.value) || 0)}
            required
          />
          <Text variant="small" color="secondary">
            جميع الأسعار بالدولار الأمريكي (USD). سيتم تحويلها تلقائياً حسب موقع المستخدم.
          </Text>
        </div>

        {/* Status */}
        <div className={styles.section}>
          <Text variant="h4">الحالة</Text>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
            />
            <span>نشط (قابل للعرض في قائمة الحزم)</span>
          </label>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            إنشاء الحزمة
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
