'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/slices/Button/Button';
import { useAdminRolesStore } from '@/stores/admin/adminRolesStore';
import type { Role, Feature, FeaturePermissions } from '@/stores/admin/adminRolesStore';
import { X, Shield, Settings, Users, Eye, Edit, Trash2, Plus } from 'lucide-react';
import styles from './RoleForm.module.scss';

interface RoleFormProps {
  isVisible: boolean;
  onClose: () => void;
  initialData?: Role | null;
  mode: 'create' | 'edit';
}

export const RoleForm: React.FC<RoleFormProps> = ({
  isVisible,
  onClose,
  initialData,
  mode
}) => {
  const { features, loading, createRole, updateRolePermissions, loadRoleWithPermissions } = useAdminRolesStore();

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

  // Initialize form data
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name,
        description: initialData.description
      });

      // Load existing permissions
      loadRoleWithPermissions(initialData.id).then(roleWithPermissions => {
        if (roleWithPermissions) {
          setPermissions(roleWithPermissions.featurePermissionsObject || {});
        }
      });
    } else {
      // Reset for create mode
      setFormData({ name: '', description: '' });
      setPermissions({});
    }
    setCurrentStep('basic');
  }, [initialData, mode, loadRoleWithPermissions]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الدور');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createRole({
          name: formData.name,
          description: formData.description,
          featurePermissions: permissions
        });
      } else if (initialData) {
        await updateRolePermissions(initialData.id, permissions);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save role:', error);
      alert('فشل في حفظ الدور. يرجى المحاولة مرة أخرى.');
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

  if (!isVisible) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Shield size={24} />
            <div>
              <h2>{mode === 'create' ? 'إضافة دور جديد' : `تعديل الدور: ${initialData?.name}`}</h2>
              <p>
                {currentStep === 'basic'
                  ? 'أدخل المعلومات الأساسية للدور'
                  : 'حدد الصلاحيات المطلوبة للدور'
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} icon={<X size={20} />} />
        </div>

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
            <div className={styles.formGroup}>
              <label>اسم الدور *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: مدير المحتوى"
                disabled={mode === 'edit'} // Can't change name in edit mode
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>وصف الدور</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر لمسؤوليات هذا الدور..."
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.stepActions}>
              <Button
                onClick={() => setCurrentStep('permissions')}
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
                <Settings size={20} />
                <span>الصلاحيات المحددة: {getPermissionCount()}</span>
              </div>
              <div className={styles.permissionsLegend}>
                <div className={styles.legendItem}>
                  <Eye size={16} />
                  <span>عرض</span>
                </div>
                <div className={styles.legendItem}>
                  <Plus size={16} />
                  <span>إنشاء</span>
                </div>
                <div className={styles.legendItem}>
                  <Edit size={16} />
                  <span>تعديل</span>
                </div>
                <div className={styles.legendItem}>
                  <Trash2 size={16} />
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
                        <h4>{getFeatureDisplayName(feature.name)}</h4>
                        <p>{feature.description || `إدارة ${getFeatureDisplayName(feature.name)}`}</p>
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
                        <Eye size={16} />
                        <span>عرض</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.create ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'create', !featurePerms.create)}
                        title="صلاحية الإنشاء"
                      >
                        <Plus size={16} />
                        <span>إنشاء</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.modify ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'modify', !featurePerms.modify)}
                        title="صلاحية التعديل"
                      >
                        <Edit size={16} />
                        <span>تعديل</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.permissionBtn} ${featurePerms.delete ? styles.active : ''}`}
                        onClick={() => handlePermissionChange(feature.name, 'delete', !featurePerms.delete)}
                        title="صلاحية الحذف"
                      >
                        <Trash2 size={16} />
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
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'جاري الحفظ...' : (mode === 'create' ? 'إنشاء الدور' : 'حفظ التغييرات')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get feature display names in Arabic
function getFeatureDisplayName(featureName: string): string {
  const displayNames: Record<string, string> = {
    users: 'المستخدمين',
    roles: 'الأدوار',
    categories: 'التصنيفات',
    attributes: 'الخصائص',
    listings: 'الإعلانات',
    ad_packages: 'حزم الإعلانات',
    ad_clients: 'عملاء الإعلانات',
    ad_campaigns: 'حملات الإعلانات',
    analytics: 'التحليلات',
    audit_logs: 'سجلات المراجعة',
    own_listings: 'الإعلانات الشخصية',
    own_chats: 'المحادثات الشخصية',
    own_account: 'الحساب الشخصي'
  };

  return displayNames[featureName] || featureName;
}