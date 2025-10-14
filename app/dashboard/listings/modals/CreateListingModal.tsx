'use client';

import React, { useState } from 'react';
import { Button, Text, Modal } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import styles from './CreateListingModal.module.scss';

interface CreateListingModalProps {
  onClose: () => void;
  onSave: (listingData: any) => Promise<void>;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceMinor: 0,
    allowBidding: false,
    biddingStartPrice: undefined as number | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان الإعلان');
      return;
    }

    if (formData.priceMinor <= 0) {
      alert('يرجى إدخال سعر صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        priceMinor: formData.priceMinor,
        allowBidding: formData.allowBidding,
        biddingStartPrice: formData.biddingStartPrice,
      });
    } catch (error) {
      console.error('Create error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isVisible onClose={onClose} title="إنشاء إعلان جديد" maxWidth="lg">
      <form onSubmit={handleSubmit}>
        <div className={styles.createSection}>
          <Text variant="paragraph" color="secondary" className={styles.description}>
            أضف معلومات الإعلان الجديد. يمكنك تعديلها لاحقاً.
          </Text>

          {/* Title */}
          <Input
            type="text"
            label="عنوان الإعلان *"
            placeholder="أدخل عنوان واضح وجذاب للإعلان"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          {/* Description */}
          <Input
            type="textarea"
            label="الوصف *"
            placeholder="اكتب وصفاً تفصيلياً يتضمن جميع المعلومات المهمة"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            required
          />

          {/* Price */}
          <Input
            type="number"
            label="السعر (بالدولار) *"
            placeholder="أدخل السعر المطلوب"
            value={formData.priceMinor > 0 ? formData.priceMinor / 100 : ''}
            onChange={(e) => setFormData({ ...formData, priceMinor: parseFloat(e.target.value || '0') * 100 })}
            required
            min={0}
            step={1}
          />

          {/* Bidding Options */}
          <div className={styles.biddingSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.allowBidding}
                onChange={(e) => setFormData({ ...formData, allowBidding: e.target.checked })}
              />
              <span>السماح بالمزايدة على هذا الإعلان</span>
            </label>

            {formData.allowBidding && (
              <Input
                type="number"
                label="سعر البداية للمزايدة (بالدولار)"
                placeholder="أدخل سعر البداية للمزايدة (اختياري)"
                value={formData.biddingStartPrice ? formData.biddingStartPrice / 100 : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  biddingStartPrice: e.target.value ? parseFloat(e.target.value) * 100 : undefined
                })}
                min={0}
                step={1}
              />
            )}
          </div>

          <div className={styles.noteBox}>
            <Text variant="small" color="secondary">
              <strong>ملاحظة:</strong> بعد إنشاء الإعلان، ستحتاج إلى إضافة الصور والمواصفات التفصيلية من خلال صفحة التعديل.
            </Text>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الإعلان'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
