'use client';

import React, { useState, useEffect } from 'react';
import { Button, Text, Modal, Loading, Form, ImageUploadGrid, ImageItem } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { Listing } from '@/types/listing';
import { useUserListingsStore } from '@/stores/userListingsStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { LISTING_STATUS_LABELS, mapToOptions } from '@/constants/metadata-labels';
import styles from './EditListingModal.module.scss';

interface EditListingModalProps {
  listing: Listing;
  onClose: () => void;
  onSave: (updatedData: Partial<Listing>) => Promise<void>;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  listing,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description || '',
    priceMinor: listing.priceMinor,
    status: listing.status,
    allowBidding: listing.allowBidding,
    biddingStartPrice: listing.biddingStartPrice,
  });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const { loadMyListingById } = useUserListingsStore();
  const { listingStatuses, fetchListingMetadata } = useMetadataStore();

  // Fetch listing statuses on mount
  useEffect(() => {
    if (listingStatuses.length === 0) {
      fetchListingMetadata();
    }
  }, [listingStatuses.length, fetchListingMetadata]);

  // Fetch detailed listing data from backend
  const fetchListingDetails = async () => {
    setLoadingDetails(true);
    try {
      await loadMyListingById(listing.id);
      const currentListing = useUserListingsStore.getState().currentListing;
      setDetailedListing(currentListing);

      // Initialize images from existing listing
      if (currentListing?.images) {
        const existingImages: ImageItem[] = currentListing.images.map((img, index) => ({
          id: `existing-${index}`,
          url: img.url,
        }));
        setImages(existingImages);
      }
    } catch (error) {
      console.error('Failed to fetch listing details:', error);
      // Fallback to basic listing data if API fails
      setDetailedListing(listing);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchListingDetails();
  }, [listing.id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.title.trim()) {
      setError('يرجى إدخال عنوان الإعلان');
      return;
    }

    if (formData.priceMinor <= 0) {
      setError('يرجى إدخال سعر صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        priceMinor: Math.round(formData.priceMinor), // Ensure integer for minor units
        status: formData.status,
        allowBidding: formData.allowBidding,
        biddingStartPrice: formData.biddingStartPrice ? Math.round(formData.biddingStartPrice) : undefined,
      });
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'فشل في حفظ التغييرات');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price - using English numbers to match user-facing listings
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  // Format date - using English dates for consistency
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <Modal isVisible onClose={onClose} title="تعديل الإعلان" maxWidth="lg">
      {loadingDetails ? (
        <div className={styles.loadingContainer}>
          <Loading />
          <Text variant="paragraph" className={styles.loadingText}>جاري تحميل تفاصيل الإعلان...</Text>
        </div>
      ) : detailedListing && (
        <>
          {/* Listing Header */}
          <div className={styles.listingHeader}>
            <Text variant="h3" className={styles.listingTitle}>{detailedListing.title}</Text>
            <div className={styles.listingInfo}>
              <div className={styles.infoItem}>
                <span className={styles.label}>السعر الحالي</span>
                <span className={`${styles.value} ${styles.price}`}>{formatPrice(detailedListing.priceMinor)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>تاريخ الإنشاء</span>
                <span className={styles.value}>{formatDate(detailedListing.createdAt)}</span>
              </div>
              {detailedListing.updatedAt !== detailedListing.createdAt && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>آخر تحديث</span>
                  <span className={styles.value}>{formatDate(detailedListing.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Grid */}
          <div className={styles.imagesSection}>
            <ImageUploadGrid
              images={images}
              onChange={setImages}
              maxImages={20}
              disabled={isSubmitting}
            />
          </div>

          {/* Specifications (Read-only) */}
          {detailedListing.specsDisplay && Object.keys(detailedListing.specsDisplay).length > 0 && (
            <div className={styles.specificationsSection}>
              <Text variant="h4" className={styles.specificationsTitle}>المواصفات والمعلومات التقنية</Text>
              <div className={styles.specsGrid}>
                {Object.entries(detailedListing.specsDisplay).map(([key, value]) => {
                  const displayLabel = typeof value === 'object' ? value.label : key;
                  const displayValue = typeof value === 'object' ? value.value : value;
                  return (
                    <div key={key} className={styles.specItem}>
                      <span className={styles.specLabel}>{displayLabel}</span>
                      <span className={styles.specValue}>{String(displayValue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Form onSubmit={handleSubmit} error={error || undefined}>
        {/* Editable Fields */}
        <div className={styles.editSection}>
          <Text variant="h4" className={styles.sectionTitle}>معلومات الإعلان</Text>

          {/* Title */}
          <Input
            type="text"
            label="عنوان الإعلان *"
            placeholder="أدخل عنوان الإعلان"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          {/* Description */}
          <Input
            type="textarea"
            label="الوصف"
            placeholder="أدخل وصف تفصيلي للإعلان"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
          />

          {/* Price */}
          <Input
            type="number"
            label="السعر (بالدولار) *"
            placeholder="أدخل السعر"
            value={Math.round(formData.priceMinor / 100)}
            onChange={(e) => setFormData({ ...formData, priceMinor: parseFloat(e.target.value || '0') * 100 })}
            required
            min={0}
            step={1}
          />

          {/* Status */}
          <Input
            type="select"
            label="حالة الإعلان *"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={mapToOptions(listingStatuses, LISTING_STATUS_LABELS)}
            required
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
                placeholder="أدخل سعر البداية"
                value={formData.biddingStartPrice ? Math.round(formData.biddingStartPrice / 100) : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  biddingStartPrice: e.target.value ? parseFloat(e.target.value || '0') * 100 : undefined
                })}
                min={0}
                step={1}
              />
            )}
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
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
