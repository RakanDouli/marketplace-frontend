'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListingsStore } from '@/stores/listingsStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { trackListingView } from '@/utils/trackListingView';
import type { Attribute } from '@/types/listing';
import { Text, Loading, Button, ImageGallery, Container, Collapsible, MobileBackButton, ShareButton, FavoriteButton, RelatedByBrand, RelatedByPrice } from '@/components/slices';
import { ChevronLeft, Eye } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import { formatDate } from '@/utils/formatDate';
import { LocationMap } from '@/components/LocationMap';
import { BiddingSection } from '@/components/BiddingSection';

import { AdContainer } from '@/components/ads';
import { ContactSellerModal } from '@/components/chat/ContactSellerModal';
import { ListingInfoCard } from '@/components/listing/ListingInfoCard';
import { ListingActionBar } from '@/components/listing/ListingActionBar';
import { OwnerInfoSection } from '@/components/ListingOwnerInfo';
import { ReportButton } from '@/components/ReportButton';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './ListingDetail.module.scss';

interface ListingDetailClientProps {
  listingId: string;
  categorySlug: string;
}

export const ListingDetailClient: React.FC<ListingDetailClientProps> = ({ listingId, categorySlug }) => {
  const router = useRouter();
  const { currentListing, isLoading, error, fetchListingById } = useListingsStore();
  const { attributes, isLoading: attributesLoading, fetchFilterData } = useFiltersStore();
  const { user: currentUser } = useUserAuthStore();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    if (listingId) {
      fetchListingById(listingId);
    }
  }, [listingId, fetchListingById]);

  // Fetch attributes when listing is loaded (uses filtersStore cache)
  useEffect(() => {
    const catSlug = currentListing?.category?.slug || categorySlug;
    if (catSlug) {
      fetchFilterData(catSlug);
    }
  }, [currentListing?.category?.slug, categorySlug, fetchFilterData]);

  // Track listing view when listing is loaded
  useEffect(() => {
    if (currentListing?.id) {
      trackListingView(currentListing.id);
    }
  }, [currentListing?.id]);

  // Back button handler - navigates to parent category
  const handleBack = () => {
    router.push(`/${categorySlug}`);
  };

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
    return (
      <Container>
        <div className={styles.errorContainer}>
          <Text variant="h1">هذه الصفحة غير موجودة</Text>
          <Text variant="paragraph" color="secondary">
            عذراً، لم نتمكن من العثور على الإعلان الذي تبحث عنه. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
          </Text>
          <div className={styles.errorActions}>
            <Button onClick={handleBack} variant="secondary">
              العودة للقائمة
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
    return (
      <Container>
        <div className={styles.errorContainer}>
          <Text variant="h1">هذه الصفحة غير موجودة</Text>
          <Text variant="paragraph" color="secondary">
            عذراً، لم نتمكن من العثور على الإعلان الذي تبحث عنه. قد يكون قد تم حذفه أو أن الرابط غير صحيح.
          </Text>
          <div className={styles.errorActions}>
            <Button onClick={handleBack} variant="secondary">
              العودة للقائمة
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

  const hasLocation = listing.location && (
    listing.location.city ||
    listing.location.province ||
    listing.location.coordinates
  );

  return (
    <>
      {/* Mobile Back Button Header - Fixed position, hides on scroll down */}
      <MobileBackButton onClick={handleBack} title={listing.title} />

      <Container>
        {/* Top Banner Ad (below gallery) */}
        <AdContainer placement="detail_top" />
        <div className={styles.listingDetail}>
          {/* Breadcrumbs with Back Button (desktop only) */}
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
              onClick={handleBack}
              className={styles.backButton}
            >
              العودة
              <ChevronLeft />
            </Button>
          </div>


          <div className={styles.layout}>
            {/* Main Content - Gallery + Details */}
            <div className={styles.mainContent}>
              {/* Gallery */}
              <ImageGallery
                images={listing.imageKeys || []}
                alt={listing.title}
                viewMode="large"
                aspectRatio="4 / 3"
                priority
                enablePreview
              />
              {/* View Count */}
              {listing.viewCount !== undefined && (
                <div className={styles.viewCount}>
                  <Eye size={16} />
                  <Text variant="small">{listing.viewCount} مشاهدة</Text>
                </div>
              )}
              {/* Mobile Info Card - Only visible on mobile, under gallery */}
              <div className={styles.mobileInfoCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.mobileActions}>
                    <ShareButton
                      metadata={{
                        title: listing.title,
                        description: listing.description || '',
                        url: typeof window !== 'undefined' ? window.location.href : '',
                        image: listing.imageKeys?.[0],
                        siteName: 'السوق السوري للسيارات',
                        type: 'product',
                        price: listing.priceMinor?.toString(),
                        currency: 'USD',
                      }}
                    />
                    <FavoriteButton
                      listingId={listing.id}
                      listingUserId={listing.user?.id}
                    />
                  </div>
                  <Text variant="h2" className={styles.mobileTitle}>{listing.title}</Text>

                </div>
                <Text variant="h3" className={styles.mobilePrice}>
                  {listing.priceMinor ? formatPrice(listing.priceMinor) : 'السعر غير محدد'}
                </Text>
                <div className={styles.mobileMeta}>
                  {listing.createdAt && (
                    <span>{formatDate(listing.createdAt)}</span>
                  )}
                  {listing.viewCount !== undefined && (
                    <span>{listing.viewCount} مشاهدة</span>
                  )}
                </div>
              </div>

              {/* Title - Hidden on mobile (shown in mobileInfoCard) */}
              <Text variant="h2" className={styles.title}>
                {listing.title}
              </Text>

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

              {/* Ad before description */}
              <AdContainer placement="detail_before_description" />

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

              {/* Owner Info Section */}
              <div className={styles.section}>
                <OwnerInfoSection
                  userId={listing.user?.id || ''}
                  listingId={listing.id}
                />
              </div>

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
              <div className={styles.infoCardWrapper}>
                <ListingInfoCard
                  onContactClick={() => setIsContactModalOpen(true)}
                />
              </div>
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

        {/* Bottom Ad */}
        <AdContainer placement="detail_bottom" />
      </Container>

      {/* Related Listings Sections - Outside Container for full-width background */}
      {listing && (
        <>
          {/* More from [Brand] - Slider */}
          <RelatedByBrand listingId={listing.id} />

          {/* You may also like - Grid */}
          <RelatedByPrice listingId={listing.id} />
        </>
      )}

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

      {/* Mobile Action Bar - Above BottomNav */}
      {currentListing && (
        <ListingActionBar
          phone={currentListing.user?.phone || currentListing.user?.contactPhone}
          onMessageClick={() => setIsContactModalOpen(true)}
          isOwnListing={currentUser?.id === currentListing.user?.id}
        />
      )}
    </>
  );
};
