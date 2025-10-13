'use client';

import React, { useState } from 'react';
import { Button, Input, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ArrowLeft } from 'lucide-react';
import styles from './AuthModal.module.scss';

export const MagicLinkForm: React.FC = () => {
  const { sendMagicLink, isLoading, switchAuthView } = useUserAuthStore();
  const { addNotification } = useNotificationStore();
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      addNotification({
        type: 'error',
        title: 'بيانات ناقصة',
        message: 'يرجى إدخال البريد الإلكتروني',
      });
      return;
    }

    try {
      await sendMagicLink(email);
      setLinkSent(true);
      addNotification({
        type: 'success',
        title: 'تم إرسال الرابط',
        message: 'يرجى التحقق من بريدك الإلكتروني',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل إرسال الرابط. يرجى المحاولة مرة أخرى',
      });
    }
  };

  return (
    <div className={styles.form}>
      {/* Back button */}
      <Button
        variant="link"
        onClick={() => switchAuthView('login')}
        disabled={isLoading}
        className={styles.backButton}
      >
        <ArrowLeft size={16} />
        <Text variant="small">العودة لتسجيل الدخول</Text>
      </Button>

      {!linkSent ? (
        <>
          <div className={styles.magicLinkInfo}>
            <Text variant="paragraph">
              أدخل بريدك الإلكتروني وسنرسل لك رابطاً للدخول المباشر بدون كلمة مرور
            </Text>
          </div>

          <form onSubmit={handleSubmit} className={styles.formFields}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <Text variant="small">البريد الإلكتروني</Text>
              </label>
              <Input
                type="email"
                name="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className={styles.submitButton}
            >
              {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الدخول'}
            </Button>
          </form>
        </>
      ) : (
        <div className={styles.successMessage}>
          <Text variant="h4" className={styles.successTitle}>
            ✅ تم إرسال الرابط
          </Text>
          <Text variant="paragraph">
            يرجى التحقق من بريدك الإلكتروني <strong>{email}</strong> والنقر على
            الرابط لتسجيل الدخول
          </Text>
          <Text variant="small" className={styles.note}>
            لم تستلم البريد؟{' '}
            <Button
              variant="link"
              onClick={() => setLinkSent(false)}
              disabled={isLoading}
            >
              إعادة الإرسال
            </Button>
          </Text>
        </div>
      )}
    </div>
  );
};
