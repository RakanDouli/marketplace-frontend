'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Text } from '@/components/slices';
import { Trash2, Plus } from 'lucide-react';
import type { UpdateAttributeInput, Attribute, AttributeOption } from '@/stores/admin/adminAttributesStore';
import styles from './CategoryModals.module.scss';

interface EditAttributeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (id: string, attributeData: UpdateAttributeInput) => Promise<void>;
  attribute: Attribute | null;
  isLoading?: boolean;
}

interface EditableAttributeOptionData {
  id?: string;
  key: string;
  value: string;
  sortOrder: number;
  isNew?: boolean;
  isDeleted?: boolean;
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

export const EditAttributeModal: React.FC<EditAttributeModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  attribute,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UpdateAttributeInput>({
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

  const [options, setOptions] = useState<EditableAttributeOptionData[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Populate form when attribute changes
  useEffect(() => {
    if (attribute) {
      setFormData({
        key: attribute.key,
        name: attribute.name,
        type: attribute.type,
        validation: attribute.validation,
        sortOrder: attribute.sortOrder,
        showInGrid: attribute.showInGrid,
        showInList: attribute.showInList,
        showInDetail: attribute.showInDetail,
        showInFilter: attribute.showInFilter
      });

      // Load existing options
      const existingOptions: EditableAttributeOptionData[] = attribute.options.map((option: AttributeOption) => ({
        id: option.id,
        key: option.key,
        value: option.value,
        sortOrder: option.sortOrder,
        isNew: false,
        isDeleted: false
      }));
      setOptions(existingOptions);
    }
  }, [attribute]);

  // Handle input changes
  const handleInputChange = (field: keyof UpdateAttributeInput, value: any) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-generate key from name (only if key hasn't been manually modified)
    if (field === 'name' && value && formData.key === attribute?.key) {
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

    // Auto-generate key from value for new options
    if (field === 'value' && value && newOptions[index].isNew) {
      newOptions[index].key = value.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    }

    setOptions(newOptions);
  };

  // Add option
  const addOption = () => {
    setOptions([...options, {
      key: '',
      value: '',
      sortOrder: options.length,
      isNew: true,
      isDeleted: false
    }]);
  };

  // Remove/mark option for deletion
  const removeOption = (index: number) => {
    const newOptions = [...options];

    if (newOptions[index].isNew) {
      // Actually remove new options
      newOptions.splice(index, 1);
      // Update sort orders
      newOptions.forEach((option, i) => {
        option.sortOrder = i;
      });
    } else {
      // Mark existing options for deletion
      newOptions[index].isDeleted = true;
    }

    setOptions(newOptions);
  };

  // Restore deleted option
  const restoreOption = (index: number) => {
    const newOptions = [...options];
    newOptions[index].isDeleted = false;
    setOptions(newOptions);
  };

  // Basic validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'اسم الخاصية مطلوب';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      errors.name = 'اسم الخاصية يجب أن يكون بين 2 و 100 حرف';
    }

    if (!formData.key?.trim()) {
      errors.key = 'مفتاح الخاصية مطلوب';
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      errors.key = 'مفتاح الخاصية يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات سفلية فقط';
    }

    if (!formData.type) {
      errors.type = 'نوع الخاصية مطلوب';
    }

    // Validate options for selector and multi_selector types
    const activeOptions = options.filter(o => !o.isDeleted);
    if ((formData.type === 'SELECTOR' || formData.type === 'MULTI_SELECTOR') && activeOptions.length === 0) {
      errors.options = 'الخصائص من نوع الاختيار تحتاج إلى خيارات';
    }

    // Validate individual options
    const seenKeys = new Set<string>();
    activeOptions.forEach((option, i) => {
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
    });

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!attribute) return;

    // Validate form
    const newValidationErrors = validateForm();
    setValidationErrors(newValidationErrors);

    // Check if there are any validation errors
    const hasErrors = Object.keys(newValidationErrors).length > 0;
    if (hasErrors) {
      return;
    }

    try {
      // Create the attribute input - only send updateable fields
      // key, type, validation cannot be changed after creation
      const attributeInput: UpdateAttributeInput = {
        name: formData.name,
        sortOrder: formData.sortOrder || 0,
        showInGrid: formData.showInGrid,
        showInList: formData.showInList,
        showInDetail: formData.showInDetail,
        showInFilter: formData.showInFilter,
        // Include options for selector and multi_selector types
        options: needsOptions ? options.filter(o => !o.isDeleted).map(o => ({
          id: o.id,
          key: o.key,
          value: o.value,
          sortOrder: o.sortOrder,
          isActive: true,
          showInGrid: formData.showInGrid,
          showInList: formData.showInList,
          showInDetail: formData.showInDetail,
          showInFilter: formData.showInFilter
        })) : undefined
      };

      await onSubmit(attribute.id, attributeInput);
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const resetForm = () => {
    setFormData({
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
  const activeOptions = options.filter(o => !o.isDeleted);
  const deletedOptions = options.filter(o => o.isDeleted);

  if (!attribute) return null;

  const isReadOnly = attribute.isSystemCore || !attribute.canBeCustomized;

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title={`تعديل الخاصية: ${attribute.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {isReadOnly && (
          <Text variant="small" color="warning" className={styles.readOnlyNotice}>
            ⚠️ هذه خاصية أساسية في النظام. بعض الحقول غير قابلة للتعديل.
          </Text>
        )}

        {/* Attribute Name */}
        <Input
          label="اسم الخاصية *"
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={validationErrors.name}
          placeholder="مثال: نوع الوقود، لون السيارة، عدد الأبواب"
          disabled={isLoading || (isReadOnly && ['name'].includes('name'))}
        />

        {/* Attribute Key - READ ONLY */}
        <Input
          label="مفتاح الخاصية"
          type="text"
          value={formData.key || ''}
          disabled={true}
          helpText="لا يمكن تعديل المفتاح بعد الإنشاء"
        />

        {/* Attribute Type - READ ONLY */}
        <Input
          label="نوع الخاصية"
          type="text"
          value={ATTRIBUTE_TYPES.find(t => t.value === formData.type)?.label || formData.type}
          disabled={true}
          helpText="لا يمكن تعديل النوع بعد الإنشاء"
        />

        {/* Validation - READ ONLY */}
        <Input
          label="نوع التحقق"
          type="text"
          value={VALIDATION_TYPES.find(v => v.value === formData.validation)?.label || formData.validation}
          disabled={true}
          helpText="لا يمكن تعديل التحقق بعد الإنشاء"
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

            {/* Active Options */}
            {activeOptions.map((option, index) => (
              <div key={option.id || `new_${index}`} className={styles.optionRow}>
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
                  disabled={isLoading || !option.isNew}
                  helpText={option.isNew ? "سيتم إنشاؤه تلقائياً من القيمة" : "مفتاح الخيارات الموجودة غير قابل للتعديل"}
                />
                <Button
                  type="button"
                  onClick={() => removeOption(index)}
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  disabled={isLoading}
                  className={styles.removeOptionButton}
                >
                </Button>
              </div>
            ))}

            {/* Deleted Options (can be restored) */}
            {deletedOptions.length > 0 && (
              <div className={styles.deletedOptionsSection}>
                <Text variant="h4">خيارات محذوفة (يمكن استعادتها):</Text>
                {deletedOptions.map((option, index) => (
                  <div key={option.id} className={styles.deletedOptionRow}>
                    <Text variant="small" className={styles.deletedOptionText}>
                      {option.value} ({option.key})
                    </Text>
                    <Button
                      type="button"
                      onClick={() => restoreOption(options.indexOf(option))}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      استعادة
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {activeOptions.length === 0 && (
              <Text variant="small" color="secondary" className={styles.emptyOptions}>
                لا توجد خيارات نشطة. اضغط "إضافة خيار" لبدء إضافة الخيارات.
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
            {isLoading ? 'جاري التحديث...' : 'تحديث الخاصية'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};