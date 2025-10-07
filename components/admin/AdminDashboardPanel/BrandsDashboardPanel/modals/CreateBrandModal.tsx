'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Text } from '@/components/slices';
import { validateBrandForm } from '@/lib/admin/validation/brandValidation';
import styles from './BrandModals.module.scss';

interface CreateBrandModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (brandData: CreateBrandData) => Promise<void>;
  categoryId: string | null;
  isLoading?: boolean;
}

export interface CreateBrandData {
  name: string;
  externalId?: string;
  source?: 'manual' | 'sync';
  status?: 'active' | 'archived';
}

export const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  categoryId,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateBrandData>({
    name: '',
    externalId: '',
    source: 'manual',
    status: 'active'
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleInputChange = (field: keyof CreateBrandData, value: any) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-generate externalId from name in lowercase
    if (field === 'name' && value) {
      newFormData.externalId = value.toLowerCase().replace(/\s+/g, '-');
    }

    setFormData(newFormData);

    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      return;
    }

    // Validate form
    const newValidationErrors = validateBrandForm(formData);
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
        externalId: '',
        source: 'manual',
        status: 'active'
      });
      setValidationErrors({});
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      externalId: '',
      source: 'manual',
      status: 'active'
    });
    setValidationErrors({});
    onClose();
  };

  if (!categoryId) {
    return null;
  }

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title="إضافة علامة تجارية جديدة"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Brand Name */}
        <Input
          label="اسم العلامة التجارية *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={validationErrors.name}
          placeholder="مثال:Toyota, Bmw, Tesla.."
          disabled={isLoading}
        />

        {/* External ID & Source - Auto-generated, hidden from user */}



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
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء العلامة التجارية'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};