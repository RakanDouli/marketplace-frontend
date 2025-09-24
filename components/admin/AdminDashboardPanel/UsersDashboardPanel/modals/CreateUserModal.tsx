'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/slices';
import { Modal } from '@/components/slices';
import { Eye, EyeOff, User, Mail, Shield } from 'lucide-react';
import styles from './UserModals.module.scss';
import { GET_USER_STATUSES_QUERY } from '@/stores/admin/adminUsersStore/adminUsersStore.gql';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    status: 'active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userStatuses, setUserStatuses] = useState<Array<{value: string, label: string}>>([]);

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
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'الدور مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        <div className={styles.field}>
          <label className={styles.label}>
            <User size={16} />
            الاسم الكامل
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`${styles.input} ${errors.name ? styles.error : ''}`}
            placeholder="أدخل الاسم الكامل"
            disabled={isLoading}
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        {/* Email Field */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Mail size={16} />
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`${styles.input} ${errors.email ? styles.error : ''}`}
            placeholder="أدخل البريد الإلكتروني"
            disabled={isLoading}
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        {/* Password Field */}
        <div className={styles.field}>
          <label className={styles.label}>
            كلمة المرور
          </label>
          <div className={styles.passwordField}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`${styles.input} ${errors.password ? styles.error : ''}`}
              placeholder="أدخل كلمة المرور"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
        </div>

        {/* Role Field */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Shield size={16} />
            الدور الإداري
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className={styles.select}
            disabled={isLoading}
          >
            <option value="">اختر الدور</option>
            {roles
              .filter(role => role.name !== 'USER') // Only exclude USER role (regular users)
              .map(role => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
          </select>
          {errors.role && <span className={styles.errorText}>{errors.role}</span>}
          <p className={styles.helpText}>
            💡 يتم إنشاء حسابات إدارية فقط. المستخدمون العاديون يسجلون من الموقع الرئيسي
          </p>
        </div>

        {/* Status Field */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Shield size={16} />
            حالة المستخدم
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className={styles.select}
            disabled={isLoading}
          >
            {userStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

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
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب إداري'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateUserModal;