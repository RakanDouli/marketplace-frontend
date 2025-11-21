'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { AD_MEDIA_TYPE_LABELS, AD_PLACEMENT_LABELS, AD_FORMAT_LABELS, mapToOptions } from '@/constants/metadata-labels';
import {
  validateCreateAdPackageForm,
  hasValidationErrors,
  type ValidationErrors,
  validatePackageName,
  validateDescription,
  validateDurationDays,
  validateImpressionLimit,
  validateBasePrice,
} from '@/lib/admin/validation/adPackageValidation';
import { getAllowedFormats, getFormatDimensions } from '@/utils/ad-format-helpers';
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
  const { adMediaTypes, adPlacements, adFormats, fetchAdMetadata } = useMetadataStore();

  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    adType: '',
    placement: '',
    format: '',
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
      // Get dimensions for the selected format
      const dimensions = getFormatDimensions(formData.format);

      if (!dimensions) {
        setError('لم يتم العثور على أبعاد الصيغة المحددة');
        return;
      }

      // Transform data before sending to GraphQL
      // Backend expects uppercase for adType only: IMAGE, VIDEO (GraphQL enum keys)
      // Backend expects lowercase with underscores for placement/format: homepage_top, super_leaderboard (enum values)
      // Backend expects basePrice in dollars (decimal), not cents
      const submissionData = {
        ...formData,
        adType: formData.adType.toUpperCase(), // IMAGE, VIDEO
        placement: formData.placement, // Keep lowercase: homepage_top
        format: formData.format, // Keep lowercase: super_leaderboard
        dimensions, // Add dimensions based on format
        basePrice: formData.basePrice / 100, // Convert cents to dollars
      };

      console.log('📤 Submitting ad package data:', JSON.stringify(submissionData, null, 2));

      await onSubmit(submissionData);
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
        placement: '',
        format: '',
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
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Reset format when adType or placement changes
      if (field === 'adType' || field === 'placement') {
        updated.format = ''; // Clear format to force user to re-select
      }

      return updated;
    });
  };

  // Calculate allowed formats based on selected adType and placement
  const allowedFormats = useMemo(() => {
    if (!formData.adType || !formData.placement) {
      return []; // No formats available until both are selected
    }

    const formats = getAllowedFormats(formData.adType, formData.placement);
    console.log(`📋 Allowed formats for ${formData.adType} + ${formData.placement}:`, formats);
    return formats;
  }, [formData.adType, formData.placement]);

  // Filter ad types to show only BANNER and VIDEO (not other variants)
  const allowedAdTypes = useMemo(() => {
    return adMediaTypes.filter(type => type === 'banner' || type === 'video');
  }, [adMediaTypes]);

  // Filter format options to show only allowed formats
  const formatOptions = useMemo(() => {
    if (allowedFormats.length === 0) {
      return [{ value: '', label: '-- اختر نوع الإعلان والموقع أولاً --' }];
    }

    return [
      { value: '', label: '-- اختر الصيغة --' },
      ...mapToOptions(allowedFormats, AD_FORMAT_LABELS)
    ];
  }, [allowedFormats]);

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
              validate={validatePackageName}
              error={validationErrors.packageName}
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
            validate={validateDescription}
            error={validationErrors.description}
          />
        </div>

        {/* Ad Type, Placement & Format */}
        <div className={styles.section}>
          <Text variant="h4">نوع الإعلان والموقع</Text>
          <div className={styles.formGrid}>
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
            <Input
              label="موقع الإعلان"
              type="select"
              value={formData.placement}
              onChange={(e) => handleChange('placement', e.target.value)}
              options={[
                { value: '', label: '-- اختر الموقع --' },
                ...mapToOptions(adPlacements, AD_PLACEMENT_LABELS)
              ]}
              required
            />
          </div>
          <Input
            label="صيغة الإعلان"
            type="select"
            value={formData.format}
            onChange={(e) => handleChange('format', e.target.value)}
            options={formatOptions}
            required
            disabled={!formData.adType || !formData.placement}
          />
          <Text variant="small" color="secondary">
            {formData.adType === 'video' && 'يتطلب فيديو بنسبة 16:9 للسطح المكتب و 1:1 للموبايل'}
            {formData.adType === 'banner' && 'بانر ثابت بالأبعاد المحددة'}
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
              validate={(value) => validateDurationDays(Number(value))}
              error={validationErrors.durationDays}
            />
            <Input
              label="حد الظهور (عدد المرات)"
              type="number"
              value={formData.impressionLimit}
              onChange={(e) => handleChange('impressionLimit', parseInt(e.target.value) || 0)}
              min={0}
              required
              validate={(value) => validateImpressionLimit(Number(value))}
              error={validationErrors.impressionLimit}
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
            error={validationErrors.basePrice}
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
