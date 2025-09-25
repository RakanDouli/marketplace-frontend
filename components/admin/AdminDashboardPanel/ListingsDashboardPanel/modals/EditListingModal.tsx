'use client';

import React, { useState, useEffect } from 'react';
import { Button, Text, Modal, Loading } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { ImageGallery } from '@/components/slices/ImageGallery/ImageGallery';
import { Listing } from '@/types/listing';
import { validateListingStatusForm, createListingFieldValidator, type ListingFormData, type ValidationErrors } from '@/lib/admin/validation/listingValidation';
import { useAdminListingsStore } from '@/stores/admin/adminListingsStore';
import { ConfirmBlockUserModal } from './ConfirmBlockUserModal';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const { getListingById } = useAdminListingsStore();

  // Block user confirmation modal state
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch detailed listing data from backend
  useEffect(() => {
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

    fetchListingDetails();
  }, [listing.id, getListingById]);

  // Create field validator for real-time validation
  const createFieldValidator = (field: keyof ListingFormData) => {
    return createListingFieldValidator(field);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    } catch (error) {
      console.error('Save error:', error);
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

  // Status options with Arabic labels
  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'pending_approval', label: 'في انتظار الموافقة' },
    { value: 'active', label: 'نشط' },
    { value: 'hidden', label: 'مخفي' },
    { value: 'sold', label: 'مباع' },
    { value: 'sold_via_platform', label: 'مباع عبر المنصة' },
  ];

  // Get current status label
  const getCurrentStatusLabel = () => {
    const currentStatus = statusOptions.find(option => option.value === listing.status);
    return currentStatus ? currentStatus.label : listing.status;
  };

  // Format price
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SY');
  };

  return (
    <Modal isVisible onClose={onClose} title="تعديل الإعلان" maxWidth="lg">
      {loadingDetails ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
          <Loading />
          <Text variant="paragraph" style={{ marginRight: '1rem' }}>جاري تحميل تفاصيل الإعلان...</Text>
        </div>
      ) : detailedListing && (
        <>
          {/* Listing Header */}
          <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Text variant="h3" style={{ marginBottom: '8px' }}>{detailedListing.title}</Text>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text variant="h4" color="primary">{formatPrice(detailedListing.priceMinor)}</Text>
              <Text variant="paragraph" color="secondary">
                الحالة الحالية: <Text as="span" color="primary">{getCurrentStatusLabel()}</Text>
              </Text>
              <Text variant="small" color="secondary">
                تاريخ الإنشاء: {formatDate(detailedListing.createdAt)}
              </Text>
              {detailedListing.updatedAt !== detailedListing.createdAt && (
                <Text variant="small" color="secondary">
                  آخر تحديث: {formatDate(detailedListing.updatedAt)}
                </Text>
              )}
            </div>
          </div>

          {/* User Account Information */}
          {detailedListing.user && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Text variant="h4">معلومات حساب المستخدم</Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {detailedListing.user.status === 'BANNED' ? (
                    <Text variant="small" style={{ padding: '4px 8px', background: 'var(--error-alpha)', borderRadius: '4px', color: 'var(--error)' }}>
                      محظور
                    </Text>
                  ) : detailedListing.user.status === 'ACTIVE' ? (
                    <Text variant="small" style={{ padding: '4px 8px', background: 'var(--success-alpha)', borderRadius: '4px', color: 'var(--success)' }}>
                      نشط
                    </Text>
                  ) : (
                    <Text variant="small" style={{ padding: '4px 8px', background: 'var(--warning-alpha)', borderRadius: '4px', color: 'var(--warning)' }}>
                      في الانتظار
                    </Text>
                  )}
                  {detailedListing.user.businessVerified && (
                    <Text variant="small" style={{ padding: '4px 8px', background: 'var(--primary-alpha)', borderRadius: '4px', color: 'var(--primary)' }}>
                      معتمد تجارياً
                    </Text>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <Text variant="small" color="secondary">الاسم</Text>
                  <Text variant="paragraph">{detailedListing.user.name || 'غير محدد'}</Text>
                </div>

                <div>
                  <Text variant="small" color="secondary">البريد الإلكتروني</Text>
                  <Text variant="paragraph" style={{ fontSize: '12px', fontFamily: 'monospace' }}>{detailedListing.user.email}</Text>
                </div>

                <div>
                  <Text variant="small" color="secondary">نوع الحساب</Text>
                  <Text variant="paragraph">
                    {detailedListing.user.accountType === 'INDIVIDUAL' ? 'شخصي' :
                     detailedListing.user.accountType === 'DEALER' ? 'معرض' : 'تجاري'}
                  </Text>
                </div>

                <div>
                  <Text variant="small" color="secondary">الدور</Text>
                  <Text variant="paragraph">{detailedListing.user.role}</Text>
                </div>

                {detailedListing.user.companyName && (
                  <div>
                    <Text variant="small" color="secondary">اسم الشركة</Text>
                    <Text variant="paragraph">{detailedListing.user.companyName}</Text>
                  </div>
                )}

                {detailedListing.user.phone && (
                  <div>
                    <Text variant="small" color="secondary">الهاتف الشخصي</Text>
                    <Text variant="paragraph">{detailedListing.user.phone}</Text>
                  </div>
                )}

                {detailedListing.user.contactPhone && (
                  <div>
                    <Text variant="small" color="secondary">هاتف الاتصال</Text>
                    <Text variant="paragraph">{detailedListing.user.contactPhone}</Text>
                  </div>
                )}

                {detailedListing.user.website && (
                  <div>
                    <Text variant="small" color="secondary">الموقع الإلكتروني</Text>
                    <Text variant="paragraph">
                      <a href={detailedListing.user.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                        {detailedListing.user.website}
                      </a>
                    </Text>
                  </div>
                )}

                <div>
                  <Text variant="small" color="secondary">تاريخ التسجيل</Text>
                  <Text variant="paragraph">{formatDate(detailedListing.user.createdAt)}</Text>
                </div>
              </div>

              {/* User Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                {detailedListing.user.status !== 'BANNED' ? (
                  <Button
                    variant="danger"
                    onClick={() => handleBlockUser(detailedListing.user!)}
                    disabled={isSubmitting}
                    style={{ fontSize: '14px' }}
                  >
                    حظر المستخدم
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={() => handleUnblockUser(detailedListing.user!)}
                    disabled={isSubmitting}
                    style={{ fontSize: '14px' }}
                  >
                    إلغاء الحظر
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Category and Location */}
          <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface)', borderRadius: '8px' }}>
            <Text variant="h4" style={{ marginBottom: '8px' }}>معلومات التصنيف والموقع</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <Text variant="small" color="secondary">معرف الفئة</Text>
                <Text variant="paragraph" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{detailedListing.categoryId}</Text>
              </div>
              {detailedListing.province && (
                <div>
                  <Text variant="small" color="secondary">المحافظة</Text>
                  <Text variant="paragraph">{detailedListing.province}</Text>
                </div>
              )}
              {detailedListing.city && (
                <div>
                  <Text variant="small" color="secondary">المدينة</Text>
                  <Text variant="paragraph">{detailedListing.city}</Text>
                </div>
              )}
              {detailedListing.area && (
                <div>
                  <Text variant="small" color="secondary">المنطقة</Text>
                  <Text variant="paragraph">{detailedListing.area}</Text>
                </div>
              )}
            </div>
            {detailedListing.locationLink && (
              <div style={{ marginTop: '12px' }}>
                <Text variant="small" color="secondary">رابط الموقع</Text>
                <Text variant="paragraph" style={{ wordBreak: 'break-all' }}>
                  <a href={detailedListing.locationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                    عرض على الخريطة
                  </a>
                </Text>
              </div>
            )}
          </div>

          {/* Bidding Information */}
          {detailedListing.allowBidding && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--success-alpha)', borderRadius: '8px', border: '1px solid var(--success)' }}>
              <Text variant="h4" style={{ marginBottom: '8px' }}>معلومات المزادات</Text>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text variant="paragraph">
                  <strong>المزايدة متاحة:</strong> نعم
                </Text>
                {detailedListing.biddingStartPrice && (
                  <Text variant="paragraph">
                    <strong>سعر البداية:</strong> {formatPrice(detailedListing.biddingStartPrice)}
                  </Text>
                )}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {detailedListing.images && detailedListing.images.length > 0 ? (
            <div style={{ marginBottom: '24px' }}>
              <Text variant="h4" style={{ marginBottom: '12px' }}>صور الإعلان ({detailedListing.images.length})</Text>
              <ImageGallery
                images={detailedListing.images.map(img => img.url)}
                alt={detailedListing.title}
                viewMode="detail"
              />
            </div>
          ) : (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface)', borderRadius: '8px' }}>
              <Text variant="h4" style={{ marginBottom: '8px' }}>صور الإعلان</Text>
              <Text variant="paragraph" color="secondary">لا توجد صور متاحة لهذا الإعلان</Text>
            </div>
          )}

          {/* Description */}
          {detailedListing.description && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface)', borderRadius: '8px' }}>
              <Text variant="h4" style={{ marginBottom: '8px' }}>الوصف</Text>
              <Text variant="paragraph" style={{ lineHeight: 1.6 }}>{detailedListing.description}</Text>
            </div>
          )}

          {/* Specifications */}
          {((detailedListing.specsDisplay && Object.keys(detailedListing.specsDisplay).length > 0) ||
            (detailedListing.specs && Object.keys(detailedListing.specs).length > 0)) && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface)', borderRadius: '8px' }}>
              <Text variant="h4" style={{ marginBottom: '12px' }}>المواصفات والمعلومات التقنية</Text>

              {/* Display specs (Arabic, user-friendly) */}
              {detailedListing.specsDisplay && Object.keys(detailedListing.specsDisplay).length > 0 && (
                <>
                  <Text variant="paragraph" style={{ marginBottom: '8px', fontWeight: 500 }}>المواصفات (للعرض)</Text>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    {Object.entries(detailedListing.specsDisplay).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--background)', borderRadius: '4px' }}>
                        <Text variant="small" color="secondary">{key}</Text>
                        <Text variant="small">{String(value)}</Text>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Raw specs (English keys, backend data) */}
              {detailedListing.specs && Object.keys(detailedListing.specs).length > 0 && (
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
              )}
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmit}>
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

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border)', marginTop: '24px' }}>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
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

      {/* Block User Confirmation Modal */}
      <ConfirmBlockUserModal
        isVisible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        user={selectedUser}
        isBlocking={blockAction === 'block'}
      />
    </Modal>
  );
};