'use client';

import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { SocialButtons } from './SocialButtons';
import { useNotificationStore } from '@/stores/notificationStore';
import { AccountType } from '@/common/enums';
import {
  validateLoginForm,
  createLoginFieldValidator,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/validation/authValidation';
import { ArrowLeft } from 'lucide-react';
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
    name: '🧑 Rakan (Real Email)',
    email: 'rairakzak@gmail.com',
    password: 'User123!',
    accountType: AccountType.INDIVIDUAL,
  },
  {
    name: 'Custom Login',
    email: '',
    password: '',
  }
];

export const LoginForm: React.FC = () => {
  const { login, resetPassword, isLoading, error, switchAuthView } = useUserAuthStore();
  const { addNotification } = useNotificationStore();
  // Show dev credentials on development and staging, hide on production
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';
  const showDevCredentials = appEnv !== 'production';

  const [selectedOption, setSelectedOption] = useState(0);
  const [formData, setFormData] = useState({
    email: showDevCredentials ? DEV_CREDENTIALS[0].email : '',
    password: showDevCredentials ? DEV_CREDENTIALS[0].password : '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string>('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Update form when option changes (development/staging only)
  useEffect(() => {
    if (showDevCredentials) {
      const option = DEV_CREDENTIALS[selectedOption];
      setFormData({
        email: option.email,
        password: option.password,
      });
    }
  }, [selectedOption, showDevCredentials]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setFormError('');

    // Validate form using Zod
    const errors = validateLoginForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      return; // STOP - do not submit
    }

    try {
      await login(formData.email, formData.password);
      // Success - modal will close automatically via store
    } catch (loginError) {
      // Show error in Form component (inside modal)
      setFormError(error || 'بيانات الاعتماد غير صحيحة. يرجى المحاولة مرة أخرى');
    }
  };

  const handleForgotPassword = () => {
    // Pre-fill email from login form if available
    setForgotPasswordEmail(formData.email);
    setShowForgotPassword(true);
    setResetEmailSent(false);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      addNotification({
        type: 'error',
        title: 'بيانات ناقصة',
        message: 'يرجى إدخال البريد الإلكتروني',
      });
      return;
    }

    try {
      await resetPassword(forgotPasswordEmail);
      setResetEmailSent(true);
      addNotification({
        type: 'success',
        title: 'تم إرسال الرابط',
        message: 'يرجى التحقق من بريدك الإلكتروني',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل إرسال الرابط. يرجى المحاولة مرة أخرى',
      });
    }
  };

  // Forgot Password View (inline in same form)
  if (showForgotPassword) {
    return (
      <div className={styles.form}>
        {/* Back button */}
        <Button
          variant="link"
          onClick={handleBackToLogin}
          disabled={isLoading}
          className={styles.backButton}
          arrow
        >
          <Text variant="small">العودة لتسجيل الدخول</Text>
        </Button>

        {!resetEmailSent ? (
          <>
            <div className={styles.magicLinkInfo}>
              <Text variant="paragraph">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
              </Text>
            </div>

            <form onSubmit={handleSendResetEmail} className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Text variant="small">البريد الإلكتروني</Text>
                </label>
                <Input
                  type="email"
                  name="resetEmail"
                  placeholder="example@email.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !forgotPasswordEmail}
                className={styles.submitButton}
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </Button>
            </form>
          </>
        ) : (
          <div className={styles.successMessage}>
            <Text variant="h4" className={styles.successTitle}>
              تم إرسال الرابط
            </Text>
            <Text variant="paragraph">
              يرجى التحقق من بريدك الإلكتروني <strong>{forgotPasswordEmail}</strong> والنقر على
              الرابط لإعادة تعيين كلمة المرور
            </Text>
            <Text variant="small" className={styles.note}>
              لم تستلم البريد؟{' '}
              <Button
                variant="link"
                onClick={() => setResetEmailSent(false)}
                disabled={isLoading}
              >
                إعادة الإرسال
              </Button>
            </Text>
          </div>
        )}
      </div>
    );
  }

  // Regular Login Form
  return (
    <div className={styles.form}>
      {/* Development/Staging credential selector */}
      {showDevCredentials && (
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
      <Form onSubmit={handleSubmit} error={formError} className={styles.formFields}>
        {/* Email */}
        <Input
          type="email"
          name="email"
          label="البريد الإلكتروني"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleInputChange}
          validate={createLoginFieldValidator('email')}
          error={validationErrors.email}
          required
          disabled={isLoading}
        />

        {/* Password */}
        <Input
          type="password"
          name="password"
          label="كلمة المرور"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleInputChange}
          validate={createLoginFieldValidator('password')}
          error={validationErrors.password}
          required
          disabled={isLoading}
        />

        {/* Forgot password link */}
        <div className={styles.forgotPassword}>
          <Button
            variant="link"
            onClick={handleForgotPassword}
            disabled={isLoading}
            type="button"
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
      </Form>

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
