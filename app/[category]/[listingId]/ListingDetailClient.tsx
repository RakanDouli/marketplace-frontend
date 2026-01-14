'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import { useListingsStore } from '@/stores/listingsStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { trackListingView } from '@/utils/trackListingView';
import type { Attribute, Listing } from '@/types/listing';
import { Text, Loading, Button, ImageGallery, Container, Collapsible, MobileBackButton, ShareButton, FavoriteButton, RelatedByBrand, RelatedByPrice, ClientPrice } from '@/components/slices';
import { CarInspection, DamageSummary, fromBackendFormat } from '@/components/slices/CarInspection';
import { ChevronLeft, Eye } from 'lucide-react';
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
import { JsonLd, generateVehicleSchema, generateListingSchema } from '@/components/seo';
import { LISTING_TYPE_LABELS, CONDITION_LABELS, ACCOUNT_TYPE_LABELS, CAR_FEATURES_LABELS } from '@/constants/metadata-labels';
import styles from './ListingDetail.module.scss';

interface ListingDetailClientProps {
  listing: Listing; // Pre-fetched from server (SSR)
  listingId: string;
  categorySlug: string;
}

export const ListingDetailClient: React.FC<ListingDetailClientProps> = ({
  listing: serverListing,
  listingId,
  categorySlug
}) => {
  const router = useRouter();
  // Use server-fetched listing, but also sync to store for other components
  const { setCurrentListing } = useListingsStore();
  const { attributes, isLoading: attributesLoading, fetchFilterData } = useFiltersStore();
  const { user: currentUser } = useUserAuthStore();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Sync server listing to store (for components that read from store)
  useEffect(() => {
    if (serverListing) {
      setCurrentListing(serverListing);
    }
  }, [serverListing, setCurrentListing]);

  // Fetch attributes when listing is loaded (uses filtersStore cache)
  useEffect(() => {
    const catSlug = serverListing?.category?.slug || categorySlug;
    if (catSlug) {
      fetchFilterData(catSlug);
    }
  }, [serverListing?.category?.slug, categorySlug, fetchFilterData]);

  // Track listing view (client-side only, after hydration)
  useEffect(() => {
    if (serverListing?.id) {
      trackListingView(serverListing.id);
    }
  }, [serverListing?.id]);

  // Back button handler - navigates to parent category
  const handleBack = () => {
    router.push(`/${categorySlug}`);
  };

  // Separate grouped and ungrouped specifications
  const { groupedSpecs, ungroupedSpecs } = useMemo(() => {
    if (!serverListing?.specsDisplay || attributes.length === 0) {
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

    // Keys to exclude from specs (shown separately in core info section)
    const excludedKeys = ['listingType', 'condition', 'accountType'];

    // Separate specs into grouped and ungrouped
    Object.entries(serverListing.specsDisplay).forEach(([key, value]: [string, any]) => {
      // Skip keys that are shown in the core info section
      if (excludedKeys.includes(key)) return;

      const attribute = attributeMap.get(key);

      if (attribute) {
        const label = typeof value === 'object' ? value.label : attribute.name;
        let displayValue = typeof value === 'object' ? value.value : value;

        // Translate feature keys to Arabic if they're raw keys (not already translated)
        if (key === 'features' && typeof displayValue === 'string') {
          // Split by both English and Arabic commas, translate each key, and rejoin
          displayValue = displayValue
            .split(/[,،]/)
            .map((v: string) => v.trim())
            .filter((v: string) => v) // Remove empty strings
            .map((v: string) => CAR_FEATURES_LABELS[v] || v)
            .join('، ');
        }

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
  }, [serverListing?.specsDisplay, attributes]);

  // Sort groups by groupOrder
  const sortedGroups = useMemo(() => {
    return Object.entries(groupedSpecs).sort((a, b) => {
      return a[1].groupOrder - b[1].groupOrder;
    });
  }, [groupedSpecs]);

  // Generate schema based on category (Vehicle for cars, Product for others)
  // IMPORTANT: This hook must be called before any early returns to follow Rules of Hooks
  const schemaData = useMemo(() => {
    if (!serverListing) return null;
    const isVehicle = categorySlug === 'cars' || serverListing.category?.slug === 'cars';
    return isVehicle ? generateVehicleSchema(serverListing) : generateListingSchema(serverListing);
  }, [serverListing, categorySlug]);

  // Use server-fetched listing directly (no loading state needed - SSR!)
  const listing = serverListing;

  const hasLocation = listing.location && (
    listing.location.city ||
    listing.location.province ||
    listing.location.coordinates
  );

  return (
    <>
      {/* Schema.org Structured Data for SEO */}
      {schemaData && <JsonLd data={schemaData} />}

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
                videoUrl={listing.videoUrl}
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
                  {listing.priceMinor ? (
                    <ClientPrice price={listing.priceMinor} fallback="السعر غير محدد" />
                  ) : (
                    'السعر غير محدد'
                  )}
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

              {/* Listing Type, Condition & Account Type - Core listing info */}
              {(listing.listingType || listing.condition || listing.accountType) && (
                <div className={styles.section}>
                  <div className={styles.specsList}>
                    {listing.listingType && (
                      <div className={styles.specRow}>
                        <span className={styles.specLabel}>نوع العرض</span>
                        <span className={styles.specValue}>
                          {LISTING_TYPE_LABELS[listing.listingType.toUpperCase()] || listing.listingType}
                        </span>
                      </div>
                    )}
                    {listing.condition && (
                      <div className={styles.specRow}>
                        <span className={styles.specLabel}>الحالة</span>
                        <span className={styles.specValue}>
                          {CONDITION_LABELS[listing.condition.toUpperCase()] || listing.condition}
                        </span>
                      </div>
                    )}
                    {listing.accountType && (
                      <div className={styles.specRow}>
                        <span className={styles.specLabel}>نوع المعلن</span>
                        <span className={styles.specValue}>
                          {ACCOUNT_TYPE_LABELS[listing.accountType.toUpperCase()] || listing.accountType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      defaultOpen={true}
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

              {/* Car Body Damage Report - Visual Diagram */}
              {listing.specs?.car_damage && Array.isArray(listing.specs.car_damage) && listing.specs.car_damage.length > 0 && (
                <Collapsible
                  title="حالة الهيكل"
                  defaultOpen={true}
                  className={styles.specGroup}
                >
                  <CarInspection
                    value={fromBackendFormat(listing.specs.car_damage as string[])}
                    disabled
                  />
                </Collapsible>
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
      {listing && (
        <ContactSellerModal
          isVisible={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          sellerId={listing.user?.id || ''}
        />
      )}

      {/* Mobile Action Bar - Above BottomNav */}
      {listing && (
        <ListingActionBar
          phone={listing.user?.phone || listing.user?.contactPhone}
          onMessageClick={() => setIsContactModalOpen(true)}
          isOwnListing={currentUser?.id === listing.user?.id}
        />
      )}
    </>
  );
};
