'use client';
import { formatDateShort } from '@/utils/formatDate';

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Input, ImageUploadGrid, Text, SubmitButton, Loading, FormSection, Form } from '@/components/slices';
import type { FormSectionStatus } from '@/components/slices';
import type { Listing } from '@/types/listing';
import type { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';
import { useUserListingsStore } from '@/stores/userListingsStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { LISTING_STATUS_LABELS, REJECTION_REASON_LABELS, mapToOptions, getLabel } from '@/constants/metadata-labels';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { ListingStatus } from '@/common/enums';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { uploadMultipleToCloudflare } from '@/utils/cloudflare-upload';
import {
  validateListingForm,
  validateAttribute,
  hasValidationErrors,
  ListingValidationConfig,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [video, setVideo] = useState<ImageItem[]>([]);
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
    specs: listing.specs || {},
    location: listing.location || { province: '', city: '', area: '', link: '' },
  });

  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Expanded sections state - matches create page order
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basicInfo: true,
    media: false,
    brandModel: false,
    location: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate section statuses and field counts - matches create page structure
  const sectionInfo = useMemo(() => {
    // Section 1: Basic info (title*, price*, description)
    const basicInfoRequired = 2; // title, price
    let basicInfoFilled = 0;
    if (formData.title.trim()) basicInfoFilled++;
    if (formData.priceMinor > 0) basicInfoFilled++;
    if (formData.description.trim()) basicInfoFilled++;
    const basicInfoTotal = 3;
    const basicInfoStatus: FormSectionStatus = basicInfoFilled >= basicInfoRequired ?
      (basicInfoFilled === basicInfoTotal ? 'complete' : 'required') : 'incomplete';

    // Section 2: Media (images* + video if allowed)
    const imagesRequired = 1;
    const imagesFilled = images.length >= imagesRequired;
    const videoFilled = video.length > 0;
    const mediaTotal = videoAllowed ? 2 : 1;
    const mediaFilled = (imagesFilled ? 1 : 0) + (videoFilled ? 1 : 0);
    const mediaStatus: FormSectionStatus = imagesFilled ?
      (mediaFilled === mediaTotal ? 'complete' : 'required') : 'incomplete';

    // Section 3: Brand/Model
    let brandModelFilled = 0;
    const brandModelTotal = brands.length > 0 ? 2 : 0;
    if (formData.specs.brandId) brandModelFilled++;
    if (formData.specs.modelId) brandModelFilled++;
    const brandModelStatus: FormSectionStatus = brandModelTotal === 0 ? 'complete' :
      brandModelFilled === brandModelTotal ? 'complete' : 'incomplete';

    // Section N (last): Location (province*, city, area)
    const locationRequired = 1; // province
    let locationFilled = 0;
    if (formData.location.province) locationFilled++;
    if (formData.location.city) locationFilled++;
    if (formData.location.area) locationFilled++;
    const locationTotal = 3; // match create page (no link in count)
    const locationStatus: FormSectionStatus = locationFilled >= locationRequired ?
      (locationFilled === locationTotal ? 'complete' : 'required') : 'incomplete';

    return {
      basicInfo: { status: basicInfoStatus, filled: basicInfoFilled, total: basicInfoTotal },
      media: { status: mediaStatus, filled: mediaFilled, total: mediaTotal },
      brandModel: { status: brandModelStatus, filled: brandModelFilled, total: brandModelTotal },
      location: { status: locationStatus, filled: locationFilled, total: locationTotal },
    };
  }, [images, video, formData, brands.length, videoAllowed]);

  // Calculate attribute groups and section numbers for consistency with create page
  const { attributeGroups, locationSectionNum } = useMemo(() => {
    // Group attributes by group field (like create page does)
    const groupedAttributes: Record<string, Attribute[]> = {};

    // Filter out non-spec attributes - SAME as create listing store does
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

    // Calculate base section number (after basicInfo, media, brandModel)
    // Order: 1=basicInfo, 2=media, 3=brandModel (if exists)
    const baseSectionNum = 2 + (brands.length > 0 ? 1 : 0);

    // Location is the last section
    const locationNum = baseSectionNum + sortedGroups.length + 1;

    return {
      attributeGroups: sortedGroups,
      locationSectionNum: locationNum,
    };
  }, [attributes, brands.length]);

  // Load detailed listing data - runs every time modal opens
  useEffect(() => {
    const loadData = async () => {
      try {
        // Force fresh fetch by bypassing cache (ttl: 0) to ensure we get latest data
        const response = await cachedGraphQLRequest(
          `query GetMyListingById($id: ID!) {
            myListingById(id: $id) {
              id title description priceMinor status allowBidding biddingStartPrice
              videoUrl imageKeys specs
              location { province city area link }
              category { id name nameAr slug }
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

        // Load video from videoUrl (R2 public URL)
        if (data.videoUrl) {
          setVideo([{
            id: data.videoUrl,
            url: data.videoUrl, // Use R2 URL directly
            isVideo: true, // Mark as video so ImageUploadGrid renders it correctly
          }]);
        } else {
          setVideo([]);
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
        // Silently fail - attributes are optional for editing
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
        // Silently fail - brands are optional
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
        // Silently fail - models are optional
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

  // Video upload/change handler
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleVideoChange = async (newVideo: ImageItem[]) => {
    // If video was deleted (empty array)
    if (newVideo.length === 0) {
      setVideo([]);
      return;
    }

    // Check if there's a new file to upload
    const newVideoItem = newVideo.find(v => v.file);
    if (!newVideoItem || !newVideoItem.file) {
      // No new file, just update state (e.g., existing video unchanged)
      setVideo(newVideo);
      return;
    }

    // Upload new video to R2
    setIsUploadingVideo(true);
    try {
      // Get auth token
      const authData = localStorage.getItem('user-auth-storage');
      if (!authData) throw new Error('يرجى تسجيل الدخول أولاً');
      const { state } = JSON.parse(authData);
      const token = state?.user?.token;
      if (!token) throw new Error('يرجى تسجيل الدخول أولاً');

      // Create FormData
      const formData = new FormData();
      formData.append('video', newVideoItem.file);

      // Upload to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.replace('/graphql', '')}/api/listings/upload-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'فشل رفع الفيديو');
      }

      const result = await response.json();
      if (!result.success || !result.videoUrl) {
        throw new Error('فشل رفع الفيديو');
      }

      // Update video state with the R2 URL
      setVideo([{
        id: result.videoUrl, // Use the R2 URL as ID (will be saved to DB)
        url: result.videoUrl,
        isVideo: true,
      }]);

      addNotification({
        type: 'success',
        title: 'تم رفع الفيديو',
        message: 'تم رفع الفيديو بنجاح',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في رفع الفيديو',
        message: error instanceof Error ? error.message : 'فشل رفع الفيديو',
        duration: 5000,
      });
      // Revert to previous state
      setVideo(video);
    } finally {
      setIsUploadingVideo(false);
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

      const attrError = validateAttribute(value, {
        key: attr.key,
        name: attr.name,
        validation: attr.validation as "REQUIRED" | "OPTIONAL",
        type: attr.type,
        maxSelections: attr.maxSelections,
      });

      if (attrError) {
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
    setErrorMessage(null); // Clear previous error

    // Validate form
    const validation = validateForm();

    if (!validation.isValid) {
      // Show error inside modal (not toast)
      setErrorMessage(`يرجى ملء جميع الحقول المطلوبة:\n${validation.errors.join('\n')}`);
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
        videoUrl: video.length > 0 ? video[0].id : null,
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
      setSubmitError(true);
      // Show error inside modal (not toast)
      const message = error instanceof Error ? error.message : 'حدث خطأ في تحديث الإعلان';
      setErrorMessage(message);
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
      <Form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.modalContent}>
          {/* Rejection Alert - Show if listing is DRAFT or REJECTED with rejection reason */}
          {(detailedListing.status === ListingStatus.DRAFT || detailedListing.status === ListingStatus.REJECTED) &&
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
                الفئة: {detailedListing.category?.nameAr || detailedListing.category?.name || 'غير محدد'}
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

          {/* Section 1: Basic Info - matches create page */}
          <FormSection
            number={1}
            title="معلومات الإعلان"
            status={sectionInfo.basicInfo.status}
            filledCount={sectionInfo.basicInfo.filled}
            totalCount={sectionInfo.basicInfo.total}
            isExpanded={expandedSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}
          >
            <Input
              type="text"
              label="عنوان الإعلان"
              placeholder="أدخل عنوان الإعلان"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={ListingValidationConfig.title.maxLength}
              required
            />

            <Input
              type="textarea"
              label="الوصف"
              placeholder="أدخل وصف تفصيلي للإعلان"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={ListingValidationConfig.description.maxLength}
              rows={5}
            />

            <div className={styles.formRow}>
              <Input
                type="price"
                label="السعر"
                value={formData.priceMinor}
                onChange={(e) => setFormData({ ...formData, priceMinor: parseInt(e.target.value) || 0 })}
                required
              />

              <Input
                type="switch"
                label="السماح بالمزايدة"
                checked={formData.allowBidding}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, allowBidding: e.target.checked })}
              />
            </div>

            {formData.allowBidding && (
              <Input
                type="number"
                label="سعر البداية للمزايدة (بالدولار)"
                placeholder="0 = مجاني"
                value={formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null ? formData.biddingStartPrice : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setFormData({ ...formData, biddingStartPrice: value });
                }}
                min={0}
                step={1}
                helpText="0 = مزايدة مجانية من أي سعر، أو حدد سعر البداية"
              />
            )}
          </FormSection>

          {/* Section 2: Media (Images + Video) - matches create page */}
          <FormSection
            number={2}
            title={videoAllowed ? 'الصور والفيديو' : 'الصور'}
            status={sectionInfo.media.status}
            filledCount={sectionInfo.media.filled}
            totalCount={sectionInfo.media.total}
            isExpanded={expandedSections.media}
            onToggle={() => toggleSection('media')}
          >
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
              maxSize={2 * 1024 * 1024} // 2MB per image
              accept="image/jpeg,image/png,image/webp,image/gif"
              label="الصور"
              onError={(error) => {
                addNotification({
                  type: 'error',
                  title: 'خطأ في رفع الصورة',
                  message: error,
                  duration: 5000,
                });
              }}
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
                تم حفظ التغييرات بنجاح
              </Text>
            )}

            {/* Video Upload - Only for Business/Dealer accounts with videoAllowed */}
            {videoAllowed && (
              <div className={styles.videoSection}>
                <Text variant="small" color="secondary" style={{ marginBottom: '8px' }}>
                  الفيديو (اختياري) - الحد الأقصى 20 ميجابايت (30-45 ثانية)
                </Text>
                <ImageUploadGrid
                  images={video}
                  onChange={handleVideoChange}
                  maxImages={1}
                  maxSize={20 * 1024 * 1024}
                  accept="video/*"
                  label="الفيديو"
                  onError={(error) => {
                    addNotification({
                      type: 'error',
                      title: 'خطأ في رفع الفيديو',
                      message: error,
                      duration: 5000,
                    });
                  }}
                  disabled={isSubmitting || isUploadingVideo}
                />
                {isUploadingVideo && (
                  <Text variant="small" style={{ marginTop: '8px', color: 'var(--primary)' }}>
                    جاري رفع الفيديو...
                  </Text>
                )}
              </div>
            )}
          </FormSection>

          {/* Section 3: Brand and Model Selection - matches create page */}
          {brands.length > 0 && (
            <FormSection
              number={3}
              title="العلامة التجارية والموديل"
              status={sectionInfo.brandModel.status}
              filledCount={sectionInfo.brandModel.filled}
              totalCount={sectionInfo.brandModel.total}
              isExpanded={expandedSections.brandModel}
              onToggle={() => toggleSection('brandModel')}
            >
              <div className={styles.formRow}>
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
            </FormSection>
          )}

          {/* Dynamic Attribute Sections - uses pre-calculated attributeGroups */}
          {attributeGroups.map(([groupName, groupAttrs], groupIndex) => {
            // Calculate filled count for this group
            const filledCount = groupAttrs.filter(attr => {
              const value = formData.specs[attr.key];
              return value !== undefined && value !== null && value !== '' &&
                !(Array.isArray(value) && value.length === 0);
            }).length;
            const totalCount = groupAttrs.length;
            const requiredCount = groupAttrs.filter(attr => attr.validation === 'REQUIRED').length;
            const requiredFilled = groupAttrs.filter(attr =>
              attr.validation === 'REQUIRED' && formData.specs[attr.key]
            ).length;

            const status: FormSectionStatus = filledCount === totalCount ? 'complete' :
              requiredFilled === requiredCount && requiredCount > 0 ? 'required' : 'incomplete';

            // Section number: 1=basicInfo, 2=media, 3=brandModel (if exists), then attributes
            const baseSectionNum = 2 + (brands.length > 0 ? 1 : 0);

            return (
              <FormSection
                key={groupName}
                number={baseSectionNum + groupIndex + 1}
                title={groupName}
                status={status}
                filledCount={filledCount}
                totalCount={totalCount}
                defaultExpanded={false}
              >
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
              </FormSection>
            );
          })}

          {/* Location Section */}
          <FormSection
            number={locationSectionNum}
            title="الموقع"
            status={sectionInfo.location.status}
            filledCount={sectionInfo.location.filled}
            totalCount={sectionInfo.location.total}
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
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
                ...provinces.map(p => ({ value: p.key, label: p.nameAr })),
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

            <div className={styles.locationLinkRow}>
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
              <Button
                type="button"
                variant="outline"
                className={styles.locationButton}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                        setFormData(prev => ({
                          ...prev,
                          location: { ...prev.location, link: mapsLink },
                        }));
                        addNotification({
                          type: 'success',
                          title: 'تم تحديد الموقع',
                          message: 'تم إضافة رابط موقعك الحالي',
                          duration: 3000,
                        });
                      },
                      (error) => {
                        addNotification({
                          type: 'error',
                          title: 'خطأ في تحديد الموقع',
                          message: error.code === 1
                            ? 'يرجى السماح بالوصول إلى الموقع من إعدادات المتصفح'
                            : 'تعذر تحديد الموقع، حاول مرة أخرى',
                          duration: 5000,
                        });
                      }
                    );
                  } else {
                    addNotification({
                      type: 'error',
                      title: 'غير مدعوم',
                      message: 'المتصفح لا يدعم تحديد الموقع الجغرافي',
                      duration: 5000,
                    });
                  }
                }}
              >
                موقعي الحالي
              </Button>
            </div>
          </FormSection>

          {/* Listing Status Management - Edit-only, outside form sections */}
          <div className={styles.statusActions}>
            <Text variant="paragraph" weight="medium" className={styles.statusLabel}>
              إدارة الإعلان
            </Text>

            {formData.status === ListingStatus.ACTIVE && (
              <div className={styles.actionButtons}>
                <Button
                  variant="secondary"
                  onClick={() => setFormData({ ...formData, status: ListingStatus.HIDDEN })}
                  type="button"
                >
                  إيقاف الإعلان مؤقتاً
                </Button>
              </div>
            )}

            {formData.status === ListingStatus.HIDDEN && (
              <div className={styles.actionButtons}>
                <Button
                  variant="primary"
                  onClick={() => setFormData({ ...formData, status: ListingStatus.ACTIVE })}
                  type="button"
                >
                  إعادة تفعيل الإعلان
                </Button>
              </div>
            )}

            {(formData.status === ListingStatus.SOLD || formData.status === ListingStatus.SOLD_VIA_PLATFORM) && (
              <div className={styles.soldNotice}>
                <Text variant="small" color="secondary">
                  هذا الإعلان تم بيعه
                </Text>
              </div>
            )}

            {(formData.status === ListingStatus.DRAFT || formData.status === ListingStatus.PENDING_APPROVAL || formData.status === ListingStatus.REJECTED) && (
              <div className={styles.systemStatus}>
                <Text variant="small" color="secondary">
                  {formData.status === ListingStatus.DRAFT
                    ? 'هذا الإعلان في وضع المسودة'
                    : formData.status === ListingStatus.REJECTED
                      ? 'هذا الإعلان مرفوض - يرجى التعديل وإعادة النشر'
                      : 'هذا الإعلان قيد المراجعة'
                  }
                </Text>
              </div>
            )}
          </div>

          {/* Error message - displayed above buttons */}
          {errorMessage && (
            <div className={styles.formError}>
              <Text variant="small" color="error">
                {errorMessage}
              </Text>
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
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
      </Form>
    </Modal>
  );
}
