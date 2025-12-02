'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListingsStore } from '@/stores/listingsStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { trackListingView } from '@/utils/trackListingView';
import type { Attribute } from '@/types/listing';
import { Text, Loading, Button, ImageGallery, Container, Collapsible } from '@/components/slices';
import { ChevronLeft, Eye } from 'lucide-react';
import { LocationMap } from '@/components/LocationMap';
import { BiddingSection } from '@/components/BiddingSection';

import { AdContainer } from '@/components/ads';
import { ContactSellerModal } from '@/components/chat/ContactSellerModal';
import { ListingInfoCard } from '@/components/listing/ListingInfoCard';
import { ReportButton } from '@/components/ReportButton';
import styles from './ListingDetail.module.scss';

interface ListingDetailClientProps {
  listingId: string;
}

export const ListingDetailClient: React.FC<ListingDetailClientProps> = ({ listingId }) => {
  const router = useRouter();
  const { currentListing, isLoading, error, fetchListingById } = useListingsStore();
  const { attributes, isLoading: attributesLoading, fetchFilterData } = useFiltersStore();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
  console.log('sss', listing);
  return (
    <Container>
      {/* Top Banner Ad (below gallery) */}
      <div className={styles.adSection}>
        <AdContainer placement="detail_top" />
      </div>
      <div className={styles.listingDetail}>
        {/* Breadcrumbs with Back Button */}
        <div className={styles.breadcrumbsContainer}>

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
          <Button
            variant="link"
            onClick={() => router.back()}
            className={styles.backButton}
          >  العودة
            <ChevronLeft />

          </Button>
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
                  <Collapsible
                    key={groupName}
                    title={groupName}
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

            {/* Ad before description */}
            <div className={styles.adSection}>
              <AdContainer placement="detail_before_description" />
            </div>

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

            {/* Report Listing Button */}
            <ReportButton
              entityType="listing"
              entityId={listing.id}
              entityTitle={listing.title}
              reportedUserId={listing.user?.id || ''}
              reportedUserName={listing.user?.name || 'غير محدد'}
              ownerId={listing.user?.id}
            />
          </div>

          {/* Right side - Seller Card (Sticky) */}
          <aside className={styles.sidebar}>
            <ListingInfoCard
              onContactClick={() => setIsContactModalOpen(true)}
            />

            {/* Bidding Section */}
            {listing.allowBidding && (
              <BiddingSection
                listingId={listing.id}
                listingOwnerId={listing.user?.id || ''}
                allowBidding={listing.allowBidding}
                biddingStartPrice={listing.biddingStartPrice || null}
              />
            )}
          </aside>
        </div>

      </div>

      {/* Contact Seller Modal */}
      {currentListing && (
        <ContactSellerModal
          isVisible={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          listingId={currentListing.id}
          listingTitle={currentListing.title}
          sellerId={currentListing.user?.id || ''}
        />
      )}
    </Container>
  );
};
