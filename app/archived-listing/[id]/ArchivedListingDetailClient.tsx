'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArchivedListingStore } from '@/stores/archivedListingStore';
import { useFiltersStore } from '@/stores/filtersStore';
import type { Attribute } from '@/types/listing';
import { Text, Loading, Button, ImageGallery, Collapsible, Container } from '@/components/slices';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LocationMap } from '@/components/LocationMap';
import { formatPrice } from '@/utils/formatPrice';
import { formatDate } from '@/utils/formatDate';
import styles from './ArchivedListingDetail.module.scss';

interface ArchivedListingDetailClientProps {
  listingId: string;
}

export const ArchivedListingDetailClient: React.FC<ArchivedListingDetailClientProps> = ({ listingId }) => {
  const router = useRouter();
  const { archivedListing, isLoading, error, fetchArchivedListing } = useArchivedListingStore();
  const { attributes, isLoading: attributesLoading, fetchFilterData } = useFiltersStore();

  useEffect(() => {
    if (listingId) {
      fetchArchivedListing(listingId);
    }
  }, [listingId, fetchArchivedListing]);

  // Fetch attributes when listing is loaded (uses filtersStore cache)
  useEffect(() => {
    const categorySlug = archivedListing?.category?.slug;
    if (categorySlug) {
      fetchFilterData(categorySlug);
    }
  }, [archivedListing?.category?.slug, fetchFilterData]);

  // Separate grouped and ungrouped specifications
  const { groupedSpecs, ungroupedSpecs } = useMemo(() => {
    if (!archivedListing?.specsDisplay || attributes.length === 0) {
      return { groupedSpecs: {}, ungroupedSpecs: [] };
    }

    const groups: Record<string, {
      groupOrder: number;
      specs: Array<{ key: string; label: string; value: string; sortOrder: number }>
    }> = {};
    const ungrouped: Array<{ key: string; label: string; value: string; sortOrder: number }> = [];

    // Create a map of attribute keys to attributes
    const attributeMap = new Map<string, Attribute>();
    attributes.forEach(attr => {
      if (attr.showInDetail) {
        attributeMap.set(attr.key, attr);
      }
    });

    // Separate specs into grouped and ungrouped
    Object.entries(archivedListing.specsDisplay).forEach(([key, value]: [string, any]) => {
      const attribute = attributeMap.get(key);

      if (attribute) {
        const label = typeof value === 'object' ? value.label : attribute.name;
        let displayValue = typeof value === 'object' ? value.value : value;

        if (attribute.group) {
          // Has a group - add to groups
          const groupName = attribute.group;
          if (!groups[groupName]) {
            groups[groupName] = {
              groupOrder: attribute.groupOrder,
              specs: []
            };
          }
          groups[groupName].specs.push({
            key,
            label,
            value: displayValue,
            sortOrder: attribute.sortOrder
          });
        } else {
          // No group - add to ungrouped list
          ungrouped.push({
            key,
            label,
            value: displayValue,
            sortOrder: attribute.sortOrder
          });
        }
      }
    });

    // Sort specs within each group
    Object.values(groups).forEach(group => {
      group.specs.sort((a, b) => a.sortOrder - b.sortOrder);
    });

    // Sort ungrouped specs by sortOrder
    ungrouped.sort((a, b) => a.sortOrder - b.sortOrder);

    return { groupedSpecs: groups, ungroupedSpecs: ungrouped };
  }, [archivedListing?.specsDisplay, attributes]);

  // Sort groups by groupOrder
  const sortedGroups = useMemo(() => {
    return Object.entries(groupedSpecs).sort((a, b) => {
      return a[1].groupOrder - b[1].groupOrder;
    });
  }, [groupedSpecs]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading type="svg" />
      </div>
    );
  }

  if (error) {
    console.error('Error loading archived listing:', error);
    return (
      <Container>
        <div className={styles.errorContainer}>
          <Text variant="h1">هذه الصفحة غير موجودة</Text>
          <Text variant="paragraph" color="secondary">
            عذراً، لم نتمكن من العثور على الإعلان المؤرشف الذي تبحث عنه. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
          </Text>
          <div className={styles.errorActions}>
            <Button onClick={() => router.back()} variant="secondary">
              العودة للصفحة السابقة
            </Button>
            <Button onClick={() => router.push('/')} variant="primary">
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (!archivedListing) {
    console.warn('Archived listing not found for ID:', listingId);
    return (
      <Container>
        <div className={styles.errorContainer}>
          <Text variant="h1">هذه الصفحة غير موجودة</Text>
          <Text variant="paragraph" color="secondary">
            عذراً، لم نتمكن من العثور على الإعلان المؤرشف الذي تبحث عنه. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
          </Text>
          <div className={styles.errorActions}>
            <Button onClick={() => router.back()} variant="secondary">
              العودة للصفحة السابقة
            </Button>
            <Button onClick={() => router.push('/')} variant="primary">
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // At this point, archivedListing is guaranteed to be non-null
  const hasLocation = archivedListing.province || archivedListing.city || archivedListing.mapLink;

  return (
    <Container>
      <div className={styles.listingDetail}>
        {/* Archive Banner */}
        <div className={styles.archiveBanner}>
          <Text variant="h4">
            هذا الإعلان لم يعد متاحًا
          </Text>
        </div>

        <div className={styles.archivedContent}>
          {/* Breadcrumbs with Back Button */}
          <div className={styles.breadcrumbsContainer}>
            <Button
              variant="link"
              onClick={() => router.back()}
              className={styles.backButton}
            >
              <ChevronRight />
              العودة
            </Button>
            <nav className={styles.breadcrumbs}>
              <Link href="/">الرئيسية</Link>
              <ChevronLeft size={16} />
              {archivedListing.category && (
                <>
                  <Link href={`/${archivedListing.category.slug}`}>{archivedListing.category.name}</Link>
                  <ChevronLeft size={16} />
                </>
              )}
              <span>{archivedListing.title}</span>
            </nav>
          </div>


          <div className={styles.layout}>
            {/* Left side - Gallery and Details */}
            <div className={styles.mainContent}>
              {/* Image Gallery - Show only first image for archived listings */}
              <ImageGallery
                images={archivedListing.imageKeys?.[0] ? [archivedListing.imageKeys[0]] : []}
                alt={archivedListing.title}
                viewMode="small"
                aspectRatio="4 / 3"
                priority
              />


              {/* Title */}
              <Text variant="h2" className={styles.title}>
                {archivedListing.title}
              </Text>

              {/* Key specs chips */}
              {/* {listing.specsDisplay && (
            <div className={styles.keySpecs}>
              {Object.entries(listing.specsDisplay)
                .slice(0, 3)
                .map(([key, value]: [string, any]) => (
                  <span key={key} className={styles.chip}>
                    {typeof value === 'object' ? value.value : value}
                  </span>
                ))}
            </div>
          )} */}

              {/* Ungrouped Specifications - Individual Fields */}
              {!attributesLoading && ungroupedSpecs.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.specsList}>
                    {ungroupedSpecs.map((spec) => (
                      <div key={spec.key} className={styles.specRow}>
                        <span className={styles.specLabel}>{spec.label}</span>
                        <span className={styles.specValue}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* sss */}
              {/* Dynamically Grouped Specifications */}
              {!attributesLoading && sortedGroups.length > 0 && (
                <>
                  {sortedGroups.map(([groupName, groupData]) => (
                    <Collapsible
                      key={groupName}
                      title={groupName}
                      defaultOpen={true}
                      variant="bordered"
                      className={styles.specGroup}
                    >
                      <div className={styles.specsList}>
                        {groupData.specs.map((spec) => (
                          <div key={spec.key} className={styles.specRow}>
                            <span className={styles.specLabel}>{spec.label}</span>
                            <span className={styles.specValue}>{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </Collapsible>
                  ))}
                </>
              )}
              {/* ww */}
              {/* Description - Moved after attributes */}
              {archivedListing.description && (
                <div className={styles.section}>
                  <Text variant="h3" className={styles.sectionTitle}>الوصف</Text>
                  <Text variant="paragraph">{archivedListing.description}</Text>
                </div>
              )}

              {/* Loading attributes */}
              {attributesLoading && (
                <div className={styles.section}>
                  <Loading type="svg" />
                </div>
              )}

              {/* Location with Map */}
              {hasLocation && (
                <div className={styles.section}>
                  <Text variant="h3" className={styles.sectionTitle}>الموقع</Text>
                  <LocationMap location={{
                    province: archivedListing.province,
                    city: archivedListing.city || undefined,
                    area: archivedListing.area || undefined,
                  }} />
                </div>
              )}


            </div>

            {/* Right side - Seller Card (Sticky) */}
            <aside className={styles.sidebar}>
              <div className={styles.sellerCard}>
                {/* Price */}
                <div className={styles.priceBox}>
                  <Text variant="h2" className={styles.title}>
                    {archivedListing.title}
                  </Text>
                  <Text variant="h3" className={styles.price}>
                    {archivedListing.priceMinor ? formatPrice(archivedListing.priceMinor) : 'السعر غير محدد'}
                  </Text>
                </div>

                {/* Seller Info */}
                <div className={styles.sellerInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>البائع</span>
                    <span className={styles.value}>{archivedListing.user?.name || 'غير محدد'}</span>
                  </div>
                  {archivedListing.province && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>الموقع</span>
                      <span className={styles.value}>{archivedListing.province}</span>
                    </div>
                  )}
                  {archivedListing.archivedAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>تاريخ الأرشفة</span>
                      <span className={styles.value}>
                        {formatDate(archivedListing.archivedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Container>
  );
};
