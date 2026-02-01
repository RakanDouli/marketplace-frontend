'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button, Text } from '@/components/slices';
import styles from './ListingLimitModal.module.scss';

interface ListingLimitModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentCount: number;
  maxListings: number;
}

export const ListingLimitModal: React.FC<ListingLimitModalProps> = ({
  isVisible,
  onClose,
  currentCount,
  maxListings,
}) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/dashboard/subscription');
  };

  const handleManageListings = () => {
    onClose();
    router.push('/dashboard/listings');
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      maxWidth="md"
    >
      <div className={styles.content}>
        <Text variant="h3" className={styles.title}>
          لقد وصلت للحد الأقصى من الإعلانات
        </Text>

        <Text variant="paragraph" color="secondary" className={styles.description}>
          لديك حالياً <strong>{currentCount}</strong> إعلان من أصل <strong>{maxListings}</strong> إعلان مسموح في خطتك الحالية.
        </Text>

        <div className={styles.options}>
          <Text variant="small" color="secondary">
            يمكنك:
          </Text>
          <ul className={styles.optionsList}>
            <li>أرشفة بعض الإعلانات الحالية لإتاحة مساحة جديدة</li>
            <li>ترقية اشتراكك للحصول على المزيد من الإعلانات</li>
          </ul>
        </div>

        <div className={styles.actions}>
          {/* <Button
            variant="primary"
            onClick={handleUpgrade}
          >
            ترقية الاشتراك
          </Button> */}
          <Button
            variant="outline"
            onClick={handleManageListings}
          >
            إدارة إعلاناتي
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ListingLimitModal;
