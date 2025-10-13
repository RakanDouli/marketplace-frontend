'use client';

import React, { useState } from 'react';
import { Button, Input, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { SocialButtons } from './SocialButtons';
import type { AccountType } from '@/stores/userAuthStore/types';
import styles from './AuthModal.module.scss';

export const SignupForm: React.FC = () => {
  const { signup, isLoading, error, switchAuthView } = useUserAuthStore();
  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'individual' as AccountType,
    acceptTerms: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      addNotification({
        type: 'error',
        title: 'بيانات ناقصة',
        message: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'كلمة المرور غير متطابقة',
      });
      return;
    }

    if (formData.password.length < 8) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      });
      return;
    }

    if (!formData.acceptTerms) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'يرجى الموافقة على الشروط والأحكام',
      });
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.name, formData.accountType);
      addNotification({
        type: 'success',
        title: 'تم إنشاء الحساب بنجاح',
        message: 'مرحباً بك في السوق السوري!',
      });
    } catch (signupError) {
      console.error('Signup error:', signupError);
      addNotification({
        type: 'error',
        title: 'خطأ في إنشاء الحساب',
        message: error || 'يرجى المحاولة مرة أخرى',
      });
    }
  };

  return (
    <div className={styles.form}>
      <form onSubmit={handleSubmit} className={styles.formFields}>
        {/* Name */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Text variant="small">الاسم الكامل</Text>
          </label>
          <Input
            type="text"
            name="name"
            placeholder="أدخل اسمك الكامل"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Text variant="small">البريد الإلكتروني</Text>
          </label>
          <Input
            type="email"
            name="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Text variant="small">كلمة المرور</Text>
          </label>
          <Input
            type="password"
            name="password"
            placeholder="8 أحرف على الأقل"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Confirm Password */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Text variant="small">تأكيد كلمة المرور</Text>
          </label>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="أعد إدخال كلمة المرور"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Terms and Conditions */}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <label htmlFor="acceptTerms">
            <Text variant="small">
              أوافق على{' '}
              <a href="/terms" target="_blank" className={styles.link}>
                الشروط والأحكام
              </a>
            </Text>
          </label>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading || !formData.acceptTerms}
          className={styles.submitButton}
        >
          {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
        </Button>
      </form>

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerLine}></span>
        <Text variant="small" className={styles.dividerText}>
          أو
        </Text>
        <span className={styles.dividerLine}></span>
      </div>

      {/* Social signup buttons */}
      <SocialButtons />

      {/* Switch to login */}
      <div className={styles.switchView}>
        <Text variant="small">
          لديك حساب بالفعل؟{' '}
          <Button
            variant="link"
            onClick={() => switchAuthView('login')}
            disabled={isLoading}
          >
            تسجيل الدخول
          </Button>
        </Text>
      </div>
    </div>
  );
};
