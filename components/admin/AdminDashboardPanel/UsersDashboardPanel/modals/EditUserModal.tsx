'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { Modal } from '@/components/slices';
import { User, Mail, Shield, Building, Key } from 'lucide-react';
import styles from './UserModals.module.scss';
import { GET_USER_STATUSES_QUERY } from '@/stores/admin/adminUsersStore/adminUsersStore.gql';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
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
  sellerBadge?: string | null;
}

interface EditUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  onResetPassword?: (userId: string) => Promise<void>;
  initialData?: User | null;
  isLoading?: boolean;
}


// Helper function to get Arabic labels for role values
const getRoleLabel = (role: string) => {
  const roleLabels: Record<string, string> = {
    'USER': 'مستخدم عادي',
    'EDITOR': 'محرر',
    'ADS_MANAGER': 'مدير الإعلانات',
    'ADMIN': 'مدير',
    'SUPER_ADMIN': 'مدير عام'
  };
  return roleLabels[role] || role;
};

// Helper function to get Arabic labels for account type values
const getAccountTypeLabel = (accountType: string) => {
  const accountTypeLabels: Record<string, string> = {
    'individual': 'فردي',
    'dealer': 'تاجر',
    'business': 'شركة'
  };
  return accountTypeLabels[accountType] || accountType;
};

export function EditUserModal({
  isVisible,
  onClose,
  onSubmit,
  onResetPassword,
  initialData,
  isLoading = false
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    accountType: 'individual',
    status: 'active',
    sellerBadge: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [userStatuses, setUserStatuses] = useState<Array<{ value: string, label: string }>>([]);

  // Helper function for GraphQL calls
  const makeGraphQLCall = async (query: string, variables: any = {}) => {
    const { user } = useAdminAuthStore.getState();
    const token = user?.token;

    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  };

  // Helper function to get Arabic labels for backend status values
  const getBackendStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'active': 'نشط',
      'pending': 'معلق',
      'banned': 'محظور'
    };
    return statusLabels[status] || status;
  };

  // Fetch user statuses from backend (they come as lowercase: active, pending, banned)
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const data = await makeGraphQLCall(GET_USER_STATUSES_QUERY);
        const statuses = data.getUserStatuses || [];
        setUserStatuses(
          statuses.map((status: string) => ({
            value: status,  // Store backend value (active, pending, banned)
            label: getBackendStatusLabel(status)
          }))
        );
      } catch (error) {
        console.error('Failed to fetch user statuses:', error);
        // Fallback to default statuses if fetch fails
        setUserStatuses([
          { value: 'active', label: getBackendStatusLabel('active') },
          { value: 'pending', label: getBackendStatusLabel('pending') },
          { value: 'banned', label: getBackendStatusLabel('banned') },
        ]);
      }
    };

    fetchStatuses();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        role: initialData.role || 'USER',
        accountType: initialData.accountType || 'individual',
        status: initialData.status || 'active',
        sellerBadge: initialData.sellerBadge || ''
      });
    }
    setErrors({});
  }, [initialData, isVisible]);

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
      // Note: email, role, accountType, sellerBadge are NOT allowed in UpdateUserInput
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
            {formData.sellerBadge || 'غير محدد'}
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
          options={userStatuses}
        />

        {/* Form Actions */}
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
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