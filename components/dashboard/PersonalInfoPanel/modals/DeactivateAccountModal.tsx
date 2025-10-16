import React, { useState } from 'react';
import { Modal, Button, Text } from '@/components/slices';
import { PauseCircle } from 'lucide-react';

interface DeactivateAccountModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeactivating(true);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تعطيل الحساب');
      setIsDeactivating(false);
    }
  };

  return (
    <Modal isVisible={true} onClose={onClose} maxWidth="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <PauseCircle size={24} color="var(--warning)" />
        <Text variant="h3">تعطيل الحساب</Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Text variant="paragraph">
          عند تعطيل حسابك:
        </Text>

        <ul style={{ paddingRight: '20px', margin: '8px 0' }}>
          <li>سيتم إخفاء جميع إعلاناتك من البحث</li>
          <li>لن يتمكن الآخرون من مشاهدة ملفك الشخصي</li>
          <li>سيتم إيقاف اشتراكاتك المدفوعة مؤقتاً</li>
          <li>يمكنك إعادة التفعيل في أي وقت بتسجيل الدخول مرة أخرى</li>
        </ul>

        <div style={{ backgroundColor: 'rgba(var(--warning-rgb), 0.1)', padding: '12px', borderRadius: '4px' }}>
          <Text variant="small">
            ملاحظة: يمكنك إعادة تفعيل حسابك في أي وقت عن طريق تسجيل الدخول مرة أخرى
          </Text>
        </div>

        {error && (
          <div style={{ color: 'var(--error)', fontSize: '14px', padding: '8px 12px', backgroundColor: 'rgba(var(--error-rgb), 0.1)', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="outline" onClick={onClose} disabled={isDeactivating}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isDeactivating}
          >
            {isDeactivating ? 'جاري التعطيل...' : 'تأكيد التعطيل'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
