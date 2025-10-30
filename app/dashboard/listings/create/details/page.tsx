'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, ImageUploadGrid, Form, SubmitButton } from '@/components/slices';
import Text from '@/components/slices/Text/Text';
import { Input } from '@/components/slices/Input/Input';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useCreateListingStore } from '@/stores/createListingStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { ChevronLeft } from 'lucide-react';
import styles from '../CreateListing.module.scss';

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

  // Get subscription limits
  const maxImagesAllowed = userPackage?.userSubscription?.maxImagesPerListing || 5;
  const videoAllowed = userPackage?.userSubscription?.videoAllowed || false;

  // Find brand and model attributes from fetched attributes
  const brandAttribute = attributes.find(attr => attr.key === 'brandId');
  const modelAttribute = attributes.find(attr => attr.key === 'modelId');

  console.log('🔍 Subscription limits:', { maxImagesAllowed, videoAllowed, userPackage });


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

  // Comprehensive validation function
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. Validate basic fields
    console.log('🔍 Checking title:', formData.title, 'trimmed:', formData.title.trim(), 'isEmpty:', !formData.title.trim());
    if (!formData.title.trim()) {
      errors.push('عنوان الإعلان مطلوب');
    }
    console.log('🔍 Checking price:', formData.priceMinor, 'isEmpty:', formData.priceMinor <= 0);
    if (formData.priceMinor <= 0) {
      errors.push('السعر مطلوب');
    }
    if (formData.allowBidding && (!formData.biddingStartPrice || formData.biddingStartPrice <= 0)) {
      errors.push('سعر البداية للمزايدة مطلوب');
    }

    // 2. Validate images
    if (formData.images.length < 1) {
      errors.push('يجب إضافة صورة واحدة على الأقل');
    }

    // 3. Validate location
    if (!formData.location.province) {
      errors.push('المحافظة مطلوبة');
    }

    // 4. Validate all required attributes (specs only, not column-based attributes)
    attributes.forEach(attr => {
      console.log('🔍 Checking attribute:', attr.key, 'storageType:', attr.storageType, 'validation:', attr.validation);

      // Skip attributes stored as columns (title, price, accountType) - they're validated above
      if (attr.storageType === 'column') {
        console.log('  ↳ Skipping (column-based)');
        return;
      }

      if (attr.validation === 'REQUIRED') {
        const value = formData.specs[attr.key];
        // Check if value is empty (covers: undefined, null, '', empty array)
        const isEmpty = value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        console.log('  ↳ Value:', value, 'isEmpty:', isEmpty);
        if (isEmpty) {
          console.log('  ↳ ❌ Adding error:', `${attr.name} مطلوب`);
          errors.push(`${attr.name} مطلوب`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚨🚨🚨 HANDLESUBMIT CALLED!!! 🚨🚨🚨');
    e.preventDefault();
    e.stopPropagation();

    console.log('🔍 Form submitted - starting validation...');
    console.log('📊 Form data:', {
      title: formData.title,
      priceMinor: formData.priceMinor,
      images: formData.images.length,
      province: formData.location.province,
      specs: formData.specs,
    });

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

    console.log('✅ Validation result:', validation);

    if (!validation.isValid) {
      console.error('❌ Validation FAILED - stopping submission');
      console.error('❌ Validation errors:', validation.errors);
      // Show validation errors to user
      setValidationError(`يرجى ملء جميع الحقول المطلوبة:\n${validation.errors.join('\n')}`);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; // Stop submission
    }

    console.log('✅ Validation passed - proceeding with submission');

    // Clear any previous validation errors
    setValidationError('');

    try {
      await submitListing();
      setSuccess('✅ تم استلام إعلانك! جاري المراجعة والنشر خلال دقيقتين...');
      // Wait 2 seconds to show success message, then redirect
      setTimeout(() => {
        router.push('/dashboard/listings');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Submission error:', err);
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

  return (
    <Container className={styles.container}>
      <div className={styles.detailsPage}>
        {/* Back button */}
        <div
          className={styles.backButton}
          onClick={() => router.push('/dashboard/listings/create')}
        >
          <ChevronLeft size={20} />
          <span>العودة لاختيار الفئة</span>
        </div>

        <div className={styles.header}>
          <Text variant="h1">أكمل تفاصيل إعلانك</Text>
        </div>

        <Form onSubmit={handleSubmit} error={validationError || error || undefined} success={success || undefined}>
          <div className={styles.formCard}>
            {/* Section 1: Basic Info */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Text variant="h3" className={styles.sectionTitle}>
                  معلومات الإعلان
                </Text>
              </div>

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
                  required
                />

                {/* Description */}
                <Input
                  type="textarea"
                  label="الوصف"
                  placeholder="أضف وصفاً تفصيلياً عن المنتج..."
                  value={formData.description}
                  onChange={(e) => setFormField('description', e.target.value)}
                  rows={6}
                />

                {/* Price & Bidding */}
                <div className={styles.formRow}>
                  <Input
                    type="number"
                    label="السعر (بالدولار)"
                    placeholder="مثال: 5000"
                    value={formData.priceMinor > 0 ? formData.priceMinor / 100 : ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormField('priceMinor', value * 100);
                    }}
                    onBlur={() => handleBlur('price')}
                    error={getError('price', formData.priceMinor <= 0 ? 'السعر مطلوب' : undefined)}
                    required
                  />

                  <Input
                    type="switch"
                    label="السماح بالمزايدة"
                    checked={formData.allowBidding}
                    onChange={(e) => setFormField('allowBidding', (e.target as HTMLInputElement).checked)}
                  />
                </div>

                {/* Bidding Start Price (conditional) */}
                {formData.allowBidding && (
                  <Input
                    type="number"
                    label="سعر البداية للمزايدة (بالدولار)"
                    placeholder="مثال: 4000"
                    value={formData.biddingStartPrice ? formData.biddingStartPrice / 100 : ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormField('biddingStartPrice', value * 100);
                    }}
                    onBlur={() => handleBlur('biddingStartPrice')}
                    error={getError('biddingStartPrice', formData.allowBidding && !formData.biddingStartPrice ? 'سعر البداية مطلوب' : undefined)}
                    helpText="سعر البداية يجب أن يكون أقل من السعر الأساسي"
                  />
                )}
              </div>
            </div>

            {/* Section 2: Photos & Video */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Text variant="h3" className={styles.sectionTitle}>
                  الصور {videoAllowed && 'والفيديو'}
                </Text>
                <Text variant="small" color="secondary">
                  (الحد الأدنى 3 صور - مطلوب)
                </Text>
              </div>

              <div className={styles.formFields}>
                <ImageUploadGrid
                  images={formData.images}
                  onChange={(images) => {
                    setFormField('images', images);
                    setTouched({ ...touched, images: true });
                  }}
                  maxImages={maxImagesAllowed}
                />
                {touched.images && formData.images.length < 1 && (
                  <Text variant="small" color="error">
                    يجب إضافة 3 صور على الأقل
                  </Text>
                )}

                {/* Video URL - Only for users with videoAllowed permission */}
                {videoAllowed && (
                  <Input
                    type="url"
                    label="رابط الفيديو (اختياري)"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormField('videoUrl', e.target.value)}
                    helpText="أضف رابط فيديو من YouTube أو Vimeo"
                  />
                )}
              </div>
            </div>
            {/* Section 3: Brand & Model */}
            {brands.length > 0 && (
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <Text variant="h3" className={styles.sectionTitle}>
                    العلامة التجارية والموديل
                  </Text>
                </div>

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
              </div>
            )}

            {/* Section 4: Other Specifications (dynamic attributes) */}
            {attributeGroups.length > 0 && attributeGroups.map((group, groupIndex) => (
              <div key={group.name} className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <Text variant="h3" className={styles.sectionTitle}>
                    {group.name}
                  </Text>
                </div>

                <div className={styles.specsGrid}>
                  {group.attributes.filter(attr => attr.key !== "brandId" && attr.key !== "modelId").map((attribute) => (
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
              </div>
            ))}

            {/* Section 4: Location */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Text variant="h3" className={styles.sectionTitle}>
                  الموقع
                </Text>
              </div>

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
                      ...provinces.map(p => ({ value: p.nameAr, label: p.nameAr })),
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

                <div className={styles.formRow}>
                  <Input
                    type="text"
                    label="المنطقة"
                    placeholder="اختياري"
                    value={formData.location.area}
                    onChange={(e) => setLocationField('area', e.target.value)}
                  />

                  <Input
                    type="text"
                    label="رابط الخريطة"
                    placeholder="اختياري"
                    value={formData.location.link}
                    onChange={(e) => setLocationField('link', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Actions */}
          <div className={styles.stickyActions}>
            <div className={styles.leftActions}>
              <Button variant="outline" onClick={handleCancel}>
                إلغاء
              </Button>
            </div>

            <div className={styles.rightActions}>
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
              >
                معاينة الإعلان
              </Button>
              <SubmitButton
                type="submit"
                variant="primary"
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
  );
}
