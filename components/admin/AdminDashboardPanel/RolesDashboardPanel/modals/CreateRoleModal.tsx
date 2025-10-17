'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import type { Feature, FeaturePermissions } from '@/stores/admin/adminRolesStore';
import {
  validateRoleForm,
  hasValidationErrors,
  createFieldValidator,
  type ValidationErrors
} from '@/lib/admin/validation/roleValidation';
import styles from './RoleModal.module.scss';

interface CreateRoleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  features: Feature[];
  isLoading: boolean;
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  features,
  isLoading
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Permission state - feature name to permissions mapping
  const [permissions, setPermissions] = useState<Record<string, FeaturePermissions>>({});

  // UI state
  const [currentStep, setCurrentStep] = useState<'basic' | 'permissions'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      setFormData({ name: '', description: '' });
      setPermissions({});
      setCurrentStep('basic');
    }
  }, [isVisible]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        featurePermissions: permissions
      });
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle permission change
  const handlePermissionChange = (featureName: string, action: keyof FeaturePermissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [featureName]: {
        ...prev[featureName],
        [action]: value
      }
    }));
  };

  // Toggle all permissions for a feature
  const toggleAllFeaturePermissions = (featureName: string, enabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [featureName]: {
        view: enabled,
        create: enabled,
        modify: enabled,
        delete: enabled
      }
    }));
  };

  // Get current permissions for a feature
  const getFeaturePermissions = (featureName: string): FeaturePermissions => {
    return permissions[featureName] || {
      view: false,
      create: false,
      modify: false,
      delete: false
    };
  };

  // Check if feature has any permissions
  const hasAnyPermissions = (featureName: string): boolean => {
    const perms = getFeaturePermissions(featureName);
    return perms.view || perms.create || perms.modify || perms.delete;
  };

  // Count selected permissions
  const getPermissionCount = (): number => {
    return Object.values(permissions).reduce((count, featurePerms) => {
      return count + Object.values(featurePerms).filter(Boolean).length;
    }, 0);
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="إضافة دور جديد"
      description={
        currentStep === 'basic'
          ? 'أدخل المعلومات الأساسية للدور'
          : 'حدد الصلاحيات المطلوبة للدور'
      }
      maxWidth="xl"
    >
      <div className={styles.wizardContent}>
        {/* Progress Indicator */}
        <div className={styles.progress}>
          <div className={`${styles.step} ${currentStep === 'basic' ? styles.active : styles.completed}`}>
            <span>1</span>
            <span>المعلومات الأساسية</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.step} ${currentStep === 'permissions' ? styles.active : ''}`}>
            <span>2</span>
            <span>الصلاحيات</span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 'basic' && (
          <div className={styles.stepContent}>
            <Input
              label="اسم الدور *"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: مدير المحتوى"
              required
              validate={createFieldValidator('name')}
              error={validationErrors.name}
            />

            <Input
              label="وصف الدور"
              type="textarea"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف مختصر لمسؤوليات هذا الدور..."
              rows={3}
              validate={createFieldValidator('description')}
              error={validationErrors.description}
            />

            <div className={styles.stepActions}>
              <Button
                onClick={() => {
                  // Validate form before proceeding to next step
                  const errors = validateRoleForm(formData);
                  setValidationErrors(errors);

                  if (!hasValidationErrors(errors)) {
                    setCurrentStep('permissions');
                  }
                }}
                variant="primary"
                disabled={!formData.name.trim()}
              >
                التالي: تحديد الصلاحيات
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Permissions */}
        {currentStep === 'permissions' && (
          <div className={styles.stepContent}>
            <div className={styles.permissionsHeader}>
              <div className={styles.permissionsInfo}>
                <span>الصلاحيات المحددة: {getPermissionCount()}</span>
              </div>
              <div className={styles.permissionsLegend}>
                <span>عرض</span>
                <span>إنشاء</span>
                <span>تعديل</span>
                <span>حذف</span>
              </div>
            </div>

            <div className={styles.permissionsGrid}>
              {features.map(feature => {
                const featurePerms = getFeaturePermissions(feature.name);
                const hasAny = hasAnyPermissions(feature.name);

                return (
                  <div key={feature.id} className={`${styles.featureCard} ${hasAny ? styles.active : ''}`}>
                    <div className={styles.featureHeader}>
                      <div className={styles.featureInfo}>
                        <h4>{feature.displayName || feature.name}</h4>
                        <p>{feature.description || `إدارة ${feature.displayName || feature.name}`}</p>
                      </div>
                      <div className={styles.featureToggle}>
                        <input
                          type="checkbox"
                          checked={hasAny}
                          onChange={(e) => toggleAllFeaturePermissions(feature.name, e.target.checked)}
                          id={`toggle-${feature.name}`}
                        />
                        <label htmlFor={`toggle-${feature.name}`}>تفعيل الكل</label>
                      </div>
                    </div>

                    <div className={styles.permissionButtons}>
                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.view ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'view', !featurePerms.view)}
                        title="صلاحية العرض"
                      >
                        عرض
                      </button>

                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.create ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'create', !featurePerms.create)}
                        title="صلاحية الإنشاء"
                      >
                        إنشاء
                      </button>

                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.modify ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'modify', !featurePerms.modify)}
                        title="صلاحية التعديل"
                      >
                        تعديل
                      </button>

                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.delete ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'delete', !featurePerms.delete)}
                        title="صلاحية الحذف"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.stepActions}>
              <Button
                onClick={() => setCurrentStep('basic')}
                variant="secondary"
              >
                السابق
              </Button>
              <Button
                onClick={handleSubmit}
                variant="primary"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الدور'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
