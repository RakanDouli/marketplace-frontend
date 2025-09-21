'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import useAdminModulesStore from '@/stores/adminModulesStore';
import { Button, Input, Container, Text } from '@/components/slices';
import type { FieldConfig, AdminFormProps, ValidationRule } from '@/lib/admin/types';
import styles from './AdminForm.module.scss';

interface AdminFormComponentProps extends Omit<AdminFormProps, 'fields'> {
  moduleKey: string;
  mode: 'create' | 'edit';
  entityId?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function AdminForm({
  moduleKey,
  mode,
  entityId,
  initialData,
  onSubmit,
  onCancel,
  onSuccess,
  onError,
  isLoading = false
}: AdminFormComponentProps) {
  const { user, hasAnyPermission } = useAdminAuthStore();
  const { getAvailableModules } = useAdminModulesStore();

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Get module configuration
  const module = useMemo(() => {
    if (!user) return null;
    const availableModules = getAvailableModules(user.role, user.permissions);
    return availableModules.find((m: any) => m.key === moduleKey);
  }, [moduleKey, user, getAvailableModules]);

  // Get visible fields based on permissions
  const visibleFields = useMemo(() => {
    if (!module?.config?.formFields || !user) return [];

    return module.config.formFields.filter((field: FieldConfig) => {
      // Check field-level permissions
      const action = mode === 'create' ? 'create' : 'update';
      const hasFieldPermission = hasAnyPermission([
        `${moduleKey}.${action}.*`,
        `${moduleKey}.${action}.${field.key}`,
        `${moduleKey}.manage`
      ]);

      return hasFieldPermission;
    });
  }, [module, user, moduleKey, mode, hasAnyPermission]);

  // Initialize form data
  useEffect(() => {
    const initData: Record<string, any> = {};

    visibleFields.forEach((field: FieldConfig) => {
      if (initialData && field.key in initialData) {
        initData[field.key] = initialData[field.key];
      } else if (field.default !== undefined) {
        initData[field.key] = field.default;
      } else {
        initData[field.key] = getDefaultValue(field.type);
      }
    });

    setFormData(initData);
  }, [visibleFields, initialData]);

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'select':
        return '';
      default:
        return '';
    }
  };

  const validateField = (field: FieldConfig, value: any): string | null => {
    if (!field.validation) return null;

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            return rule.messageAr || rule.message || `${field.labelAr || field.label} مطلوب`;
          }
          break;

        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return rule.messageAr || rule.message || 'صيغة البريد الإلكتروني غير صحيحة';
          }
          break;

        case 'min':
          if (typeof value === 'string' && value.length < rule.value) {
            return rule.messageAr || rule.message || `الحد الأدنى ${rule.value} أحرف`;
          }
          if (typeof value === 'number' && value < rule.value) {
            return rule.messageAr || rule.message || `الحد الأدنى ${rule.value}`;
          }
          break;

        case 'max':
          if (typeof value === 'string' && value.length > rule.value) {
            return rule.messageAr || rule.message || `الحد الأقصى ${rule.value} أحرف`;
          }
          if (typeof value === 'number' && value > rule.value) {
            return rule.messageAr || rule.message || `الحد الأقصى ${rule.value}`;
          }
          break;

        case 'pattern':
          if (value && !new RegExp(rule.value).test(value)) {
            return rule.messageAr || rule.message || 'صيغة غير صحيحة';
          }
          break;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    visibleFields.forEach((field: FieldConfig) => {
      const error = validateField(field, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));

    // Clear field error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }));
    }

    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onSuccess?.(formData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionsForKey = (optionsKey: string) => {
    // Handle predefined option sets
    switch (optionsKey) {
      case 'USER_ROLES':
        return [
          { value: 'USER', label: 'مستخدم' },
          { value: 'EDITOR', label: 'محرر' },
          { value: 'ADMIN', label: 'مدير' },
          { value: 'SUPER_ADMIN', label: 'مدير عام' }
        ];

      case 'LISTING_STATUS':
        return [
          { value: 'DRAFT', label: 'مسودة' },
          { value: 'ACTIVE', label: 'نشط' },
          { value: 'SOLD', label: 'مباع' },
          { value: 'SUSPENDED', label: 'معلق' }
        ];

      default:
        return [];
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key] || '';
    const hasError = !!errors[field.key];

    // Handle checkbox separately
    if (field.type === 'boolean') {
      return (
        <div className={styles.checkboxField}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              disabled={isSubmitting || isLoading}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>
              {field.labelAr || field.label}
              {field.required && <span className={styles.required}>*</span>}
            </span>
          </label>
          {hasError && <div className={styles.fieldError}>{errors[field.key]}</div>}
        </div>
      );
    }

    // Handle other field types using Input slice
    const options = field.type === 'select'
      ? (Array.isArray(field.options) ? field.options.map(opt => ({
          value: opt.value.toString(),
          label: opt.labelAr || opt.label
        })) : getOptionsForKey(field.options || ''))
      : undefined;

    return (
      <Input
        key={field.key}
        type={field.type}
        label={field.labelAr || field.label}
        value={value}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        placeholder={field.placeholderAr || field.placeholder}
        error={errors[field.key]}
        disabled={isSubmitting || isLoading}
        required={field.required}
        options={options}
        rows={field.type === 'textarea' ? 4 : undefined}
        hasError={hasError}
      />
    );
  };

  if (!module) {
    return (
      <Container>
        <div className={styles.emptyState}>
          <Text>وحدة غير موجودة أو غير مسموح الوصول إليها</Text>
        </div>
      </Container>
    );
  }

  if (visibleFields.length === 0) {
    return (
      <Container>
        <div className={styles.emptyState}>
          <Text>لا توجد حقول متاحة للتعديل</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.formContainer}>
        {/* Form Header */}
        <div className={styles.header}>
          <Text variant="h3">
            {mode === 'create' ? 'إضافة' : 'تعديل'} {module.nameAr || module.name}
          </Text>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.form} dir="rtl">
          <div className={styles.fieldsGrid}>
            {visibleFields.map((field: FieldConfig) => (
              <div
                key={field.key}
                className={field.type === 'textarea' ? styles.fullWidth : ''}
              >
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isLoading || !isDirty}
            >
              {mode === 'create' ? 'إضافة' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

export default AdminForm;