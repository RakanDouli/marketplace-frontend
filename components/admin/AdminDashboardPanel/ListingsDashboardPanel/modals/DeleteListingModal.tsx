'use client';

import React, { useState } from 'react';
import { Button, Text, Modal } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { Listing } from '@/types/listing';
import { AlertTriangle } from 'lucide-react';

interface DeleteListingModalProps {
  listing: Listing;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteListingModal: React.FC<DeleteListingModalProps> = ({
  listing,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Handle delete confirmation
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format price for display
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  return (
    <Modal isVisible onClose={onClose} title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle color="var(--danger)" size={24} />
        <Text variant="h2">حذف الإعلان</Text>
      </div>
    }>
      {/* Warning Message */}
      <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--danger-alpha)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
        <Text variant="paragraph" color="error" style={{ fontWeight: 500, fontSize: '16px' }}>
          هل أنت متأكد من حذف هذا الإعلان؟ هذا الإجراء لا يمكن التراجع عنه.
        </Text>
      </div>

      {/* Listing Details */}
      <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <Text variant="h3" style={{ marginBottom: '12px' }}>{listing.title}</Text>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <Text as="span" style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '16px' }}>
            {formatPrice(listing.priceMinor)}
          </Text>
          <Text as="span" color="secondary" style={{ fontSize: '14px', padding: '2px 8px', background: 'var(--surface)', borderRadius: '4px' }}>
            سيارات
          </Text>
          <Text as="span" color="secondary" style={{ fontSize: '14px', padding: '2px 8px', background: 'var(--surface)', borderRadius: '4px' }}>
            {new Date(listing.createdAt).toLocaleDateString('ar-SY')}
          </Text>
        </div>

        {listing.description && (
          <Text variant="paragraph" color="secondary" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            {listing.description.length > 150
              ? `${listing.description.substring(0, 150)}...`
              : listing.description
            }
          </Text>
        )}
      </div>

      {/* Delete Reason (Optional) */}
      <Input
        type="textarea"
        label="سبب الحذف (اختياري)"
        value={deleteReason}
        onChange={(e) => setDeleteReason(e.target.value)}
        placeholder="اكتب سبب حذف هذا الإعلان للمراجعة المستقبلية..."
        rows={3}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border)', marginTop: '24px' }}>
        <Button
          onClick={onClose}
          variant="secondary"
          disabled={isDeleting}
        >
          إلغاء
        </Button>
        <Button
          onClick={handleConfirm}
          variant="danger"
          disabled={isDeleting}
          loading={isDeleting}
        >
          {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
        </Button>
      </div>
    </Modal>
  );
};