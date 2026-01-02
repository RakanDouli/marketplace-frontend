'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices';
import { Button } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import styles from './TokenExpirationModal.module.scss';

interface TokenExpirationModalProps {
  isVisible: boolean;
  expiresAt: number; // timestamp in milliseconds
  onExtendSession: () => Promise<void>;
  onLogout: () => void;
  warningThreshold?: number; // seconds before expiry to show warning (default: 300 = 5 minutes)
}

export const TokenExpirationModal: React.FC<TokenExpirationModalProps> = ({
  isVisible,
  expiresAt,
  onExtendSession,
  onLogout,
  warningThreshold = 300 // 5 minutes default
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  // Calculate time remaining
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      // Auto logout when time is up
      if (remaining <= 0) {
        onLogout();
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onLogout]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle extend session
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  // Determine urgency level for styling
  const getUrgencyLevel = (): 'warning' | 'danger' | 'critical' => {
    if (timeLeft <= 60) return 'critical'; // Last minute
    if (timeLeft <= 120) return 'danger';  // Last 2 minutes
    return 'warning'; // 5 minutes or less
  };

  const urgencyLevel = getUrgencyLevel();

  return (
    <Modal
      isVisible={isVisible}
      closeable={false}
      className={styles.tokenModal}
      maxWidth='lg'
    >
      <div className={`${styles.modalContent} ${styles[urgencyLevel]}`}>
        {/* Icon and Title */}
        <div className={styles.header}>
          <div className={`${styles.icon} ${styles[urgencyLevel]}`}>
            <Clock size={32} />
          </div>
          <Text variant="h3" className={styles.title}>
            انتهاء صلاحية الجلسة
          </Text>
          <Text variant="paragraph" color="secondary" className={styles.subtitle}>
            ستنتهي جلستك قريباً
          </Text>
        </div>

        {/* Timer Display */}
        <div className={`${styles.timerContainer} ${styles[urgencyLevel]}`}>
          <div className={styles.timerDisplay}>
            <Text variant="h1" className={styles.timerText}>
              {formatTime(timeLeft)}
            </Text>
          </div>
          <Text variant="small" color="secondary" className={styles.timerLabel}>
            الوقت المتبقي
          </Text>
        </div>

        {/* Warning Message */}
        <div className={styles.message}>
          <Text variant="paragraph" className={styles.messageText}>
            {timeLeft > 60
              ? 'ستنتهي صلاحية جلستك قريباً. انقر على "متابعة الجلسة" للبقاء مسجل الدخول.'
              : 'ستنتهي صلاحية جلستك خلال دقيقة! انقر على "متابعة الجلسة" الآن.'
            }
          </Text>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            onClick={handleExtendSession}
            variant="primary"
            disabled={isExtending || timeLeft <= 0}
            className={styles.extendButton}
            size="lg"
          >
            {isExtending ? (
              <>
                <RefreshCw size={16} className={styles.spinning} />
                جاري التمديد...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                متابعة الجلسة
              </>
            )}
          </Button>

          <Button
            onClick={onLogout}
            variant="secondary"
            className={styles.logoutButton}
            size="lg"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </Button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div
            className={`${styles.progressBar} ${styles[urgencyLevel]}`}
            style={{
              width: `${Math.max(0, (timeLeft / warningThreshold) * 100)}%`
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TokenExpirationModal;
