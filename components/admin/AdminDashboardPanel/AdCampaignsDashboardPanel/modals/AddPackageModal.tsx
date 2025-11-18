'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form, Input, ImageUploadGrid } from '@/components/slices';
import type { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';
import { uploadToCloudflare, validateImageFile } from '@/utils/cloudflare-upload';
import { useNotificationStore } from '@/stores/notificationStore';
import styles from './AdCampaignModals.module.scss';

export interface AdPackage {
  id: string;
  packageName: string;
  basePrice: number;
  currency: string;
  adType: string;
  placement: string;
  format: string;
  durationDays: number;
  dimensions: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  mediaRequirements: string[];
}

export interface CampaignPackage {
  packageId: string;
  packageData: AdPackage;
  desktopMediaUrl: string;
  mobileMediaUrl: string;
  clickUrl?: string;
  openInNewTab?: boolean;
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
  const [desktopImages, setDesktopImages] = useState<ImageItem[]>([]);
  const [mobileImages, setMobileImages] = useState<ImageItem[]>([]);
  const [clickUrl, setClickUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPackage = availablePackages.find(p => p.id === selectedPackageId);

  // Convert packages to options format for Input select
  const packageOptions = availablePackages.map(pkg => ({
    value: pkg.id,
    label: `${pkg.packageName} - $${pkg.basePrice}`
  }));

  // Determine if package requires video or image
  const isVideoPackage = selectedPackage?.adType === 'video';
  const mediaTypeLabel = isVideoPackage ? 'فيديو' : 'صورة';
  const acceptAttribute = isVideoPackage ? 'video/*' : 'image/*,video/*';

  // Populate form when editing
  React.useEffect(() => {
    if (editingPackage && isVisible) {
      setSelectedPackageId(editingPackage.packageId);

      // Convert URLs to ImageItem format
      if (editingPackage.desktopMediaUrl) {
        setDesktopImages([{
          id: `desktop-${Date.now()}`,
          url: editingPackage.desktopMediaUrl,
          file: undefined
        }]);
      }

      if (editingPackage.mobileMediaUrl) {
        setMobileImages([{
          id: `mobile-${Date.now()}`,
          url: editingPackage.mobileMediaUrl,
          file: undefined
        }]);
      }

      setClickUrl(editingPackage.clickUrl || '');
    } else if (!isVisible) {
      // Reset form when closing
      setSelectedPackageId('');
      setDesktopImages([]);
      setMobileImages([]);
      setClickUrl('');
      setError(null);
    }
  }, [editingPackage, isVisible]);

  // Handle desktop image upload (immediate upload when added)
  const handleDesktopImageAdd = async (newImages: ImageItem[]) => {
    const addedImages = newImages.filter(img => img.file && img.url.startsWith('blob:'));

    if (addedImages.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const imageItem of addedImages) {
        if (!imageItem.file) continue;

        // Upload to Cloudflare immediately (returns image ID)
        const imageId = await uploadToCloudflare(imageItem.file, 'image');

        // Update the image with the uploaded ID (Image component will convert it to URL)
        setDesktopImages([{ id: imageItem.id, url: imageId, file: undefined }]);

        addNotification({
          type: 'success',
          title: 'تم الرفع',
          message: 'تم رفع صورة سطح المكتب بنجاح',
          duration: 3000,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في رفع الصورة');
      setDesktopImages([]); // Clear on error
    } finally {
      setIsUploading(false);
    }
  };

  // Handle mobile image upload (immediate upload when added)
  const handleMobileImageAdd = async (newImages: ImageItem[]) => {
    const addedImages = newImages.filter(img => img.file && img.url.startsWith('blob:'));

    if (addedImages.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const imageItem of addedImages) {
        if (!imageItem.file) continue;

        // Upload to Cloudflare immediately (returns image ID)
        const imageId = await uploadToCloudflare(imageItem.file, 'image');

        // Update the image with the uploaded ID (Image component will convert it to URL)
        setMobileImages([{ id: imageItem.id, url: imageId, file: undefined }]);

        addNotification({
          type: 'success',
          title: 'تم الرفع',
          message: 'تم رفع صورة الموبايل بنجاح',
          duration: 3000,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في رفع الصورة');
      setMobileImages([]); // Clear on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedPackageId) {
      setError('يرجى اختيار حزمة إعلانية');
      return;
    }

    if (desktopImages.length === 0 || !desktopImages[0].url) {
      setError('يرجى رفع صورة سطح المكتب');
      return;
    }

    if (mobileImages.length === 0 || !mobileImages[0].url) {
      setError('يرجى رفع صورة الموبايل');
      return;
    }

    if (!selectedPackage) {
      setError('الحزمة المحددة غير موجودة');
      return;
    }

    // Create campaign package object (URLs already uploaded)
    // Note: No custom price - packages use their base price
    // Note: openInNewTab always true (handled in frontend - 99% of ads open in new tab)
    const campaignPackage: CampaignPackage = {
      packageId: selectedPackageId,
      packageData: selectedPackage,
      desktopMediaUrl: desktopImages[0].url,
      mobileMediaUrl: mobileImages[0].url,
      clickUrl: clickUrl || undefined,
      openInNewTab: true, // Always true - ads open in new tab
    };

    onAdd(campaignPackage);

    // Reset form
    setSelectedPackageId('');
    setDesktopImages([]);
    setMobileImages([]);
    setClickUrl('');

    addNotification({
      type: 'success',
      title: 'تم الإضافة',
      message: 'تمت إضافة الحزمة بنجاح',
      duration: 3000,
    });

    onClose();
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
        <Input
          type="select"
          label="الحزمة الإعلانية"
          value={selectedPackageId}
          onChange={(e) => setSelectedPackageId(e.target.value)}
          options={packageOptions}
          required
          placeholder="اختر الحزمة الإعلانية"
        />

        {selectedPackage && (
          <div className={styles.packageInfo}>
            <Text variant="small">
              النوع: {selectedPackage.adType} | الموضع: {selectedPackage.placement} | نوع الوسائط: {mediaTypeLabel}
            </Text>
            <Text variant="small">
              الأبعاد: {selectedPackage.dimensions.desktop.width}x{selectedPackage.dimensions.desktop.height} (سطح مكتب) | {' '}
              {selectedPackage.dimensions.mobile.width}x{selectedPackage.dimensions.mobile.height} (موبايل)
            </Text>
          </div>
        )}

        {/* Desktop Media Upload */}
        <div className={styles.imagesSection}>
          <Text variant="h4">
            {mediaTypeLabel} سطح المكتب ({desktopImages.length}/1) *
          </Text>
          {selectedPackage && (
            <Text variant="small" color="secondary">
              الأبعاد المطلوبة: {selectedPackage.dimensions.desktop.width}x{selectedPackage.dimensions.desktop.height}
            </Text>
          )}
          <ImageUploadGrid
            images={desktopImages}
            onChange={(newImages) => {
              // Detect if images were added or removed
              if (newImages.length > desktopImages.length) {
                handleDesktopImageAdd(newImages);
              } else {
                setDesktopImages(newImages);
              }
            }}
            maxImages={1}
            disabled={isUploading}
          />
          {isUploading && desktopImages.length === 0 && (
            <Text variant="small" style={{ marginTop: '8px', color: 'var(--primary)' }}>
              جاري رفع الصورة...
            </Text>
          )}
        </div>

        {/* Mobile Media Upload */}
        <div className={styles.imagesSection}>
          <Text variant="h4">
            {mediaTypeLabel} الموبايل ({mobileImages.length}/1) *
          </Text>
          {selectedPackage && (
            <Text variant="small" color="secondary">
              الأبعاد المطلوبة: {selectedPackage.dimensions.mobile.width}x{selectedPackage.dimensions.mobile.height}
            </Text>
          )}
          <ImageUploadGrid
            images={mobileImages}
            onChange={(newImages) => {
              // Detect if images were added or removed
              if (newImages.length > mobileImages.length) {
                handleMobileImageAdd(newImages);
              } else {
                setMobileImages(newImages);
              }
            }}
            maxImages={1}
            disabled={isUploading}
          />
          {isUploading && mobileImages.length === 0 && (
            <Text variant="small" style={{ marginTop: '8px', color: 'var(--primary)' }}>
              جاري رفع الصورة...
            </Text>
          )}
        </div>

        {/* Click URL */}
        <div className={styles.section}>
          <Input
            label="رابط التوجيه (اختياري)"
            type="text"
            value={clickUrl}
            onChange={(e) => setClickUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <Text variant="small" color="secondary" className={styles.description}>
            سيتم فتح الرابط في تبويب جديد تلقائياً
          </Text>
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
