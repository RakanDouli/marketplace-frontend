'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import type { Role, Feature, FeaturePermissions, RoleWithPermissions } from '@/stores/admin/adminRolesStore';
import {
  validateRoleForm,
  hasValidationErrors,
  createFieldValidator,
  type ValidationErrors
} from '@/lib/admin/validation/roleValidation';
import styles from './RoleModal.module.scss';

interface EditRoleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: Role | null;
  features: Feature[];
  isLoading: boolean;
  loadRoleWithPermissions: (roleId: string) => Promise<RoleWithPermissions | null>;
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  initialData,
  features,
  isLoading,
  loadRoleWithPermissions
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
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (initialData && isVisible) {
      setFormData({
        name: initialData.name,
        description: initialData.description
      });

      // Load existing permissions
      setLoadingPermissions(true);
      loadRoleWithPermissions(initialData.id).then(roleWithPermissions => {
        if (roleWithPermissions) {
          setPermissions(roleWithPermissions.featurePermissionsObject || {});
        }
        setLoadingPermissions(false);
      });

      setCurrentStep('basic');
    } else if (!isVisible) {
      // Reset when modal closes
      setFormData({ name: '', description: '' });
      setPermissions({});
      setCurrentStep('basic');
    }
  }, [initialData, isVisible, loadRoleWithPermissions]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim() || !initialData) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialData.id,
        name: formData.name,
        description: formData.description,
        featurePermissions: permissions
      });
    } catch (error) {
      console.error('Failed to update role:', error);
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
      isVisible={isVisible && !!initialData}
      onClose={onClose}
      title={`تعديل الدور: ${initialData?.name || ''}`}
      description={
        currentStep === 'basic'
          ? 'تحديث المعلومات الأساسية للدور'
          : 'تعديل الصلاحيات المطلوبة للدور'
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
              disabled={true}
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
                onClick={() => setCurrentStep('permissions')}
                variant="primary"
                disabled={!formData.name.trim() || loadingPermissions}
              >
                {loadingPermissions ? 'جاري التحميل...' : 'التالي: تعديل الصلاحيات'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Permissions */}
        {currentStep === 'permissions' && (
          <div className={styles.stepContent}>
            {loadingPermissions ? (
              <div className={styles.loadingPermissions}>
                <p>جاري تحميل الصلاحيات الحالية...</p>
              </div>
            ) : (
              <>
                <div className={styles.permissionsHeader}>
                  <div className={styles.permissionsInfo}>
                    <span>الصلاحيات المحددة: {getPermissionCount()}</span>
                  </div>
                  <div className={styles.permissionsLegend}>
                    <div className={styles.legendItem}>
                      <span>عرض</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span>إنشاء</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span>تعديل</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span>حذف</span>
                    </div>
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
                            <span>عرض</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.permissionBtn} ${featurePerms.create ? styles.active : ''}`}
                            onClick={() => handlePermissionChange(feature.name, 'create', !featurePerms.create)}
                            title="صلاحية الإنشاء"
                          >
                            <span>إنشاء</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.permissionBtn} ${featurePerms.modify ? styles.active : ''}`}
                            onClick={() => handlePermissionChange(feature.name, 'modify', !featurePerms.modify)}
                            title="صلاحية التعديل"
                          >
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.permissionBtn} ${featurePerms.delete ? styles.active : ''}`}
                            onClick={() => handlePermissionChange(feature.name, 'delete', !featurePerms.delete)}
                            title="صلاحية الحذف"
                          >
                            <span>حذف</span>
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
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
