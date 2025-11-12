'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { uploadToCloudflare, validateImageFile } from '@/utils/cloudflare-upload';
import { useNotificationStore } from '@/stores/notificationStore';
import styles from './AdCampaignModals.module.scss';

interface AdPackage {
  id: string;
  packageName: string;
  basePrice: number;
  currency: string;
  adType: string;
  placement: string;
  format: string;
  dimensions: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  mediaRequirements: string[];
}

interface CampaignPackage {
  packageId: string;
  packageData: AdPackage;
  desktopMediaUrl: string;
  mobileMediaUrl: string;
  customPrice?: number;
}

interface AddPackageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (pkg: CampaignPackage) => void;
  availablePackages: AdPackage[];
  editingPackage?: CampaignPackage;
}

export const AddPackageModal: React.FC<AddPackageModalProps> = ({
  isVisible,
  onClose,
  onAdd,
  availablePackages,
  editingPackage,
}) => {
  const { addNotification } = useNotificationStore();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPackage = availablePackages.find(p => p.id === selectedPackageId);

  // Populate form when editing
  React.useEffect(() => {
    if (editingPackage && isVisible) {
      setSelectedPackageId(editingPackage.packageId);
      setDesktopPreview(editingPackage.desktopMediaUrl);
      setMobilePreview(editingPackage.mobileMediaUrl);
      setCustomPrice(editingPackage.customPrice);
    } else if (!isVisible) {
      // Reset form when closing
      setSelectedPackageId('');
      setDesktopFile(null);
      setMobileFile(null);
      setDesktopPreview(null);
      setMobilePreview(null);
      setCustomPrice(undefined);
      setError(null);
    }
  }, [editingPackage, isVisible]);

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid desktop image');
      return;
    }

    setDesktopFile(file);
    setDesktopPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid mobile image');
      return;
    }

    setMobileFile(file);
    setMobilePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedPackageId) {
      setError('يرجى اختيار حزمة إعلانية');
      return;
    }

    if (!desktopFile) {
      setError('يرجى رفع صورة سطح المكتب');
      return;
    }

    if (!mobileFile) {
      setError('يرجى رفع صورة الموبايل');
      return;
    }

    if (!selectedPackage) {
      setError('الحزمة المحددة غير موجودة');
      return;
    }

    setIsUploading(true);

    try {
      // Upload desktop image
      const desktopUrl = await uploadToCloudflare(desktopFile);

      // Upload mobile image
      const mobileUrl = await uploadToCloudflare(mobileFile);

      // Create campaign package object
      const campaignPackage: CampaignPackage = {
        packageId: selectedPackageId,
        packageData: selectedPackage,
        desktopMediaUrl: desktopUrl,
        mobileMediaUrl: mobileUrl,
        customPrice,
      };

      onAdd(campaignPackage);

      // Reset form
      setSelectedPackageId('');
      setDesktopFile(null);
      setMobileFile(null);
      setDesktopPreview(null);
      setMobilePreview(null);
      setCustomPrice(undefined);

      addNotification({
        type: 'success',
        title: 'تم الإضافة',
        message: 'تمت إضافة الحزمة بنجاح',
        duration: 3000,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في رفع الصور');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="إضافة حزمة إعلانية"
      description="اختر حزمة وارفع الصور المطلوبة"
      maxWidth="lg"
    >
      <Form onSubmit={handleSubmit} error={error || undefined} className={styles.addPackageForm}>
        {/* Package Selection */}
        <div className={styles.section}>
          <label className={styles.label}>الحزمة الإعلانية *</label>
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">-- اختر الحزمة --</option>
            {availablePackages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.packageName} - ${pkg.basePrice}
              </option>
            ))}
          </select>

          {selectedPackage && (
            <div className={styles.packageInfo}>
              <Text variant="small">
                النوع: {selectedPackage.adType} | الموضع: {selectedPackage.placement}
              </Text>
              <Text variant="small">
                الأبعاد: {selectedPackage.dimensions.desktop.width}x{selectedPackage.dimensions.desktop.height} (سطح مكتب) | {' '}
                {selectedPackage.dimensions.mobile.width}x{selectedPackage.dimensions.mobile.height} (موبايل)
              </Text>
            </div>
          )}
        </div>

        {/* Desktop Image Upload */}
        <div className={styles.section}>
          <label className={styles.label}>صورة سطح المكتب *</label>
          {selectedPackage && (
            <Text variant="small" className={styles.dimensionHint}>
              الأبعاد المطلوبة: {selectedPackage.dimensions.desktop.width}x{selectedPackage.dimensions.desktop.height}
            </Text>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleDesktopFileChange}
            className={styles.fileInput}
            required
          />
          {desktopPreview && (
            <div className={styles.imagePreview}>
              <img src={desktopPreview} alt="Desktop preview" />
            </div>
          )}
        </div>

        {/* Mobile Image Upload */}
        <div className={styles.section}>
          <label className={styles.label}>صورة الموبايل *</label>
          {selectedPackage && (
            <Text variant="small" className={styles.dimensionHint}>
              الأبعاد المطلوبة: {selectedPackage.dimensions.mobile.width}x{selectedPackage.dimensions.mobile.height}
            </Text>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleMobileFileChange}
            className={styles.fileInput}
            required
          />
          {mobilePreview && (
            <div className={styles.imagePreview}>
              <img src={mobilePreview} alt="Mobile preview" />
            </div>
          )}
        </div>

        {/* Custom Price (Optional) */}
        <div className={styles.section}>
          <label className={styles.label}>سعر مخصص (اختياري)</label>
          <input
            type="number"
            value={customPrice || ''}
            onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={`السعر الافتراضي: $${selectedPackage?.basePrice || 0}`}
            className={styles.input}
            min="0"
            step="0.01"
          />
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={isUploading}>
            {isUploading ? 'جاري الرفع...' : 'إضافة الحزمة'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
