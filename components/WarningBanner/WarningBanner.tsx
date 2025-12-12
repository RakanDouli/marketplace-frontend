'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { UserStatus } from '@/common/enums';
import styles from './WarningBanner.module.scss';

export const WarningBanner: React.FC = () => {
  const user = useUserAuthStore((state) => state.user);
  const acknowledgeWarning = useUserAuthStore((state) => state.acknowledgeWarning);

  // Debug: Log user warning data
  console.log('🔍 WarningBanner - User data:', {
    hasUser: !!user,
    userName: user?.name,
    warningCount: user?.warningCount,
    currentWarningMessage: user?.currentWarningMessage,
    warningAcknowledged: user?.warningAcknowledged,
    status: user?.status,
  });

  // Don't show banner if:
  // - No user
  // - No warning message
  // - Warning already acknowledged
  // - User is banned/suspended (they can't access the site anyway)
  const isBannedOrSuspended = user?.status === UserStatus.BANNED || user?.status === UserStatus.SUSPENDED;
  if (
    !user ||
    !user.currentWarningMessage ||
    user.warningAcknowledged ||
    isBannedOrSuspended
  ) {
    console.log('⚠️ WarningBanner NOT showing. Reason:', {
      noUser: !user,
      noMessage: !user?.currentWarningMessage,
      acknowledged: user?.warningAcknowledged,
      bannedOrSuspended: isBannedOrSuspended,
    });
    return null;
  }

  console.log('✅ WarningBanner SHOULD be visible now!');

  const getStrikeMessage = () => {
    if (user.warningCount === 1) {
      return '⚠️ تحذير أول - المخالفة القادمة ستؤدي إلى إيقاف الحساب لمدة 7 أيام';
    } else if (user.warningCount === 2) {
      return '🚫 تحذير ثاني - حسابك موقوف لمدة 7 أيام. المخالفة القادمة ستؤدي إلى حظر دائم';
    }
    return '⚠️ تحذير';
  };

  const getStrikeSeverity = (): 'warning' | 'danger' => {
    return (user.warningCount || 0) >= 2 ? 'danger' : 'warning';
  };

  return (
    <div className={`${styles.warningBanner} ${styles[getStrikeSeverity()]}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <AlertTriangle size={24} />
        </div>
        <div className={styles.text}>
          <div className={styles.title}>{getStrikeMessage()}</div>
          <div className={styles.message}>{user.currentWarningMessage}</div>
        </div>
      </div>
      <button
        className={styles.closeButton}
        onClick={() => acknowledgeWarning()}
        aria-label="إغلاق التحذير"
      >
        <X size={20} />
      </button>
    </div>
  );
};
