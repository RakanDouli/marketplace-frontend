'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, ImageUploadGrid, Form, SubmitButton, FormSection, MobileBackButton } from '@/components/slices';
import type { FormSectionStatus } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { GET_BRANDS_QUERY, GET_MODELS_QUERY } from '@/stores/createListingStore/createListing.gql';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import {
  validateListingForm,
  hasValidationErrors,
  validateAttribute,
  ListingValidationConfig,
  type ValidationErrors,
} from '@/lib/validation/listingValidation';
import { MapPin, ArrowLeft } from 'lucide-react';
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
  const { user, userPackage, isLoading: isAuthLoading } = useUserAuthStore();
  const { provinces } = useMetadataStore();
  const { addNotification } = useNotificationStore();
  const {
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

  // Expanded sections state - default first section open
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basicInfo: true,
    media: false,
    brandModel: false,
    location: false,
  });

  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Find brand and model attributes from fetched attributes
  const brandAttribute = attributes.find(attr => attr.key === 'brandId');
  const modelAttribute = attributes.find(attr => attr.key === 'modelId');

  // Find column-stored global attributes (listingType, condition)
  const listingTypeAttribute = attributes.find(attr => attr.key === 'listingType');
  const conditionAttribute = attributes.find(attr => attr.key === 'condition');

  // Section status and field counts
  // - status: 'incomplete' | 'required' | 'complete'
  // - filledCount / totalCount: for X/Y display
  // - hasError: true when touched but required fields missing
  interface SectionInfo {
    status: FormSectionStatus;
    filledCount: number;
    totalCount: number;
    hasError: boolean;
  }

  const sectionInfo: Record<string, SectionInfo> = useMemo(() => {
    // Helper to determine status
    const getStatus = (requiredFilled: boolean, allFilled: boolean): FormSectionStatus => {
      if (!requiredFilled) return 'incomplete';
      if (allFilled) return 'complete';
      return 'required';
    };

    // Section 1: Basic Info (title*, price*, description)
    const titleFilled = formData.title.trim().length >= ListingValidationConfig.title.minLength;
    const priceFilled = formData.priceMinor > 0;
    const descriptionFilled = formData.description.trim().length > 0;
    const basicInfoRequired = titleFilled && priceFilled;
    const basicInfoAll = basicInfoRequired && descriptionFilled;
    const basicInfoFilled = [titleFilled, priceFilled, descriptionFilled].filter(Boolean).length;
    // Error if touched but required not filled
    const basicInfoError = (touched.title && !titleFilled) || (touched.price && !priceFilled);

    // Section 2: Media (images*, video)
    const imagesRequired = formData.images.length >= ListingValidationConfig.images.min;
    const videoFilled = formData.video.length > 0;
    const mediaAll = imagesRequired && (!videoAllowed || videoFilled);
    const mediaTotal = videoAllowed ? 2 : 1;
    const mediaFilled = [imagesRequired, videoFilled].filter(Boolean).length;
    const mediaError = touched.images && !imagesRequired;

    // Section 3: Brand & Model
    const brandRequired = brandAttribute?.validation === 'REQUIRED';
    const modelRequired = modelAttribute?.validation === 'REQUIRED';
    const brandFilled = !!formData.specs.brandId;
    const modelFilled = !!formData.specs.modelId;
    const brandModelRequiredOk = brands.length === 0 || (
      (!brandRequired || brandFilled) &&
      (!modelRequired || !brandFilled || modelFilled)
    );
    const brandModelAll = brands.length === 0 || (brandFilled && modelFilled);
    const brandModelFilled = [brandFilled, modelFilled].filter(Boolean).length;
    const brandModelError = (touched.brandId && brandRequired && !brandFilled) ||
      (touched.modelId && modelRequired && brandFilled && !modelFilled);

    // Section 4+: Dynamic attribute groups
    const attributeGroupsInfo: Record<string, SectionInfo> = {};
    attributeGroups.forEach((group) => {
      const groupAttrs = group.attributes.filter(attr => attr.key !== 'brandId' && attr.key !== 'modelId');

      const requiredFilled = groupAttrs.every(attr => {
        if (attr.validation !== 'REQUIRED') return true;
        const value = formData.specs[attr.key];
        return value !== undefined && value !== null && value !== '';
      });

      let filledCount = 0;
      let hasGroupError = false;
      groupAttrs.forEach(attr => {
        const value = formData.specs[attr.key];
        if (value !== undefined && value !== null && value !== '') {
          filledCount++;
        }
        // Check if touched and required but empty
        if (touched[`spec_${attr.key}`] && attr.validation === 'REQUIRED' && !value) {
          hasGroupError = true;
        }
      });

      const allFilled = filledCount === groupAttrs.length;

      attributeGroupsInfo[group.name] = {
        status: getStatus(requiredFilled, allFilled),
        filledCount,
        totalCount: groupAttrs.length,
        hasError: hasGroupError,
      };
    });

    // Section: Location (province*, city, area)
    const provinceRequired = !!formData.location.province;
    const cityFilled = !!formData.location.city;
    const areaFilled = !!formData.location.area;
    const locationAll = provinceRequired && cityFilled && areaFilled;
    const locationFilled = [provinceRequired, cityFilled, areaFilled].filter(Boolean).length;
    const locationError = touched.province && !provinceRequired;

    return {
      basicInfo: { status: getStatus(basicInfoRequired, basicInfoAll), filledCount: basicInfoFilled, totalCount: 3, hasError: basicInfoError },
      media: { status: getStatus(imagesRequired, mediaAll), filledCount: mediaFilled, totalCount: mediaTotal, hasError: mediaError },
      brandModel: { status: getStatus(brandModelRequiredOk, brandModelAll), filledCount: brandModelFilled, totalCount: 2, hasError: brandModelError },
      location: { status: getStatus(provinceRequired, locationAll), filledCount: locationFilled, totalCount: 3, hasError: locationError },
      ...attributeGroupsInfo,
    };
  }, [formData, attributes, attributeGroups, brands.length, brandAttribute, modelAttribute, videoAllowed, touched]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Auth guard
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  // Redirect if no category selected
  useEffect(() => {
    if (!formData.categoryId) {
      router.push('/dashboard/listings/create');
    }
  }, [formData.categoryId, router]);

  // Fetch provinces if not already loaded
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
          // Bypass cache to get fresh brand list
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
    // Don't fetch models if brand is temporary (not yet created in DB)
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
      setModels([]); // Clear models if brand is temp or empty
    }
  }, [formData.specs.brandId]);

  if (isAuthLoading || !user || !formData.categoryId) {
    return null;
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getError = (field: string, errorMessage?: string) => {
    return touched[field] ? errorMessage : undefined;
  };

  // Comprehensive validation function using Zod
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    // 1. Validate core listing fields using Zod
    const validationErrors = validateListingForm(formData);

    const errors: string[] = [];

    // Convert validation errors object to array of messages
    Object.entries(validationErrors).forEach(([field, message]) => {
      if (message) {
        errors.push(message);
      }
    });

    // 2. Validate dynamic attributes (specs only, not column-based attributes)
    attributes.forEach(attr => {
      // Skip attributes stored as columns (title, price, accountType) - they're validated by Zod
      if (attr.storageType === 'column') {
        return;
      }

      // Validate using the attribute validator from listingValidation.ts
      const value = formData.specs[attr.key];
      const attrError = validateAttribute(value, {
        key: attr.key,
        name: attr.name,
        validation: attr.validation,
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
    e.stopPropagation();

    // Mark all fields as touched to show errors
    const allFields: Record<string, boolean> = {
      title: true,
      price: true,
      images: true,
      province: true,
    };

    // Mark all spec fields as touched
    attributes.forEach(attr => {
      allFields[attr.key] = true;
      allFields[`spec_${attr.key}`] = true;
    });

    setTouched(allFields);

    // Validate form
    const validation = validateForm();

    if (!validation.isValid) {
      // Show validation errors to user
      setValidationError(`يرجى ملء جميع الحقول المطلوبة:\n${validation.errors.join('\n')}`);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; // Stop submission
    }

    // Clear any previous errors
    setValidationError('');
    setSuccess('');

    try {
      await submitListing();
      // Only show success if no error occurred
      if (!error) {
        // Show success toast
        addNotification({
          type: 'success',
          title: 'نجح',
          message: 'تم إنشاء الإعلان بنجاح',
          duration: 5000,
        });
        setSuccess('تم استلام إعلانك! جاري المراجعة والنشر خلال دقيقتين...');
        // Wait 2 seconds to show success message, then redirect
        setTimeout(() => {
          router.push('/dashboard/listings');
        }, 2000);
      }
    } catch (err: any) {
      // Error is already set in store, Form component will display it
    }
  };

  const handleCancel = () => {
    const confirm = window.confirm('هل أنت متأكد من إلغاء الإعلان؟ سيتم فقدان جميع البيانات المدخلة.');
    if (confirm) {
      reset();
      router.push('/dashboard/listings');
    }
  };

  // Handle creating a new brand - Just store the name (backend handles creation & formatting)
  const handleCreateBrand = (brandName: string) => {
    // Create a temporary brand object for the dropdown UI
    const tempBrand: Brand = {
      id: `temp_${brandName}`,
      name: brandName,
      slug: brandName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };

    // Add to brands list so user can see it in dropdown
    setBrands(prev => [...prev, tempBrand]);

    // Store temp ID and raw name (backend will format and create brand)
    setFormField('specs', {
      ...formData.specs,
      brandId: tempBrand.id,
      _brandName: brandName,
    });
  };

  // Handle creating a new model - Just store the name (backend handles creation & formatting)
  const handleCreateModel = (modelName: string) => {
    // Create a temporary model object for the dropdown UI
    const tempModel: Model = {
      id: `temp_${modelName}`,
      name: modelName,
      slug: modelName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };

    // Add to models list so user can see it in dropdown
    setModels(prev => [...prev, tempModel]);

    // Store temp ID and raw name (backend will format and create model)
    setFormField('specs', {
      ...formData.specs,
      modelId: tempModel.id,
      _modelName: modelName,
    });
  };

  // Calculate section number dynamically
  let sectionNumber = 0;

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

      <Container className={styles.container}>
        <div className={styles.detailsPage}>
          <div className={styles.header}>
            <Text variant="h1">أكمل تفاصيل إعلانك</Text>
          </div>

          <Form onSubmit={handleSubmit} error={validationError || error || undefined} success={success || undefined}>
            <div className={styles.sectionsContainer}>
              {/* Section 1: Basic Info */}
              <FormSection
                number={++sectionNumber}
                title="معلومات الإعلان"
                status={sectionInfo.basicInfo.status}
                filledCount={sectionInfo.basicInfo.filledCount}
                totalCount={sectionInfo.basicInfo.totalCount}
                hasError={sectionInfo.basicInfo.hasError}
                isExpanded={expandedSections.basicInfo}
                onToggle={() => toggleSection('basicInfo')}
              >
                <div className={styles.formFields}>
                  {/* Title */}
                  <Input
                    type="text"
                    label="عنوان الإعلان"
                    placeholder="مثال: تويوتا كامري 2020 فل كامل"
                    value={formData.title}
                    onChange={(e) => setFormField('title', e.target.value)}
                    onBlur={() => handleBlur('title')}
                    error={getError('title', !formData.title.trim() ? 'العنوان مطلوب' : undefined)}
                    maxLength={ListingValidationConfig.title.maxLength}
                    required
                  />

                  {/* Description */}
                  <Input
                    type="textarea"
                    label="الوصف"
                    placeholder="أضف وصفاً تفصيلياً عن المنتج..."
                    value={formData.description}
                    onChange={(e) => setFormField('description', e.target.value)}
                    maxLength={ListingValidationConfig.description.maxLength}
                    rows={6}
                  />

                  {/* Price */}
                  <Input
                    type="price"
                    label="السعر"
                    value={formData.priceMinor}
                    onChange={(e) => setFormField('priceMinor', parseInt(e.target.value) || 0)}
                    error={getError('price', formData.priceMinor <= 0 ? 'السعر مطلوب' : undefined)}
                    required
                  />

                  {/* Bidding Toggle - Separate line */}
                  <Input
                    type="switch"
                    label="السماح بالمزايدة"
                    checked={formData.allowBidding}
                    onChange={(e) => setFormField('allowBidding', (e.target as HTMLInputElement).checked)}
                  />

                  {/* Bidding Start Price (conditional) - Uses same currency as main price */}
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

                  {/* Listing Type - Sale/Rent (column-stored global attribute) */}
                  {listingTypeAttribute && (
                    <Input
                      type="select"
                      label={listingTypeAttribute.name}
                      value={formData.listingType}
                      onChange={(e) => setFormField('listingType', e.target.value)}
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
                    />
                  )}

                  {/* Condition - New/Used (column-stored global attribute) */}
                  {conditionAttribute && (
                    <Input
                      type="select"
                      label={conditionAttribute.name}
                      value={formData.condition}
                      onChange={(e) => setFormField('condition', e.target.value)}
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
                    />
                  )}
                </div>
              </FormSection>

              {/* Section 2: Photos & Video */}
              <FormSection
                number={++sectionNumber}
                title={videoAllowed ? 'الصور والفيديو' : 'الصور'}
                status={sectionInfo.media.status}
                filledCount={sectionInfo.media.filledCount}
                totalCount={sectionInfo.media.totalCount}
                hasError={sectionInfo.media.hasError}
                isExpanded={expandedSections.media}
                onToggle={() => toggleSection('media')}
              >
                <div className={styles.formFields}>
                  <Text variant="small" color="secondary" style={{ marginBottom: '8px' }}>
                    الحد الأدنى {ListingValidationConfig.images.min} صورة - مطلوب
                  </Text>
                  <ImageUploadGrid
                    images={formData.images}
                    onChange={(images) => {
                      setFormField('images', images);
                      setTouched({ ...touched, images: true });
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
                  />
                  {touched.images && formData.images.length < ListingValidationConfig.images.min && (
                    <Text variant="small" color="error">
                      يجب إضافة {ListingValidationConfig.images.min} صورة على الأقل
                    </Text>
                  )}

                  {/* Video Upload - Only for users with videoAllowed permission */}
                  {videoAllowed && (
                    <div className={styles.videoSection}>
                      <Text variant="h4" className={styles.videoLabel}>
                        الفيديو (اختياري) - ({formData.video.length}/1)
                      </Text>
                      <Text variant="small" color="secondary" className={styles.videoHint}>
                        الحد الأقصى 20 ميجابايت - MP4 فقط (30-45 ثانية)
                      </Text>
                      <ImageUploadGrid
                        images={formData.video}
                        onChange={(video) => setFormField('video', video)}
                        maxImages={1}
                        maxSize={20 * 1024 * 1024} // 20MB for video
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

              {/* Section 3: Brand & Model (conditional) */}
              {brands.length > 0 && (
                <FormSection
                  number={++sectionNumber}
                  title="العلامة التجارية والموديل"
                  status={sectionInfo.brandModel.status}
                  filledCount={sectionInfo.brandModel.filledCount}
                  totalCount={sectionInfo.brandModel.totalCount}
                  hasError={sectionInfo.brandModel.hasError}
                  isExpanded={expandedSections.brandModel}
                  onToggle={() => toggleSection('brandModel')}
                >
                  <div className={styles.formFields}>
                    <div className={styles.formRow}>
                      {/* Brand Selector */}
                      <Input
                        type="select"
                        label="العلامة التجارية"
                        value={formData.specs.brandId || ''}
                        onChange={(e) => {
                          setSpecField('brandId', e.target.value);
                          // Clear model when brand changes
                          setSpecField('modelId', '');
                        }}
                        onBlur={() => handleBlur('brandId')}
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
                        required={brandAttribute?.validation === 'REQUIRED'}
                        error={getError('brandId',
                          brandAttribute?.validation === 'REQUIRED' && !formData.specs.brandId
                            ? `${brandAttribute.name} مطلوب`
                            : undefined
                        )}
                      />

                      {/* Model Selector (appears after brand is selected) */}
                      {formData.specs.brandId && (
                        <Input
                          type="select"
                          label="الموديل"
                          value={formData.specs.modelId || ''}
                          onChange={(e) => setSpecField('modelId', e.target.value)}
                          onBlur={() => handleBlur('modelId')}
                          options={[
                            { value: '', label: '-- اختر الموديل --' },
                            ...models
                              .filter(m => m.isActive)
                              .map(model => ({
                                value: model.id,
                                label: model.name,
                              })),
                          ]}
                          disabled={isLoadingModels}
                          searchable
                          creatable
                          isLoading={isLoadingModels}
                          onCreateOption={handleCreateModel}
                          required={modelAttribute?.validation === 'REQUIRED'}
                          error={getError('modelId',
                            modelAttribute?.validation === 'REQUIRED' && !formData.specs.modelId
                              ? `${modelAttribute.name} مطلوب`
                              : undefined
                          )}
                        />
                      )}
                    </div>
                  </div>
                </FormSection>
              )}

              {/* Section 4+: Dynamic Attribute Groups */}
              {attributeGroups.length > 0 && attributeGroups.map((group) => {
                // Filter out brand/model from display
                const groupAttributes = group.attributes.filter(attr => attr.key !== 'brandId' && attr.key !== 'modelId');
                if (groupAttributes.length === 0) return null;

                // Initialize expanded state for this group if not exists
                if (expandedSections[group.name] === undefined) {
                  expandedSections[group.name] = false;
                }

                const groupInfo = sectionInfo[group.name] ?? { status: 'complete' as FormSectionStatus, filledCount: 0, totalCount: 0, hasError: false };

                return (
                  <FormSection
                    key={group.name}
                    number={++sectionNumber}
                    title={group.name}
                    status={groupInfo.status}
                    filledCount={groupInfo.filledCount}
                    totalCount={groupInfo.totalCount}
                    hasError={groupInfo.hasError}
                    isExpanded={expandedSections[group.name]}
                    onToggle={() => toggleSection(group.name)}
                  >
                    <div className={styles.specsGrid}>
                      {groupAttributes.map((attribute) => (
                        <div key={attribute.key}>
                          {renderAttributeField({
                            attribute,
                            value: formData.specs[attribute.key],
                            onChange: (value) => setSpecField(attribute.key, value),
                            error: touched[`spec_${attribute.key}`] && attribute.validation === 'REQUIRED' && !formData.specs[attribute.key]
                              ? `${attribute.name} مطلوب`
                              : undefined,
                          })}
                        </div>
                      ))}
                    </div>
                  </FormSection>
                );
              })}

              {/* Section: Location */}
              <FormSection
                number={++sectionNumber}
                title="الموقع"
                status={sectionInfo.location.status}
                filledCount={sectionInfo.location.filledCount}
                totalCount={sectionInfo.location.totalCount}
                hasError={sectionInfo.location.hasError}
                isExpanded={expandedSections.location}
                onToggle={() => toggleSection('location')}
              >
                <div className={styles.formFields}>
                  <div className={styles.formRow}>
                    <Input
                      type="select"
                      label="المحافظة"
                      value={formData.location.province}
                      onChange={(e) => setLocationField('province', e.target.value)}
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
                    />
                  </div>

                  <Input
                    type="text"
                    label="المنطقة"
                    placeholder="اختياري"
                    value={formData.location.area}
                    onChange={(e) => setLocationField('area', e.target.value)}
                  />

                  <div className={styles.locationLinkRow}>
                    <Input
                      type="text"
                      label="رابط الخريطة"
                      placeholder="https://maps.google.com/..."
                      value={formData.location.link}
                      onChange={(e) => setLocationField('link', e.target.value)}
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
            {/* Inline loader - shows during submission */}
            <ListingSubmitLoader isVisible={isSubmitting} />

            {/* Sticky Actions */}
            <div className={styles.stickyActions}>
              <div className={styles.leftActions}>
                <Button variant="outline" onClick={handleCancel}>
                  إلغاء
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
