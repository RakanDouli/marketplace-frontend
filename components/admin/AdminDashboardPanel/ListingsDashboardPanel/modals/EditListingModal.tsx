'use client';

import React, { useState, useEffect } from 'react';
import { Button, Text, Modal, Loading, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { ImageGallery } from '@/components/slices/ImageGallery/ImageGallery';
import { Listing } from '@/types/listing';
import { validateListingStatusForm, createListingFieldValidator, type ListingFormData, type ValidationErrors } from '@/lib/admin/validation/listingValidation';
import { useAdminListingsStore } from '@/stores/admin/adminListingsStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { LISTING_STATUS_LABELS, mapToOptions, getLabel } from '@/constants/metadata-labels';
import { ConfirmBlockUserModal } from './ConfirmBlockUserModal';
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
  const [formData, setFormData] = useState<ListingFormData>({
    status: listing.status,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const { getListingById } = useAdminListingsStore();

  // Block user confirmation modal state
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch detailed listing data from backend
  const fetchListingDetails = async () => {
    setLoadingDetails(true);
    try {
      const fullListing = await getListingById(listing.id);
      setDetailedListing(fullListing);
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
  }, [listing.id, getListingById]);

  // Create field validator for real-time validation
  const createFieldValidator = (field: keyof ListingFormData) => {
    return createListingFieldValidator(field);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    const newValidationErrors = validateListingStatusForm(formData);
    setValidationErrors(newValidationErrors);

    if (Object.keys(newValidationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        status: formData.status as Listing['status'],
        // TODO: Add moderation notes field to Listing type and backend
      });
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'فشل في حفظ التغييرات');
    } finally {
      setIsSubmitting(false);
    }
  };

  // User management handlers
  const handleBlockUser = (user: any) => {
    setSelectedUser(user);
    setBlockAction('block');
    setBlockModalVisible(true);
  };

  const handleUnblockUser = (user: any) => {
    setSelectedUser(user);
    setBlockAction('unblock');
    setBlockModalVisible(true);
  };

  // Fetch listing metadata
  const { listingStatuses } = useMetadataStore();

  useEffect(() => {
    const metadataStore = useMetadataStore.getState();
    if (listingStatuses.length === 0) {
      metadataStore.fetchListingMetadata();
    }
  }, [listingStatuses.length]);

  // Status options from metadata store
  const statusOptions = mapToOptions(listingStatuses, LISTING_STATUS_LABELS);

  // Get current status label
  const getCurrentStatusLabel = () => {
    return getLabel(listing.status, LISTING_STATUS_LABELS);
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
    <Modal isVisible onClose={onClose} title="تعديل العرض" maxWidth="lg">
      {loadingDetails ? (
        <div className={styles.loadingContainer}>
          <Loading />
          <Text variant="paragraph" className={styles.loadingText}>جاري تحميل تفاصيل العرض...</Text>
        </div>
      ) : detailedListing && (
        <>
          {/* Listing Header */}
          <div className={styles.listingHeader}>
            <Text variant="h3" className={styles.listingTitle}>{detailedListing.title}</Text>
            <div className={styles.listingInfo}>
              <div className={styles.infoItem}>
                <span className={styles.label}>السعر</span>
                <span className={`${styles.value} ${styles.price}`}>{formatPrice(detailedListing.priceMinor)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>الحالة الحالية</span>
                <span className={styles.value}>{getCurrentStatusLabel()}</span>
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

          {/* Bidding Information */}
          {detailedListing.allowBidding && (
            <div className={styles.biddingInfo}>
              <Text variant="h4" className={styles.biddingTitle}>معلومات المزادات</Text>
              <div className={styles.biddingDetails}>
                <div className={styles.biddingItem}>
                  <span className={styles.label}>المزايدة متاحة</span>
                  <span className={styles.value}>نعم</span>
                </div>
                {detailedListing.biddingStartPrice && (
                  <div className={styles.biddingItem}>
                    <span className={styles.label}>سعر البداية</span>
                    <span className={styles.value}>{formatPrice(detailedListing.biddingStartPrice)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {detailedListing.images && detailedListing.images.length > 0 ? (
            <div className={styles.imagesSection}>
              <Text variant="h4" className={styles.imagesSectionTitle}>صور الإعلان ({detailedListing.images.length})</Text>
              <ImageGallery
                images={detailedListing.images.map(img => img.url)}
                alt={detailedListing.title}
                viewMode="large"
              />
            </div>
          ) : (
            <div className={styles.noImagesContainer}>
              <Text variant="h4" className={styles.noImagesTitle}>صور الإعلان</Text>
              <Text variant="paragraph" color="secondary">لا توجد صور متاحة لهذا الإعلان</Text>
            </div>
          )}

          {/* Description */}
          {detailedListing.description && (
            <div className={styles.descriptionSection}>
              <Text variant="h4" className={styles.descriptionTitle}>الوصف</Text>
              <Text variant="paragraph" className={styles.descriptionText}>{detailedListing.description}</Text>
            </div>
          )}

          {/* Specifications */}
          {((detailedListing.specsDisplay && Object.keys(detailedListing.specsDisplay).length > 0) ||
            (detailedListing.specs && Object.keys(detailedListing.specs).length > 0)) && (
              <div className={styles.specificationsSection}>
                <Text variant="h4" className={styles.specificationsTitle}>المواصفات والمعلومات التقنية</Text>

                {/* Display specs (Arabic, user-friendly) */}
                {detailedListing.specsDisplay && Object.keys(detailedListing.specsDisplay).length > 0 && (
                  <>
                    <Text variant="paragraph" className={styles.specsDisplayTitle}>المواصفات (للعرض)</Text>
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
                  </>
                )}

                {/* Raw specs (English keys, backend data) */}
                {/* {detailedListing.specs && Object.keys(detailedListing.specs).length > 0 && (
                  <>
                    <Text variant="paragraph" style={{ marginBottom: '8px', fontWeight: 500 }}>البيانات الخام (للمطورين)</Text>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {Object.entries(detailedListing.specs).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--background-alt)', borderRadius: '4px' }}>
                          <Text variant="small" color="secondary" style={{ fontFamily: 'monospace' }}>{key}</Text>
                          <Text variant="small" style={{ fontFamily: 'monospace' }}>{String(value)}</Text>
                        </div>
                      ))}
                    </div>
                  </>
                )} */}
              </div>
            )}
        </>
      )}

      {/* User Account Information */}
      {detailedListing?.user && (
        <div className={styles.userInfoSection}>
          <div className={styles.userInfoHeader}>
            <Text variant="h4" className={styles.userInfoTitle}>معلومات حساب المستخدم</Text>
            <div className={styles.userBadges}>
              {detailedListing.user.status === 'BANNED' ? (
                <Text variant="small" className={`${styles.statusBadge} ${styles.statusBanned}`}>
                  محظور
                </Text>
              ) : detailedListing.user.status === 'ACTIVE' ? (
                <Text variant="small" className={`${styles.statusBadge} ${styles.statusActive}`}>
                  نشط
                </Text>
              ) : (
                <Text variant="small" className={`${styles.statusBadge} ${styles.statusPending}`}>
                  في الانتظار
                </Text>
              )}
              {detailedListing.user.businessVerified && (
                <Text variant="small" className={`${styles.statusBadge} ${styles.businessVerifiedBadge}`}>
                  معتمد تجارياً
                </Text>
              )}
            </div>
          </div>

          <div className={styles.userDetailsGrid}>
            <div className={styles.userDetailItem}>
              <span className={styles.label}>الاسم</span>
              <span className={styles.value}>{detailedListing.user.name || 'غير محدد'}</span>
            </div>

            <div className={styles.userDetailItem}>
              <span className={styles.label}>البريد الإلكتروني</span>
              <span className={`${styles.value} ${styles.userEmail}`}>{detailedListing.user.email}</span>
            </div>

            <div className={styles.userDetailItem}>
              <span className={styles.label}>نوع الحساب</span>
              <span className={styles.value}>
                {detailedListing.user.accountType === 'INDIVIDUAL' ? 'شخصي' :
                  detailedListing.user.accountType === 'DEALER' ? 'معرض' : 'تجاري'}
              </span>
            </div>

            <div className={styles.userDetailItem}>
              <span className={styles.label}>الدور</span>
              <span className={styles.value}>{detailedListing.user.role}</span>
            </div>

            {detailedListing.user.companyName && (
              <div className={styles.userDetailItem}>
                <span className={styles.label}>اسم الشركة</span>
                <span className={styles.value}>{detailedListing.user.companyName}</span>
              </div>
            )}

            {detailedListing.user.phone && (
              <div className={styles.userDetailItem}>
                <span className={styles.label}>الهاتف الشخصي</span>
                <span className={styles.value}>{detailedListing.user.phone}</span>
              </div>
            )}

            {detailedListing.user.contactPhone && (
              <div className={styles.userDetailItem}>
                <span className={styles.label}>هاتف الاتصال</span>
                <span className={styles.value}>{detailedListing.user.contactPhone}</span>
              </div>
            )}

            {detailedListing.user.website && (
              <div className={styles.userDetailItem}>
                <span className={styles.label}>الموقع الإلكتروني</span>
                <a href={detailedListing.user.website} target="_blank" rel="noopener noreferrer" className={`${styles.value} ${styles.userWebsite}`}>
                  {detailedListing.user.website}
                </a>
              </div>
            )}

            <div className={styles.userDetailItem}>
              <span className={styles.label}>تاريخ التسجيل</span>
              <span className={styles.value}>{formatDate(detailedListing.user.createdAt)}</span>
            </div>
          </div>

          {/* User Actions */}
          <div className={styles.userActions}>
            {detailedListing.user.status !== 'BANNED' ? (
              <Button
                variant="danger"
                onClick={() => handleBlockUser(detailedListing.user!)}
                disabled={isSubmitting}
                className={styles.userActionButton}
              >
                حظر المستخدم
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={() => handleUnblockUser(detailedListing.user!)}
                disabled={isSubmitting}
                className={styles.userActionButton}
              >
                إلغاء الحظر
              </Button>
            )}
          </div>
        </div>
      )}

      <Form onSubmit={handleSubmit} error={error || undefined}>
        {/* Status Selection */}
        <Input
          type="select"
          label="حالة الإعلان الجديدة *"
          placeholder="اختر حالة الإعلان"
          options={statusOptions}
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          validate={createFieldValidator('status')}
          error={validationErrors.status}
        />

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

      {/* Block User Confirmation Modal */}
      <ConfirmBlockUserModal
        isVisible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        user={selectedUser}
        isBlocking={blockAction === 'block'}
        onSuccess={fetchListingDetails}
      />
    </Modal>
  );
};