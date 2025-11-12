'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, UserCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { Container, Text, Button } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import styles from './blocked-users.module.scss';

export default function BlockedUsersPage() {
  const router = useRouter();
  const { user } = useUserAuthStore();
  const { blockedUsers, isLoading, error, fetchBlockedUsers, unblockUser } = useChatStore();
  const { addNotification } = useNotificationStore();
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchBlockedUsers();
  }, [user, fetchBlockedUsers, router]);

  const handleUnblock = async (blockedUserId: string) => {
    setUnblockingUserId(blockedUserId);
    try {
      await unblockUser(blockedUserId);
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم إلغاء حظر المستخدم بنجاح',
        duration: 5000,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في إلغاء حظر المستخدم. حاول مرة أخرى.',
        duration: 5000,
      });
    } finally {
      setUnblockingUserId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container>
      <div className={styles.blockedUsersPage}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Ban size={28} />
            <Text variant="h2">المحظورون</Text>
          </div>
          {!isLoading && !error && blockedUsers.length > 0 && (
            <Text variant="small" color="secondary">
              {blockedUsers.length} {blockedUsers.length === 1 ? 'مستخدم' : 'مستخدمين'}
            </Text>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingState}>
            <Text variant="paragraph" color="secondary">
              جاري التحميل...
            </Text>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className={styles.emptyState}>
            <Text variant="paragraph" color="error">
              {error}
            </Text>
            <Button onClick={() => fetchBlockedUsers()}>إعادة المحاولة</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && blockedUsers.length === 0 && (
          <div className={styles.emptyState}>
            <Ban size={64} className={styles.emptyIcon} />
            <Text variant="h3">لا يوجد مستخدمين محظورين</Text>
            <Text variant="paragraph" color="secondary" className={styles.emptyDescription}>
              يمكنك حظر المستخدمين من صفحة المحادثات أو صفحة الإعلان
            </Text>
            <Button onClick={() => router.push('/messages')}>الذهاب إلى المحادثات</Button>
          </div>
        )}

        {/* Success State - List of Blocked Users */}
        {!isLoading && !error && blockedUsers.length > 0 && (
          <div className={styles.blockedUsersList}>
            {blockedUsers.map((blockedUser) => (
              <div key={blockedUser.id} className={styles.blockedUserCard}>
                <div className={styles.userInfo}>
                  <UserCircle size={48} className={styles.userIcon} />
                  <div className={styles.userDetails}>
                    <Text variant="h4">
                      {blockedUser.blockedUser.companyName || blockedUser.blockedUser.name || blockedUser.blockedUser.email}
                    </Text>
                    <Text variant="small" color="secondary">
                      {blockedUser.blockedUser.email}
                    </Text>
                    <Text variant="small" color="secondary">
                      تم الحظر: {new Date(blockedUser.blockedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleUnblock(blockedUser.blockedUserId)}
                  disabled={unblockingUserId === blockedUser.blockedUserId}
                >
                  {unblockingUserId === blockedUser.blockedUserId ? 'جاري الإلغاء...' : 'إلغاء الحظر'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
