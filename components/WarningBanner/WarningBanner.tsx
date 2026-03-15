'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './WarningBanner.module.scss';

// Warning expiration period in days (must match backend)
const WARNING_EXPIRATION_DAYS = 7;

/**
 * WarningBanner - Shows warning for Strike 1 users ONLY
 *
 * Strike System:
 * - Strike 1 (warningCount = 1): User is ACTIVE, shows this banner for 7 days
 * - Strike 2 (warningCount = 2): User is SUSPENDED, blocked at login
 * - Strike 3 (warningCount >= 3): User is BANNED, blocked at login
 *
 * This banner should ONLY appear for warningCount = 1 because:
 * - warningCount >= 2 means user has SUSPENDED/BANNED status
 * - Those users are blocked at login and cannot reach the dashboard
 *
 * Warning auto-expires after 7 days:
 * - Backend cron clears currentWarningMessage after 7 days
 * - Frontend also checks warnedAt date to hide banner immediately (no refresh needed)
 */
export const WarningBanner: React.FC = () => {
  const user = useUserAuthStore((state) => state.user);
  const acknowledgeWarning = useUserAuthStore((state) => state.acknowledgeWarning);

  // Check if warning has expired (older than 7 days)
  const isWarningExpired = useMemo(() => {
    if (!user?.warnedAt || user.warningCount !== 1) return false;
    const warnedDate = new Date(user.warnedAt);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - WARNING_EXPIRATION_DAYS);
    return warnedDate < expirationDate;
  }, [user?.warnedAt, user?.warningCount]);

  // Only show banner for Strike 1 (first warning) that hasn't expired
  // Users with warningCount >= 2 have SUSPENDED/BANNED status and are blocked at login
  if (
    !user ||
    !user.currentWarningMessage ||
    user.warningAcknowledged ||
    user.warningCount !== 1 || // Only show for exactly 1 strike
    isWarningExpired // Hide if warning is older than 7 days
  ) {
    return null;
  }

  return (
    <div className={`${styles.warningBanner} ${styles.warning}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <AlertTriangle size={24} />
        </div>
        <div className={styles.text}>
          <div className={styles.title}>
            تحذير أول - المخالفة القادمة ستؤدي إلى إيقاف الحساب لمدة 7 أيام
          </div>
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
