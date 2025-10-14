'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { SocialButtons } from './SocialButtons';
import { AccountType } from '@/common/enums';
import styles from './AuthModal.module.scss';

// Development credentials from backend seed
const DEV_CREDENTIALS = [
  {
    name: '👨 Individual (5 listings, no avatar)',
    email: 'individual@marketplace.com',
    password: 'Individual123!',
    accountType: AccountType.INDIVIDUAL,
  },
  {
    name: '🚗 Dealer (unlimited, avatar)',
    email: 'dealer@marketplace.com',
    password: 'Dealer123!',
    accountType: AccountType.DEALER,
  },
  {
    name: '🏢 Business (unlimited, avatar)',
    email: 'business@marketplace.com',
    password: 'Business123!',
    accountType: AccountType.BUSINESS,
  },
  {
    name: 'User 1 (Legacy)',
    email: 'user@marketplace.com',
    password: 'User123!',
    accountType: AccountType.INDIVIDUAL,
  },
  {
    name: 'User 2 (Legacy)',
    email: 'user2@marketplace.com',
    password: 'User123!',
    accountType: AccountType.INDIVIDUAL,
  },
  {
    name: 'Custom Login',
    email: '',
    password: '',
  },
];

export const LoginForm: React.FC = () => {
  const { login, isLoading, error, switchAuthView } = useUserAuthStore();
  const { addNotification } = useNotificationStore();
  const isProduction = process.env.NODE_ENV === 'production';

  const [selectedOption, setSelectedOption] = useState(0);
  const [formData, setFormData] = useState({
    email: isProduction ? '' : DEV_CREDENTIALS[0].email,
    password: isProduction ? '' : DEV_CREDENTIALS[0].password,
  });

  // Update form when option changes (development only)
  useEffect(() => {
    if (!isProduction) {
      const option = DEV_CREDENTIALS[selectedOption];
      setFormData({
        email: option.email,
        password: option.password,
      });
    }
  }, [selectedOption, isProduction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      addNotification({
        type: 'error',
        title: 'بيانات ناقصة',
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
      });
      return;
    }

    try {
      await login(formData.email, formData.password);
      addNotification({
        type: 'success',
        title: 'تسجيل دخول ناجح',
        message: 'مرحباً بك مرة أخرى!',
      });
    } catch (loginError) {
      console.error('Login error:', loginError);
      addNotification({
        type: 'error',
        title: 'خطأ في تسجيل الدخول',
        message: error || 'يرجى التحقق من بيانات الاعتماد',
      });
    }
  };

  return (
    <div className={styles.form}>
      {/* Development credential selector */}
      {!isProduction && (
        <div className={styles.devSelector}>
          <label className={styles.label}>
            <Text variant="xs">اختر حساب من قاعدة البيانات:</Text>
          </label>
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            className={styles.select}
            disabled={isLoading}
          >
            {DEV_CREDENTIALS.map((option, index) => (
              <option key={index} value={index}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className={styles.formFields}>
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

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Text variant="small">كلمة المرور</Text>
          </label>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Forgot password link */}
        <div className={styles.forgotPassword}>
          <Button
            variant="link"
            onClick={() => switchAuthView('magic-link')}
            disabled={isLoading}
          >
            <Text variant="small">نسيت كلمة المرور؟</Text>
          </Button>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password}
          className={styles.submitButton}
        >
          {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
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

      {/* Social login buttons */}
      <SocialButtons />

      {/* Switch to signup */}
      <div className={styles.switchView}>
        <Text variant="small">
          ليس لديك حساب؟{' '}
          <Button
            variant="link"
            onClick={() => switchAuthView('signup')}
            disabled={isLoading}
          >
            إنشاء حساب جديد
          </Button>
        </Text>
      </div>
    </div>
  );
};
