import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الحساب');
      setIsDeleting(false);
    }
  };

  return (
    <Modal isVisible={true} onClose={onClose} maxWidth="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <AlertTriangle size={24} color="var(--error)" />
        <Text variant="h3" style={{ color: 'var(--error)' }}>
          حذف الحساب نهائياً
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: 'rgba(var(--error-rgb), 0.1)', padding: '12px', borderRadius: '4px' }}>
          <Text variant="paragraph" style={{ fontWeight: 600 }}>
            تحذير: هذا الإجراء لا يمكن التراجع عنه!
          </Text>
        </div>

        <Text variant="paragraph">
          سيتم حذف حسابك بشكل نهائي، بما في ذلك:
        </Text>

        <ul style={{ paddingRight: '20px', margin: '8px 0' }}>
          <li>جميع إعلاناتك</li>
          <li>معلوماتك الشخصية</li>
          <li>سجل المعاملات</li>
          <li>الاشتراكات النشطة</li>
        </ul>

        {error && (
          <div style={{ color: 'var(--error)', fontSize: '14px', padding: '8px 12px', backgroundColor: 'rgba(var(--error-rgb), 0.1)', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            إلغاء
          </Button>
          <Button
            variant="secondary"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'جاري الحذف...' : 'حذف الحساب نهائياً'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
