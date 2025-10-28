'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Input, ImageUploadGrid, Text } from '@/components/slices';
import type { Listing } from '@/types/listing';
import type { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';
import { useUserListingsStore } from '@/stores/userListingsStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { LISTING_STATUS_LABELS, mapToOptions } from '@/constants/metadata-labels';
import { renderAttributeField } from '@/utils/attributeFieldRenderer';
import { optimizeListingImage } from '@/utils/cloudflare-images';
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
  options?: Array<{ key: string; value: string; sortOrder: number; isActive: boolean }>;
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
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Form state - EXACTLY like create page
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

  // Load detailed listing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data: Listing = await loadMyListingById(listing.id);
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
  }, [listing.id, loadMyListingById]);

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

    try {
      const uploadedImageKeys: string[] = [];

      for (const imageItem of addedImages) {
        if (!imageItem.file) continue;

        // Type assertion: file is guaranteed to exist after the guard above
        const file: File = imageItem.file;

        // Get Cloudflare upload URL
        const uploadData = await cachedGraphQLRequest(
          `mutation { createImageUploadUrl { uploadUrl assetKey } }`,
          {}
        );
        const { uploadUrl, assetKey } = (uploadData as any).createImageUploadUrl;

        // Upload to Cloudflare
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error('Image upload failed');
        }

        uploadedImageKeys.push(assetKey);
      }

      // Update listing images immediately
      const allImageKeys = [...images.map(img => img.id), ...uploadedImageKeys];

      await cachedGraphQLRequest(
        `mutation UpdateListingImages($id: String!, $imageKeys: [String!]!) {
          updateMyListing(id: $id, input: { imageKeys: $imageKeys }) {
            id
          }
        }`,
        { id: listing.id, imageKeys: allImageKeys }
      );

      // Update local state
      const newImagesWithUrls: ImageItem[] = uploadedImageKeys.map(key => ({
        id: key,
        url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${key}/public`,
      }));

      setImages(prev => [...prev, ...newImagesWithUrls]);

      addNotification({
        type: 'success',
        title: 'تم رفع الصور',
        message: 'تم رفع الصور بنجاح',
        duration: 3000,
      });
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

    setIsUploadingImage(true);

    try {
      // Update listing images immediately
      const remainingImageKeys = newImages.map(img => img.id);

      await cachedGraphQLRequest(
        `mutation UpdateListingImages($id: String!, $imageKeys: [String!]!) {
          updateMyListing(id: $id, input: { imageKeys: $imageKeys }) {
            id
          }
        }`,
        { id: listing.id, imageKeys: remainingImageKeys }
      );

      setImages(newImages);

      addNotification({
        type: 'success',
        title: 'تم حذف الصورة',
        message: 'تم حذف الصورة بنجاح',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ في حذف الصورة',
        duration: 5000,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        priceMinor: formData.priceMinor,
        status: formData.status,
        allowBidding: formData.allowBidding,
        biddingStartPrice: formData.biddingStartPrice,
        videoUrl: formData.videoUrl || undefined,
        specs: formData.specs,
        location: formData.location,
      };

      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error('Error updating listing:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isVisible={true} onClose={onClose} title="تعديل الإعلان" maxWidth="xl">
      <form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.modalContent}>
          {/* Listing Info Card */}
          {detailedListing && (
            <div className={styles.infoCard}>
              <Text variant="small" style={{ color: 'var(--text-secondary)' }}>
                الفئة: {detailedListing.category?.name || 'غير محدد'}
              </Text>
              <div className={styles.infoGrid}>
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
              type="number"
              label="السعر (بالدولار) *"
              placeholder="أدخل السعر"
              value={formData.priceMinor > 0 ? formData.priceMinor / 100 : ''}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setFormData({ ...formData, priceMinor: value * 100 });
              }}
              required
              min={0}
              step={1}
            />

            <Input
              type="select"
              label="حالة الإعلان *"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={mapToOptions(listingStatuses, LISTING_STATUS_LABELS)}
              required
            />

            <Input
              type="switch"
              label="السماح بالمزايدة"
              checked={formData.allowBidding}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, allowBidding: e.target.checked })}
            />

            {formData.allowBidding && (
              <Input
                type="number"
                label="سعر البداية للمزايدة *"
                placeholder="أدخل سعر البداية"
                value={formData.biddingStartPrice ? formData.biddingStartPrice / 100 : ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, biddingStartPrice: value * 100 });
                }}
                required={formData.allowBidding}
                min={0}
                step={1}
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
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isUploadingImage}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
