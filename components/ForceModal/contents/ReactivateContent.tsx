'use client';

import React, { useState } from 'react';
import { Button, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useRouter } from 'next/navigation';
import styles from './ReactivateContent.module.scss';

export const ReactivateContent: React.FC = () => {
  const { user, logout } = useUserAuthStore();
  const { updateProfile } = useUserProfileStore();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReactivate = async () => {
    if (!user?.token) return;

    setIsLoading(true);
    try {
      await updateProfile(user.token, { status: 'ACTIVE' });

      // Refresh the page to update user status in UI
      window.location.reload();
    } catch (error) {
      console.error('Reactivate error:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
    router.push('/');
  };

  return (
    <div className={styles.content}>
      <Text variant="paragraph" className={styles.message}>
        لقد قمت بتعطيل حسابك. هل تريد إعادة تفعيله؟
      </Text>
      <Text variant="small" color="secondary" className={styles.note}>
        <strong>ملاحظة:</strong> جميع إعلاناتك تم تغيير حالتها إلى مخفي.
        إذا كنت تريد إعادة تفعيلها، يرجى الذهاب إلى قسم "إعلاناتي" وتفعيل كل إعلان على حدة.
      </Text>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={isLoading}
        >
          إلغاء والعودة للرئيسية
        </Button>
        <Button
          variant="primary"
          onClick={handleReactivate}
          disabled={isLoading}
        >
          {isLoading ? 'جاري إعادة التفعيل...' : 'إعادة تفعيل الحساب'}
        </Button>
      </div>
    </div>
  );
};
