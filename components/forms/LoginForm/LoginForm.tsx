'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/slices';
import styles from './LoginForm.module.scss';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = '/',
  className = ''
}) => {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock login function - will be replaced with real GraphQL mutation
  const mockLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser = {
        id: '1',
        email,
        firstName: 'أحمد',
        lastName: 'السوري',
        phone: '+963911123456',
        avatar: undefined,
        isVerified: true,
        role: 'BUYER' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const mockToken = 'mock-jwt-token';
      
      login(mockUser, mockToken);
      onSuccess?.();
      router.push(redirectTo);
    } catch (err) {
      setError('فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await mockLogin(
        formData.email.toLowerCase().trim(),
        formData.password
      );
    } catch (err) {
      // Error handled by mock login function
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>تسجيل الدخول</h1>
        <p className={styles.subtitle}>
          أدخل بياناتك للوصول إلى حسابك
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onKeyPress={handleKeyPress}
            className={`${styles.input} ${errors.email ? styles.error : ''}`}
            placeholder="example@email.com"
            disabled={loading}
            autoComplete="email"
            dir="ltr"
          />
          {errors.email && (
            <span className={styles.errorMessage}>{errors.email}</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            كلمة المرور
          </label>
          <div className={styles.passwordContainer}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.password ? styles.error : ''}`}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && (
            <span className={styles.errorMessage}>{errors.password}</span>
          )}
        </div>

        <div className={styles.actions}>
          <Link href="/auth/forgot-password" className={styles.forgotPassword}>
            هل نسيت كلمة المرور؟
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </Button>

        {error && (
          <div className={styles.globalError}>
            {error}
          </div>
        )}
      </form>

      <div className={styles.footer}>
        <p>
          ليس لديك حساب؟{' '}
          <Link href="/auth/register" className={styles.link}>
            إنشاء حساب جديد
          </Link>
        </p>
      </div>

      {/* Social Login Options (Future Enhancement) */}
      <div className={styles.divider}>
        <span>أو</span>
      </div>
      
      <div className={styles.socialLogin}>
        <button
          type="button"
          className={styles.socialButton}
          disabled={loading}
        >
          <span className={styles.socialIcon}>📱</span>
          متابعة بواسطة رقم الهاتف
        </button>
      </div>
    </div>
  );
};

export default LoginForm;