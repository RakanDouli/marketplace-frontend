'use client';

import React, { useState } from 'react';
import { Button, Form, Input, Text } from '@/components/slices';
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

  const [formError, setFormError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear form-level error when user types
    if (formError) setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check terms acceptance
    if (!formData.acceptTerms) {
      setFormError('يرجى الموافقة على الشروط والأحكام');
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
      setFormError(error || 'يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <div className={styles.form}>
      <Form
        onSubmit={handleSubmit}
        error={formError}
        className={styles.formFields}
      >
        {/* Name */}
        <Input
          type="text"
          name="name"
          label="الاسم الكامل"
          placeholder="أدخل اسمك الكامل"
          value={formData.name}
          onChange={handleInputChange}
          validate={(v) => !v.trim() ? 'الاسم مطلوب' : undefined}
          required
          disabled={isLoading}
        />

        {/* Email */}
        <Input
          type="email"
          name="email"
          label="البريد الإلكتروني"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleInputChange}
          validate={(v) => {
            if (!v.trim()) return 'البريد الإلكتروني مطلوب';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'البريد الإلكتروني غير صحيح';
            return undefined;
          }}
          required
          disabled={isLoading}
        />

        {/* Password */}
        <Input
          type="password"
          name="password"
          label="كلمة المرور"
          placeholder="8 أحرف على الأقل"
          value={formData.password}
          onChange={handleInputChange}
          validate={(v) => {
            if (!v) return 'كلمة المرور مطلوبة';
            if (v.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
            return undefined;
          }}
          required
          disabled={isLoading}
        />

        {/* Confirm Password */}
        <Input
          type="password"
          name="confirmPassword"
          label="تأكيد كلمة المرور"
          placeholder="أعد إدخال كلمة المرور"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          validate={(v) => {
            if (!v) return 'تأكيد كلمة المرور مطلوب';
            if (v !== formData.password) return 'كلمة المرور غير متطابقة';
            return undefined;
          }}
          required
          disabled={isLoading}
        />

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
      </Form>

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
