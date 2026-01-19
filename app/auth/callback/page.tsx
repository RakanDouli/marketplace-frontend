'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { Loading } from '@/components/slices/Loading/Loading';
import { Text, Button, Container } from '@/components/slices';
import styles from './callback.module.scss';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUserData } = useUserAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL hash (Supabase OAuth returns tokens in hash)
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('فشل في الحصول على جلسة المصادقة');
          return;
        }

        if (!data.session) {
          // Try to exchange code for session (for PKCE flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const code = queryParams.get('code');

          if (accessToken && refreshToken) {
            // Token-based callback (implicit flow)
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error('Set session error:', setSessionError);
              setError('فشل في إعداد الجلسة');
              return;
            }
          } else if (code) {
            // Code-based callback (PKCE flow)
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              console.error('Code exchange error:', exchangeError);
              setError('فشل في تبادل الرمز');
              return;
            }
          } else {
            setError('لم يتم العثور على بيانات المصادقة');
            return;
          }
        }

        // Refresh user data in store
        await refreshUserData();

        // Redirect to home or dashboard
        router.replace('/');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('حدث خطأ أثناء المصادقة');
      }
    };

    handleCallback();
  }, [refreshUserData, router]);

  if (error) {
    return (
      <Container paddingY="xl">
        <div className={styles.errorCard}>
          <Text variant="h2" className={styles.errorTitle}>
            خطأ في تسجيل الدخول
          </Text>
          <Text variant="paragraph" className={styles.errorMessage}>
            {error}
          </Text>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => router.push('/')}>
              العودة للرئيسية
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container paddingY="xl" className={styles.container}>
      <Loading type="svg" />
    </Container>
  );
}
