import React, { useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button } from '@/components/slices/Button/Button';
import { Text } from '@/components/slices/Text/Text';
import { useAdminListingsStore } from '@/stores/admin/adminListingsStore';
import { useNotificationStore } from '@/stores';
import styles from './ConfirmBlockUserModal.module.scss';

interface ConfirmBlockUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
  } | null;
  isBlocking: boolean; // true for block, false for unblock
  onSuccess?: () => void; // Callback after successful block/unblock
}

export const ConfirmBlockUserModal: React.FC<ConfirmBlockUserModalProps> = ({
  isVisible,
  onClose,
  user,
  isBlocking,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser } = useAdminListingsStore();
  const { addNotification } = useNotificationStore();

  const handleConfirm = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newStatus = isBlocking ? 'BANNED' : 'ACTIVE';
      const result = await updateUser({ id: user.id, status: newStatus });

      if (result) {
        const message = isBlocking
          ? 'تم حظر المستخدم بنجاح'
          : 'تم إلغاء حظر المستخدم بنجاح';

        addNotification({
          type: 'success',
          message,
          duration: 5000,
        });

        onClose();
        onSuccess?.(); // Call the success callback to refresh the listing
      } else {
        const errorMessage = isBlocking
          ? 'فشل في حظر المستخدم'
          : 'فشل في إلغاء حظر المستخدم';

        addNotification({
          type: 'error',
          message: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      const errorMessage = isBlocking
        ? 'فشل في حظر المستخدم'
        : 'فشل في إلغاء حظر المستخدم';

      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title={isBlocking ? "تأكيد حظر المستخدم" : "تأكيد إلغاء حظر المستخدم"}
      maxWidth="sm"
    >
      <div className={styles.container}>
        {/* Warning Message */}
        <div className={styles.warningMessage}>
          <Text variant="paragraph" className={`${styles.warningText} ${!isBlocking ? styles.success : ''}`}>
            {isBlocking ? " تحذير: حظر المستخدم" : " إلغاء حظر المستخدم"}
          </Text>
        </div>

        {/* User Information */}
        <div className={styles.userInfo}>
          <Text variant="paragraph" className={styles.questionText}>
            {isBlocking
              ? "هل أنت متأكد من حظر هذا المستخدم؟"
              : "هل أنت متأكد من إلغاء حظر هذا المستخدم؟"
            }
          </Text>

          <div className={styles.userDetails}>
            <Text variant="small" color="secondary">اسم المستخدم:</Text>
            <Text variant="paragraph" className={styles.userName}>
              {user?.name || 'غير محدد'}
            </Text>

            <Text variant="small" color="secondary">البريد الإلكتروني:</Text>
            <Text variant="paragraph" className={styles.userEmail}>
              {user?.email || ''}
            </Text>
          </div>
        </div>

        {/* Consequences Warning */}
        {isBlocking ? (
          <div className={styles.consequences}>
            <Text variant="small" color="error">
              العواقب:
            </Text>
            <ul className={styles.consequencesList}>
              <li>سيتم منع المستخدم من تسجيل الدخول</li>
              <li>لن يتمكن من إنشاء عروض جديدة</li>
              <li>ستظل عروضه الحالية مرئية</li>
              <li>يمكن إلغاء الحظر لاحقاً</li>
            </ul>
          </div>
        ) : (
          <div className={styles.unblockResult}>
            <Text variant="small" color="secondary">
              النتيجة:
            </Text>
            <ul className={styles.resultList}>
              <li>سيتمكن المستخدم من تسجيل الدخول</li>
              <li>يمكنه إنشاء عروض جديدة</li>
              <li>سيعود حسابه إلى الحالة النشطة</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant={isBlocking ? "danger" : "success"}
            disabled={isLoading}
          >
            {isLoading
              ? (isBlocking ? "جاري الحظر..." : "جاري إلغاء الحظر...")
              : (isBlocking ? "تأكيد الحظر" : "تأكيد إلغاء الحظر")
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};