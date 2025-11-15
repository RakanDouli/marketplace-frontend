'use client';
import { formatDateShort } from '@/utils/formatDate';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Input, ImageUploadGrid, Text, SubmitButton, Loading } from '@/components/slices';
import type { Listing } from '@/types/listing';
import type { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';
import { useUserListingsStore } from '@/stores/userListingsStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { LISTING_STATUS_LABELS, REJECTION_REASON_LABELS, mapToOptions, getLabel } from '@/constants/metadata-labels';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { uploadMultipleToCloudflare } from '@/utils/cloudflare-upload';
import {
  validateListingForm,
  validateAttribute,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/validation/listingValidation';
import styles from './EditListingModal.module.scss';

interface EditListingModalProps {
  listing: Listing;
  onClose: () => void;
  onSave: (updatedData: Partial<Listing>) => Promise<void>;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Model {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Attribute {
  id: string;
  key: string;
  name: string;
  type: string;
  validation: string;
  storageType: string;
  columnName: string | null;
  options?: Array<{ key: string; value: string; sortOrder: number; isActive: boolean }>;
  maxSelections?: number;
  sortOrder: number;
  group: string;
  groupOrder: number;
}

// GraphQL Queries
const GET_BRANDS_QUERY = `
  query GetBrands($categoryId: String!) {
    brands(categoryId: $categoryId) {
      id
      name
      slug
      isActive
    }
  }
`;

const GET_MODELS_QUERY = `
  query GetModels($brandId: String!) {
    models(brandId: $brandId) {
      id
      name
      slug
      isActive
    }
  }
`;

const GET_ATTRIBUTES_QUERY = `
  query GetAttributesByCategory($categoryId: String!) {
    getAttributesByCategory(categoryId: $categoryId) {
      id
      key
      name
      type
      validation
      storageType
      columnName
      options { key value sortOrder isActive }
      sortOrder
      group
      groupOrder
    }
  }
`;

export function EditListingModal({ listing, onClose, onSave }: EditListingModalProps) {
  const { userPackage } = useUserAuthStore();
  const { listingStatuses, provinces } = useMetadataStore();
  const { addNotification } = useNotificationStore();
  const { loadMyListingById } = useUserListingsStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [imageOperationSuccess, setImageOperationSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Form state - Will be populated by loadData useEffect with fresh data from API
  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description || '',
    priceMinor: listing.priceMinor,
    status: listing.status,
    allowBidding: listing.allowBidding,
    biddingStartPrice: listing.biddingStartPrice || 0,
    videoUrl: listing.videoUrl || '',
    specs: listing.specs || {},
    location: listing.location || { province: '', city: '', area: '', link: '' },
  });

  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Load detailed listing data - runs every time modal opens
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Fetching fresh listing data for ID:', listing.id);
        // Force fresh fetch by bypassing cache (ttl: 0) to ensure we get latest data
        const response = await cachedGraphQLRequest(
          `query GetMyListingById($id: ID!) {
            myListingById(id: $id) {
              id title description priceMinor status allowBidding biddingStartPrice
              videoUrl imageKeys specs
              location { province city area link }
              category { id name slug }
              rejectionReason rejectionMessage
             moderationScore moderationFlags
              createdAt updatedAt
            }
          }`,
          { id: listing.id },
          { ttl: 0 } // Bypass cache to get fresh data
        );
        const data: Listing = (response as any).myListingById;
        setDetailedListing(data);

        // Debug: Log listing data
        console.log('📋 Detailed Listing Data:', {
          id: data.id,
          status: data.status,
          rejectionReason: data.rejectionReason,
          rejectionMessage: data.rejectionMessage,

        });

        // Parse specs from JSON string to object
        const parsedSpecs = data.specs
          ? (typeof data.specs === 'string' ? JSON.parse(data.specs) : data.specs)
          : {};

        // Update form data with detailed listing
        setFormData({
          title: data.title,
          description: data.description || '',
          priceMinor: data.priceMinor,
          status: data.status,
          allowBidding: data.allowBidding,
          biddingStartPrice: data.biddingStartPrice || 0,
          videoUrl: data.videoUrl || '',
          specs: parsedSpecs,
          location: data.location || { province: '', city: '', area: '', link: '' },
        });

        // Load images from imageKeys
        if (data.imageKeys && data.imageKeys.length > 0) {
          const existingImages: ImageItem[] = data.imageKeys.map((key: string) => ({
            id: key,
            url: optimizeListingImage(key, 'public'),
          }));
          setImages(existingImages);
        }
      } catch (error) {
        console.error('Error loading listing:', error);
        addNotification({
          type: 'error',
          title: 'خطأ',
          message: 'حدث خطأ في تحميل بيانات الإعلان',
          duration: 5000,
        });
      }
    };

    loadData();
  }, [listing]); // Re-run when listing object changes (not just ID)

  // Fetch provinces if not already loaded
  useEffect(() => {
    const metadataStore = useMetadataStore.getState();
    if (provinces.length === 0) {
      metadataStore.fetchLocationMetadata();
    }
  }, [provinces.length]);

  // Fetch attributes
  useEffect(() => {
    const fetchAttributes = async () => {
      if (!listing.category?.id) return;

      try {
        const data = await cachedGraphQLRequest(GET_ATTRIBUTES_QUERY, {
          categoryId: listing.category.id,
        });
        setAttributes((data as any).getAttributesByCategory || []);
      } catch (error) {
        console.error('Error fetching attributes:', error);
      }
    };

    if (listing.category?.id) {
      fetchAttributes();
    }
  }, [listing.category?.id]);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      if (!listing.category?.id) return;

      setIsLoadingBrands(true);
      try {
        // Force fresh fetch - use 0 TTL to bypass cache
        const data = await cachedGraphQLRequest(GET_BRANDS_QUERY, {
          categoryId: listing.category.id,
        }, { ttl: 0 });
        setBrands((data as any).brands || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    if (listing.category?.id) {
      fetchBrands();
    }
  }, [listing.category?.id]);

  // Fetch models when brand is selected
  useEffect(() => {
    const fetchModels = async () => {
      const brandId = formData.specs.brandId;
      if (!brandId || brandId.startsWith('temp_')) return;

      setIsLoadingModels(true);
      try {
        const data = await cachedGraphQLRequest(GET_MODELS_QUERY, { brandId });
        setModels((data as any).models || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    if (formData.specs.brandId) {
      fetchModels();
    }
  }, [formData.specs.brandId]);

  // Handle creating a new brand - EXACTLY like create page
  const handleCreateBrand = (brandName: string) => {
    const tempBrand: Brand = {
      id: `temp_${brandName}`,
      name: brandName,
      slug: brandName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };

    setBrands(prev => [...prev, tempBrand]);

    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        brandId: tempBrand.id,
        _brandName: brandName,
        modelId: '',
      },
    }));
  };

  // Handle creating a new model - EXACTLY like create page
  const handleCreateModel = (modelName: string) => {
    const tempModel: Model = {
      id: `temp_${modelName}`,
      name: modelName,
      slug: modelName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };

    setModels(prev => [...prev, tempModel]);

    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        modelId: tempModel.id,
        _modelName: modelName,
      },
    }));
  };

  const handleImageAdd = async (newImages: ImageItem[]) => {
    const addedImages = newImages.filter(img => img.file && !images.find(i => i.id === img.id));

    if (addedImages.length === 0) {
      setImages(newImages);
      return;
    }

    // Check subscription limits
    if (images.length + addedImages.length > maxImagesAllowed) {
      addNotification({
        type: 'error',
        title: 'تجاوز الحد المسموح',
        message: `الحد الأقصى للصور هو ${maxImagesAllowed} صور حسب اشتراكك`,
        duration: 5000,
      });
      return;
    }

    setIsUploadingImage(true);
    setImageOperationSuccess(false);

    try {
      // Upload new images using unified utility
      const filesToUpload = addedImages
        .filter(img => img.file)
        .map(img => img.file!);

      const uploadedImageKeys = await uploadMultipleToCloudflare(filesToUpload, 'image');

      // Update listing images immediately
      const allImageKeys = [...images.map(img => img.id), ...uploadedImageKeys];

      await cachedGraphQLRequest(
        `mutation UpdateListingImages($id: ID!, $imageKeys: [String!]!) {
          updateMyListing(id: $id, input: { imageKeys: $imageKeys }) {
            id
          }
        }`,
        { id: listing.id, imageKeys: allImageKeys }
      );

      // Update local state - keep blob URLs temporarily, then update to Cloudflare URLs after a delay
      const newImagesWithBlobUrls: ImageItem[] = addedImages.map((img, index) => ({
        id: uploadedImageKeys[index],
        url: img.url, // Keep blob URL temporarily
        file: img.file,
      }));

      setImages(prev => [...prev, ...newImagesWithBlobUrls]);

      // After 2 seconds, replace blob URLs with Cloudflare URLs (gives time for processing)
      setTimeout(() => {
        setImages(prevImages =>
          prevImages.map(img => {
            if (uploadedImageKeys.includes(img.id) && img.url.startsWith('blob:')) {
              return {
                ...img,
                url: optimizeListingImage(img.id, 'public'),
                file: undefined, // Remove file reference
              };
            }
            return img;
          })
        );
      }, 2000);

      // Show success message inline
      setImageOperationSuccess(true);
      setTimeout(() => setImageOperationSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading images:', error);
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ في رفع الصور',
        duration: 5000,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageDelete = async (newImages: ImageItem[]) => {
    const deletedImages = images.filter(img => !newImages.find(i => i.id === img.id));

    if (deletedImages.length === 0) {
      setImages(newImages);
      return;
    }

    setIsDeletingImage(true);
    setImageOperationSuccess(false);

    try {
      // Update listing images immediately
      const remainingImageKeys = newImages.map(img => img.id);

      await cachedGraphQLRequest(
        `mutation UpdateListingImages($id: ID!, $imageKeys: [String!]!) {
          updateMyListing(id: $id, input: { imageKeys: $imageKeys }) {
            id
          }
        }`,
        { id: listing.id, imageKeys: remainingImageKeys }
      );

      setImages(newImages);

      // Show success message inline
      setImageOperationSuccess(true);
      setTimeout(() => setImageOperationSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting image:', error);
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ في حذف الصورة',
        duration: 5000,
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. Validate basic fields using Zod (from listingValidation.ts)
    const validationErrors = validateListingForm({
      ...formData,
      images, // Pass images array for validation
      location: {
        province: formData.location.province || '',
        city: formData.location.city,
        area: formData.location.area,
        link: formData.location.link,
      },
    } as any);

    // Convert ValidationErrors object to string array
    Object.entries(validationErrors).forEach(([field, message]) => {
      if (message) errors.push(message);
    });

    // 2. Validate dynamic attributes (same as create listing page)
    attributes.forEach(attr => {
      // Skip column-based attributes (like title, price, accountType)
      if (attr.storageType === 'column') return;

      // Skip location-based attributes (handled by Zod)
      if (attr.storageType === 'location') return;

      const value = formData.specs[attr.key];

      // DEBUG: Log attribute validation details
      console.log(`🔍 Validating attribute "${attr.name}" (${attr.key}):`, {
        type: attr.type,
        validation: attr.validation,
        value: value,
        valueType: typeof value,
      });

      const attrError = validateAttribute(value, {
        key: attr.key,
        name: attr.name,
        validation: attr.validation as "REQUIRED" | "OPTIONAL",
        type: attr.type,
        maxSelections: attr.maxSelections,
      });

      if (attrError) {
        console.log(`❌ Attribute validation failed for "${attr.name}":`, attrError);
        errors.push(attrError);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(false);
    setSubmitSuccess(false);

    // DEBUG: Log form data before validation
    console.log('📝 EditListingModal - Form data before validation:', {
      allowBidding: formData.allowBidding,
      biddingStartPrice: formData.biddingStartPrice,
      title: formData.title,
      priceMinor: formData.priceMinor,
    });

    // Validate form
    const validation = validateForm();

    // DEBUG: Log validation result
    console.log('✅ Validation result:', validation);

    if (!validation.isValid) {
      console.log('❌ Validation failed, errors:', validation.errors);
      addNotification({
        type: 'error',
        title: 'خطأ في التحقق',
        message: `يرجى ملء جميع الحقول المطلوبة:\n${validation.errors.join('\n')}`,
        duration: 5000,
      });
      setSubmitError(true);
      setIsSubmitting(false);
      return; // Stop submission
    }

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        priceMinor: formData.priceMinor,
        status: formData.status,
        allowBidding: formData.allowBidding,
        videoUrl: formData.videoUrl || undefined,
        location: formData.location,
      };

      // Only include biddingStartPrice if bidding is allowed (0 is valid)
      if (formData.allowBidding && formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null) {
        updateData.biddingStartPrice = formData.biddingStartPrice;
      }

      await onSave(updateData);
      setSubmitSuccess(true);

      // Close modal immediately (parent will show success toast)
      onClose();
    } catch (error) {
      console.error('Error updating listing:', error);
      setSubmitError(true);
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ في تحديث الإعلان',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render form until we have fresh data
  if (!detailedListing) {
    return (
      <Modal isVisible={true} onClose={onClose} title="تعديل الإعلان" maxWidth="xl">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loading />
          <Text variant="paragraph" style={{ marginTop: '16px' }}>جاري تحميل بيانات الإعلان...</Text>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isVisible={true} onClose={onClose} title="تعديل الإعلان" maxWidth="xl">
      <form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.modalContent}>
          {/* Rejection Alert - Show if listing is DRAFT with rejection reason */}
          {detailedListing.status?.toLowerCase() === 'draft' &&
            (detailedListing.rejectionReason || detailedListing.rejectionMessage) && (
              <div className={styles.rejectionAlert}>
                <div className={styles.rejectionHeader}>
                  <Text variant="h4" className={styles.rejectionTitle}>
                    تم رفض إعلانك
                  </Text>
                </div>
                {detailedListing.rejectionReason && (
                  <div className={styles.rejectionReason}>
                    <Text variant="small" className={styles.rejectionLabel}>
                      السبب:{' '}
                    </Text>
                    <Text variant="paragraph" className={styles.rejectionValue}>
                      {getLabel(detailedListing.rejectionReason, REJECTION_REASON_LABELS)}
                    </Text>
                  </div>
                )}
                {detailedListing.rejectionMessage && (
                  <div className={styles.rejectionMessage}>
                    <Text variant="small" className={styles.rejectionLabel}>
                      رسالة:{' '}
                    </Text>
                    <Text variant="paragraph" className={styles.rejectionMessageText}>
                      {detailedListing.rejectionMessage}
                    </Text>
                  </div>
                )}
                <Text variant="small" className={styles.rejectionHint}>
                  يرجى تعديل إعلانك وفقاً للملاحظات أعلاه
                </Text>
              </div>
            )}

          {/* Listing Info Card */}
          {detailedListing && (
            <div className={styles.infoCard}>
              <Text variant="small" style={{ color: 'var(--text-secondary)' }}>
                الفئة: {detailedListing.category?.name || 'غير محدد'}
              </Text>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>تاريخ الإنشاء</span>
                  <span className={styles.value}>{formatDateShort(detailedListing.createdAt)}</span>
                </div>
                {detailedListing.updatedAt !== detailedListing.createdAt && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>آخر تحديث</span>
                    <span className={styles.value}>{formatDateShort(detailedListing.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Upload Grid */}
          <div className={styles.imagesSection}>
            <Text variant="h4" className={styles.specificationsTitle}>
              الصور ({images.length}/{maxImagesAllowed})
            </Text>
            <ImageUploadGrid
              images={images}
              onChange={(newImages) => {
                // Detect if images were added or removed
                if (newImages.length > images.length) {
                  handleImageAdd(newImages);
                } else if (newImages.length < images.length) {
                  handleImageDelete(newImages);
                } else {
                  setImages(newImages);
                }
              }}
              maxImages={maxImagesAllowed}
              disabled={isSubmitting || isUploadingImage}
            />
            {isUploadingImage && (
              <Text variant="small" style={{ marginTop: '8px', color: 'var(--primary)' }}>
                جاري رفع الصور...
              </Text>
            )}
            {isDeletingImage && (
              <Text variant="small" style={{ marginTop: '8px', color: 'var(--primary)' }}>
                جاري حذف الصورة...
              </Text>
            )}
            {imageOperationSuccess && (
              <Text variant="small" style={{ marginTop: '8px', color: 'var(--success)' }}>
                ✓ تم حفظ التغييرات بنجاح
              </Text>
            )}
          </div>

          {/* Video URL - Only for Business/Dealer accounts with videoAllowed */}
          {videoAllowed && (
            <div className={styles.videoSection}>
              <Input
                type="text"
                label="رابط الفيديو (اختياري)"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
              <Text variant="small" style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                يمكنك إضافة رابط فيديو من YouTube أو Vimeo لعرض إعلانك بشكل أفضل
              </Text>
            </div>
          )}

          {/* Basic Fields */}
          <div className={styles.editSection}>
            <Text variant="h4" className={styles.sectionTitle}>معلومات الإعلان</Text>

            <Input
              type="text"
              label="عنوان الإعلان *"
              placeholder="أدخل عنوان الإعلان"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Input
              type="textarea"
              label="الوصف"
              placeholder="أدخل وصف تفصيلي للإعلان"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
            />

            <Input
              type="price"
              label="السعر"
              value={formData.priceMinor}
              onChange={(e) => setFormData({ ...formData, priceMinor: parseInt(e.target.value) || 0 })}
              required
            />

            {/* Listing Status Actions - Simple UX */}
            <div className={styles.statusActions}>
              <Text variant="paragraph" weight="medium" className={styles.statusLabel}>
                إدارة الإعلان
              </Text>

              {formData.status === 'ACTIVE' && (
                <div className={styles.actionButtons}>
                  <Button
                    variant="secondary"
                    onClick={() => setFormData({ ...formData, status: 'HIDDEN' })}
                    type="button"
                  >
                    إيقاف الإعلان مؤقتاً
                  </Button>
                </div>
              )}

              {formData.status === 'HIDDEN' && (
                <div className={styles.actionButtons}>
                  <Button
                    variant="primary"
                    onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                    type="button"
                  >
                    اعاده تفعيل الاعلان
                  </Button>
                </div>
              )}

              {(formData.status === 'SOLD' || formData.status === 'SOLD_VIA_PLATFORM') && (
                <div className={styles.soldNotice}>
                  <Text variant="small" color="secondary">
                    ✅ هذا الإعلان تم بيعه
                  </Text>
                </div>
              )}

              {(formData.status === 'DRAFT' || formData.status === 'PENDING_APPROVAL') && (
                <div className={styles.systemStatus}>
                  <Text variant="small" color="secondary">
                    {formData.status === 'DRAFT'
                      ? '📝 هذا الإعلان في وضع المسودة'
                      : '⏳ هذا الإعلان قيد المراجعة'
                    }
                  </Text>
                </div>
              )}
            </div>

            <Input
              type="switch"
              label="السماح بالمزايدة"
              checked={formData.allowBidding}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, allowBidding: e.target.checked })}
            />

            {formData.allowBidding && (
              <Input
                type="number"
                label="سعر البداية للمزايدة"
                placeholder="0 = مجاني"
                value={formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null ? formData.biddingStartPrice / 100 : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setFormData({ ...formData, biddingStartPrice: value * 100 });
                }}
                min={0}
                step={1}
                helpText="0 = مزايدة مجانية من أي سعر، أو حدد سعر البداية"
              />
            )}
          </div>

          {/* Brand and Model Selection - EXACTLY like create page */}
          {brands.length > 0 && (
            <div className={styles.editSection}>
              <Text variant="h4" className={styles.sectionTitle}>العلامة التجارية والموديل</Text>

              <div className={styles.brandModelGrid}>
                <Input
                  type="select"
                  label="العلامة التجارية"
                  value={formData.specs.brandId || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      specs: { ...prev.specs, brandId: e.target.value, modelId: '' },
                    }));
                  }}
                  options={[
                    { value: '', label: '-- اختر العلامة التجارية --' },
                    ...brands
                      .filter(b => b.isActive)
                      .map(brand => ({
                        value: brand.id,
                        label: brand.name,
                      })),
                  ]}
                  disabled={isLoadingBrands}
                  searchable
                  creatable
                  isLoading={isLoadingBrands}
                  onCreateOption={handleCreateBrand}
                />

                {formData.specs.brandId && (
                  <Input
                    type="select"
                    label="الموديل"
                    value={formData.specs.modelId || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        specs: { ...prev.specs, modelId: e.target.value },
                      }));
                    }}
                    options={[
                      { value: '', label: '-- اختر الموديل --' },
                      ...models
                        .filter(m => m.isActive)
                        .map(model => ({
                          value: model.id,
                          label: model.name,
                        })),
                    ]}
                    disabled={isLoadingModels || !formData.specs.brandId || formData.specs.brandId.startsWith('temp_')}
                    searchable
                    creatable
                    isLoading={isLoadingModels}
                    onCreateOption={handleCreateModel}
                  />
                )}
              </div>
            </div>
          )}

          {/* Other Specifications - Grouped by attribute.group */}
          {(() => {
            // Group attributes by group field (like create page does)
            const groupedAttributes: Record<string, Attribute[]> = {};

            // Filter out non-spec attributes - SAME as create listing store does (line 194)
            // These are global fields, not category-specific attributes
            const excludedKeys = ['search', 'title', 'description', 'price', 'province', 'city', 'area', 'accountType', 'location', 'brandId', 'modelId'];

            attributes
              .filter(attr => !excludedKeys.includes(attr.key))
              .forEach(attr => {
                const groupName = attr.group || 'المواصفات';
                if (!groupedAttributes[groupName]) {
                  groupedAttributes[groupName] = [];
                }
                groupedAttributes[groupName].push(attr);
              });

            // Sort groups by groupOrder
            const sortedGroups = Object.entries(groupedAttributes).sort((a, b) => {
              const aOrder = a[1][0]?.groupOrder || 0;
              const bOrder = b[1][0]?.groupOrder || 0;
              return aOrder - bOrder;
            });

            return sortedGroups.map(([groupName, groupAttrs]) => (
              <div key={groupName} className={styles.editSection}>
                <Text variant="h4" className={styles.sectionTitle}>{groupName}</Text>

                <div className={styles.specsGrid}>
                  {groupAttrs
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(attribute => (
                      <div key={attribute.key}>
                        {renderAttributeField({
                          attribute: attribute as any,
                          value: formData.specs[attribute.key],
                          onChange: (value) => {
                            setFormData(prev => ({
                              ...prev,
                              specs: {
                                ...prev.specs,
                                [attribute.key]: value,
                              },
                            }));
                          },
                        })}
                      </div>
                    ))}
                </div>
              </div>
            ));
          })()}

          {/* Location Section */}
          <div className={styles.editSection}>
            <Text variant="h4" className={styles.sectionTitle}>الموقع</Text>

            <Input
              type="select"
              label="المحافظة *"
              value={formData.location.province || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, province: e.target.value },
              }))}
              options={[
                { value: '', label: '-- اختر المحافظة --' },
                ...provinces.map(p => ({ value: p.nameAr, label: p.nameAr })),
              ]}
              required
            />

            <div className={styles.formRow}>
              <Input
                type="text"
                label="المدينة"
                placeholder="أدخل المدينة"
                value={formData.location.city || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, city: e.target.value },
                }))}
              />

              <Input
                type="text"
                label="المنطقة"
                placeholder="أدخل المنطقة"
                value={formData.location.area || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, area: e.target.value },
                }))}
              />
            </div>

            <Input
              type="text"
              label="رابط الموقع"
              placeholder="https://maps.google.com/..."
              value={formData.location.link || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, link: e.target.value },
              }))}
            />
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <SubmitButton
              type="submit"
              variant="primary"
              disabled={isUploadingImage}
              isLoading={isSubmitting}
              isSuccess={submitSuccess}
              isError={submitError}
            >
              حفظ التغييرات
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
