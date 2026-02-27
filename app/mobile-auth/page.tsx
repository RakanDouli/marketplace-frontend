'use client';

/**
 * Mobile Auth Page
 *
 * This page receives an access token from the mobile app WebView
 * and sets up a Supabase session, then redirects to the target page.
 *
 * Flow:
 * 1. Mobile app opens: /mobile-auth?token=xxx&redirect=/advertise
 * 2. This page receives the token
 * 3. Sets Supabase session using the token
 * 4. Redirects to the target page (e.g., /advertise)
 *
 * Security Notes:
 * - Token is a valid Supabase JWT from the mobile app
 * - Token is only valid for the same Supabase project
 * - Token expires according to Supabase settings
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loading } from '@/components/slices/Loading/Loading';
import { Container } from '@/components/slices/Container/Container';
import { Text } from '@/components/slices/Text/Text';
import styles from './MobileAuth.module.scss';

export default function MobileAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const token = searchParams.get('token');
        const redirect = searchParams.get('redirect') || '/';

        if (!token) {
          setError('رمز المصادقة مفقود');
          setIsProcessing(false);
          return;
        }

        // Set the session using the access token from mobile app
        // This creates a valid Supabase session in the WebView
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '', // We don't have refresh token, but session will work for the current visit
        });

        if (sessionError) {
          console.error('[MobileAuth] Session error:', sessionError);
          // If token is invalid or expired, redirect anyway (user will see login prompt)
          router.replace(redirect);
          return;
        }

        if (data.session) {
          console.log('[MobileAuth] Session established, redirecting to:', redirect);
        }

        // Redirect to target page
        router.replace(redirect);
      } catch (err) {
        console.error('[MobileAuth] Error:', err);
        setError('حدث خطأ في المصادقة');
        setIsProcessing(false);
      }
    };

    handleAuth();
  }, [searchParams, router]);

  if (error) {
    return (
      <Container paddingY="xl">
        <div className={styles.container}>
          <div className={styles.errorBox}>
            <Text variant="h4" color="error">
              {error}
            </Text>
            <Text variant="paragraph" color="secondary">
              يرجى إغلاق هذه الصفحة والمحاولة مرة أخرى من التطبيق
            </Text>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container paddingY="xl">
      <div className={styles.container}>
        <Loading />
        <Text variant="paragraph" color="secondary" className={styles.loadingText}>
          جاري تسجيل الدخول...
        </Text>
      </div>
    </Container>
  );
}
