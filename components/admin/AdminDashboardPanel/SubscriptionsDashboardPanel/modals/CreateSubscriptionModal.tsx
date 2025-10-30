'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import styles from './SubscriptionModals.module.scss';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { mapToOptions, BILLING_CYCLE_LABELS, SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_ACCOUNT_TYPE_LABELS } from '@/constants/metadata-labels';
import {
  validateCreateSubscriptionForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/admin/validation/subscriptionValidation';

interface CreateSubscriptionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { addNotification } = useNotificationStore();

  // Fetch metadata from store
  const {
    billingCycles,
    subscriptionStatuses,
    subscriptionAccountTypes,
    fetchSubscriptionMetadata,
  } = useMetadataStore();

  // Fetch metadata on mount
  useEffect(() => {
    if (isVisible && billingCycles.length === 0) {
      fetchSubscriptionMetadata();
    }
  }, [isVisible, billingCycles.length, fetchSubscriptionMetadata]);

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    maxListings: 0,
    maxImagesPerListing: 0,
    videoAllowed: false,
    priorityPlacement: false,
    analyticsAccess: false,
    customBranding: false,
    featuredListings: false,
    status: 'active',
    sortOrder: 0,
    isPublic: true,
    isDefault: false,
    accountType: 'all', // Default to ALL account types
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using Zod
    const errors = validateCreateSubscriptionForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Subscription validation failed:', errors);
      setError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return; // STOP - do not submit
    }

    console.log('✅ Subscription validation passed, submitting...');

    try {
      await onSubmit(formData);

      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم إنشاء خطة الاشتراك بنجاح',
        duration: 5000,
      });

      // Reset form
      setFormData({
        name: '',
        title: '',
        description: '',
        price: 0,
        billingCycle: 'monthly',
        maxListings: 0,
        maxImagesPerListing: 0,
        videoAllowed: false,
        priorityPlacement: false,
        analyticsAccess: false,
        customBranding: false,
        featuredListings: false,
        status: 'active',
        sortOrder: 0,
        isPublic: true,
        isDefault: false,
        accountType: 'all',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء خطة الاشتراك');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="إضافة خطة اشتراك جديدة"
      description="أضف خطة اشتراك جديدة مع تحديد الميزات والحدود"
      maxWidth="xl"
    >
      <Form onSubmit={handleSubmit} error={error || undefined} className={styles.form}>
        {/* Basic Information */}
        <div className={styles.section}>
          <Text variant="h4">المعلومات الأساسية</Text>
          <div className={styles.formGrid}>
            <Input
              label="اسم المعرف (بالإنجليزية)"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="free_plan"
              required
            />
            <Input
              label="عنوان الخطة"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="الخطة المجانية"
              required
            />
          </div>
          <Input
            label="الوصف"
            type="textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="وصف مختصر للخطة..."
            rows={3}
          />
        </div>

        {/* Pricing */}
        <div className={styles.section}>
          <Text variant="h4">التسعير</Text>
          <div className={styles.formGrid}>
            <Input
              label="السعر (بالدولار)"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
              min={0}
              step={0.01}
              required
            />
            <Input
              label="دورة الفوترة"
              type="select"
              value={formData.billingCycle}
              onChange={(e) => handleChange('billingCycle', e.target.value)}
              options={mapToOptions(billingCycles, BILLING_CYCLE_LABELS)}
              required
            />
          </div>
        </div>

        {/* Limits */}
        <div className={styles.section}>
          <Text variant="h4">الحدود</Text>
          <div className={styles.formGrid}>
            <Input
              label="حد الإعلانات (0 = غير محدود)"
              type="number"
              value={formData.maxListings}
              onChange={(e) => handleChange('maxListings', parseInt(e.target.value) || 0)}
              min={0}
              required
            />
            <Input
              label="حد الصور لكل إعلان (0 = غير محدود)"
              type="number"
              value={formData.maxImagesPerListing}
              onChange={(e) => handleChange('maxImagesPerListing', parseInt(e.target.value) || 0)}
              min={0}
              required
            />
          </div>
        </div>

        {/* Features */}
        <div className={styles.section}>
          <Text variant="h4">الميزات</Text>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.videoAllowed}
                onChange={(e) => handleChange('videoAllowed', e.target.checked)}
              />
              <Text variant="paragraph">السماح بالفيديو</Text>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.priorityPlacement}
                onChange={(e) => handleChange('priorityPlacement', e.target.checked)}
              />
              <Text variant="paragraph">الأولوية في البحث</Text>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.customBranding}
                onChange={(e) => handleChange('customBranding', e.target.checked)}
              />
              <Text variant="paragraph">علامة تجارية مخصصة</Text>
            </label>
          </div>
        </div>

        {/* Settings */}
        <div className={styles.section}>
          <Text variant="h4">الإعدادات</Text>
          <div className={styles.formGrid}>
            <Input
              label="نوع الحساب"
              type="select"
              value={formData.accountType}
              onChange={(e) => handleChange('accountType', e.target.value)}
              options={mapToOptions(subscriptionAccountTypes, SUBSCRIPTION_ACCOUNT_TYPE_LABELS)}
              required
            />
            <Input
              label="الحالة"
              type="select"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={mapToOptions(subscriptionStatuses, SUBSCRIPTION_STATUS_LABELS)}
              required
            />
          </div>
          <Input
            label="ترتيب العرض"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
            min={0}
          />
          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
              />
              <Text variant="paragraph">عرض في صفحة الأسعار (يراها المستخدمون عند الترقية)</Text>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleChange('isDefault', e.target.checked)}
              />
              <Text variant="paragraph">خطة افتراضية (تُعطى تلقائياً للمستخدمين الجدد عند التسجيل)</Text>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button type="button" onClick={onClose} variant="secondary" disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء الخطة'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
