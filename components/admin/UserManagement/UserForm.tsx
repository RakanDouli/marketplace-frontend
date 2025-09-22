'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/slices';
import { Modal } from '@/components/slices';
import { Eye, EyeOff, User, Mail, Shield, Building } from 'lucide-react';
import styles from './UserForm.module.scss';

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  accountType: string;
  status: string;
  sellerBadge?: string | null;
}

interface UserFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  initialData?: User | null;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const USER_ROLES = [
  { value: 'USER', label: 'مستخدم عادي', labelEn: 'User' },
  { value: 'EDITOR', label: 'محرر', labelEn: 'Editor' },
  { value: 'ADS_MANAGER', label: 'مدير الإعلانات', labelEn: 'Ads Manager' },
  { value: 'ADMIN', label: 'مدير', labelEn: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'مدير عام', labelEn: 'Super Admin' },
];

const ACCOUNT_TYPES = [
  { value: 'individual', label: 'فردي', labelEn: 'Individual' },
  { value: 'dealer', label: 'تاجر', labelEn: 'Dealer' },
  { value: 'business', label: 'شركة', labelEn: 'Business' },
];

const USER_STATUSES = [
  { value: 'active', label: 'نشط', labelEn: 'Active' },
  { value: 'pending', label: 'معلق', labelEn: 'Pending' },
  { value: 'banned', label: 'محظور', labelEn: 'Banned' },
];

export function UserForm({
  isVisible,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  mode
}: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    accountType: 'individual',
    status: 'active',
    sellerBadge: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role: initialData.role || 'USER',
        accountType: initialData.accountType || 'individual',
        status: initialData.status || 'active',
        sellerBadge: initialData.sellerBadge || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        accountType: 'individual',
        status: 'active',
        sellerBadge: ''
      });
    }
    setErrors({});
  }, [initialData, isVisible]);

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

    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };
    if (mode === 'edit') {
      submitData.id = initialData?.id;
      // Don't send password if it's empty in edit mode
      if (!submitData.password) {
        delete submitData.password;
      }
    }

    try {
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
      title={mode === 'create' ? 'إضافة مستخدم جديد' : 'تعديل المستخدم'}
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
            كلمة المرور {mode === 'edit' && '(اتركها فارغة إذا لم تريد تغييرها)'}
          </label>
          <div className={styles.passwordField}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`${styles.input} ${errors.password ? styles.error : ''}`}
              placeholder={mode === 'create' ? 'أدخل كلمة المرور' : 'كلمة مرور جديدة (اختياري)'}
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
            الدور
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className={styles.select}
            disabled={isLoading}
          >
            {USER_ROLES.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Account Type Field */}
        <div className={styles.field}>
          <label className={styles.label}>
            <Building size={16} />
            نوع الحساب
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => handleInputChange('accountType', e.target.value)}
            className={styles.select}
            disabled={isLoading}
          >
            {ACCOUNT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Seller Badge Field */}
        <div className={styles.field}>
          <label className={styles.label}>
            شارة البائع
          </label>
          <input
            type="text"
            value={formData.sellerBadge}
            onChange={(e) => handleInputChange('sellerBadge', e.target.value)}
            className={styles.input}
            placeholder="شارة البائع (اختياري)"
            disabled={isLoading}
          />
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
            {USER_STATUSES.map(status => (
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
            {isLoading ? 'جاري الحفظ...' : mode === 'create' ? 'إضافة' : 'حفظ التغييرات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UserForm;