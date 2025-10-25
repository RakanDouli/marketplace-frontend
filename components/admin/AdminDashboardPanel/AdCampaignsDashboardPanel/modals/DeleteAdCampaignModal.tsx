'use client';

import React from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text } from '@/components/slices';
import { AlertTriangle } from 'lucide-react';
import styles from './AdCampaignModals.module.scss';

interface DeleteAdCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  adCampaign: any | null;
  isLoading: boolean;
}

export const DeleteAdCampaignModal: React.FC<DeleteAdCampaignModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  adCampaign,
  isLoading
}) => {
  if (!adCampaign) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تأكيد حذف الحملة"
      maxWidth="md"
    >
      <div className={styles.deleteModalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} />
        </div>

        <div className={styles.campaignInfo}>
          <Text variant="h3" align="center">
            هل أنت متأكد من حذف الحملة الإعلانية؟
          </Text>

          <div className={styles.campaignDetail}>
            <Text variant="paragraph" weight="medium">اسم الحملة:</Text>
            <Text variant="paragraph" color="secondary">{adCampaign.campaignName}</Text>
          </div>

          <div className={styles.campaignDetail}>
            <Text variant="paragraph" weight="medium">العميل:</Text>
            <Text variant="paragraph" color="secondary">{adCampaign.client?.companyName || 'غير محدد'}</Text>
          </div>

          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <Text variant="paragraph" weight="medium">تحذير!</Text>
              <Text variant="small">
                سيتم حذف جميع البيانات المرتبطة بهذه الحملة بما في ذلك التقارير والملفات. هذا الإجراء لا يمكن التراجع عنه.
              </Text>
            </div>
          </div>
        </div>

        <div className={styles.deleteActions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading}>
            حذف الحملة
          </Button>
        </div>
      </div>
    </Modal>
  );
};
