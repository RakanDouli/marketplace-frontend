'use client';

/**
 * Mobile Auth Page
 *
 * This page receives access_token and refresh_token from the mobile app WebView
 * and sets up a Supabase session, then redirects to the target page.
 *
 * Flow:
 * 1. Mobile app opens: /mobile-auth?access_token=xxx&refresh_token=xxx&redirect=/advertise
 * 2. This page receives both tokens
 * 3. Sets Supabase session using both tokens
 * 4. Redirects to the target page (e.g., /advertise)
 *
 * Security Notes:
 * - Tokens are valid Supabase JWTs from the mobile app
 * - Tokens are only valid for the same Supabase project
 * - Tokens expire according to Supabase settings
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
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const redirect = searchParams.get('redirect') || '/';

        console.log('[MobileAuth] Received tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length,
          refreshTokenLength: refreshToken?.length,
          redirect,
        });

        if (!accessToken || !refreshToken) {
          setError('رمز المصادقة مفقود');
          setIsProcessing(false);
          return;
        }

        // Decode tokens in case they were double-encoded
        const decodedAccessToken = decodeURIComponent(accessToken);
        const decodedRefreshToken = decodeURIComponent(refreshToken);

        console.log('[MobileAuth] Decoded tokens:', {
          accessTokenLength: decodedAccessToken.length,
          refreshTokenLength: decodedRefreshToken.length,
          accessTokenStart: decodedAccessToken.substring(0, 20),
        });

        // Set the session using BOTH tokens from mobile app
        // This creates a valid Supabase session in the WebView
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: decodedAccessToken,
          refresh_token: decodedRefreshToken,
        });

        if (sessionError) {
          console.error('[MobileAuth] Session error:', sessionError);
          // If token is invalid or expired, redirect anyway (user will see login prompt)
          router.replace(redirect);
          return;
        }

        if (data.session) {
          console.log('[MobileAuth] Session established successfully');
          console.log('[MobileAuth] User:', data.session.user?.email);
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
