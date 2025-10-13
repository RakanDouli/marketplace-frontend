'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListingsStore } from '@/stores/listingsStore';
import { Text, Loading, Button, ImageGallery, CollapsibleSection, Container } from '@/components/slices';
import { Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { LocationMap } from '@/components/LocationMap';
import { ShareButton, FavoriteButton } from '@/components/slices/Button';
import styles from './ListingDetail.module.scss';

interface ListingDetailClientProps {
  listingId: string;
}

interface AttributeOption {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
}

interface Attribute {
  id: string;
  key: string;
  name: string;
  type: string;
  group: string | null;
  groupOrder: number;
  sortOrder: number;
  showInDetail: boolean;
  options: AttributeOption[];
}

const GET_ATTRIBUTES_QUERY = `
  query GetAttributesByCategory($categoryId: String!) {
    getAttributesByCategory(categoryId: $categoryId) {
      id
      key
      name
      type
      group
      groupOrder
      sortOrder
      showInDetail
      options {
        id
        key
        value
        sortOrder
      }
    }
  }
`;

export const ListingDetailClient: React.FC<ListingDetailClientProps> = ({ listingId }) => {
  const router = useRouter();
  const { currentListing, isLoading, error, fetchListingById } = useListingsStore();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);

  useEffect(() => {
    if (listingId) {
      fetchListingById(listingId);
    }
  }, [listingId, fetchListingById]);

  // Fetch attributes when listing is loaded
  useEffect(() => {
    const categoryId = currentListing?.category?.id;
    if (categoryId) {
      const fetchAttributes = async () => {
        setAttributesLoading(true);
        try {
          const data = await cachedGraphQLRequest(
            GET_ATTRIBUTES_QUERY,
            { categoryId },
            { ttl: 10 * 60 * 1000 } // Cache for 10 minutes
          );
          setAttributes(data.getAttributesByCategory || []);
        } catch (err) {
          console.error('Failed to fetch attributes:', err);
        } finally {
          setAttributesLoading(false);
        }
      };
      fetchAttributes();
    }
  }, [currentListing?.category?.id]);

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
  const hasLocation = listing.location && (
    listing.location.city ||
    listing.location.province ||
    listing.location.coordinates
  );

  return (
    <Container>
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

            {/* Dynamically Grouped Specifications */}
            {!attributesLoading && sortedGroups.length > 0 && (
              <div className={styles.section}>
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
              </div>
            )}

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
                <FavoriteButton listingId={listing.id} />
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
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
};
