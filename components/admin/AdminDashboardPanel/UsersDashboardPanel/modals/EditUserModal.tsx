'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { Modal } from '@/components/slices';
import { User, Mail, Shield, Building, Key } from 'lucide-react';
import styles from './UserModals.module.scss';
import { useMetadataStore } from '@/stores/metadataStore';
import { USER_STATUS_LABELS, USER_ROLE_LABELS, ACCOUNT_TYPE_LABELS, getLabel } from '@/constants/metadata-labels';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { useAdminUsersStore } from '@/stores/admin/adminUsersStore';
import {
  validateUserFormEdit,
  hasValidationErrors,
  createUserFieldValidator,
  type UserFormData,
  type ValidationErrors
} from '@/lib/admin/validation/userValidation';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  accountType: string;
  status: string;
  accountBadge?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface EditUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  onResetPassword?: (userId: string) => Promise<void>;
  initialData?: User | null;
  isLoading?: boolean;
}


// Helper functions now use imported labels from metadata-labels.ts
const getRoleLabel = (role: string) => getLabel(role, USER_ROLE_LABELS);
const getAccountTypeLabel = (accountType: string) => getLabel(accountType, ACCOUNT_TYPE_LABELS);

export function EditUserModal({
  isVisible,
  onClose,
  onSubmit,
  onResetPassword,
  initialData,
  isLoading = false
}: EditUserModalProps) {
  // Use centralized metadata store
  const { userStatuses, fetchUserMetadata } = useMetadataStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    accountType: 'individual',
    status: 'active',
    accountBadge: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [fullUserData, setFullUserData] = useState<User | null>(null);

  const { getUserById } = useAdminUsersStore();

  // Fetch user statuses from centralized metadata store
  useEffect(() => {
    if (isVisible && userStatuses.length === 0) {
      fetchUserMetadata();
    }
  }, [isVisible, userStatuses.length, fetchUserMetadata]);

  // Map backend enum values to dropdown options with Arabic labels
  const statusOptions = userStatuses.map(status => ({
    value: status,
    label: USER_STATUS_LABELS[status] || status
  }));

  useEffect(() => {
    const fetchUserData = async () => {
      if (initialData?.id && isVisible) {
        // Fetch full user data with timestamps
        const userData = await getUserById(initialData.id);
        if (userData) {
          setFullUserData(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'USER',
            accountType: userData.accountType || 'individual',
            status: userData.status || 'active',
            accountBadge: userData.accountBadge || ''
          });
        }
      } else if (initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          role: initialData.role || 'USER',
          accountType: initialData.accountType || 'individual',
          status: initialData.status || 'active',
          accountBadge: initialData.accountBadge || ''
        });
      }
      setErrors({});
    };

    fetchUserData();
  }, [initialData, isVisible, getUserById]);

  const validateForm = () => {
    // Use our new validation system for edit mode
    const newValidationErrors = validateUserFormEdit(formData);
    setValidationErrors(newValidationErrors);

    // Keep old errors for existing UI (for now)
    const newErrors: Record<string, string> = {};
    Object.entries(newValidationErrors).forEach(([key, value]) => {
      if (value) newErrors[key] = value;
    });
    setErrors(newErrors);

    return !hasValidationErrors(newValidationErrors);
  };

  // Map values to GraphQL enum keys
  const mapValuesToGraphQLEnums = (data: any) => {
    return {
      ...data,
      // Status mapping: convert lowercase to GraphQL enum keys
      status: data.status?.toUpperCase() || 'ACTIVE'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Only send fields that UpdateUserInput allows
    const submitData: any = {
      id: initialData?.id,
      name: formData.name,
      status: formData.status
      // Note: email, role, accountType, accountBadge are NOT allowed in UpdateUserInput
    };

    // Map values to GraphQL enum keys before sending
    const mappedData = mapValuesToGraphQLEnums(submitData);

    try {
      await onSubmit(mappedData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تعديل المستخدم"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Name Field */}
        <Input
          label="الاسم الكامل"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="أدخل الاسم الكامل"
          disabled={isLoading}
          validate={createUserFieldValidator('name', 'edit')}
          error={validationErrors.name}
          required
        />

        {/* Email Field - Read Only */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Mail size={16} />
            البريد الإلكتروني
          </label>
          <div className={styles.readOnlyField}>
            {formData.email}
          </div>
          <p className={styles.helpText}>
            💡 البريد الإلكتروني لا يمكن تعديله لأسباب أمنية
          </p>
        </div>

        {/* Role Display - Read-only */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Shield size={16} />
            الدور الحالي
          </label>
          <div className={styles.readOnlyField}>
            {getRoleLabel(formData.role)}
          </div>
          <p className={styles.helpText}>
            💡 لتغيير دور المستخدم، استخدم نظام إدارة الأدوار المخصص لضمان الأمان
          </p>
        </div>

        {/* Password Reset Section */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Key size={16} />
            إعادة تعيين كلمة المرور
          </label>
          <div className={styles.passwordResetSection}>
            <p className={styles.helpText}>
              إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني: <strong>{formData.email}</strong>
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (initialData?.id && onResetPassword) {
                  try {
                    await onResetPassword(initialData.id);
                    alert('تم إرسال رابط إعادة التعيين بنجاح!');
                  } catch (error) {
                    console.error('Reset error:', error);
                    alert('فشل في إرسال الرابط. حاول مرة أخرى.');
                  }
                }
              }}
              disabled={isLoading || !onResetPassword}
            >
              <Key size={16} />
              إرسال رابط إعادة التعيين
            </Button>
            <p className={styles.securityNote}>
              🔒 سيتم إرسال رابط آمن للمستخدم عبر البريد الإلكتروني
            </p>
          </div>
        </div>

        {/* Account Type Field - Read Only */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Building size={16} />
            نوع الحساب
          </label>
          <div className={styles.readOnlyField}>
            {getAccountTypeLabel(formData.accountType)}
          </div>
          <p className={styles.helpText}>
            💡 نوع الحساب يتم تحديده من قبل المستخدم ولا يمكن تعديله من لوحة الإدارة
          </p>
        </div>

        {/* Seller Badge Field - Read Only */}
        <div className={styles.field}>
          <label className={styles.label}>
            شارة البائع
          </label>
          <div className={styles.readOnlyField}>
            {formData.accountBadge || 'غير محدد'}
          </div>
          <p className={styles.helpText}>
            💡 شارة البائع يتم منحها بناءً على نظام التقييم والتحقق
          </p>
        </div>

        {/* Status Field */}
        <Input
          label="حالة المستخدم"
          type="select"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          disabled={isLoading}
          validate={createUserFieldValidator('status', 'edit')}
          error={validationErrors.status}
          required
          options={statusOptions}
        />

        {/* Timestamps - Read Only */}
        {fullUserData?.createdAt && (
          <div className={styles.field}>
            <label className={styles.label}>تاريخ الإنشاء</label>
            <div className={styles.readOnlyField}>
              {new Date(fullUserData.createdAt).toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}

        {fullUserData?.updatedAt && (
          <div className={styles.field}>
            <label className={styles.label}>آخر تحديث</label>
            <div className={styles.readOnlyField}>
              {new Date(fullUserData.updatedAt).toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditUserModal;