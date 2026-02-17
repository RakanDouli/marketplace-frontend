'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Button, ImageUploadGrid, Form, SubmitButton, MobileBackButton, CarInspection, toBackendFormat, fromBackendFormat } from '@/components/slices';
import type { DamageReport } from '@/components/slices';
import type { WizardStepStatus } from '@/components/slices';
import { WizardStep } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { GET_BRANDS_QUERY, GET_MODELS_QUERY, GET_VARIANTS_BY_MODEL_QUERY, GET_MODEL_SUGGESTION_QUERY } from '@/stores/createListingStore/createListing.gql';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@/stores/currencyStore';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import {
  validateListingForm,
  validateAttribute,
  validateTitle,
  validateDescription,
  validatePriceMinor,
  ListingValidationConfig,
} from '@/lib/validation/listingValidation';
import { MapPin, Check, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { ListingSubmitLoader } from '@/components/ListingSubmitLoader';
import { Modal } from '@/components/slices';
import styles from './CreateListingWizard.module.scss';

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
  hasVariants?: boolean;
}

interface Variant {
  id: string;
  modelId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

// Define step structure
interface StepConfig {
  id: string;
  title: string;
  hasRequiredFields: boolean;
}

export default function CreateListingWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId');

  const { user, userPackage, isLoading: isAuthLoading } = useUserAuthStore();
  const { provinces } = useMetadataStore();
  const { addNotification } = useNotificationStore();
  const { preferredCurrency, getRate } = useCurrencyStore();
  const {
    draftId,
    formData,
    attributes,
    attributeGroups,
    isLoadingAttributes,
    isSubmitting,
    error,
    setFormField,
    setSpecField,
    setLocationField,
    submitListing,
    saveDraft,
    loadDraft,
    uploadAndAddImage,
    removeImage,
    uploadAndAddVideo,
    removeVideo,
    deleteDraft,
    reset,
  } = useCreateListingStore();

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadingImageIds, setUploadingImageIds] = useState<Set<string>>(new Set());
  const [pendingImages, setPendingImages] = useState<any[]>([]);
  const [pendingVideo, setPendingVideo] = useState<any | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCarDamage, setShowCarDamage] = useState(false);

  // Wizard state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward' | 'none'>('none');

  // Model suggestion specs
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

  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Find brand, model, and variant attributes
  const brandAttribute = attributes.find(attr => attr.key === 'brandId');
  const modelAttribute = attributes.find(attr => attr.key === 'modelId');
  const variantAttribute = attributes.find(attr => attr.key === 'variantId');

  // Find column-stored global attributes
  const listingTypeAttribute = attributes.find(attr => attr.key === 'listingType');
  const conditionAttribute = attributes.find(attr => attr.key === 'condition');

  // Separate first group (lowest groupOrder) from other dynamic groups
  // Sort by groupOrder to find the first one dynamically
  const sortedGroups = [...attributeGroups].sort((a, b) => a.groupOrder - b.groupOrder);
  const firstGroup = sortedGroups[0];
  const otherGroups = sortedGroups.slice(1);

  // Build steps dynamically
  const steps: StepConfig[] = useMemo(() => {
    const stepsList: StepConfig[] = [];

    // Step 1: First dynamic group (اختر السيارة) if exists
    if (firstGroup && firstGroup.attributes.length > 0) {
      stepsList.push({
        id: 'firstGroup',
        title: firstGroup.name,
        hasRequiredFields: firstGroup.attributes.some(a => a.validation === 'REQUIRED'),
      });
    }

    // Step 2: Basic Info
    stepsList.push({
      id: 'basicInfo',
      title: 'معلومات الإعلان',
      hasRequiredFields: true,
    });

    // Step 3: Media
    stepsList.push({
      id: 'media',
      title: videoAllowed ? 'الصور والفيديو' : 'الصور',
      hasRequiredFields: true,
    });

    // Step 4+: Other dynamic groups
    otherGroups.forEach((group, idx) => {
      if (group.attributes.length > 0) {
        stepsList.push({
          id: `group_${idx}`,
          title: group.name,
          hasRequiredFields: group.attributes.some(a => a.validation === 'REQUIRED'),
        });
      }
    });

    // Location step
    stepsList.push({
      id: 'location',
      title: 'الموقع',
      hasRequiredFields: true,
    });

    // Preview step
    stepsList.push({
      id: 'preview',
      title: 'معاينة ونشر',
      hasRequiredFields: false,
    });

    return stepsList;
  }, [firstGroup, otherGroups, videoAllowed]);

  // Section status calculation
  interface SectionInfo {
    status: WizardStepStatus;
    hasError: boolean;
    filledCount: number;
    totalCount: number;
    isValid: boolean;
  }

  const sectionInfo: Record<string, SectionInfo> = useMemo(() => {
    const getStatus = (requiredFilled: boolean, allFilled: boolean): WizardStepStatus => {
      if (!requiredFilled) return 'incomplete';
      if (allFilled) return 'complete';
      return 'required';
    };

    // Basic Info
    const titleFilled = !validateTitle(formData.title);
    const descriptionFilled = formData.description.trim().length > 0;
    const priceFilled = !validatePriceMinor(formData.priceMinor);
    const listingTypeRequired = listingTypeAttribute?.validation === 'REQUIRED';
    const conditionRequired = conditionAttribute?.validation === 'REQUIRED';
    const listingTypeFilled = !!formData.listingType;
    const conditionFilled = !!formData.condition;

    let basicInfoTotal = 3;
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
    const basicInfoError = (touched.title && !titleFilled) || (touched.price && !priceFilled) ||
      (touched.listingType && listingTypeRequired && !listingTypeFilled) ||
      (touched.condition && conditionRequired && !conditionFilled);

    // Media
    const imagesOk = formData.images.length >= ListingValidationConfig.images.min;
    const mediaError = touched.images && !imagesOk;
    const mediaTotal = videoAllowed ? 2 : 1;
    let mediaFilled = 0;
    if (formData.images.length > 0) mediaFilled++;
    if (videoAllowed && formData.video.length > 0) mediaFilled++;

    // Location
    const provinceFilled = !!formData.location.province;
    const locationError = touched.province && !provinceFilled;
    const locationTotal = 4;
    const locationFilled = +provinceFilled + +!!formData.location.city + +!!formData.location.area + +!!formData.location.link;

    // Dynamic attribute groups
    const brandRequired = brandAttribute?.validation === 'REQUIRED';
    const modelRequired = modelAttribute?.validation === 'REQUIRED';
    const brandFilled = !!formData.specs.brandId;
    const modelFilled = !!formData.specs.modelId;

    const attributeGroupsInfo: Record<string, SectionInfo> = {};
    attributeGroups.forEach((group) => {
      let requiredFilled = true;
      let allFilled = true;
      let hasGroupError = false;
      let groupTotal = 0;
      let groupFilled = 0;

      group.attributes.forEach(attr => {
        if (attr.key === 'brandId') {
          if (brands.length > 0) {
            groupTotal++;
            if (brandFilled) groupFilled++;
            if (brandRequired && !brandFilled) requiredFilled = false;
            if (!brandFilled) allFilled = false;
            if (touched.brandId && brandRequired && !brandFilled) hasGroupError = true;
          }
          return;
        }
        if (attr.key === 'modelId') {
          if (brands.length > 0) {
            groupTotal++;
            if (brandFilled && modelFilled) groupFilled++;
            if (modelRequired && brandFilled && !modelFilled) requiredFilled = false;
            if (!modelFilled) allFilled = false;
            if (touched.modelId && modelRequired && brandFilled && !modelFilled) hasGroupError = true;
          }
          return;
        }

        groupTotal++;
        const value = formData.specs[attr.key];
        const isFilled = value !== undefined && value !== null && value !== '';
        if (isFilled) groupFilled++;
        if (!isFilled) allFilled = false;
        if (attr.validation === 'REQUIRED' && !isFilled) requiredFilled = false;
        if (touched[`spec_${attr.key}`] && attr.validation === 'REQUIRED' && !isFilled) hasGroupError = true;
      });

      attributeGroupsInfo[group.name] = {
        status: getStatus(requiredFilled, allFilled),
        hasError: hasGroupError,
        filledCount: groupFilled,
        totalCount: groupTotal,
        isValid: requiredFilled,
      };
    });

    const basicInfoAllFilled = basicInfoFilled === basicInfoTotal;
    const mediaAllFilled = mediaFilled === mediaTotal;
    const locationAllFilled = locationFilled === locationTotal;

    return {
      basicInfo: { status: getStatus(basicInfoRequiredOk, basicInfoAllFilled), hasError: basicInfoError, filledCount: basicInfoFilled, totalCount: basicInfoTotal, isValid: basicInfoRequiredOk },
      media: { status: getStatus(imagesOk, mediaAllFilled), hasError: mediaError, filledCount: mediaFilled, totalCount: mediaTotal, isValid: imagesOk },
      location: { status: getStatus(provinceFilled, locationAllFilled), hasError: locationError, filledCount: locationFilled, totalCount: locationTotal, isValid: provinceFilled },
      preview: { status: 'complete', hasError: false, filledCount: 0, totalCount: 0, isValid: true },
      ...attributeGroupsInfo,
    };
  }, [formData, attributes, attributeGroups, brands.length, brandAttribute, modelAttribute, listingTypeAttribute, conditionAttribute, touched, videoAllowed]);

  // Check if current step is valid
  const isCurrentStepValid = useCallback(() => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return true;

    if (currentStep.id === 'basicInfo') {
      return sectionInfo.basicInfo?.isValid ?? false;
    }
    if (currentStep.id === 'media') {
      return sectionInfo.media?.isValid ?? false;
    }
    if (currentStep.id === 'location') {
      return sectionInfo.location?.isValid ?? false;
    }
    if (currentStep.id === 'preview') {
      return true;
    }
    if (currentStep.id === 'firstGroup' && firstGroup) {
      return sectionInfo[firstGroup.name]?.isValid ?? true;
    }
    // Other dynamic groups
    const groupIndex = parseInt(currentStep.id.replace('group_', ''));
    if (!isNaN(groupIndex) && otherGroups[groupIndex]) {
      return sectionInfo[otherGroups[groupIndex].name]?.isValid ?? true;
    }
    return true;
  }, [currentStepIndex, steps, sectionInfo, firstGroup, otherGroups]);

  // Listing limit check
  const maxListings = userPackage?.userSubscription?.maxListings || 0;
  const currentListingsCount = userPackage?.currentListings || 0;
  const isAtLimit = maxListings > 0 && currentListingsCount >= maxListings;

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Listing limit guard
  useEffect(() => {
    if (!isAuthLoading && user && isAtLimit) {
      addNotification({
        type: 'warning',
        title: 'لقد وصلت للحد الأقصى من الإعلانات',
        message: `لديك ${currentListingsCount} إعلان من أصل ${maxListings}. قم بأرشفة بعض الإعلانات أو ترقية اشتراكك.`,
        duration: 8000,
      });
      router.push('/dashboard/listings');
    }
  }, [user, isAuthLoading, isAtLimit, currentListingsCount, maxListings, router, addNotification]);

  // Load draft from URL parameter
  useEffect(() => {
    if (draftIdFromUrl && !draftId && !isLoadingDraft) {
      setIsLoadingDraft(true);
      loadDraft(draftIdFromUrl).finally(() => {
        setIsLoadingDraft(false);
      });
    }
  }, [draftIdFromUrl, draftId, loadDraft, isLoadingDraft]);

  // Redirect if no draft
  useEffect(() => {
    if (!isLoadingDraft && !draftId && !draftIdFromUrl && !formData.categoryId) {
      router.push('/dashboard/listings/create');
    }
  }, [draftId, draftIdFromUrl, formData.categoryId, router, isLoadingDraft]);

  // Fetch provinces
  useEffect(() => {
    const metadataStore = useMetadataStore.getState();
    if (provinces.length === 0) {
      metadataStore.fetchLocationMetadata();
    }
  }, [provinces.length]);

  // Fetch brands
  useEffect(() => {
    if (formData.categoryId) {
      const fetchBrands = async () => {
        setIsLoadingBrands(true);
        try {
          const data = await cachedGraphQLRequest(GET_BRANDS_QUERY, {
            categoryId: formData.categoryId,
          }, { ttl: 0 });
          setBrands((data as any).brands || []);
        } catch (error) {
          console.error('Error fetching brands:', error);
        } finally {
          setIsLoadingBrands(false);
        }
      };
      fetchBrands();
    }
  }, [formData.categoryId]);

  // Fetch models
  useEffect(() => {
    const brandId = formData.specs.brandId;
    if (brandId && !brandId.startsWith('temp_')) {
      const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
          const data = await cachedGraphQLRequest(GET_MODELS_QUERY, {
            brandId: brandId,
          });
          setModels((data as any).models || []);
        } catch (error) {
          console.error('Error fetching models:', error);
        } finally {
          setIsLoadingModels(false);
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [formData.specs.brandId]);

  // Fetch variants (actual models like C-180) only when a series (modelId) is selected
  // OPTIMIZED: Only loads ~10-20 variants for selected series, not all variants for entire brand
  useEffect(() => {
    const modelId = formData.specs.modelId;
    if (modelId && !modelId.startsWith('temp_')) {
      const fetchVariants = async () => {
        setIsLoadingVariants(true);
        try {
          const data = await cachedGraphQLRequest(GET_VARIANTS_BY_MODEL_QUERY, {
            modelId: modelId,
          });
          setVariants((data as any).variants || []);
        } catch (error) {
          console.error('Error fetching variants:', error);
        } finally {
          setIsLoadingVariants(false);
        }
      };
      fetchVariants();
    } else {
      setVariants([]);
    }
  }, [formData.specs.modelId]);

  // Fetch model suggestions
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
      setIsAutoFilling(true);
      try {
        // Pass variantId to get variant-specific specs from CarAPI
        // (e.g., "A6 Sportback e-tron" instead of just "A6")
        const data = await cachedGraphQLRequest(GET_MODEL_SUGGESTION_QUERY, {
          brandId,
          modelId,
          year: year ? parseInt(String(year)) : null,
          variantId: variantId || null,
        }, { ttl: 0 });

        const suggestion = (data as any).getModelSuggestion;
        if (suggestion?.specs) {
          const specs = suggestion.specs;
          setSuggestionSpecs(specs);

          // Dynamic auto-fill: iterate over all keys from backend suggestion
          // Auto-fill any field that has exactly one option
          // Always overwrite since we clear fields when model changes (React batching causes stale state check to fail)
          Object.keys(specs).forEach((field) => {
            const options = specs[field];
            if (Array.isArray(options) && options.length === 1) {
              // Convert to string for SELECTOR compatibility (validation expects string type)
              setSpecField(field, String(options[0]));
            }
          });
        } else {
          setSuggestionSpecs(null);
        }
      } catch (error) {
        console.error('Error fetching model suggestions:', error);
        setSuggestionSpecs(null);
      } finally {
        setIsAutoFilling(false);
      }
    };

    fetchSuggestions();
  }, [formData.specs.brandId, formData.specs.modelId, formData.specs.variantId, formData.specs.year, setSpecField]);

  if (isAuthLoading || !user || isLoadingDraft) {
    return (
      <Container className={styles.container}>
        <div className={styles.loadingIndicator}>
          <Loader2 className={styles.spinner} size={24} />
          <Text variant="paragraph">جاري التحميل...</Text>
        </div>
      </Container>
    );
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    saveDraft();
  };

  const getError = (field: string, errorMessage?: string) => {
    return touched[field] ? errorMessage : undefined;
  };

  // Image handlers
  const handleImagesChange = async (images: any[]) => {
    const existingIds = formData.images.map(img => img.id);
    const newImages = images.filter(img => img.file && !existingIds.includes(img.id));

    for (const newImage of newImages) {
      if (newImage.file) {
        setPendingImages(prev => [...prev, { ...newImage, isUploading: true, uploadProgress: 0 }]);
        setUploadingImageIds(prev => new Set([...prev, newImage.id]));
        setIsUploadingImage(true);
        try {
          await uploadAndAddImage(newImage.file, undefined, (progress) => {
            setPendingImages(prev => prev.map(img =>
              img.id === newImage.id ? { ...img, uploadProgress: progress } : img
            ));
          });
        } catch (err: any) {
          addNotification({
            type: 'error',
            title: 'خطأ في رفع الصورة',
            message: err.message || 'فشل رفع الصورة',
            duration: 5000,
          });
        } finally {
          setPendingImages(prev => prev.filter(img => img.id !== newImage.id));
          setUploadingImageIds(prev => {
            const next = new Set(prev);
            next.delete(newImage.id);
            return next;
          });
          setIsUploadingImage(false);
        }
      }
    }

    const newIds = images.map(img => img.id);
    const removedImages = formData.images.filter(img => !newIds.includes(img.id));

    for (const removedImage of removedImages) {
      await removeImage(removedImage.id);
    }

    setTouched({ ...touched, images: true });
  };

  const imagesWithUploadState = [
    ...formData.images.map(img => ({ ...img, isUploading: false })),
    ...pendingImages,
  ];

  // Video handlers
  const handleVideoChange = async (videos: any[]) => {
    if (videos.length > 0 && videos[0].file) {
      const newVideo = videos[0];
      setPendingVideo({ ...newVideo, isUploading: true, isVideo: true, uploadProgress: 0 });
      setIsUploadingVideo(true);
      try {
        await uploadAndAddVideo(newVideo.file, (progress: number) => {
          setPendingVideo((prev: any) => prev ? { ...prev, uploadProgress: progress } : null);
        });
      } catch (err: any) {
        addNotification({
          type: 'error',
          title: 'خطأ في رفع الفيديو',
          message: err.message || 'فشل رفع الفيديو',
          duration: 5000,
        });
      } finally {
        setPendingVideo(null);
        setIsUploadingVideo(false);
      }
    } else if (videos.length === 0 && formData.video.length > 0) {
      await removeVideo();
    }
  };

  const videoWithUploadState = pendingVideo
    ? [pendingVideo]
    : formData.video.map(v => ({ ...v, isUploading: false }));

  // Car damage handler
  const handleCarDamageChange = (damages: DamageReport[]) => {
    const backendFormat = toBackendFormat(damages);
    setSpecField('car_damage', backendFormat.length > 0 ? backendFormat : undefined);
    saveDraft();
  };

  // Get current car damage value
  const currentCarDamage = formData.specs.car_damage
    ? fromBackendFormat(formData.specs.car_damage as string[])
    : [];

  // Navigation handlers
  const goToNextStep = () => {
    if (!isCurrentStepValid()) {
      // Mark all fields in current step as touched
      markCurrentStepTouched();
      addNotification({
        type: 'error',
        title: 'يرجى ملء الحقول المطلوبة',
        message: 'لا يمكن المتابعة قبل ملء جميع الحقول المطلوبة',
        duration: 3000,
      });
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setAnimationDirection('forward');
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setAnimationDirection('backward');
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const goToStep = (index: number) => {
    // Only allow going to previous steps or current step
    if (index <= currentStepIndex) {
      setAnimationDirection(index < currentStepIndex ? 'backward' : 'none');
      setCurrentStepIndex(index);
    }
  };

  const markCurrentStepTouched = () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const newTouched: Record<string, boolean> = { ...touched };

    if (currentStep.id === 'basicInfo') {
      newTouched.title = true;
      newTouched.price = true;
      if (listingTypeAttribute) newTouched.listingType = true;
      if (conditionAttribute) newTouched.condition = true;
    } else if (currentStep.id === 'media') {
      newTouched.images = true;
    } else if (currentStep.id === 'location') {
      newTouched.province = true;
    } else if (currentStep.id === 'firstGroup' && firstGroup) {
      firstGroup.attributes.forEach(attr => {
        newTouched[attr.key] = true;
        newTouched[`spec_${attr.key}`] = true;
      });
    } else {
      const groupIndex = parseInt(currentStep.id.replace('group_', ''));
      if (!isNaN(groupIndex) && otherGroups[groupIndex]) {
        otherGroups[groupIndex].attributes.forEach(attr => {
          newTouched[attr.key] = true;
          newTouched[`spec_${attr.key}`] = true;
        });
      }
    }

    setTouched(newTouched);
  };

  // Validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const validationErrors = validateListingForm(formData);
    const errors: string[] = [];

    Object.entries(validationErrors).forEach(([field, message]) => {
      if (message) errors.push(message);
    });

    attributes.forEach(attr => {
      if (attr.storageType === 'column' || attr.storageType === 'location') return;
      const value = formData.specs[attr.key];
      const attrError = validateAttribute(value, {
        key: attr.key,
        name: attr.name,
        validation: attr.validation,
        type: attr.type,
        maxSelections: attr.config?.maxSelections,
      });
      if (attrError) errors.push(attrError);
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const allFields: Record<string, boolean> = {
      title: true,
      price: true,
      images: true,
      province: true,
    };

    attributes.forEach(attr => {
      allFields[attr.key] = true;
      allFields[`spec_${attr.key}`] = true;
    });

    setTouched(allFields);

    const validation = validateForm();

    if (!validation.isValid) {
      setValidationError(`يرجى ملء جميع الحقول المطلوبة: ${validation.errors.join(' - ')}`);
      return;
    }

    setValidationError('');
    setSuccess('');

    try {
      await submitListing();
      if (!error) {
        addNotification({
          type: 'success',
          title: 'نجح',
          message: 'تم إنشاء الإعلان بنجاح',
          duration: 5000,
        });
        setSuccess('تم استلام إعلانك! جاري المراجعة والنشر خلال دقيقتين...');
        setTimeout(() => {
          router.push('/dashboard/listings');
        }, 2000);
      }
    } catch (err: any) {
      // Error displayed by Form component
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelModal(false);
    await deleteDraft();
    router.push('/dashboard/listings');
  };

  // Brand/model handlers
  const handleCreateBrand = (brandName: string) => {
    const tempBrand: Brand = {
      id: `temp_${brandName}`,
      name: brandName,
      slug: brandName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };
    setBrands(prev => [...prev, tempBrand]);
    setFormField('specs', {
      ...formData.specs,
      brandId: tempBrand.id,
      _brandName: brandName,
    });
    saveDraft();
  };

  const handleCreateModel = (modelName: string) => {
    const tempModel: Model = {
      id: `temp_${modelName}`,
      name: modelName,
      slug: modelName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };
    setModels(prev => [...prev, tempModel]);
    setFormField('specs', {
      ...formData.specs,
      modelId: tempModel.id,
      _modelName: modelName,
    });
    saveDraft();
  };

  // Render dynamic group
  const renderDynamicGroup = (group: typeof attributeGroups[0]) => {
    const groupAttributes = group.attributes;
    if (groupAttributes.length === 0) return null;

    const hasBrandModel = groupAttributes.some(attr => attr.key === 'brandId' || attr.key === 'modelId' || attr.key === 'variantId');
    if (hasBrandModel && brands.length === 0) {
      const otherAttrs = groupAttributes.filter(attr => attr.key !== 'brandId' && attr.key !== 'modelId');
      if (otherAttrs.length === 0) return null;
    }

    const renderBrandModelFields = () => {
      if (!hasBrandModel || brands.length === 0) return null;

      /**
       * NEW STRUCTURE:
       * - Brand: Mercedes-Benz (from brands table)
       * - Series: C-Class (from models table) - displayed as "الفئة"
       * - Model: C-180, C-200 (from model_variants table) - displayed as "الموديل"
       *
       * Data mapping:
       * - brandId → Brand
       * - modelId → Series (stored in models table)
       * - variantId → Actual model (stored in model_variants table)
       */

      // Get variants (actual models) for the selected series
      const selectedSeriesId = formData.specs.modelId;
      const modelsForSeries = selectedSeriesId
        ? variants.filter(v => v.modelId === selectedSeriesId && v.isActive)
        : [];

      // Handle series selection
      const handleSeriesSelection = (seriesId: string) => {
        // Clear auto-filled fields when series changes
        if (suggestionSpecs) {
          Object.keys(suggestionSpecs).forEach(field => setSpecField(field, ''));
        }
        setSpecField('modelId', seriesId);
        setSpecField('variantId', ''); // Clear model when series changes
        saveDraft();
      };

      // Handle model selection (from variants)
      const handleModelSelection = (variantId: string) => {
        // Clear auto-filled fields when model changes
        if (suggestionSpecs) {
          Object.keys(suggestionSpecs).forEach(field => setSpecField(field, ''));
        }
        setSpecField('variantId', variantId);
        saveDraft();
      };

      return (
        <>
          {/* Brand Dropdown */}
          <Input
            type="select"
            label={brandAttribute?.name || "العلامة التجارية"}
            value={formData.specs.brandId || ''}
            onChange={(e) => {
              setSpecField('brandId', e.target.value);
              setSpecField('modelId', '');
              setSpecField('variantId', '');
              saveDraft();
            }}
            onBlur={() => handleBlur('brandId')}
            options={[
              { value: '', label: `-- اختر ${brandAttribute?.name || 'العلامة التجارية'} --` },
              ...brands.filter(b => b.isActive).map(brand => ({ value: brand.id, label: brand.name })),
            ]}
            disabled={isLoadingBrands}
            searchable
            creatable
            isLoading={isLoadingBrands}
            onCreateOption={handleCreateBrand}
            required={brandAttribute?.validation === 'REQUIRED'}
            error={getError('brandId',
              brandAttribute?.validation === 'REQUIRED' && !formData.specs.brandId
                ? `${brandAttribute?.name || 'العلامة التجارية'} مطلوب`
                : undefined
            )}
            success={!!formData.specs.brandId && !getError('brandId', undefined)}
          />

          {/* Series Dropdown (stored in models table) */}
          <Input
            type="select"
            label="الفئة"
            value={formData.specs.modelId || ''}
            onChange={(e) => handleSeriesSelection(e.target.value)}
            onBlur={() => handleBlur('modelId')}
            options={[
              { value: '', label: formData.specs.brandId ? '-- اختر الفئة --' : '-- اختر العلامة التجارية أولاً --' },
              ...models.filter(m => m.isActive).map(model => ({ value: model.id, label: model.name })),
            ]}
            disabled={!formData.specs.brandId || isLoadingModels}
            searchable={!!formData.specs.brandId}
            creatable={!!formData.specs.brandId}
            isLoading={isLoadingModels}
            onCreateOption={handleCreateModel}
            required={modelAttribute?.validation === 'REQUIRED'}
            error={getError('modelId',
              modelAttribute?.validation === 'REQUIRED' && !formData.specs.modelId
                ? 'الفئة مطلوبة'
                : undefined
            )}
            success={!!formData.specs.modelId && !getError('modelId', undefined)}
          />

          {/* Model Dropdown (stored in model_variants table) */}
          {formData.specs.modelId && (
            <Input
              type="select"
              label="الموديل"
              value={formData.specs.variantId || ''}
              onChange={(e) => handleModelSelection(e.target.value)}
              onBlur={() => handleBlur('variantId')}
              options={[
                { value: '', label: modelsForSeries.length > 0 ? '-- اختر الموديل --' : '-- لا توجد موديلات متاحة --' },
                ...modelsForSeries.map(variant => ({ value: variant.id, label: variant.name })),
              ]}
              disabled={!formData.specs.modelId || isLoadingVariants || modelsForSeries.length === 0}
              searchable={modelsForSeries.length > 5}
              isLoading={isLoadingVariants}
              required={variantAttribute?.validation === 'REQUIRED'}
              error={getError('variantId',
                variantAttribute?.validation === 'REQUIRED' && !formData.specs.variantId
                  ? 'الموديل مطلوب'
                  : undefined
              )}
              success={!!formData.specs.variantId && !getError('variantId', undefined)}
            />
          )}
        </>
      );
    };

    // Filter out special attributes that are handled separately:
    // - brandId, modelId, variantId: handled by renderBrandModelFields
    // - car_damage: handled by CarInspection component
    const excludedKeys = ['variantId', 'car_damage'];
    if (hasBrandModel) {
      excludedKeys.push('brandId', 'modelId');
    }
    const regularAttributes = groupAttributes.filter(attr => !excludedKeys.includes(attr.key));

    return (
      <div className={styles.specsGrid}>
        {renderBrandModelFields()}
        {regularAttributes.map((attribute) => {
          const suggestedValues = suggestionSpecs?.[attribute.key as keyof typeof suggestionSpecs];
          return (
            <div key={attribute.key}>
              {renderAttributeField({
                attribute,
                value: formData.specs[attribute.key],
                onChange: (value) => {
                  setSpecField(attribute.key, value);
                  saveDraft();
                },
                onBlur: () => handleBlur(`spec_${attribute.key}`),
                error: touched[`spec_${attribute.key}`]
                  ? validateAttribute(formData.specs[attribute.key], {
                    key: attribute.key,
                    name: attribute.name,
                    validation: attribute.validation as 'REQUIRED' | 'OPTIONAL',
                    type: attribute.type,
                    maxSelections: attribute.config?.maxSelections,
                    config: attribute.config || undefined,
                  })
                  : undefined,
                suggestedValues: suggestedValues as (string | number)[] | undefined,
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Get section info for step
  const getStepInfo = (step: StepConfig) => {
    if (step.id === 'basicInfo') return sectionInfo.basicInfo;
    if (step.id === 'media') return sectionInfo.media;
    if (step.id === 'location') return sectionInfo.location;
    if (step.id === 'preview') return { status: 'complete' as WizardStepStatus, hasError: false, filledCount: 0, totalCount: 0, isValid: true };
    if (step.id === 'firstGroup' && firstGroup) return sectionInfo[firstGroup.name];
    const groupIndex = parseInt(step.id.replace('group_', ''));
    if (!isNaN(groupIndex) && otherGroups[groupIndex]) {
      return sectionInfo[otherGroups[groupIndex].name];
    }
    return { status: 'complete' as WizardStepStatus, hasError: false, filledCount: 0, totalCount: 0, isValid: true };
  };

  const currentStep = steps[currentStepIndex];

  return (
    <>
      <MobileBackButton
        onClick={() => router.push('/dashboard/listings/create')}
        title="أكمل تفاصيل إعلانك"
      />

      <div className={styles.backButton}>
        <Button
          variant="outline"
          href="/dashboard/listings/create"
          arrow
        >
          عودة لاختيار الفئة
        </Button>
      </div>

      <Container innerPadding='none' paddingX='none'>
        <div className={styles.wizardPage}>
          <div className={styles.header}>
            <Text variant="h2">أكمل تفاصيل إعلانك</Text>
          </div>

          <Form onSubmit={handleSubmit} error={validationError || error || undefined} success={success || undefined}>
            <div className={styles.stepsContainer}>
              {/* Progress Bar - Desktop */}
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  {steps.map((step, index) => {
                    const stepInfo = getStepInfo(step);
                    const isCompleted = index < currentStepIndex || stepInfo?.status === 'complete' || stepInfo?.status === 'required';
                    const isCurrent = index === currentStepIndex;
                    const isClickable = index <= currentStepIndex;

                    return (
                      <div
                        key={step.id}
                        className={`${styles.progressStep} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${isClickable ? styles.clickable : ''}`}
                        onClick={() => isClickable && goToStep(index)}
                      >
                        <div className={styles.stepCircle}>
                          {isCompleted && !isCurrent ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <span className={styles.stepLabel}>{step.title}</span>
                        {index < steps.length - 1 && <div className={styles.connector} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar - Mobile (title + numbered progress with connectors) */}
              <div className={styles.mobileProgressNav}>
                <span className={styles.mobileStepTitle}>{currentStep?.title}</span>
                <div className={styles.mobileProgressBar}>
                  {steps.map((step, index) => {
                    const stepInfo = getStepInfo(step);
                    const isCompleted = index < currentStepIndex || stepInfo?.status === 'complete' || stepInfo?.status === 'required';
                    const isCurrent = index === currentStepIndex;
                    const isClickable = index <= currentStepIndex;

                    return (
                      <div key={step.id} className={styles.mobileStepWrapper}>
                        <button
                          type="button"
                          className={`${styles.mobileProgressStep} ${isCompleted && !isCurrent ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${isClickable ? styles.clickable : ''}`}
                          onClick={() => isClickable && goToStep(index)}
                          disabled={!isClickable}
                          aria-label={`${step.title} - خطوة ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                        {index < steps.length - 1 && (
                          <div className={`${styles.mobileConnector} ${isCompleted ? styles.completed : ''}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* First Dynamic Group Step */}
              {currentStep?.id === 'firstGroup' && firstGroup && (
                <WizardStep
                  number={currentStepIndex + 1}
                  title={firstGroup.name}
                  status={sectionInfo[firstGroup.name]?.status || 'incomplete'}
                  hasError={sectionInfo[firstGroup.name]?.hasError}
                  hasRequiredFields={firstGroup.attributes.some(a => a.validation === 'REQUIRED')}
                  filledCount={sectionInfo[firstGroup.name]?.filledCount}
                  totalCount={sectionInfo[firstGroup.name]?.totalCount}
                  isActive={true}
                  animationDirection={animationDirection}
                  onPrevious={currentStepIndex > 0 ? goToPrevStep : undefined}
                  onCancel={handleCancelClick}
                  onNext={goToNextStep}
                  isFirstStep={currentStepIndex === 0}
                  isLastStep={false}
                >
                  {renderDynamicGroup(firstGroup)}
                </WizardStep>
              )}

              {/* Basic Info Step */}
              {currentStep?.id === 'basicInfo' && (
                <WizardStep
                  number={currentStepIndex + 1}
                  title="معلومات الإعلان"
                  status={sectionInfo.basicInfo.status}
                  hasError={sectionInfo.basicInfo.hasError}
                  hasRequiredFields
                  filledCount={sectionInfo.basicInfo.filledCount}
                  totalCount={sectionInfo.basicInfo.totalCount}
                  isActive={true}
                  animationDirection={animationDirection}
                  onPrevious={currentStepIndex > 0 ? goToPrevStep : undefined}
                  onCancel={handleCancelClick}
                  onNext={goToNextStep}
                  isFirstStep={currentStepIndex === 0}
                  isLastStep={false}
                >
                  <div className={styles.formFields}>
                    <Input
                      type="text"
                      label="عنوان الإعلان"
                      placeholder="مثال: تويوتا كامري 2020 فل كامل"
                      value={formData.title}
                      onChange={(e) => setFormField('title', e.target.value)}
                      onBlur={() => handleBlur('title')}
                      error={getError('title', validateTitle(formData.title))}
                      maxLength={ListingValidationConfig.title.maxLength}
                      required
                    />

                    <Input
                      type="textarea"
                      label="الوصف"
                      placeholder="أضف وصفاً تفصيلياً عن المنتج..."
                      value={formData.description}
                      onChange={(e) => setFormField('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      error={getError('description', validateDescription(formData.description))}
                      maxLength={ListingValidationConfig.description.maxLength}
                      rows={6}
                    />

                    <Input
                      type="price"
                      label="السعر"
                      value={formData.priceMinor}
                      onChange={(e) => setFormField('priceMinor', parseInt(e.target.value) || 0)}
                      onBlur={() => handleBlur('price')}
                      error={getError('price', validatePriceMinor(formData.priceMinor))}
                      required
                    />

                    <Input
                      type="switch"
                      label="السماح بالمزايدة"
                      checked={formData.allowBidding}
                      onChange={(e) => {
                        setFormField('allowBidding', (e.target as HTMLInputElement).checked);
                        saveDraft();
                      }}
                    />

                    {formData.allowBidding && (
                      <Input
                        type="price"
                        label="سعر البداية للمزايدة"
                        value={formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null ? formData.biddingStartPrice : 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setFormField('biddingStartPrice', value);
                        }}
                        onBlur={() => handleBlur('biddingStartPrice')}
                        helpText="0 = مزايدة مجانية من أي سعر، أو حدد سعر البداية بالعملة المختارة"
                      />
                    )}

                    {listingTypeAttribute && (
                      <Input
                        type="select"
                        label={listingTypeAttribute.name}
                        value={formData.listingType}
                        onChange={(e) => {
                          setFormField('listingType', e.target.value);
                          saveDraft();
                        }}
                        onBlur={() => handleBlur('listingType')}
                        options={[
                          { value: '', label: `-- اختر ${listingTypeAttribute.name} --` },
                          ...listingTypeAttribute.options
                            .filter(opt => opt.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map(opt => ({ value: opt.key, label: opt.value }))
                        ]}
                        required={listingTypeAttribute.validation === 'REQUIRED'}
                        error={getError('listingType',
                          listingTypeAttribute.validation === 'REQUIRED' && !formData.listingType
                            ? `${listingTypeAttribute.name} مطلوب`
                            : undefined
                        )}
                        success={!!formData.listingType}
                      />
                    )}

                    {conditionAttribute && (
                      <Input
                        type="select"
                        label={conditionAttribute.name}
                        value={formData.condition}
                        onChange={(e) => {
                          setFormField('condition', e.target.value);
                          saveDraft();
                        }}
                        onBlur={() => handleBlur('condition')}
                        options={[
                          { value: '', label: `-- اختر ${conditionAttribute.name} --` },
                          ...conditionAttribute.options
                            .filter(opt => opt.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map(opt => ({ value: opt.key, label: opt.value }))
                        ]}
                        required={conditionAttribute.validation === 'REQUIRED'}
                        error={getError('condition',
                          conditionAttribute.validation === 'REQUIRED' && !formData.condition
                            ? `${conditionAttribute.name} مطلوب`
                            : undefined
                        )}
                        success={!!formData.condition}
                      />
                    )}
                  </div>
                </WizardStep>
              )}

              {/* Media Step */}
              {currentStep?.id === 'media' && (
                <WizardStep
                  number={currentStepIndex + 1}
                  title={videoAllowed ? 'الصور والفيديو' : 'الصور'}
                  status={sectionInfo.media.status}
                  hasError={sectionInfo.media.hasError}
                  hasRequiredFields
                  filledCount={sectionInfo.media.filledCount}
                  totalCount={sectionInfo.media.totalCount}
                  isActive={true}
                  animationDirection={animationDirection}
                  onPrevious={goToPrevStep}
                  onCancel={handleCancelClick}
                  onNext={goToNextStep}
                  isFirstStep={false}
                  isLastStep={false}
                >
                  <div className={styles.formFields}>
                    <Text variant="small" color="secondary" style={{ marginBottom: '8px' }}>
                      الحد الأدنى {ListingValidationConfig.images.min} صورة - مطلوب
                      {isUploadingImage && ' (جاري الرفع...)'}
                    </Text>
                    <ImageUploadGrid
                      images={imagesWithUploadState}
                      onChange={handleImagesChange}
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
                    />
                    {touched.images && formData.images.length < ListingValidationConfig.images.min && (
                      <Text variant="small" color="error">
                        يجب إضافة {ListingValidationConfig.images.min} صورة على الأقل
                      </Text>
                    )}

                    {videoAllowed && (
                      <div className={styles.videoSection}>
                        <Text variant="h4" className={styles.videoLabel}>
                          الفيديو (اختياري) - ({formData.video.length}/1)
                          {isUploadingVideo && ' (جاري الرفع...)'}
                        </Text>
                        <Text variant="small" color="secondary" className={styles.videoHint}>
                          الحد الأقصى 20 ميجابايت - MP4 فقط (30-45 ثانية)
                        </Text>
                        <ImageUploadGrid
                          images={videoWithUploadState}
                          onChange={handleVideoChange}
                          maxImages={1}
                          maxSize={20 * 1024 * 1024}
                          accept="video/mp4"
                          label="الفيديو"
                          onError={(error) => {
                            addNotification({
                              type: 'error',
                              title: 'خطأ في رفع الفيديو',
                              message: error,
                              duration: 5000,
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Car Damage Section */}
                    <div className={styles.carDamageSection}>
                      <Input
                        type="switch"
                        label="هل يوجد ملاحظات على الهيكل؟"
                        checked={showCarDamage || currentCarDamage.length > 0}
                        onChange={(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          setShowCarDamage(checked);
                          if (!checked) {
                            // Clear car damage when toggle is off
                            setSpecField('car_damage', undefined);
                            saveDraft();
                          }
                        }}
                      />
                      <Text variant="small" color="secondary">
                        حدد الأجزاء المدهونة أو المُستبدلة في السيارة
                      </Text>

                      {(showCarDamage || currentCarDamage.length > 0) && (
                        <CarInspection
                          value={currentCarDamage}
                          onChange={handleCarDamageChange}
                        />
                      )}
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Other Dynamic Groups */}
              {otherGroups.map((group, idx) => {
                const stepId = `group_${idx}`;
                if (currentStep?.id !== stepId) return null;

                return (
                  <WizardStep
                    key={stepId}
                    number={currentStepIndex + 1}
                    title={group.name}
                    status={sectionInfo[group.name]?.status || 'incomplete'}
                    hasError={sectionInfo[group.name]?.hasError}
                    hasRequiredFields={group.attributes.some(a => a.validation === 'REQUIRED')}
                    filledCount={sectionInfo[group.name]?.filledCount}
                    totalCount={sectionInfo[group.name]?.totalCount}
                    isActive={true}
                    animationDirection={animationDirection}
                    onPrevious={goToPrevStep}
                    onCancel={handleCancelClick}
                    onNext={goToNextStep}
                    isFirstStep={false}
                    isLastStep={false}
                  >
                    {renderDynamicGroup(group)}
                  </WizardStep>
                );
              })}

              {/* Location Step */}
              {currentStep?.id === 'location' && (
                <WizardStep
                  number={currentStepIndex + 1}
                  title="الموقع"
                  status={sectionInfo.location.status}
                  hasError={sectionInfo.location.hasError}
                  hasRequiredFields
                  filledCount={sectionInfo.location.filledCount}
                  totalCount={sectionInfo.location.totalCount}
                  isActive={true}
                  animationDirection={animationDirection}
                  onPrevious={goToPrevStep}
                  onCancel={handleCancelClick}
                  onNext={goToNextStep}
                  isFirstStep={false}
                  isLastStep={false}
                >
                  <div className={styles.formFields}>
                    <div className={styles.formRow}>
                      <Input
                        type="select"
                        label="المحافظة"
                        value={formData.location.province}
                        onChange={(e) => {
                          setLocationField('province', e.target.value);
                          saveDraft();
                        }}
                        onBlur={() => handleBlur('province')}
                        options={[
                          { value: '', label: '-- اختر المحافظة --' },
                          ...provinces.map(p => ({ value: p.key, label: p.nameAr })),
                        ]}
                        error={getError('province', !formData.location.province ? 'المحافظة مطلوبة' : undefined)}
                        required
                      />

                      <Input
                        type="text"
                        label="المدينة"
                        placeholder="اختياري"
                        value={formData.location.city}
                        onChange={(e) => setLocationField('city', e.target.value)}
                        onBlur={() => {
                          handleBlur('city');
                          saveDraft();
                        }}
                      />
                    </div>

                    <Input
                      type="text"
                      label="المنطقة"
                      placeholder="اختياري"
                      value={formData.location.area}
                      onChange={(e) => setLocationField('area', e.target.value)}
                      onBlur={() => {
                        handleBlur('area');
                        saveDraft();
                      }}
                    />

                    <div className={styles.locationLinkRow}>
                      <Input
                        type="text"
                        label="رابط الخريطة"
                        placeholder="https://maps.google.com/..."
                        value={formData.location.link}
                        onChange={(e) => setLocationField('link', e.target.value)}
                        onBlur={() => {
                          handleBlur('link');
                          saveDraft();
                        }}
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
                                setLocationField('link', mapsLink);
                                saveDraft();
                                addNotification({
                                  type: 'success',
                                  title: 'تم تحديد الموقع',
                                  message: 'تم إضافة رابط موقعك الحالي',
                                  duration: 3000,
                                });
                              },
                              (err) => {
                                addNotification({
                                  type: 'error',
                                  title: 'خطأ في تحديد الموقع',
                                  message: err.code === 1
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
                        <MapPin size={16} />
                        موقعي الحالي
                      </Button>
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Preview Step */}
              {currentStep?.id === 'preview' && (
                <WizardStep
                  number={currentStepIndex + 1}
                  title="معاينة ونشر"
                  status="complete"
                  hasRequiredFields={false}
                  isActive={true}
                  animationDirection={animationDirection}
                  onPrevious={goToPrevStep}
                  onCancel={handleCancelClick}
                  isFirstStep={false}
                  isLastStep={true}
                  rightAction={
                    <SubmitButton
                      type="submit"
                      isLoading={isSubmitting}
                      isSuccess={!!success}
                      isError={!!error}
                    >
                      نشر الإعلان
                    </SubmitButton>
                  }
                >
                  <div className={styles.previewSection}>
                    <Text variant="h4" className={styles.previewTitle}>مراجعة الإعلان قبل النشر</Text>

                    <div className={styles.previewCard}>
                      {/* Images Preview */}
                      {formData.images.length > 0 && (
                        <div className={styles.previewImages}>
                          <img
                            src={formData.images[0].url}
                            alt={formData.title}
                            className={styles.mainImage}
                          />
                          {formData.images.length > 1 && (
                            <div className={styles.thumbnailRow}>
                              {formData.images.slice(1, 5).map((img, idx) => (
                                <img
                                  key={img.id}
                                  src={img.url}
                                  alt={`صورة ${idx + 2}`}
                                  className={styles.thumbnail}
                                />
                              ))}
                              {formData.images.length > 5 && (
                                <div className={styles.moreImages}>
                                  +{formData.images.length - 5}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Title & Price */}
                      <div className={styles.previewHeader}>
                        <Text variant="h3">{formData.title || 'بدون عنوان'}</Text>
                        <Text variant="h3" color="primary" className={styles.previewPrice}>
                          {formData.priceMinor > 0
                            ? `${CURRENCY_SYMBOLS[preferredCurrency]} ${Math.round(formData.priceMinor * getRate('USD', preferredCurrency)).toLocaleString('en-US')}`
                            : 'السعر غير محدد'}
                        </Text>
                      </div>

                      {/* Description */}
                      {formData.description && (
                        <div className={styles.previewDescription}>
                          <Text variant="small" color="secondary">الوصف:</Text>
                          <Text variant="paragraph">{formData.description}</Text>
                        </div>
                      )}

                      {/* Specs Summary */}
                      <div className={styles.previewSpecs}>
                        <Text variant="small" color="secondary">المواصفات:</Text>
                        <div className={styles.specsList}>
                          {Object.entries(formData.specs).filter(([key, value]) => value && !key.startsWith('_')).map(([key, value]) => {
                            const attr = attributes.find(a => a.key === key);
                            if (!attr) return null;
                            let displayValue = value;
                            if (key === 'brandId') {
                              displayValue = brands.find(b => b.id === value)?.name || value;
                            } else if (key === 'modelId') {
                              // Show variant name if selected, otherwise model name
                              const variantId = formData.specs.variantId;
                              if (variantId) {
                                const variant = variants.find(v => v.id === variantId);
                                const model = models.find(m => m.id === value);
                                displayValue = variant ? `${model?.name || ''} ${variant.name}` : (model?.name || value);
                              } else {
                                displayValue = models.find(m => m.id === value)?.name || value;
                              }
                            } else if (key === 'variantId') {
                              // Skip variantId in preview - already shown with modelId
                              return null;
                            } else if (attr.options && attr.options.length > 0) {
                              const opt = attr.options.find(o => o.key === value);
                              displayValue = opt?.value || value;
                            }
                            return (
                              <div key={key} className={styles.specItem}>
                                <Text variant="small" color="secondary">{attr.name}:</Text>
                                <Text variant="small">{String(displayValue)}</Text>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Location */}
                      <div className={styles.previewLocation}>
                        <Text variant="small" color="secondary">الموقع:</Text>
                        <Text variant="paragraph">
                          {provinces.find(p => p.key === formData.location.province)?.nameAr || formData.location.province}
                          {formData.location.city && ` - ${formData.location.city}`}
                          {formData.location.area && ` - ${formData.location.area}`}
                        </Text>
                      </div>
                    </div>

                    <Text variant="small" color="secondary" className={styles.previewNote}>
                      سيتم مراجعة إعلانك من قبل فريقنا قبل النشر. عادة ما تستغرق المراجعة أقل من دقيقتين.
                    </Text>
                  </div>
                </WizardStep>
              )}
            </div>

            {/* Mobile Action Bar - outside steps (all buttons in one row) */}
            <div className={styles.mobileActionBar}>
              {currentStepIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPrevStep}
                  className={styles.mobilePrevButton}
                >
                  <span className={styles.mobilePrevIcon}>
                    <ArrowRight size={18} />
                  </span>
                  السابق
                </Button>
              )}
              <Button
                type="button"
                variant="danger"
                onClick={handleCancelClick}
                icon={<Trash2 size={16} />}
              >
                إلغاء
              </Button>
              {currentStep?.id === 'preview' ? (
                <SubmitButton
                  type="submit"
                  isLoading={isSubmitting}
                  isSuccess={!!success}
                  isError={!!error}
                >
                  نشر الإعلان
                </SubmitButton>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={goToNextStep}
                  arrow
                >
                  التالي
                </Button>
              )}
            </div>

            <ListingSubmitLoader isVisible={isSubmitting} />
          </Form>
        </div>
      </Container>

      {/* Cancel Confirmation Modal */}
      <Modal
        isVisible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="إلغاء الإعلان"
        maxWidth="md"
      >
        <div className={styles.cancelModal}>
          <Text variant="paragraph">
            هل أنت متأكد من إلغاء الإعلان؟
          </Text>
          <Text variant="small" color="secondary">
            سيتم حذف المسودة وجميع الصور والفيديوهات المرفوعة نهائياً.
          </Text>
          <div className={styles.cancelModalActions}>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              متابعة التعديل
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
            >
              إلغاء وحذف المسودة
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
