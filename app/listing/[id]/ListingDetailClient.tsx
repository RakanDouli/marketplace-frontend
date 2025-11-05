'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListingsStore } from '@/stores/listingsStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { trackListingView } from '@/utils/trackListingView';
import type { Attribute } from '@/types/listing';
import { Text, Loading, Button, ImageGallery, CollapsibleSection, Container } from '@/components/slices';
import { Phone, MessageCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { LocationMap } from '@/components/LocationMap';
import { ShareButton, FavoriteButton } from '@/components/slices/Button';
import { AdContainer } from '@/components/ads';
import styles from './ListingDetail.module.scss';

interface ListingDetailClientProps {
  listingId: string;
}

export const ListingDetailClient: React.FC<ListingDetailClientProps> = ({ listingId }) => {
  const router = useRouter();
  const { currentListing, isLoading, error, fetchListingById } = useListingsStore();
  const { attributes, isLoading: attributesLoading, fetchFilterData } = useFiltersStore();

  useEffect(() => {
    if (listingId) {
      fetchListingById(listingId);
    }
  }, [listingId, fetchListingById]);

  // Fetch attributes when listing is loaded (uses filtersStore cache)
  useEffect(() => {
    const categorySlug = currentListing?.category?.slug;
    if (categorySlug) {
      fetchFilterData(categorySlug);
    }
  }, [currentListing?.category?.slug, fetchFilterData]);

  // Track listing view when listing is loaded
  useEffect(() => {
    if (currentListing?.id) {
      trackListingView(currentListing.id);
    }
  }, [currentListing?.id]);
  console.log(currentListing);
  // Separate grouped and ungrouped specifications
  const { groupedSpecs, ungroupedSpecs } = useMemo(() => {
    if (!currentListing?.specsDisplay || attributes.length === 0) {
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
    Object.entries(currentListing.specsDisplay).forEach(([key, value]: [string, any]) => {
      const attribute = attributeMap.get(key);

      if (attribute) {
        const label = typeof value === 'object' ? value.label : attribute.name;
        const displayValue = typeof value === 'object' ? value.value : value;

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
  }, [currentListing?.specsDisplay, attributes]);

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
    console.error('Error loading listing:', error);
    return (
      <Container>
        <div className={styles.errorContainer}>
          <Text variant="h1">هذه الصفحة غير موجودة</Text>
          <Text variant="paragraph" color="secondary">
            عذراً، لم نتمكن من العثور على الإعلان الذي تبحث عنه. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
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

  if (!currentListing) {
    console.warn('Listing not found for ID:', listingId);
    return (
      <Container>
        <div className={styles.errorContainer}>
          <Text variant="h1">هذه الصفحة غير موجودة</Text>
          <Text variant="paragraph" color="secondary">
            عذراً، لم نتمكن من العثور على الإعلان الذي تبحث عنه. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
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

  const listing = currentListing;
  const primaryPrice = listing.prices?.[0];

  // Debug: Log location data
  console.log('🔍 Listing Location Debug:', {
    location: listing.location,
    hasLocation: listing.location && (
      listing.location.city ||
      listing.location.province ||
      listing.location.coordinates
    ),
    province: listing.location?.province,
    city: listing.location?.city,
    area: listing.location?.area,
    viewCount: listing.viewCount
  });

  const hasLocation = listing.location && (
    listing.location.city ||
    listing.location.province ||
    listing.location.coordinates
  );

  return (
    <Container>
      {/* Top Banner Ad (below gallery) */}
      <div className={styles.adSection}>
        <AdContainer type="BANNER" placement="detail-top" />
      </div>
      <div className={styles.listingDetail}>
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
            {listing.category && (
              <>
                <Link href={`/${listing.category.slug}`}>{listing.category.name}</Link>
                <ChevronLeft size={16} />
              </>
            )}
            <span>{listing.title}</span>
          </nav>
        </div>


        <div className={styles.layout}>
          {/* Left side - Gallery and Details */}
          <div className={styles.mainContent}>
            {/* Image Gallery */}
            <ImageGallery
              images={listing.imageKeys || []}
              alt={listing.title}
              viewMode="large"
              aspectRatio="4 / 3"
              priority
            />

            {/* View Count */}
            {listing.viewCount !== undefined && (
              <div className={styles.viewCount}>
                <Eye size={16} />
                <Text variant="small">{listing.viewCount} مشاهدة</Text>
              </div>
            )}

            {/* Title */}
            <Text variant="h2" className={styles.title}>
              {listing.title}
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
                  <CollapsibleSection
                    key={groupName}
                    title={groupName}
                    defaultExpanded={true}
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
                  </CollapsibleSection>
                ))}
              </>
            )}
            {/* ww */}
            {/* Description - Moved after attributes */}
            {listing.description && (
              <div className={styles.section}>
                <Text variant="h3" className={styles.sectionTitle}>الوصف</Text>
                <Text variant="paragraph">{listing.description}</Text>
              </div>
            )}

            {/* Loading attributes */}
            {attributesLoading && (
              <div className={styles.section}>
                <Loading type="svg" />
              </div>
            )}

            {/* Location with Map */}
            {hasLocation && listing.location && (
              <div className={styles.section}>
                <Text variant="h3" className={styles.sectionTitle}>الموقع</Text>
                <LocationMap location={listing.location} />
              </div>
            )}


          </div>

          {/* Right side - Seller Card (Sticky) */}
          <aside className={styles.sidebar}>
            <div className={styles.sellerCard}>
              {/* Share and Favorite Buttons */}
              <div className={styles.actionButtons}>
                <ShareButton
                  metadata={{
                    title: listing.title,
                    description: listing.description || '',
                    url: typeof window !== 'undefined' ? window.location.href : '',
                    image: listing.imageKeys?.[0],
                    siteName: 'السوق السوري للسيارات',
                    type: 'product',
                    price: primaryPrice?.value,
                    currency: primaryPrice?.currency,
                    availability: listing.status === 'ACTIVE' ? 'in stock' : 'out of stock',
                  }}
                />
                <FavoriteButton
                  listingId={listing.id}
                  listingUserId={listing.user?.id}
                />
              </div>

              {/* Price */}
              <div className={styles.priceBox}>
                <Text variant="h2" className={styles.title}>
                  {listing.title}
                </Text>
                <Text variant="h3" className={styles.price}>
                  {primaryPrice ? `${primaryPrice.value} ${primaryPrice.currency}` : 'السعر غير محدد'}
                </Text>
              </div>

              {/* Contact Buttons */}
              <div className={styles.buttons}>
                <Button variant="primary" size="lg" icon={<Phone size={18} />}>
                  {listing.user?.phone || 'اتصل بالبائع'}
                </Button>
                <Button variant="outline" size="lg" icon={<MessageCircle size={18} />}>
                  أرسل رسالة
                </Button>
              </div>

              {/* Seller Info */}
              <div className={styles.sellerInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>البائع</span>
                  <span className={styles.value}>{listing.user?.name || 'غير محدد'}</span>
                </div>
                {listing.location?.province && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>الموقع</span>
                    <span className={styles.value}>{listing.location.province}</span>
                  </div>
                )}
                {listing.createdAt && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>تاريخ النشر</span>
                    <span className={styles.value}>
                      {new Date(listing.createdAt).toLocaleDateString('ar')}
                    </span>
                  </div>
                )}
                {/* {listing.viewCount !== undefined && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>المشاهدات</span>
                    <span className={styles.value}>
                      <Eye size={16} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                      {listing.viewCount.toLocaleString('ar')}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          </aside>
        </div>

      </div>
      {/* Bottom Banner Ad (after all content) */}
      <div className={styles.adSection}>
        <AdContainer type="BETWEEN_LISTINGS_BANNER" placement="detail-bottom" />
      </div>
    </Container>
  );
};
