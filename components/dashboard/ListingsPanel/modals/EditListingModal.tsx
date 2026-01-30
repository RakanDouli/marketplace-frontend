'use client';
import { formatDateShort } from '@/utils/formatDate';

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Input, ImageUploadGrid, Text, SubmitButton, Loading, FormSection, Form, CarInspection, toBackendFormat, fromBackendFormat } from '@/components/slices';
import type { DamageReport } from '@/components/slices';
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
import { uploadToCloudflareWithProgress, uploadVideoToR2 } from '@/utils/cloudflare-upload';
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

interface Variant {
  id: string;
  modelId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface AttributeConfig {
  expectedValue?: 'string' | 'number' | 'date' | 'array' | 'boolean';
  dateFormat?: 'year' | 'month' | 'day' | 'full';
  maxLength?: number;
  maxSelections?: number;
  dataSource?: string;
  min?: number;
  max?: number;
}

interface AttributeOption {
  key: string;
  value: string;
  sortOrder: number;
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
  options: AttributeOption[];
  config: AttributeConfig | null;
  sortOrder: number;
  group: string;
  groupOrder: number;
}

interface AttributeGroup {
  name: string;
  groupOrder: number;
  attributes: Attribute[];
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

const GET_VARIANTS_BY_BRAND_QUERY = `
  query GetVariantsByBrand($brandId: String!) {
    variantsByBrand(brandId: $brandId) {
      id
      modelId
      name
      slug
      isActive
    }
  }
`;

// variantId is optional - when provided, uses variant name for CarAPI lookup
const GET_MODEL_SUGGESTION_QUERY = `
  query GetModelSuggestion($brandId: String!, $modelId: String!, $year: Int, $variantId: String) {
    getModelSuggestion(brandId: $brandId, modelId: $modelId, year: $year, variantId: $variantId) {
      id
      brandId
      modelId
      year
      specs
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
      config
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
  const { updateListingImages, updateListingVideoUrl } = useUserListingsStore();

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
  const [pendingImages, setPendingImages] = useState<ImageItem[]>([]); // Images being uploaded
  const [pendingVideo, setPendingVideo] = useState<ImageItem | null>(null); // Video being uploaded
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [showCarDamage, setShowCarDamage] = useState(false);

  // Model suggestion specs - used to filter dropdown options (like create page)
  const [suggestionSpecs, setSuggestionSpecs] = useState<{
    fuel_type?: string[];
    transmission?: string[];
    body_type?: string[];
    engine_size?: string[];
    cylinders?: string[];
    seats?: number[];
    doors?: number[];
    drive_type?: string[];
  } | null>(null);

  // Form state - Will be populated by loadData useEffect with fresh data from API
  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description || '',
    priceMinor: listing.priceMinor,
    status: listing.status,
    allowBidding: listing.allowBidding,
    biddingStartPrice: listing.biddingStartPrice || 0,
    listingType: '',
    condition: '',
    specs: listing.specs || {},
    location: listing.location || { province: '', city: '', area: '', link: '' },
  });

  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Find brand, model, and variant attributes
  const brandAttribute = attributes.find(attr => attr.key === 'brandId');
  const modelAttribute = attributes.find(attr => attr.key === 'modelId');
  const variantAttribute = attributes.find(attr => attr.key === 'variantId');

  // Find column-stored global attributes (like create page)
  const listingTypeAttribute = attributes.find(attr => attr.key === 'listingType');
  const conditionAttribute = attributes.find(attr => attr.key === 'condition');

  // Group attributes by group field (like create page store does)
  const attributeGroups: AttributeGroup[] = useMemo(() => {
    // Filter out non-spec attributes
    const excludedKeys = ['search', 'title', 'description', 'price', 'province', 'city', 'area', 'accountType', 'location', 'listingType', 'condition', 'car_damage'];

    const groupsMap = new Map<string, Attribute[]>();

    attributes
      .filter(attr => !excludedKeys.includes(attr.key))
      .forEach(attr => {
        const groupName = attr.group || 'other';
        if (!groupsMap.has(groupName)) {
          groupsMap.set(groupName, []);
        }
        groupsMap.get(groupName)!.push(attr);
      });

    // Convert to array and sort by groupOrder
    const groups: AttributeGroup[] = [];
    groupsMap.forEach((attrs, name) => {
      // Skip "other" group (attributes without group won't render - as per admin instructions)
      if (attrs.length && name !== 'other') {
        groups.push({
          name,
          groupOrder: attrs[0]?.groupOrder || 0,
          attributes: attrs.sort((a, b) => a.sortOrder - b.sortOrder),
        });
      }
    });

    return groups.sort((a, b) => a.groupOrder - b.groupOrder);
  }, [attributes]);

  // Separate "اختر السيارة" group from other dynamic groups (like create page)
  const firstGroup = attributeGroups.find(g => g.name === 'اختر السيارة');
  const otherGroups = attributeGroups.filter(g => g.name !== 'اختر السيارة');

  // Section status info with counts (matching create page logic)
  const sectionInfo = useMemo(() => {
    const getStatus = (requiredFilled: boolean, allFilled: boolean): FormSectionStatus => {
      if (!requiredFilled) return 'incomplete';
      if (allFilled) return 'complete';
      return 'required';
    };

    // Basic Info
    const titleFilled = !!formData.title.trim();
    const descriptionFilled = !!formData.description.trim();
    const priceFilled = formData.priceMinor > 0;
    const listingTypeRequired = listingTypeAttribute?.validation === 'REQUIRED';
    const conditionRequired = conditionAttribute?.validation === 'REQUIRED';
    const listingTypeFilled = !!formData.listingType;
    const conditionFilled = !!formData.condition;

    let basicInfoTotal = 3; // title, description, price
    let basicInfoFilled = 0;
    if (titleFilled) basicInfoFilled++;
    if (descriptionFilled) basicInfoFilled++;
    if (priceFilled) basicInfoFilled++;
    if (listingTypeAttribute) {
      basicInfoTotal++;
      if (listingTypeFilled) basicInfoFilled++;
    }
    if (conditionAttribute) {
      basicInfoTotal++;
      if (conditionFilled) basicInfoFilled++;
    }

    const basicInfoRequiredOk = titleFilled && priceFilled &&
      (!listingTypeRequired || listingTypeFilled) &&
      (!conditionRequired || conditionFilled);
    const basicInfoAllFilled = basicInfoFilled === basicInfoTotal;

    // Media
    const imagesOk = images.length >= 1;
    const mediaTotal = videoAllowed ? 2 : 1;
    let mediaFilled = 0;
    if (images.length > 0) mediaFilled++;
    if (videoAllowed && video.length > 0) mediaFilled++;
    const mediaAllFilled = mediaFilled === mediaTotal;

    // Location
    const provinceFilled = !!formData.location.province;
    const locationTotal = 4;
    const locationFilled = +provinceFilled + +!!formData.location.city + +!!formData.location.area + +!!formData.location.link;
    const locationAllFilled = locationFilled === locationTotal;

    // Dynamic attribute groups
    const brandRequired = brandAttribute?.validation === 'REQUIRED';
    const modelRequired = modelAttribute?.validation === 'REQUIRED';
    const brandFilled = !!formData.specs.brandId;
    const modelFilled = !!formData.specs.modelId;

    const attributeGroupsInfo: Record<string, { status: FormSectionStatus; filled: number; total: number }> = {};
    attributeGroups.forEach((group) => {
      let requiredFilled = true;
      let filledCount = 0;
      let totalCount = 0;

      group.attributes.forEach(attr => {
        if (attr.key === 'brandId') {
          if (brands.length > 0) {
            totalCount++;
            if (brandFilled) filledCount++;
            if (brandRequired && !brandFilled) requiredFilled = false;
          }
          return;
        }
        if (attr.key === 'modelId') {
          // Always count modelId in total (like create page fix)
          if (brands.length > 0) {
            totalCount++;
            if (brandFilled && modelFilled) filledCount++;
            if (modelRequired && brandFilled && !modelFilled) requiredFilled = false;
          }
          return;
        }

        totalCount++;
        const value = formData.specs[attr.key];
        const isFilled = value !== undefined && value !== null && value !== '' &&
          !(Array.isArray(value) && value.length === 0);
        if (isFilled) filledCount++;
        if (attr.validation === 'REQUIRED' && !isFilled) requiredFilled = false;
      });

      // Skip empty groups
      if (totalCount === 0) return;

      const allFilled = filledCount === totalCount;
      attributeGroupsInfo[group.name] = {
        status: getStatus(requiredFilled, allFilled),
        filled: filledCount,
        total: totalCount,
      };
    });

    return {
      basicInfo: { status: getStatus(basicInfoRequiredOk, basicInfoAllFilled), filled: basicInfoFilled, total: basicInfoTotal },
      media: { status: getStatus(imagesOk, mediaAllFilled), filled: mediaFilled, total: mediaTotal },
      location: { status: getStatus(provinceFilled, locationAllFilled), filled: locationFilled, total: locationTotal },
      ...attributeGroupsInfo,
    };
  }, [images, video, formData, brands.length, videoAllowed, attributeGroups, brandAttribute, modelAttribute, listingTypeAttribute, conditionAttribute]);

  // Load detailed listing data - runs every time modal opens
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await cachedGraphQLRequest(
          `query GetMyListingById($id: ID!) {
            myListingById(id: $id) {
              id title description priceMinor status allowBidding biddingStartPrice
              videoUrl imageKeys specs listingType condition
              location { province city area link }
              category { id name nameAr slug }
              rejectionReason rejectionMessage
              moderationScore moderationFlags
              createdAt updatedAt
            }
          }`,
          { id: listing.id },
          { ttl: 0 }
        );
        const data: Listing = (response as any).myListingById;
        setDetailedListing(data);

        const parsedSpecs = data.specs
          ? (typeof data.specs === 'string' ? JSON.parse(data.specs) : data.specs)
          : {};

        setFormData({
          title: data.title,
          description: data.description || '',
          priceMinor: data.priceMinor,
          status: data.status,
          allowBidding: data.allowBidding,
          biddingStartPrice: data.biddingStartPrice || 0,
          listingType: data.listingType || '',
          condition: data.condition || '',
          specs: parsedSpecs,
          location: data.location || { province: '', city: '', area: '', link: '' },
        });

        if (data.imageKeys && data.imageKeys.length > 0) {
          const existingImages: ImageItem[] = data.imageKeys.map((key: string) => ({
            id: key,
            url: optimizeListingImage(key, 'public'),
          }));
          setImages(existingImages);
        }

        if (data.videoUrl) {
          setVideo([{
            id: data.videoUrl,
            url: data.videoUrl,
            isVideo: true,
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
  }, [listing]);

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
        }, { ttl: 0 });
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

  // Fetch variants when brand is selected (for combined model/variant dropdown)
  useEffect(() => {
    const fetchVariants = async () => {
      const brandId = formData.specs.brandId;
      if (!brandId || brandId.startsWith('temp_')) return;

      setIsLoadingVariants(true);
      try {
        const data = await cachedGraphQLRequest(GET_VARIANTS_BY_BRAND_QUERY, { brandId });
        setVariants((data as any).variantsByBrand || []);
      } catch (error) {
        // Silently fail - variants are optional
      } finally {
        setIsLoadingVariants(false);
      }
    };

    if (formData.specs.brandId) {
      fetchVariants();
    } else {
      setVariants([]);
    }
  }, [formData.specs.brandId]);

  // Fetch model suggestions when brand + model + year are selected (like create page)
  useEffect(() => {
    const brandId = formData.specs.brandId;
    const modelId = formData.specs.modelId;
    const variantId = formData.specs.variantId;
    const year = formData.specs.year;

    if (!brandId || !modelId || brandId.startsWith('temp_') || modelId.startsWith('temp_')) {
      setSuggestionSpecs(null);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // Pass variantId to get variant-specific specs from CarAPI
        const data = await cachedGraphQLRequest(GET_MODEL_SUGGESTION_QUERY, {
          brandId,
          modelId,
          year: year ? parseInt(String(year)) : null,
          variantId: variantId || null,
        }, { ttl: 0 });

        const suggestion = (data as any).getModelSuggestion;
        if (suggestion?.specs) {
          setSuggestionSpecs(suggestion.specs);

          // Dynamic auto-fill: iterate over all keys from backend suggestion
          // Auto-fill any field that has exactly one option
          // Always overwrite since we clear fields when model changes (React batching causes stale state check to fail)
          Object.keys(suggestion.specs).forEach((field) => {
            const options = suggestion.specs[field];
            if (Array.isArray(options) && options.length === 1) {
              setFormData(prev => ({
                ...prev,
                // Convert to string for SELECTOR compatibility (validation expects string type)
                specs: { ...prev.specs, [field]: String(options[0]) },
              }));
            }
          });
        } else {
          setSuggestionSpecs(null);
        }
      } catch (error) {
        console.error('Error fetching model suggestions:', error);
        setSuggestionSpecs(null);
      }
    };

    fetchSuggestions();
  }, [formData.specs.brandId, formData.specs.modelId, formData.specs.variantId, formData.specs.year]);

  // Handle creating a new brand
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

  // Handle creating a new model
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

    if (images.length + addedImages.length > maxImagesAllowed) {
      addNotification({
        type: 'error',
        title: 'تجاوز الحد المسموح',
        message: `الحد الأقصى للصور هو ${maxImagesAllowed} صور حسب اشتراكك`,
        duration: 5000,
      });
      return;
    }

    // Add to pending images for upload progress display
    const pendingWithState = addedImages.map(img => ({ ...img, isUploading: true, uploadProgress: 0 }));
    setPendingImages(pendingWithState);
    setIsUploadingImage(true);
    setImageOperationSuccess(false);

    try {
      // Upload images one by one with progress tracking
      const uploadedImageKeys: string[] = [];
      for (let i = 0; i < addedImages.length; i++) {
        const img = addedImages[i];
        if (img.file) {
          const imageKey = await uploadToCloudflareWithProgress(img.file, 'image', (progress) => {
            // Update progress for this specific image
            setPendingImages(prev => prev.map((p, idx) =>
              idx === i ? { ...p, uploadProgress: progress } : p
            ));
          });
          uploadedImageKeys.push(imageKey);
        }
      }

      const allImageKeys = [...images.map(img => img.id), ...uploadedImageKeys];

      // Update listing with new image keys via store
      await updateListingImages(listing.id, allImageKeys);

      const newImagesWithBlobUrls: ImageItem[] = addedImages.map((img, index) => ({
        id: uploadedImageKeys[index],
        url: img.url,
        file: img.file,
      }));

      setImages(prev => [...prev, ...newImagesWithBlobUrls]);

      setTimeout(() => {
        setImages(prevImages =>
          prevImages.map(img => {
            if (uploadedImageKeys.includes(img.id) && img.url.startsWith('blob:')) {
              return {
                ...img,
                url: optimizeListingImage(img.id, 'public'),
                file: undefined,
              };
            }
            return img;
          })
        );
      }, 2000);

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
      setPendingImages([]);
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
      const remainingImageKeys = newImages.map(img => img.id);

      // Update listing with remaining image keys via store
      await updateListingImages(listing.id, remainingImageKeys);

      setImages(newImages);

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

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleVideoChange = async (newVideo: ImageItem[]) => {
    if (newVideo.length === 0) {
      setVideo([]);
      return;
    }

    const newVideoItem = newVideo.find(v => v.file);
    if (!newVideoItem || !newVideoItem.file) {
      setVideo(newVideo);
      return;
    }

    // Add pending video for upload progress display
    setPendingVideo({ ...newVideoItem, isUploading: true, isVideo: true, uploadProgress: 0 });
    setIsUploadingVideo(true);
    try {
      // Upload video using utility with progress tracking
      const videoUrl = await uploadVideoToR2(newVideoItem.file, (progress: number) => {
        setPendingVideo(prev => prev ? { ...prev, uploadProgress: progress } : null);
      });

      // Update listing with video URL via store
      await updateListingVideoUrl(listing.id, videoUrl);

      setVideo([{
        id: videoUrl,
        url: videoUrl,
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
      setVideo(video);
    } finally {
      setPendingVideo(null);
      setIsUploadingVideo(false);
    }
  };

  // Computed values for displaying images and videos with upload state
  const imagesWithUploadState = useMemo(() => [
    ...images.map(img => ({ ...img, isUploading: false })),
    ...pendingImages,
  ], [images, pendingImages]);

  const videoWithUploadState = useMemo(() => {
    if (pendingVideo) {
      return [pendingVideo];
    }
    return video.map(v => ({ ...v, isUploading: false }));
  }, [video, pendingVideo]);

  // Car damage handler
  const handleCarDamageChange = (damages: DamageReport[]) => {
    const backendFormat = toBackendFormat(damages);
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, car_damage: backendFormat.length > 0 ? backendFormat : undefined },
    }));
  };

  // Get current car damage value from specs
  const currentCarDamage = useMemo(() => {
    return formData.specs.car_damage
      ? fromBackendFormat(formData.specs.car_damage as string[])
      : [];
  }, [formData.specs.car_damage]);

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    const validationErrors = validateListingForm({
      ...formData,
      images,
      location: {
        province: formData.location.province || '',
        city: formData.location.city,
        area: formData.location.area,
        link: formData.location.link,
      },
    } as any);

    Object.entries(validationErrors).forEach(([field, message]) => {
      if (message) errors.push(message);
    });

    attributes.forEach(attr => {
      if (attr.storageType === 'column') return;
      if (attr.storageType === 'location') return;

      const value = formData.specs[attr.key];

      const attrError = validateAttribute(value, {
        key: attr.key,
        name: attr.name,
        validation: attr.validation as "REQUIRED" | "OPTIONAL",
        type: attr.type,
        maxSelections: attr.config?.maxSelections,
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
    setErrorMessage(null);

    const validation = validateForm();

    if (!validation.isValid) {
      setErrorMessage(`يرجى ملء جميع الحقول المطلوبة:\n${validation.errors.join('\n')}`);
      setSubmitError(true);
      setIsSubmitting(false);
      return;
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
        // GraphQL enums expect UPPERCASE values
        listingType: formData.listingType ? formData.listingType.toUpperCase() : undefined,
        condition: formData.condition ? formData.condition.toUpperCase() : undefined,
        specs: formData.specs,
      };

      if (formData.allowBidding && formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null) {
        updateData.biddingStartPrice = formData.biddingStartPrice;
      }

      await onSave(updateData);
      setSubmitSuccess(true);
      onClose();
    } catch (error) {
      setSubmitError(true);
      const message = error instanceof Error ? error.message : 'حدث خطأ في تحديث الإعلان';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render brand/model fields (like create page)
  const renderBrandModelFields = () => {
    if (brands.length === 0) return null;

    // Build model options with variants included
    // Models with variants show as optgroups, variants as selectable options
    // Models without variants show as regular selectable options
    const buildModelOptions = () => {
      const options: Array<{ value: string; label: string; group?: string }> = [
        { value: '', label: formData.specs.brandId ? `-- اختر ${modelAttribute?.name || 'الموديل'} --` : '-- اختر العلامة التجارية أولاً --' },
      ];
      const addedValues = new Set<string>(); // Prevent duplicates

      models.filter(m => m.isActive).forEach(model => {
        const modelVariants = variants.filter(v => v.modelId === model.id && v.isActive);

        if (modelVariants.length > 0) {
          // Model has variants - add variants with model name as group
          modelVariants.forEach(variant => {
            const value = `variant_${variant.id}`;
            if (!addedValues.has(value)) {
              addedValues.add(value);
              options.push({
                value,
                label: variant.name,
                group: model.name,
              });
            }
          });
        } else {
          // Model has no variants - add model directly
          const value = `model_${model.id}`;
          if (!addedValues.has(value)) {
            addedValues.add(value);
            options.push({
              value,
              label: model.name,
            });
          }
        }
      });

      return options;
    };

    // Get current value for model dropdown
    const getModelDropdownValue = () => {
      if (formData.specs.variantId) {
        return `variant_${formData.specs.variantId}`;
      }
      if (formData.specs.modelId) {
        return `model_${formData.specs.modelId}`;
      }
      return '';
    };

    // Handle model/variant selection
    const handleModelSelection = (value: string) => {
      // Clear auto-filled fields when model/variant changes
      // Use current suggestionSpecs keys (dynamic from backend) instead of hardcoded list
      const clearedSpecs: Record<string, string> = {};
      if (suggestionSpecs) {
        Object.keys(suggestionSpecs).forEach(field => { clearedSpecs[field] = ''; });
      }

      if (!value) {
        setFormData(prev => ({
          ...prev,
          specs: { ...prev.specs, ...clearedSpecs, modelId: '', variantId: '' },
        }));
      } else if (value.startsWith('variant_')) {
        const variantId = value.replace('variant_', '');
        const variant = variants.find(v => v.id === variantId);
        if (variant) {
          setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, ...clearedSpecs, modelId: variant.modelId, variantId: variantId },
          }));
        }
      } else if (value.startsWith('model_')) {
        const modelId = value.replace('model_', '');
        setFormData(prev => ({
          ...prev,
          specs: { ...prev.specs, ...clearedSpecs, modelId: modelId, variantId: '' },
        }));
      }
    };

    return (
      <>
        <Input
          type="select"
          label={brandAttribute?.name || "العلامة التجارية"}
          value={formData.specs.brandId || ''}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              specs: { ...prev.specs, brandId: e.target.value, modelId: '', variantId: '' },
            }));
          }}
          options={[
            { value: '', label: `-- اختر ${brandAttribute?.name || 'العلامة التجارية'} --` },
            ...brands.filter(b => b.isActive).map(brand => ({
              value: brand.id,
              label: brand.name,
            })),
          ]}
          disabled={isLoadingBrands}
          searchable
          creatable
          isLoading={isLoadingBrands}
          onCreateOption={handleCreateBrand}
          required={brandAttribute?.validation === 'REQUIRED'}
        />

        <Input
          type="select"
          label={modelAttribute?.name || "الموديل"}
          value={getModelDropdownValue()}
          onChange={(e) => handleModelSelection(e.target.value)}
          options={buildModelOptions()}
          disabled={!formData.specs.brandId || isLoadingModels || isLoadingVariants}
          searchable={!!formData.specs.brandId}
          creatable={!!formData.specs.brandId}
          isLoading={isLoadingModels || isLoadingVariants}
          onCreateOption={handleCreateModel}
          required={modelAttribute?.validation === 'REQUIRED'}
        />
      </>
    );
  };

  // Helper function to render a dynamic attribute group (like create page)
  const renderDynamicGroup = (group: AttributeGroup, sectionNum: number, isFirstSection: boolean = false) => {
    const groupAttributes = group.attributes;
    if (groupAttributes.length === 0) return null;

    const hasBrandModel = groupAttributes.some(attr => attr.key === 'brandId' || attr.key === 'modelId' || attr.key === 'variantId');
    if (hasBrandModel && brands.length === 0) {
      const otherAttrs = groupAttributes.filter(attr => attr.key !== 'brandId' && attr.key !== 'modelId' && attr.key !== 'variantId');
      if (otherAttrs.length === 0) return null;
    }

    const groupInfo = (sectionInfo as Record<string, { status: FormSectionStatus; filled: number; total: number }>)[group.name];
    const status: FormSectionStatus = groupInfo?.status || 'incomplete';
    const filledCount = groupInfo?.filled || 0;
    const totalCount = groupInfo?.total || 0;

    if (totalCount === 0) return null;

    // Filter out special attributes that are handled separately:
    // - brandId, modelId, variantId: handled by renderBrandModelFields
    // - car_damage: handled by CarInspection component
    const excludedKeys = ['variantId', 'car_damage'];
    if (hasBrandModel) {
      excludedKeys.push('brandId', 'modelId');
    }
    const regularAttributes = groupAttributes.filter(attr => !excludedKeys.includes(attr.key));

    return (
      <FormSection
        key={group.name}
        number={sectionNum}
        title={group.name}
        status={status}
        filledCount={filledCount}
        totalCount={totalCount}
        defaultExpanded={isFirstSection}
      >
        <div className={styles.specsGrid}>
          {hasBrandModel && renderBrandModelFields()}

          {regularAttributes.map((attribute) => {
            const suggestedValues = suggestionSpecs?.[attribute.key as keyof typeof suggestionSpecs];

            return (
              <div key={attribute.key}>
                {renderAttributeField({
                  attribute: attribute as any,
                  value: formData.specs[attribute.key],
                  onChange: (value) => {
                    setFormData(prev => ({
                      ...prev,
                      specs: { ...prev.specs, [attribute.key]: value },
                    }));
                  },
                  suggestedValues: suggestedValues as (string | number)[] | undefined,
                })}
              </div>
            );
          })}
        </div>
      </FormSection>
    );
  };

  // Don't render form until we have fresh data
  if (!detailedListing) {
    return (
      <Modal isVisible={true} onClose={onClose} title="تعديل الإعلان" maxWidth="xl">
        <div style={{ padding: '40px', textAlign: 'center' }}>

          <Text variant="paragraph" style={{ marginTop: '16px' }}>جاري تحميل بيانات الإعلان </Text>
          <Loading />
        </div>
      </Modal>
    );
  }

  // Calculate section numbers dynamically
  let sectionNumber = 0;

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

          {/* Section 1: First Dynamic Group (اختر السيارة) - like create page */}
          {firstGroup && renderDynamicGroup(firstGroup, ++sectionNumber, true)}

          {/* Section 2: Basic Info */}
          <FormSection
            number={++sectionNumber}
            title="معلومات الإعلان"
            status={sectionInfo.basicInfo.status}
            filledCount={sectionInfo.basicInfo.filled}
            totalCount={sectionInfo.basicInfo.total}
            defaultExpanded={!firstGroup}
          >
            <div className={styles.formFields}>
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

              {listingTypeAttribute && (
                <Input
                  type="select"
                  label={listingTypeAttribute.name}
                  value={formData.listingType}
                  onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                  options={[
                    { value: '', label: `-- اختر ${listingTypeAttribute.name} --` },
                    ...listingTypeAttribute.options
                      .filter(opt => opt.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(opt => ({
                        value: opt.key,
                        label: opt.value,
                      }))
                  ]}
                  required={listingTypeAttribute.validation === 'REQUIRED'}
                />
              )}

              {conditionAttribute && (
                <Input
                  type="select"
                  label={conditionAttribute.name}
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  options={[
                    { value: '', label: `-- اختر ${conditionAttribute.name} --` },
                    ...conditionAttribute.options
                      .filter(opt => opt.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(opt => ({
                        value: opt.key,
                        label: opt.value,
                      }))
                  ]}
                  required={conditionAttribute.validation === 'REQUIRED'}
                />
              )}
            </div>
          </FormSection>

          {/* Section 3: Media (Images + Video) */}
          <FormSection
            number={++sectionNumber}
            title={videoAllowed ? 'الصور والفيديو' : 'الصور'}
            status={sectionInfo.media.status}
            filledCount={sectionInfo.media.filled}
            totalCount={sectionInfo.media.total}
            defaultExpanded={false}
          >
            <ImageUploadGrid
              images={imagesWithUploadState}
              onChange={(newImages) => {
                // Filter out pending images to get actual change
                const actualImages = newImages.filter(img => !img.isUploading);
                if (actualImages.length > images.length) {
                  handleImageAdd(newImages);
                } else if (actualImages.length < images.length) {
                  handleImageDelete(actualImages);
                } else {
                  setImages(actualImages);
                }
              }}
              maxImages={maxImagesAllowed}
              maxSize={2 * 1024 * 1024}
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

            {videoAllowed && (
              <div className={styles.videoSection}>
                <Text variant="small" color="secondary" style={{ marginBottom: '8px' }}>
                  الفيديو (اختياري) - الحد الأقصى 20 ميجابايت (30-45 ثانية)
                </Text>
                <ImageUploadGrid
                  images={videoWithUploadState}
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

            {/* Car Damage Section */}
            <div className={styles.carDamageSection}>
              <Input
                type="switch"
                label="هل يوجد ملاحظات على الهيكل؟"
                checked={showCarDamage || currentCarDamage.length > 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const checked = e.target.checked;
                  setShowCarDamage(checked);
                  if (!checked) {
                    // Clear car damage when toggle is off
                    setFormData(prev => ({
                      ...prev,
                      specs: { ...prev.specs, car_damage: undefined },
                    }));
                  }
                }}
              />
              <Text variant="small" >
                حدد الأجزاء المدهونة أو المُستبدلة في السيارة
              </Text>

              {(showCarDamage || currentCarDamage.length > 0) && (
                <CarInspection
                  value={currentCarDamage}
                  onChange={handleCarDamageChange}
                />
              )}
            </div>
          </FormSection>

          {/* Remaining Dynamic Attribute Groups */}
          {otherGroups.map((group) => renderDynamicGroup(group, ++sectionNumber, false))}

          {/* Location Section */}
          <FormSection
            number={++sectionNumber}
            title="الموقع"
            status={sectionInfo.location.status}
            filledCount={sectionInfo.location.filled}
            totalCount={sectionInfo.location.total}
            defaultExpanded={false}
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
              <Text variant="small">
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
