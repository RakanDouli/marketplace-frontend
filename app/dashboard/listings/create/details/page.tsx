'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Button, ImageUploadGrid, Form, SubmitButton, FormSection, MobileBackButton } from '@/components/slices';
import type { FormSectionStatus } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { GET_BRANDS_QUERY, GET_MODELS_QUERY, GET_MODEL_SUGGESTION_QUERY } from '@/stores/createListingStore/createListing.gql';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import {
  validateListingForm,
  hasValidationErrors,
  validateAttribute,
  validateTitle,
  validateDescription,
  validatePriceMinor,
  ListingValidationConfig,
  type ValidationErrors,
} from '@/lib/validation/listingValidation';
import { MapPin, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ListingSubmitLoader } from '@/components/ListingSubmitLoader';
import styles from '../CreateListing.module.scss';

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


export default function CreateListingDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId');

  const { user, userPackage, isLoading: isAuthLoading } = useUserAuthStore();
  const { provinces } = useMetadataStore();
  const { addNotification } = useNotificationStore();
  const {
    draftId,
    formData,
    attributes,
    attributeGroups,
    isLoadingAttributes,
    isSubmitting,
    isDraftSaving,
    lastSavedAt,
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
  const [showPreview, setShowPreview] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadingImageIds, setUploadingImageIds] = useState<Set<string>>(new Set());
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Model suggestion specs - used to filter dropdown options
  // Each field contains an array of valid options for the selected brand+model+year
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

  // Note: Section expansion is now handled internally by Collapsible component
  // Using defaultExpanded prop for initial state


  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Find brand and model attributes
  const brandAttribute = attributes.find(attr => attr.key === 'brandId');
  const modelAttribute = attributes.find(attr => attr.key === 'modelId');

  // Find column-stored global attributes
  const listingTypeAttribute = attributes.find(attr => attr.key === 'listingType');
  const conditionAttribute = attributes.find(attr => attr.key === 'condition');

  // Section status info with counts
  interface SectionInfo {
    status: FormSectionStatus;
    hasError: boolean;
    filledCount: number;
    totalCount: number;
  }

  const sectionInfo: Record<string, SectionInfo> = useMemo(() => {
    // Status: incomplete (required missing), required (required filled), complete (all filled)
    const getStatus = (requiredFilled: boolean, allFilled: boolean): FormSectionStatus => {
      if (!requiredFilled) return 'incomplete';
      if (allFilled) return 'complete';
      return 'required';
    };

    // Basic Info - count fields dynamically
    const titleFilled = !validateTitle(formData.title);
    const descriptionFilled = formData.description.trim().length > 0;
    const priceFilled = !validatePriceMinor(formData.priceMinor);
    const listingTypeRequired = listingTypeAttribute?.validation === 'REQUIRED';
    const conditionRequired = conditionAttribute?.validation === 'REQUIRED';
    const listingTypeFilled = !!formData.listingType;
    const conditionFilled = !!formData.condition;

    // Basic info fields: title, description, price, allowBidding, biddingStartPrice (conditional), listingType (conditional), condition (conditional)
    let basicInfoTotal = 3; // title, description, price always present
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

    // Media - count images and video
    const imagesOk = formData.images.length >= ListingValidationConfig.images.min;
    const mediaError = touched.images && !imagesOk;
    const mediaTotal = videoAllowed ? 2 : 1; // images + video (if allowed)
    let mediaFilled = 0;
    if (formData.images.length > 0) mediaFilled++;
    if (videoAllowed && formData.video.length > 0) mediaFilled++;

    // Location - only province is defined in backend, others are hardcoded optional fields
    const provinceFilled = !!formData.location.province;
    const locationError = touched.province && !provinceFilled;
    // TODO: Add city, area, link as backend attributes so admin can control them
    const locationTotal = 4; // province, city, area, link (all rendered in form)
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
          if (brands.length > 0 && brandFilled) {
            groupTotal++;
            if (modelFilled) groupFilled++;
            if (modelRequired && !modelFilled) requiredFilled = false;
            if (!modelFilled) allFilled = false;
            if (touched.modelId && modelRequired && !modelFilled) hasGroupError = true;
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
      };
    });

    // Calculate "all filled" for each section
    const basicInfoAllFilled = basicInfoFilled === basicInfoTotal;
    const mediaAllFilled = mediaFilled === mediaTotal;
    const locationAllFilled = locationFilled === locationTotal;

    return {
      basicInfo: { status: getStatus(basicInfoRequiredOk, basicInfoAllFilled), hasError: basicInfoError, filledCount: basicInfoFilled, totalCount: basicInfoTotal },
      media: { status: getStatus(imagesOk, mediaAllFilled), hasError: mediaError, filledCount: mediaFilled, totalCount: mediaTotal },
      location: { status: getStatus(provinceFilled, locationAllFilled), hasError: locationError, filledCount: locationFilled, totalCount: locationTotal },
      ...attributeGroupsInfo,
    };
  }, [formData, attributes, attributeGroups, brands.length, brandAttribute, modelAttribute, listingTypeAttribute, conditionAttribute, touched, videoAllowed]);


  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Load draft from URL parameter (Continue Draft feature)
  useEffect(() => {
    if (draftIdFromUrl && !draftId && !isLoadingDraft) {
      setIsLoadingDraft(true);
      loadDraft(draftIdFromUrl).finally(() => {
        setIsLoadingDraft(false);
      });
    }
  }, [draftIdFromUrl, draftId, loadDraft, isLoadingDraft]);

  // Redirect if no draft (neither from URL nor from category selection)
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

  // Fetch brands when category is loaded
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

  // Fetch models when brand is selected
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

  // Fetch model suggestions when brand + model + year are selected
  // This populates suggestionSpecs which is used to filter dropdown options
  useEffect(() => {
    const brandId = formData.specs.brandId;
    const modelId = formData.specs.modelId;
    const year = formData.specs.year;

    // Clear suggestions when brand/model changes
    if (!brandId || !modelId || brandId.startsWith('temp_') || modelId.startsWith('temp_')) {
      setSuggestionSpecs(null);
      return;
    }

    const fetchSuggestions = async () => {
      setIsAutoFilling(true);
      try {
        const data = await cachedGraphQLRequest(GET_MODEL_SUGGESTION_QUERY, {
          brandId,
          modelId,
          year: year ? parseInt(String(year)) : null,
        }, { ttl: 0 }); // No cache for fresh data

        const suggestion = (data as any).getModelSuggestion;
        if (suggestion?.specs) {
          const specs = suggestion.specs;

          // Store suggestion specs for filtering dropdowns
          setSuggestionSpecs(specs);

          // Auto-fill fields where there's only ONE option (auto-select)
          const autoFillFields = [
            'fuel_type',
            'transmission',
            'body_type',
            'engine_size',
            'cylinders',
            'seats',
            'doors',
            'drive_type',
          ] as const;

          let filledCount = 0;
          autoFillFields.forEach((field) => {
            const options = specs[field];
            // Only auto-fill if:
            // 1. There's exactly 1 option available
            // 2. The field is currently empty (don't overwrite user changes)
            if (Array.isArray(options) && options.length === 1 && !formData.specs[field]) {
              setSpecField(field, options[0]);
              filledCount++;
            }
          });

          // Auto-fill complete - badge shows "تم التعبئة تلقائياً ✓" in field label
        } else {
          // No suggestions found
          setSuggestionSpecs(null);
        }
      } catch (error) {
        console.error('Error fetching model suggestions:', error);
        setSuggestionSpecs(null);
        // Silent fail - auto-fill is optional
      } finally {
        setIsAutoFilling(false);
      }
    };

    fetchSuggestions();
  }, [formData.specs.brandId, formData.specs.modelId, formData.specs.year, setSpecField, addNotification]);

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
    // Trigger auto-save on blur
    saveDraft();
  };

  const getError = (field: string, errorMessage?: string) => {
    return touched[field] ? errorMessage : undefined;
  };

  // Handle image upload via draft system
  const handleImagesChange = async (images: any[]) => {
    // Find new files to upload
    const existingIds = formData.images.map(img => img.id);
    const newImages = images.filter(img => img.file && !existingIds.includes(img.id));

    // Upload new images
    for (const newImage of newImages) {
      if (newImage.file) {
        // Mark image as uploading
        setUploadingImageIds(prev => new Set([...prev, newImage.id]));
        setIsUploadingImage(true);
        try {
          await uploadAndAddImage(newImage.file);
        } catch (err: any) {
          addNotification({
            type: 'error',
            title: 'خطأ في رفع الصورة',
            message: err.message || 'فشل رفع الصورة',
            duration: 5000,
          });
        } finally {
          // Remove from uploading set
          setUploadingImageIds(prev => {
            const next = new Set(prev);
            next.delete(newImage.id);
            return next;
          });
          setIsUploadingImage(false);
        }
      }
    }

    // Find removed images
    const newIds = images.map(img => img.id);
    const removedImages = formData.images.filter(img => !newIds.includes(img.id));

    // Remove images
    for (const removedImage of removedImages) {
      await removeImage(removedImage.id);
    }

    setTouched({ ...touched, images: true });
  };

  // Merge formData.images with uploading state for display
  const imagesWithUploadState = formData.images.map(img => ({
    ...img,
    isUploading: uploadingImageIds.has(img.id),
  }));

  // Handle video upload via draft system
  const handleVideoChange = async (videos: any[]) => {
    if (videos.length > 0 && videos[0].file) {
      // New video to upload
      setIsUploadingVideo(true);
      try {
        await uploadAndAddVideo(videos[0].file);
      } catch (err: any) {
        addNotification({
          type: 'error',
          title: 'خطأ في رفع الفيديو',
          message: err.message || 'فشل رفع الفيديو',
          duration: 5000,
        });
      } finally {
        setIsUploadingVideo(false);
      }
    } else if (videos.length === 0 && formData.video.length > 0) {
      // Video removed
      await removeVideo();
    }
  };

  // Validation function
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const validationErrors = validateListingForm(formData);
    const errors: string[] = [];

    Object.entries(validationErrors).forEach(([field, message]) => {
      if (message) {
        errors.push(message);
      }
    });

    attributes.forEach(attr => {
      // Skip column and location types - they're handled separately
      if (attr.storageType === 'column' || attr.storageType === 'location') return;

      const value = formData.specs[attr.key];
      const attrError = validateAttribute(value, {
        key: attr.key,
        name: attr.name,
        validation: attr.validation,
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
    e.stopPropagation();

    // Mark all fields as touched
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

    // Validate
    const validation = validateForm();

    if (!validation.isValid) {
      setValidationError(`يرجى ملء جميع الحقول المطلوبة: ${validation.errors.join(' - ')}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCancel = async () => {
    const confirm = window.confirm('هل أنت متأكد من إلغاء الإعلان؟ سيتم حذف المسودة وجميع الصور المرفوعة.');
    if (confirm) {
      await deleteDraft();
      router.push('/dashboard/listings');
    }
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

  let sectionNumber = 0;

  // Separate "اختر السيارة" group from other dynamic groups
  // This group renders BEFORE basic info, other groups render AFTER media
  // Find by group name to be explicit (groupOrder may vary)
  const firstGroup = attributeGroups.find(g => g.name === 'اختر السيارة');
  const otherGroups = attributeGroups.filter(g => g.name !== 'اختر السيارة');

  // Helper function to render a dynamic attribute group
  const renderDynamicGroup = (group: typeof attributeGroups[0], isFirstSection: boolean = false) => {
    const groupAttributes = group.attributes;
    if (groupAttributes.length === 0) return null;

    // Check if this group has brand/model attributes
    const hasBrandModel = groupAttributes.some(attr => attr.key === 'brandId' || attr.key === 'modelId');
    // Skip brand/model group entirely if no brands available for this category
    if (hasBrandModel && brands.length === 0) {
      // Filter out brand/model and check if there are other attributes
      const otherAttrs = groupAttributes.filter(attr => attr.key !== 'brandId' && attr.key !== 'modelId');
      if (otherAttrs.length === 0) return null;
    }

    const groupInfo = sectionInfo[group.name] ?? { status: 'complete' as FormSectionStatus, hasError: false };

    // Check if group has any required attributes
    const hasRequiredFields = groupAttributes.some(attr => attr.validation === 'REQUIRED');

    // Helper function to render brand/model fields as separate grid items
    const renderBrandModelFields = () => {
      if (!hasBrandModel || brands.length === 0) return null;

      return (
        <>
          <Input
            type="select"
            label={brandAttribute?.name || "العلامة التجارية"}
            value={formData.specs.brandId || ''}
            onChange={(e) => {
              setSpecField('brandId', e.target.value);
              setSpecField('modelId', '');
              saveDraft();
            }}
            onBlur={() => handleBlur('brandId')}
            options={[
              { value: '', label: `-- اختر ${brandAttribute?.name || 'العلامة التجارية'} --` },
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
            required={brandAttribute?.validation === 'REQUIRED'}
            error={getError('brandId',
              brandAttribute?.validation === 'REQUIRED' && !formData.specs.brandId
                ? `${brandAttribute?.name || 'العلامة التجارية'} مطلوب`
                : undefined
            )}
            success={!!formData.specs.brandId && !getError('brandId', brandAttribute?.validation === 'REQUIRED' && !formData.specs.brandId ? 'error' : undefined)}
          />

          <Input
            type="select"
            label={modelAttribute?.name || "الموديل"}
            value={formData.specs.modelId || ''}
            onChange={(e) => {
              setSpecField('modelId', e.target.value);
              saveDraft();
            }}
            onBlur={() => handleBlur('modelId')}
            options={[
              { value: '', label: formData.specs.brandId ? `-- اختر ${modelAttribute?.name || 'الموديل'} --` : '-- اختر العلامة التجارية أولاً --' },
              ...models
                .filter(m => m.isActive)
                .map(model => ({
                  value: model.id,
                  label: model.name,
                })),
            ]}
            disabled={!formData.specs.brandId || isLoadingModels}
            searchable={!!formData.specs.brandId}
            creatable={!!formData.specs.brandId}
            isLoading={isLoadingModels}
            onCreateOption={handleCreateModel}
            required={modelAttribute?.validation === 'REQUIRED'}
            error={getError('modelId',
              modelAttribute?.validation === 'REQUIRED' && !formData.specs.modelId
                ? `${modelAttribute?.name || 'الموديل'} مطلوب`
                : undefined
            )}
            success={!!formData.specs.modelId && !getError('modelId', modelAttribute?.validation === 'REQUIRED' && !formData.specs.modelId ? 'error' : undefined)}
          />
        </>
      );
    };

    // Filter out brand/model for regular rendering (they're rendered specially)
    const regularAttributes = hasBrandModel
      ? groupAttributes.filter(attr => attr.key !== 'brandId' && attr.key !== 'modelId')
      : groupAttributes;

    return (
      <FormSection
        key={group.name}
        number={++sectionNumber}
        title={group.name}
        status={groupInfo.status}
        hasError={groupInfo.hasError}
        hasRequiredFields={hasRequiredFields}
        defaultExpanded={isFirstSection}
        filledCount={groupInfo.filledCount}
        totalCount={groupInfo.totalCount}
      >
        <div className={styles.specsGrid}>
          {/* Render brand/model first if present */}
          {renderBrandModelFields()}

          {/* Render other attributes */}
          {regularAttributes.map((attribute) => {
            // Get suggested values from model_suggestions specs for this attribute
            // These are shown as hints below the dropdown (all options remain visible)
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
      </FormSection>
    );
  };

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
          icon={<ArrowLeft size={18} />}
        >
          عودة لاختيار الفئة
        </Button>
      </div>

      <Container innerPadding='none' paddingX='none'>
        <div className={styles.detailsPage}>
          <div className={styles.header}>
            <Text variant="h1">أكمل تفاصيل إعلانك</Text>
            {/* Auto-save indicator */}
            {isDraftSaving && (
              <div className={styles.savingIndicator}>
                <Loader2 className={styles.spinner} size={14} />
                <Text variant="small" color="secondary">جاري الحفظ...</Text>
              </div>
            )}
            {lastSavedAt && !isDraftSaving && (
              <Text variant="small" color="secondary">
                آخر حفظ: {lastSavedAt.toLocaleTimeString('ar-EG')}
              </Text>
            )}
          </div>

          <Form onSubmit={handleSubmit} error={validationError || error || undefined} success={success || undefined}>
            <div className={styles.sectionsContainer}>
              {/* Section 1: First Dynamic Group (اختر السيارة - groupOrder 1) */}
              {firstGroup && renderDynamicGroup(firstGroup, true)}

              {/* Section 2: Basic Info */}
              <FormSection
                number={++sectionNumber}
                title="معلومات الإعلان"
                status={sectionInfo.basicInfo.status}
                hasError={sectionInfo.basicInfo.hasError}
                hasRequiredFields
                defaultExpanded={!firstGroup}
                filledCount={sectionInfo.basicInfo.filledCount}
                totalCount={sectionInfo.basicInfo.totalCount}
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
                          .map(opt => ({
                            value: opt.key,
                            label: opt.value,
                          }))
                      ]}
                      required={listingTypeAttribute.validation === 'REQUIRED'}
                      error={getError('listingType',
                        listingTypeAttribute.validation === 'REQUIRED' && !formData.listingType
                          ? `${listingTypeAttribute.name} مطلوب`
                          : undefined
                      )}
                      success={!!formData.listingType && !getError('listingType', undefined)}
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
                          .map(opt => ({
                            value: opt.key,
                            label: opt.value,
                          }))
                      ]}
                      required={conditionAttribute.validation === 'REQUIRED'}
                      error={getError('condition',
                        conditionAttribute.validation === 'REQUIRED' && !formData.condition
                          ? `${conditionAttribute.name} مطلوب`
                          : undefined
                      )}
                      success={!!formData.condition && !getError('condition', undefined)}
                    />
                  )}
                </div>
              </FormSection>

              {/* Section 2: Photos & Video */}
              <FormSection
                number={++sectionNumber}
                title={videoAllowed ? 'الصور والفيديو' : 'الصور'}
                status={sectionInfo.media.status}
                hasError={sectionInfo.media.hasError}
                hasRequiredFields
                defaultExpanded={false}
                filledCount={sectionInfo.media.filledCount}
                totalCount={sectionInfo.media.totalCount}
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
                        images={formData.video}
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
                </div>
              </FormSection>

              {/* Remaining Dynamic Attribute Groups (groupOrder 2+) */}
              {otherGroups.map((group) => renderDynamicGroup(group, false))}

              {/* Location Section */}
              <FormSection
                number={++sectionNumber}
                title="الموقع"
                status={sectionInfo.location.status}
                hasError={sectionInfo.location.hasError}
                hasRequiredFields
                defaultExpanded={false}
                filledCount={sectionInfo.location.filledCount}
                totalCount={sectionInfo.location.totalCount}
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
                      <MapPin size={16} />
                      موقعي الحالي
                    </Button>
                  </div>
                </div>
              </FormSection>
            </div>

            <ListingSubmitLoader isVisible={isSubmitting} />

            {/* Sticky Actions */}
            <div className={styles.stickyActions}>
              <div className={styles.leftActions}>
                <Button variant="outline" onClick={handleCancel}>
                  إلغاء وحذف المسودة
                </Button>
              </div>

              <div className={styles.rightActions}>
                <SubmitButton
                  type="submit"
                  isLoading={isSubmitting}
                  isSuccess={!!success}
                  isError={!!error}
                >
                  نشر الإعلان
                </SubmitButton>
              </div>
            </div>
          </Form>
        </div>
      </Container>
    </>
  );
}
