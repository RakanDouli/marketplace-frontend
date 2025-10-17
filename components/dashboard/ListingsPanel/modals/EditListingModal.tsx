'use client';

import React, { useState, useEffect } from 'react';
import { Button, Text, Modal, Loading } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { ImageGallery } from '@/components/slices/ImageGallery/ImageGallery';
import { Listing } from '@/types/listing';
import { useUserListingsStore } from '@/stores/userListingsStore';
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
    allowBidding: listing.allowBidding,
    biddingStartPrice: listing.biddingStartPrice,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const { loadMyListingById } = useUserListingsStore();

  // Fetch detailed listing data from backend
  const fetchListingDetails = async () => {
    setLoadingDetails(true);
    try {
      await loadMyListingById(listing.id);
      const currentListing = useUserListingsStore.getState().currentListing;
      setDetailedListing(currentListing);
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
      console.error('Save error:', error);
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

          {/* Image Gallery */}
          {detailedListing.images && detailedListing.images.length > 0 && (
            <div className={styles.imagesSection}>
              <Text variant="h4" className={styles.imagesSectionTitle}>صور الإعلان ({detailedListing.images.length})</Text>
              <ImageGallery
                images={detailedListing.images.map(img => img.url)}
                alt={detailedListing.title}
                viewMode="large"
              />
            </div>
          )}

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

      <form onSubmit={handleSubmit}>
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
            value={formData.priceMinor / 100}
            onChange={(e) => setFormData({ ...formData, priceMinor: parseFloat(e.target.value) * 100 })}
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
                placeholder="أدخل سعر البداية"
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
      </form>
    </Modal>
  );
};
