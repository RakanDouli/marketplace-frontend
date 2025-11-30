'use client';

import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { Modal, Button, Text, Form, Input } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { useReportsStore } from '@/stores/reportsStore';
import { REPORT_REASON_LABELS } from '@/constants/metadata-labels';
import {
  validateReportForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/validation/reportValidation';
import styles from './ReportModal.module.scss';

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;

  // Entity details
  entityType: 'listing' | 'thread' | 'user';
  entityId: string;
  entityTitle: string;

  // Reported user details
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_REASON_OPTIONS = Object.entries(REPORT_REASON_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const ReportModal: React.FC<ReportModalProps> = ({
  isVisible,
  onClose,
  entityType,
  entityId,
  entityTitle,
  reportedUserId,
  reportedUserName,
}) => {
  const { addNotification } = useNotificationStore();
  const { createReport, isLoading } = useReportsStore();

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateReportForm({ reason, details });
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      return;
    }

    try {
      await createReport({
        reportedUserId,
        entityType,
        entityId,
        reason,
        details,
      });

      addNotification({
        type: 'success',
        title: 'تم إرسال البلاغ',
        message: 'شكراً لك، سنقوم بمراجعة البلاغ في أقرب وقت',
        duration: 5000,
      });

      handleClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة مرة أخرى',
      });
    }
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setValidationErrors({});
    onClose();
  };

  // Entity-specific labels
  const getModalTitle = () => {
    switch (entityType) {
      case 'listing':
        return 'الإبلاغ عن الإعلان';
      case 'thread':
        return 'إبلاغ عن محتوى مسيء';
      case 'user':
        return 'الإبلاغ عن المستخدم';
    }
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'listing':
        return 'الإعلان';
      case 'thread':
        return 'المحادثة';
      case 'user':
        return 'المستخدم';
    }
  };

  return (
    <Modal isVisible={isVisible} maxWidth="md" onClose={handleClose}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Flag size={24} />
          <Text variant="h3">{getModalTitle()}</Text>
        </div>

        <div className={styles.info}>
          <Text variant="small" color="secondary">
            <strong>{getEntityLabel()}:</strong> {entityTitle}
          </Text>
          {entityType !== 'user' && (
            <Text variant="small" color="secondary">
              <strong>البائع:</strong> {reportedUserName}
            </Text>
          )}
        </div>

        <Form onSubmit={handleSubmit}>
          <Input
            label="سبب البلاغ"
            type="select"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setValidationErrors({});
            }}
            error={validationErrors.reason}
            options={[{ value: '', label: 'اختر السبب' }, ...REPORT_REASON_OPTIONS]}
            required
            disabled={isLoading}
          />

          <Input
            label="تفاصيل إضافية (اختياري)"
            type="textarea"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            error={validationErrors.details}
            placeholder="يرجى إضافة أي تفاصيل إضافية تساعدنا في مراجعة البلاغ..."
            rows={4}
            disabled={isLoading}
          />

          <div className={styles.actions}>
            <Button variant="outline" onClick={handleClose} disabled={isLoading} type="button">
              إلغاء
            </Button>
            <Button variant="danger" type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الإرسال...' : 'إرسال البلاغ'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
