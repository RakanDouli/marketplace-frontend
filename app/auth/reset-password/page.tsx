'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Container, Text, Button, Form, Input } from '@/components/slices';
import styles from './reset-password.module.scss';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // If there's a hash in the URL, Supabase will handle the token exchange
      if (window.location.hash) {
        // Wait a bit for Supabase to process the hash
        setTimeout(async () => {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          setIsValidSession(!!newSession);
        }, 1000);
      } else {
        setIsValidSession(!!session);
      }
    };

    checkSession();

    // Listen for auth state changes (when Supabase processes the hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <Container paddingY="xl">
        <div className={styles.card}>
          <Text variant="paragraph" color="secondary">
            جاري التحقق...
          </Text>
        </div>
      </Container>
    );
  }

  // Invalid or expired link
  if (!isValidSession && !success) {
    return (
      <Container paddingY="xl">
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <span className={styles.errorIcon}>!</span>
          </div>
          <Text variant="h2" className={styles.title}>
            رابط غير صالح
          </Text>
          <Text variant="paragraph" color="secondary" className={styles.description}>
            رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.
            <br />
            يرجى طلب رابط جديد من صفحة تسجيل الدخول.
          </Text>
          <Button variant="primary" onClick={() => router.push('/')}>
            العودة للرئيسية
          </Button>
        </div>
      </Container>
    );
  }

  // Success state
  if (success) {
    return (
      <Container paddingY="xl">
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <span className={styles.successIcon}>✓</span>
          </div>
          <Text variant="h2" className={styles.title}>
            تم تغيير كلمة المرور بنجاح
          </Text>
          <Text variant="paragraph" color="secondary" className={styles.description}>
            يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
          </Text>

          <Button variant="primary" onClick={() => router.push('/')}>
            الذهاب للرئيسية
          </Button>
        </div>
      </Container>
    );
  }

  // Password reset form
  return (
    <Container paddingY="xl">
      <div className={styles.card}>
        <Text variant="h2" className={styles.title}>
          إعادة تعيين كلمة المرور
        </Text>
        <Text variant="paragraph" color="secondary" className={styles.description}>
          أدخل كلمة المرور الجديدة لحسابك
        </Text>

        <Form onSubmit={handleSubmit} error={error || undefined} className={styles.form}>
          <Input
            type="password"
            name="password"
            label="كلمة المرور الجديدة"
            placeholder="8 أحرف على الأقل"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            type="password"
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            placeholder="أعد إدخال كلمة المرور"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </Button>
        </Form>
      </div>
    </Container>
  );
}
