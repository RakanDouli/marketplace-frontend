'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { Modal } from '@/components/slices';
import { Eye, EyeOff, User, Mail, Shield } from 'lucide-react';
import styles from './UserModals.module.scss';
import { useMetadataStore } from '@/stores/metadataStore';
import { USER_STATUS_LABELS } from '@/constants/metadata-labels';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import {
  validateUserFormCreate,
  hasValidationErrors,
  createUserFieldValidator,
  type UserFormData,
  type ValidationErrors
} from '@/lib/admin/validation/userValidation';

interface Role {
  id: string;
  name: string;
}

interface CreateUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  roles?: Role[];
  isLoading?: boolean;
}


export function CreateUserModal({
  isVisible,
  onClose,
  onSubmit,
  roles = [],
  isLoading = false
}: CreateUserModalProps) {
  // Use centralized metadata store
  const { userStatuses, fetchUserMetadata } = useMetadataStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    status: 'active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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
    if (isVisible) {
      // Reset form when modal opens
      setFormData({
        name: '',
        email: '',
        password: '',
        role: '',
        status: 'active'
      });
      setErrors({});
    }
  }, [isVisible]);

  const validateForm = () => {
    // Use our new validation system
    const newValidationErrors = validateUserFormCreate(formData);
    setValidationErrors(newValidationErrors);

    // Keep old errors for existing UI (for now)
    const newErrors: Record<string, string> = {};
    Object.entries(newValidationErrors).forEach(([key, value]) => {
      if (value) newErrors[key] = value;
    });
    setErrors(newErrors);

    return !hasValidationErrors(newValidationErrors);
  };

  // Map values to GraphQL formats
  const mapValuesToGraphQLFormats = (data: any) => {
    return {
      ...data,
      // Role: Send role name as-is (STRING field now, not enum)
      role: data.role,
      // Status: Still needs enum key conversion
      status: data.status?.toUpperCase() || 'ACTIVE'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Map values to GraphQL formats before sending
      const submitData = mapValuesToGraphQLFormats(formData);
      await onSubmit(submitData);
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
      title="إضافة مستخدم إداري جديد"
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
          validate={createUserFieldValidator('name', 'create')}
          error={validationErrors.name}
          required
        />

        {/* Email Field */}
        <Input
          label="البريد الإلكتروني"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="أدخل البريد الإلكتروني"
          disabled={isLoading}
          validate={createUserFieldValidator('email', 'create')}
          error={validationErrors.email}
          required
        />

        {/* Password Field */}
        <div className={styles.passwordContainer}>
          <Input
            label="كلمة المرور"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="أدخل كلمة المرور"
            disabled={isLoading}
            validate={createUserFieldValidator('password', 'create')}
            error={validationErrors.password}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.passwordToggle}
            title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Role Field */}
        <Input
          label="الدور الإداري"
          type="select"
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          disabled={isLoading}
          validate={createUserFieldValidator('role', 'create')}
          error={validationErrors.role}
          required
          helpText="💡 يتم إنشاء حسابات إدارية فقط. المستخدمون العاديون يسجلون من الموقع الرئيسي"
          options={[
            { value: '', label: 'اختر الدور' },
            ...roles
              .filter(role => role.name !== 'USER')
              .map(role => ({
                value: role.name,
                label: role.name
              }))
          ]}
        />

        {/* Status Field */}
        <Input
          label="حالة المستخدم"
          type="select"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          disabled={isLoading}
          validate={createUserFieldValidator('status', 'create')}
          error={validationErrors.status}
          required
          options={statusOptions}
        />

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
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب إداري'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateUserModal;