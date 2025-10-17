'use client';

import React, { useState } from 'react';
import { Button, Form, Input, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { SocialButtons } from './SocialButtons';
import type { AccountType } from '@/stores/userAuthStore/types';
import {
  validateSignupForm,
  createSignupFieldValidator,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/validation/authValidation';
import styles from './AuthModal.module.scss';

export const SignupForm: React.FC = () => {
  const { signup, isLoading, error, switchAuthView } = useUserAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'individual' as AccountType,
    acceptTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string>('');

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous form error
    setFormError('');

    // Validate form - BLOCKS submission if errors exist
    const errors = validateSignupForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Validation failed:', errors);
      return; // STOP - do not submit
    }

    console.log('✅ Validation passed, submitting...');

    try {
      await signup(formData.email, formData.password, formData.name, formData.accountType);
      // Success - modal will close automatically via store
    } catch (signupError) {
      console.error('Signup error:', signupError);
      // Show error in Form component (inside modal)
      setFormError(error || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى');
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
          validate={createSignupFieldValidator('name')}
          error={validationErrors.name}
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
          validate={createSignupFieldValidator('email')}
          error={validationErrors.email}
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
          validate={createSignupFieldValidator('password')}
          error={validationErrors.password}
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
          validate={createSignupFieldValidator('confirmPassword', formData.password)}
          error={validationErrors.confirmPassword}
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
        {validationErrors.acceptTerms && (
          <Text variant="small" style={{ color: 'rgb(239, 68, 68)', marginTop: '-8px' }}>
            {validationErrors.acceptTerms}
          </Text>
        )}

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
