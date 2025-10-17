'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Text, Form } from '@/components/slices';
import { Trash2, Plus } from 'lucide-react';
import type { CreateAttributeInput } from '@/stores/admin/adminAttributesStore';
import styles from './CategoryModals.module.scss';
import { useMetadataStore } from '@/stores/metadataStore';
import { mapToOptions, ATTRIBUTE_TYPE_LABELS, ATTRIBUTE_VALIDATION_LABELS, ATTRIBUTE_STORAGE_TYPE_LABELS } from '@/constants/metadata-labels';

interface CreateAttributeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (attributeData: CreateAttributeInput) => Promise<void>;
  categoryId?: string;
  isLoading?: boolean;
}

export interface AttributeOptionData {
  key: string;
  value: string;
  sortOrder: number;
}

export const CreateAttributeModal: React.FC<CreateAttributeModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  categoryId,
  isLoading = false
}) => {
  // Fetch metadata from store
  const {
    attributeTypes,
    attributeValidations,
    attributeStorageTypes,
    fetchAttributeMetadata,
  } = useMetadataStore();

  // Fetch metadata on mount
  useEffect(() => {
    if (isVisible && attributeTypes.length === 0) {
      fetchAttributeMetadata();
    }
  }, [isVisible, attributeTypes.length, fetchAttributeMetadata]);
  const [formData, setFormData] = useState<CreateAttributeInput>({
    categoryId: categoryId,
    key: '',
    name: '',
    type: 'TEXT',
    validation: 'OPTIONAL',
    sortOrder: 0,
    showInGrid: true,
    showInList: true,
    showInDetail: true,
    showInFilter: false
  });

  const [options, setOptions] = useState<AttributeOptionData[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Reset form when categoryId changes
  useEffect(() => {
    if (categoryId) {
      setFormData((prev: CreateAttributeInput) => ({ ...prev, categoryId }));
    }
  }, [categoryId]);

  // Handle input changes
  const handleInputChange = (field: keyof CreateAttributeInput, value: any) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-generate key from name
    if (field === 'name' && value) {
      newFormData.key = value.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    }

    setFormData(newFormData);

    // Clear validation error for this field
    const fieldName = String(field);
    if (validationErrors[fieldName]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  // Handle option changes
  const handleOptionChange = (index: number, field: 'key' | 'value', value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // Auto-generate key from value
    if (field === 'value' && value) {
      newOptions[index].key = value.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    }

    setOptions(newOptions);
  };

  // Add option
  const addOption = () => {
    setOptions([...options, { key: '', value: '', sortOrder: options.length }]);
  };

  // Remove option
  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    // Update sort orders
    newOptions.forEach((option, i) => {
      option.sortOrder = i;
    });
    setOptions(newOptions);
  };

  // Basic validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'اسم الخاصية مطلوب';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      errors.name = 'اسم الخاصية يجب أن يكون بين 2 و 100 حرف';
    }

    if (!formData.key.trim()) {
      errors.key = 'مفتاح الخاصية مطلوب';
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      errors.key = 'مفتاح الخاصية يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات سفلية فقط';
    }

    if (!formData.type) {
      errors.type = 'نوع الخاصية مطلوب';
    }

    // Validate options for selector and multi_selector types
    if ((formData.type === 'SELECTOR' || formData.type === 'MULTI_SELECTOR') && options.length === 0) {
      errors.options = 'الخصائص من نوع الاختيار تحتاج إلى خيارات';
    }

    // Validate individual options
    if (options.length > 0) {
      const seenKeys = new Set<string>();

      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (!option.value.trim()) {
          errors[`option_${i}_value`] = `قيمة الخيار ${i + 1} مطلوبة`;
        }
        if (!option.key.trim()) {
          errors[`option_${i}_key`] = `مفتاح الخيار ${i + 1} مطلوب`;
        } else {
          // Check for duplicate keys
          const normalizedKey = option.key.trim().toLowerCase();
          if (seenKeys.has(normalizedKey)) {
            errors[`option_${i}_key`] = `مفتاح الخيار مكرر: "${option.key}"`;
          } else {
            seenKeys.add(normalizedKey);
          }
        }
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission while loading
    if (isLoading) {
      return;
    }

    // Validate form
    const newValidationErrors = validateForm();
    setValidationErrors(newValidationErrors);

    // Check if there are any validation errors
    const hasErrors = Object.keys(newValidationErrors).length > 0;
    if (hasErrors) {
      return;
    }

    try {
      // Create the attribute input
      const attributeInput: CreateAttributeInput = {
        ...formData,
        sortOrder: formData.sortOrder || 0,
        options: options.length > 0 ? options : undefined
      };

      // Debug: Log options being sent
      if (options.length > 0) {
        console.log('Options being sent:', options);
        console.log('Option keys:', options.map(o => o.key));

        // Check for duplicates
        const keys = options.map(o => o.key.toLowerCase());
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
          console.error('DUPLICATE KEYS DETECTED:', keys);
        }
      }

      await onSubmit(attributeInput);

      // Reset form on success
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الخاصية');
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: categoryId,
      key: '',
      name: '',
      type: 'TEXT',
      validation: 'OPTIONAL',
      sortOrder: 0,
      showInGrid: true,
      showInList: true,
      showInDetail: true,
      showInFilter: false
    });
    setOptions([]);
    setValidationErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const needsOptions = formData.type === 'SELECTOR' || formData.type === 'MULTI_SELECTOR';

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title="إضافة خاصية جديدة"
      maxWidth="lg"
    >
      <Form onSubmit={handleSubmit} error={error || undefined} className={styles.form}>
        {/* Attribute Name */}
        <Input
          label="اسم الخاصية *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={validationErrors.name}
          placeholder="مثال: نوع الوقود، لون السيارة، عدد الأبواب"
          disabled={isLoading}
        />

        {/* Attribute Key */}
        <Input
          label="مفتاح الخاصية *"
          type="text"
          value={formData.key}
          onChange={(e) => handleInputChange('key', e.target.value)}
          error={validationErrors.key}
          placeholder="مثال: fuel_type, car_color, doors_count"
          disabled={isLoading}
        />

        {/* Attribute Type */}
        <Input
          label="نوع الخاصية *"
          type="select"
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          options={mapToOptions(attributeTypes, ATTRIBUTE_TYPE_LABELS)}
          error={validationErrors.type}
          disabled={isLoading}
        />

        {/* Validation */}
        <Input
          label="نوع التحقق"
          type="select"
          value={formData.validation || 'optional'}
          onChange={(e) => handleInputChange('validation', e.target.value)}
          options={mapToOptions(attributeValidations, ATTRIBUTE_VALIDATION_LABELS)}
          disabled={isLoading}
        />

        {/* Display Options */}
        <Input
          type="boolean"
          label="عرض في الشبكة"
          checked={formData.showInGrid || false}
          onChange={(e) => handleInputChange('showInGrid', (e.target as HTMLInputElement).checked)}
          disabled={isLoading}
        />

        <Input
          type="boolean"
          label="عرض في القائمة"
          checked={formData.showInList || false}
          onChange={(e) => handleInputChange('showInList', (e.target as HTMLInputElement).checked)}
          disabled={isLoading}
        />

        <Input
          type="boolean"
          label="عرض في التفاصيل"
          checked={formData.showInDetail || false}
          onChange={(e) => handleInputChange('showInDetail', (e.target as HTMLInputElement).checked)}
          disabled={isLoading}
        />

        <Input
          type="boolean"
          label="عرض في الفلاتر"
          checked={formData.showInFilter || false}
          onChange={(e) => handleInputChange('showInFilter', (e.target as HTMLInputElement).checked)}
          disabled={isLoading}
        />

        {/* Options for selector types */}
        {needsOptions && (
          <div className={styles.optionsSection}>
            <div className={styles.optionsHeader}>
              <Text variant="h4">خيارات الخاصية</Text>
              <Button
                type="button"
                onClick={addOption}
                variant="outline"
                size="sm"
                icon={<Plus size={16} />}
                disabled={isLoading}
              >
                إضافة خيار
              </Button>
            </div>

            {validationErrors.options && (
              <Text variant="small" color="error" className={styles.error}>
                {validationErrors.options}
              </Text>
            )}

            {options.map((option, index) => (
              <div key={index} className={styles.optionRow}>
                <Input
                  label={`قيمة الخيار ${index + 1} *`}
                  type="text"
                  value={option.value}
                  onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                  error={validationErrors[`option_${index}_value`]}
                  placeholder="مثال: بنزين، ديزل، هايبرد"
                  disabled={isLoading}

                />
                <Input
                  label={`مفتاح الخيار ${index + 1} *`}
                  type="text"
                  value={option.key}
                  onChange={(e) => handleOptionChange(index, 'key', e.target.value)}
                  error={validationErrors[`option_${index}_key`]}
                  placeholder="مثال: gasoline, diesel, hybrid"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={() => removeOption(index)}
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  disabled={isLoading}
                  className={styles.removeOptionButton}
                >ss
                </Button>
              </div>
            ))}

            {options.length === 0 && (
              <Text variant="small" color="secondary" className={styles.emptyOptions}>
                لا توجد خيارات. اضغط "إضافة خيار" لبدء إضافة الخيارات.
              </Text>
            )}
          </div>
        )}

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
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء الخاصية'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};