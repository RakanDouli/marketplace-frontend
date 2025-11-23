'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form, Input, ImageUploadGrid } from '@/components/slices';
import type { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';
import { uploadToCloudflare, validateImageFile, deleteFromCloudflare } from '@/utils/cloudflare-upload';
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
  impressionLimit: number; // Number of guaranteed impressions
  dimensions: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  mediaRequirements: string[];
}

export interface CampaignPackage {
  packageId: string;
  packageData: AdPackage;
  startDate: string | null;  // Per package start date (null for ASAP packages)
  endDate: string | null;    // Per package end date (null for ASAP packages)
  isAsap: boolean;           // ASAP flag to activate immediately after payment
  desktopMediaUrl: string;
  mobileMediaUrl: string;
  clickUrl?: string;
  openInNewTab?: boolean;
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
  const [isAsap, setIsAsap] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
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
      setStartDate(editingPackage.startDate || '');

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
      setStartDate('');
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

        // Determine media type from package (image or video)
        const mediaType = selectedPackage?.adType.toLowerCase() === 'video' ? 'video' : 'image';

        // Upload to Cloudflare immediately (returns media ID)
        const mediaId = await uploadToCloudflare(imageItem.file, mediaType);

        // Update the image with the uploaded ID (Image component will convert it to URL)
        setDesktopImages([{ id: imageItem.id, url: mediaId, file: undefined }]);

        addNotification({
          type: 'success',
          title: 'تم الرفع',
          message: `تم رفع ${mediaTypeLabel} سطح المكتب بنجاح`,
          duration: 3000,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `فشل في رفع ${mediaTypeLabel}`);
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

        // Determine media type from package (image or video)
        const mediaType = selectedPackage?.adType.toLowerCase() === 'video' ? 'video' : 'image';

        // Upload to Cloudflare immediately (returns media ID)
        const mediaId = await uploadToCloudflare(imageItem.file, mediaType);

        // Update the image with the uploaded ID (Image component will convert it to URL)
        setMobileImages([{ id: imageItem.id, url: mediaId, file: undefined }]);

        addNotification({
          type: 'success',
          title: 'تم الرفع',
          message: `تم رفع ${mediaTypeLabel} الموبايل بنجاح`,
          duration: 3000,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `فشل في رفع ${mediaTypeLabel}`);
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

    if (!isAsap && !startDate) {
      setError('يرجى اختيار تاريخ البدء أو تفعيل خيار ASAP');
      return;
    }

    if (desktopImages.length === 0 || !desktopImages[0].url) {
      setError(`يرجى رفع ${mediaTypeLabel} سطح المكتب`);
      return;
    }

    if (mobileImages.length === 0 || !mobileImages[0].url) {
      setError(`يرجى رفع ${mediaTypeLabel} الموبايل`);
      return;
    }

    if (!selectedPackage) {
      setError('الحزمة المحددة غير موجودة');
      return;
    }

    console.log('🔍 Selected Package:', selectedPackage);
    console.log('🔍 Duration Days:', selectedPackage.durationDays);
    console.log('🔍 Is ASAP:', isAsap);

    if (!selectedPackage.durationDays || selectedPackage.durationDays <= 0) {
      console.error('❌ Duration validation failed:', {
        durationDays: selectedPackage.durationDays,
        type: typeof selectedPackage.durationDays,
        isAsap
      });
      setError(`مدة الحزمة غير صالحة (القيمة الحالية: ${selectedPackage.durationDays})`);
      return;
    }

    // Calculate start/end dates
    // If ASAP, store null (will be set after payment confirmation)
    // If not ASAP, validate and use the provided start date
    let effectiveStartDate: string | null = null;
    let effectiveEndDate: string | null = null;

    if (isAsap) {
      // ASAP: dates will be set after payment, store null
      effectiveStartDate = null;
      effectiveEndDate = null;
    } else {
      // Specific date: validate and calculate end date
      if (!startDate) {
        setError('يرجى تحديد تاريخ البدء أو تفعيل "البدء فوراً"');
        return;
      }

      const start = new Date(startDate);

      // Check if date is valid
      if (isNaN(start.getTime())) {
        setError('تاريخ البدء غير صالح');
        return;
      }

      const end = new Date(start);
      end.setDate(end.getDate() + selectedPackage.durationDays);

      effectiveStartDate = startDate;
      effectiveEndDate = end.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }

    // Create campaign package object (URLs already uploaded)
    const campaignPackage: CampaignPackage = {
      packageId: selectedPackageId,
      packageData: selectedPackage,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      isAsap: isAsap,
      desktopMediaUrl: desktopImages[0].url,
      mobileMediaUrl: mobileImages[0].url,
      clickUrl: clickUrl || undefined,
      openInNewTab: true, // Always true - ads open in new tab
    };

    console.log('Adding package to campaign:', campaignPackage);
    console.log('Selected package data:', selectedPackage);

    onAdd(campaignPackage);

    // Reset form
    setSelectedPackageId('');
    setStartDate('');
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
            <Text variant="small" color="secondary">
              المدة: {selectedPackage.durationDays} يوم | السعر الأساسي: ${selectedPackage.basePrice}
            </Text>
          </div>
        )}

