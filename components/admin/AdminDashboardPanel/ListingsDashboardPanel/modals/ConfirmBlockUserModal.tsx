import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
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
      title={isBlocking ? "حظر المستخدم" : "إلغاء حظر المستخدم"}
      maxWidth="md"
    >
      <div className={styles.modalContent}>
        <Text variant="h3" align="center">
          {isBlocking
            ? "هل أنت متأكد من حظر هذا المستخدم؟"
            : "هل أنت متأكد من إلغاء حظر هذا المستخدم؟"
          }
        </Text>

        <div className={styles.userInfo}>
          <Text variant="paragraph" weight="medium">المستخدم المحدد:</Text>
          <div className={styles.userDetail}>
            <Text variant="small"><strong>الاسم:</strong> {user?.name || 'غير محدد'}</Text>
            <Text variant="small"><strong>البريد الإلكتروني:</strong> {user?.email || ''}</Text>
            <Text variant="small"><strong>الحالة الحالية:</strong> {user?.status === 'BANNED' ? 'محظور' : 'نشط'}</Text>
          </div>
        </div>

        <div className={isBlocking ? styles.warningBox : styles.infoBox}>
          <div>
            <Text variant="small" weight="bold" color={isBlocking ? "error" : "secondary"}>
              {isBlocking ? "تحذير مهم:" : "النتيجة:"}
            </Text>
            <ul>
              {isBlocking ? (
                <>
                  <li>سيتم منع المستخدم من تسجيل الدخول</li>
                  <li>لن يتمكن من إنشاء عروض جديدة</li>
                  <li>ستظل عروضه الحالية مرئية</li>
                  <li>يمكن إلغاء الحظر لاحقاً</li>
                </>
              ) : (
                <>
                  <li>سيتمكن المستخدم من تسجيل الدخول</li>
                  <li>يمكنه إنشاء عروض جديدة</li>
                  <li>سيعود حسابه إلى الحالة النشطة</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            variant={isBlocking ? "danger" : "primary"}
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