'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button, Container, Input } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import styles from './AdminLogin.module.scss';

// Real backend credentials from get-token.js and user seeders
const CREDENTIAL_OPTIONS = [
  {
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    email: 'superadmin@marketplace.com',
    password: 'SuperAdmin123!'
  },
  {
    name: 'Admin',
    role: 'ADMIN',
    email: 'admin@marketplace.com',
    password: 'Admin123!'
  },
  {
    name: 'Editor',
    role: 'EDITOR',
    email: 'editor@marketplace.com',
    password: 'Editor123!'
  },
  {
    name: 'Ads Manager',
    role: 'ADS_MANAGER',
    email: 'adsmanager@marketplace.com',
    password: 'AdsManager123!'
  },
  {
    name: 'User',
    role: 'USER',
    email: 'user@marketplace.com',
    password: 'User123!'
  },
  {
    name: 'User 2',
    role: 'USER',
    email: 'user2@marketplace.com',
    password: 'User123!'
  },
  {
    name: 'Custom Login',
    role: 'CUSTOM',
    email: '',
    password: ''
  }
];

export default function AdminLogin() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error } = useAdminAuthStore();
  const { addNotification } = useNotificationStore();
  // Check if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';

  const [selectedOption, setSelectedOption] = useState(0);
  const [formData, setFormData] = useState({
    email: isProduction ? '' : CREDENTIAL_OPTIONS[0].email,
    password: isProduction ? '' : CREDENTIAL_OPTIONS[0].password
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  // Update form when option changes (development only)
  useEffect(() => {
    if (!isProduction) {
      const option = CREDENTIAL_OPTIONS[selectedOption];
      setFormData({
        email: option.email,
        password: option.password
      });
    }
  }, [selectedOption, isProduction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      addNotification({
        type: 'error',
        title: 'بيانات ناقصة',
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور. Please enter both email and password.'
      });
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Success notification
      addNotification({
        type: 'success',
        title: 'تسجيل دخول ناجح',
        message: 'تم تسجيل الدخول بنجاح! Login successful!'
      });
      // Redirect to admin dashboard
      router.push('/admin');
    } catch (loginError) {
      console.error('Login error:', loginError);
      // Show the error from the store in a notification
      addNotification({
        type: 'error',
        title: 'خطأ في تسجيل الدخول',
        message: error || 'يرجى التحقق من بيانات الاعتماد. Please check your credentials.'
      });
    }
  };

  return (
    <Container>
      <div className={styles.loginCard}>
        <div className={styles.content}>

          <Text variant="h3">تسجيل دخول الإدارة</Text>

          {/* Credential Selector - Development Only */}
          {!isProduction && (
            <div className={styles.credentialSelector}>
              <label className={styles.selectorLabel}>
                اختر حساب من قاعدة البيانات:
              </label>
              <select
                value={selectedOption}
                onChange={(e) => setSelectedOption(Number(e.target.value))}
                className={styles.select}
                disabled={isLoading}
              >
                {CREDENTIAL_OPTIONS.map((option, index) => (
                  <option key={index} value={index}>
                    {option.role === 'CUSTOM' ? option.name : `${option.name} (${option.role})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>البريد الإلكتروني</label>
              <Input
                type="email"
                name="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>كلمة المرور</label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={styles.input}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className={styles.submitButton}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className={styles.backLink}>
            <Button
              variant="link"
              onClick={() => router.push('/')}
              className={styles.backButton}
            >
              ← العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}