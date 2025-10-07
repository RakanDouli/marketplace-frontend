'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Text } from '@/components/slices';
import styles from './CategoryModals.module.scss';

interface CreateCategoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (categoryData: CreateCategoryData) => Promise<void>;
  isLoading?: boolean;
}

export interface CreateCategoryData {
  name: string;
  nameAr?: string;
  slug: string;
  isActive?: boolean;
  biddingEnabled?: boolean;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    nameAr: '',
    slug: '',
    isActive: true,
    biddingEnabled: false
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleInputChange = (field: keyof CreateCategoryData, value: any) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-generate slug from name
    if (field === 'name' && value) {
      newFormData.slug = value.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    setFormData(newFormData);

    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  // Basic validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'اسم التصنيف مطلوب';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      errors.name = 'اسم التصنيف يجب أن يكون بين 2 و 100 حرف';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'الرابط مطلوب';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط';
    }

    if (formData.nameAr && (formData.nameAr.length < 2 || formData.nameAr.length > 100)) {
      errors.nameAr = 'الاسم العربي يجب أن يكون بين 2 و 100 حرف';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newValidationErrors = validateForm();
    setValidationErrors(newValidationErrors);

    // Check if there are any validation errors
    const hasErrors = Object.keys(newValidationErrors).length > 0;
    if (hasErrors) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        nameAr: '',
        slug: '',
        isActive: true,
        biddingEnabled: false
      });
      setValidationErrors({});
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      nameAr: '',
      slug: '',
      isActive: true,
      biddingEnabled: false
    });
    setValidationErrors({});
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title="إضافة تصنيف جديد"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Category Name (English) */}
        <Input
          label="اسم التصنيف (بالإنجليزية) *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={validationErrors.name}
          placeholder="مثال: Cars, Electronics, Real Estate"
          disabled={isLoading}
        />

        {/* Category Name (Arabic) */}
        <Input
          label="اسم التصنيف (بالعربية)"
          type="text"
          value={formData.nameAr || ''}
          onChange={(e) => handleInputChange('nameAr', e.target.value)}
          error={validationErrors.nameAr}
          placeholder="مثال: سيارات، إلكترونيات، عقارات"
          disabled={isLoading}
        />

        {/* Slug */}
        <Input
          label="الرابط *"
          type="text"
          value={formData.slug}
          onChange={(e) => handleInputChange('slug', e.target.value)}
          error={validationErrors.slug}
          placeholder="مثال: cars, electronics, real-estate"
          disabled={isLoading}
          helpText="سيتم إنشاؤه تلقائياً من اسم التصنيف"
        />

        {/* Active Status */}
        <Input
          type="boolean"
          label="التصنيف نشط"
          checked={formData.isActive || false}
          onChange={(e) => handleInputChange('isActive', (e.target as HTMLInputElement).checked)}
          disabled={isLoading}
        />

        {/* Bidding Enabled */}
        <Input
          type="boolean"
          label="تفعيل المزايدة"
          checked={formData.biddingEnabled || false}
          onChange={(e) => handleInputChange('biddingEnabled', (e.target as HTMLInputElement).checked)}
          disabled={isLoading}
        />

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء التصنيف'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};