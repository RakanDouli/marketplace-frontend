import React, { useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button } from '@/components/slices/Button/Button';
import { Text } from '@/components/slices/Text/Text';
import { useAdminListingsStore } from '@/stores/admin/adminListingsStore';

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
}

export const ConfirmBlockUserModal: React.FC<ConfirmBlockUserModalProps> = ({
  isVisible,
  onClose,
  user,
  isBlocking,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser } = useAdminListingsStore();

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
        alert(message);
        onClose();
      } else {
        const errorMessage = isBlocking
          ? 'فشل في حظر المستخدم'
          : 'فشل في إلغاء حظر المستخدم';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      const errorMessage = isBlocking
        ? 'فشل في حظر المستخدم'
        : 'فشل في إلغاء حظر المستخدم';
      alert(errorMessage);
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
      <div style={{ padding: '16px 0' }}>
        {/* Warning Message */}
        <div >
          <Text variant="paragraph" style={{ color: isBlocking ? 'var(--error)' : 'var(--success)' }}>
            {isBlocking ? "⚠️ تحذير: حظر المستخدم" : " إلغاء حظر المستخدم"}
          </Text>
        </div>

        {/* User Information */}
        <div >
          <Text variant="paragraph" style={{ marginBottom: '8px' }}>
            {isBlocking
              ? "هل أنت متأكد من حظر هذا المستخدم؟"
              : "هل أنت متأكد من إلغاء حظر هذا المستخدم؟"
            }
          </Text>

          <div>
            <Text variant="small" color="secondary">اسم المستخدم:</Text>
            <Text variant="paragraph" style={{ fontWeight: '600', marginBottom: '4px' }}>
              {user?.name || 'غير محدد'}
            </Text>

            <Text variant="small" color="secondary">البريد الإلكتروني:</Text>
            <Text variant="paragraph" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {user?.email || ''}
            </Text>
          </div>
        </div>

        {/* Consequences Warning */}
        {isBlocking ? (
          <div style={{ marginBottom: '20px' }}>
            <Text variant="small" color="secondary" style={{ marginBottom: '8px' }}>
              العواقب:
            </Text>
            <ul style={{
              margin: '0',
              paddingRight: '20px',
              color: 'var(--text-secondary)'
            }}>
              <li>سيتم منع المستخدم من تسجيل الدخول</li>
              <li>لن يتمكن من إنشاء إعلانات جديدة</li>
              <li>ستظل إعلاناته الحالية مرئية</li>
              <li>يمكن إلغاء الحظر لاحقاً</li>
            </ul>
          </div>
        ) : (
          <div >
            <Text variant="small" color="secondary">
              النتيجة:
            </Text>
            <ul>
              <li>سيتمكن المستخدم من تسجيل الدخول</li>
              <li>يمكنه إنشاء إعلانات جديدة</li>
              <li>سيعود حسابه إلى الحالة النشطة</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)'
        }}>
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