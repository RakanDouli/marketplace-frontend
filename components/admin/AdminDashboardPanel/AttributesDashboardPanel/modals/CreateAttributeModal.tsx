'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Text } from '@/components/slices';
import { Trash2, Plus } from 'lucide-react';
import type { CreateAttributeInput } from '@/stores/admin/adminAttributesStore';
import styles from './CategoryModals.module.scss';

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

const ATTRIBUTE_TYPES = [
  { value: 'TEXT', label: 'نص' },
  { value: 'TEXTAREA', label: 'نص طويل' },
  { value: 'SELECTOR', label: 'اختيار واحد' },
  { value: 'MULTI_SELECTOR', label: 'اختيار متعدد' },
  { value: 'RANGE', label: 'مدى رقمي' },
  { value: 'CURRENCY', label: 'عملة' },
  { value: 'BOOLEAN', label: 'نعم/لا' },
  { value: 'DATE', label: 'تاريخ' }
];

const VALIDATION_TYPES = [
  { value: 'REQUIRED', label: 'مطلوب' },
  { value: 'OPTIONAL', label: 'اختياري' }
];

export const CreateAttributeModal: React.FC<CreateAttributeModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  categoryId,
  isLoading = false
}) => {
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
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (!option.value.trim()) {
          errors[`option_${i}_value`] = `قيمة الخيار ${i + 1} مطلوبة`;
        }
        if (!option.key.trim()) {
          errors[`option_${i}_key`] = `مفتاح الخيار ${i + 1} مطلوب`;
        }
      }
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
      // Create the attribute input
      const attributeInput: CreateAttributeInput = {
        ...formData,
        sortOrder: formData.sortOrder || 0,
        options: options.length > 0 ? options : undefined
      };

      await onSubmit(attributeInput);

      // Reset form on success
      resetForm();
    } catch (error) {
      // Error is handled by the parent component
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
      <form onSubmit={handleSubmit} className={styles.form}>
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
          helpText="سيتم إنشاؤه تلقائياً من اسم الخاصية"
        />

        {/* Attribute Type */}
        <Input
          label="نوع الخاصية *"
          type="select"
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          options={ATTRIBUTE_TYPES}
          error={validationErrors.type}
          disabled={isLoading}
        />

        {/* Validation */}
        <Input
          label="نوع التحقق"
          type="select"
          value={formData.validation || 'optional'}
          onChange={(e) => handleInputChange('validation', e.target.value)}
          options={VALIDATION_TYPES}
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
                  helpText=""

                />
                <Input
                  label={`مفتاح الخيار ${index + 1} *`}
                  type="text"
                  value={option.key}
                  onChange={(e) => handleOptionChange(index, 'key', e.target.value)}
                  error={validationErrors[`option_${index}_key`]}
                  placeholder="مثال: gasoline, diesel, hybrid"
                  disabled={isLoading}
                  helpText="سيتم إنشاؤه تلقائياً من القيمة"
                />
                <Button
                  type="button"
                  onClick={() => removeOption(index)}
                  variant="outline"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  disabled={isLoading}
                  className={styles.removeOptionButton}
                >
                  حذف
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
            variant="secondary"
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
      </form>
    </Modal>
  );
};