        {/* Start Date with ASAP Option */}
        <div className={styles.section}>
          <Input
            type="checkbox"
            label="البدء فوراً بعد الدفع (ASAP)"
            checked={isAsap}
            onChange={(e) => {
              setIsAsap(e.target.checked);
              if (e.target.checked) {
                setStartDate(''); // Clear start date when ASAP is enabled
              }
            }}
          />
          <Text variant="small" color="secondary" className={styles.description}>
            عند تفعيل هذا الخيار، سيبدأ الإعلان فوراً بعد تأكيد الدفع
          </Text>

          {!isAsap && (
            <>
              <Input
                label="تاريخ بدء الحزمة"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                placeholder="اختر تاريخ البدء"
              />
              {selectedPackage && startDate && (
                <Text variant="small" color="secondary" className={styles.description}>
                  تاريخ الانتهاء (محسوب تلقائياً): {(() => {
                    const start = new Date(startDate);
                    const end = new Date(start);
                    end.setDate(end.getDate() + selectedPackage.durationDays);
                    return end.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
                  })()}
                </Text>
              )}
            </>
          )}

          {isAsap && selectedPackage && (
            <Text variant="small" color="secondary" className={styles.description}>
              المدة: {selectedPackage.durationDays} يوم (ستبدأ بعد تأكيد الدفع)
            </Text>
          )}
        </div>

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
            onChange={async (newImages) => {
              // Detect if images were added or removed
              if (newImages.length > desktopImages.length) {
                handleDesktopImageAdd(newImages);
              } else if (newImages.length < desktopImages.length) {
                // Image removed - delete from Cloudflare
                const removedImages = desktopImages.filter(
                  oldImg => !newImages.find(newImg => newImg.id === oldImg.id)
                );

                for (const img of removedImages) {
                  if (img.url && !img.url.startsWith('blob:')) {
                    console.log(`🗑️ Deleting desktop media: ${img.url}`);
                    await deleteFromCloudflare(img.url).catch(err =>
                      console.error('Failed to delete desktop media:', err)
                    );
                  }
                }

                setDesktopImages(newImages);
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
            onChange={async (newImages) => {
              // Detect if images were added or removed
              if (newImages.length > mobileImages.length) {
                handleMobileImageAdd(newImages);
              } else if (newImages.length < mobileImages.length) {
                // Image removed - delete from Cloudflare
                const removedImages = mobileImages.filter(
                  oldImg => !newImages.find(newImg => newImg.id === oldImg.id)
                );

                for (const img of removedImages) {
                  if (img.url && !img.url.startsWith('blob:')) {
                    console.log(`🗑️ Deleting mobile media: ${img.url}`);
                    await deleteFromCloudflare(img.url).catch(err =>
                      console.error('Failed to delete mobile media:', err)
                    );
                  }
                }

                setMobileImages(newImages);
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
