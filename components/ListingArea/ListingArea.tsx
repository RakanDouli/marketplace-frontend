import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "../../utils/formatPrice";
import { Grid3X3, List, Search } from "lucide-react";
import { ListingCard, Text, Pagination } from "../slices";
import { Loading } from "../slices/Loading/Loading";
import { useTranslation } from "../../hooks/useTranslation";
import { AppliedFilters } from "../AppliedFilters/AppliedFilters";
import { SortControls, SortOption } from "../slices/SortControls/SortControls";
import {
  useListingsStore,
  useSearchStore,
  useFiltersStore,
  useListingsViewType,
  useCategoriesStore,
} from "../../stores";
import { useCurrencyStore } from "../../stores/currencyStore";
import { useMetadataStore } from "../../stores/metadataStore";
import { AdContainer } from "../ads";
import styles from "./ListingArea.module.scss";

export interface ListingData {
  id: string;
  title: string;
  price: string; // Already includes currency symbol from formatPrice()
  location: string;
  accountType: "individual" | "dealer" | "business";
  specs?: Record<string, any>; // Dynamic specs from backend
  images: string[];
  isLiked?: boolean;
}

export interface ListingAreaProps {
  className?: string;
  listingType?: string; // ListingType enum value (sale/rent)
  listingTypeSlug?: string; // URL segment (sell/rent)
}

export const ListingArea: React.FC<ListingAreaProps> = ({
  className = "",
  listingType,
  listingTypeSlug = "sell", // Default to sell for backwards compatibility
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const categorySlug = params?.category as string;

  // Get data directly from stores
  const {
    listings,
    isLoading: loading,
    pagination,
    currentCategoryId,
    currentListingType,
    setSortFilter,
    setViewType,
    fetchListings,
    fetchListingsByCategory,
    setPagination,
  } = useListingsStore();

  const viewType = useListingsViewType();
  const { appliedFilters, getStoreFilters, setFilter } = useSearchStore();
  const { preferredCurrency } = useCurrencyStore(); // Subscribe to currency changes
  const { attributes, isLoading: countLoading } = useFiltersStore();
  const { getCategoryBySlug } = useCategoriesStore();
  const { provinces, fetchLocationMetadata } = useMetadataStore();

  // Fetch provinces if not loaded (needed for Arabic location names)
  useEffect(() => {
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
  }, [provinces.length, fetchLocationMetadata]);

  // Helper to get Arabic province name from key
  const getProvinceArabicName = (provinceKey: string): string => {
    const province = provinces.find((p) => p.key === provinceKey);
    return province?.nameAr || provinceKey;
  };

  // Store-based handlers (previously passed as props)
  const handleCardClick = (listingId: string) => {
    // Navigation is handled by ListingCard component's Link
  };

  // Filter toggle is now handled by Filter component itself (self-sufficient)

  // Fetch listings when component mounts or category changes
  // Skip if SSR already hydrated the store with listings
  useEffect(() => {
    const fetchInitialListings = async () => {
      if (!categorySlug) {
        return;
      }

      // Convert slug to ID using cached categories
      const category = getCategoryBySlug(categorySlug);
      if (!category) {
        return;
      }

      // Skip fetch if we already fetched for this category AND listing type (even if 0 results)
      // currentCategoryId and currentListingType are set after each successful fetch/hydration
      // This prevents infinite loop when category has no listings
      // Check both category AND listing type to ensure we refetch when navigating between /sell and /rent
      if (!loading && currentCategoryId === categorySlug && currentListingType === listingType) {
        return;
      }

      try {
        // Get current filters from search store
        // Always include listingType to ensure proper filtering for sale/rent separation
        const storeFilters = {
          categoryId: category.id,
          ...(listingType && { listingType }),
          ...getStoreFilters()
        };

        // Fetch listings for the current category (pass slug for URL, but use ID in filters)
        await fetchListingsByCategory(categorySlug, storeFilters, viewType);
      } catch (error) {
        // Silently fail - error state is handled by store
      }
    };

    fetchInitialListings();
  }, [categorySlug, listingType, viewType, fetchListingsByCategory, getStoreFilters, getCategoryBySlug, loading, currentCategoryId, currentListingType]);

  // Sync local viewMode with store viewType for backward compatibility
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    viewType === "detail" ? "list" : viewType === "list" ? "list" : "grid"
  );

  // Track grid columns for responsive ad insertion
  const [gridColumns, setGridColumns] = useState(4);

  // Detect grid columns based on viewport width
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width <= 768) { // breakpoint-sm
        setGridColumns(3);
      } else {
        setGridColumns(4);
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  // Update store when viewMode changes and refetch data with appropriate view
  const handleViewModeChange = (newViewMode: "grid" | "list") => {
    setViewMode(newViewMode);
    setViewType(newViewMode);

    // Refetch listings with new view type for optimized payload
    // Always include listingType to ensure proper filtering for sale/rent separation
    const currentFilters = {
      ...(listingType && { listingType }),
      ...getStoreFilters()
    };
    fetchListings(currentFilters, newViewMode);
  };

  // Filter specs based on view type and attribute flags from FiltersStore
  const filterSpecsByViewType = (
    allSpecs: Record<string, any>,
    currentViewType: string
  ): Record<string, any> => {
    // If no attributes loaded yet, return all specs
    if (!attributes || attributes.length === 0) {
      return allSpecs;
    }

    const filteredSpecs: Record<string, any> = {};

    // Check each spec against attribute display flags
    Object.entries(allSpecs).forEach(([specKey, specValue]) => {
      // Find the corresponding attribute definition
      const attribute = attributes.find(
        (attr) =>
          attr.key === specKey ||
          attr.name === specKey ||
          // Also check Arabic names that might be used as keys
          (typeof specKey === "string" &&
            attr.name &&
            attr.name.includes(specKey))
      );

      if (attribute) {
        // Check if this attribute should be shown for the current view type
        const shouldShow =
          currentViewType === "grid"
            ? attribute.showInGrid === true
            : currentViewType === "list"
              ? attribute.showInList === true
              : currentViewType === "detail"
                ? attribute.showInDetail === true
                : true; // Default to show if view type not recognized

        if (shouldShow) {
          filteredSpecs[specKey] = specValue;
        }
      } else {
        // If no attribute definition found, show in detail view only (be conservative)
        if (currentViewType === "detail") {
          filteredSpecs[specKey] = specValue;
        }
      }
    });

    return filteredSpecs;
  };

  // Convert store listings to component format
  const listingData: ListingData[] = (listings || []).map((listing) => {
    // Use specsDisplay for Arabic values if available, fallback to specs
    const allSpecs = listing.specsDisplay || listing.specs || {};

    // Add account type to specs with Arabic label if available from specsDisplay
    const specsWithAccountType = {
      ...allSpecs,
      // If accountType exists in specsDisplay, use it; otherwise create it from listing.accountType
      accountType: allSpecs.accountType || listing.accountType,
    };

    // Filter specs based on current view type and attribute flags
    const viewFilteredSpecs = filterSpecsByViewType(specsWithAccountType, viewType);

    // Handle price formatting (price is in dollars)
    // formatPrice() handles currency conversion based on user's preferred currency
    const displayPrice = formatPrice(listing.priceMinor || 0);

    // Extract location from listing.location object
    const provinceKey = (listing as any).location?.province;
    const city = (listing as any).location?.city;
    const province = provinceKey ? getProvinceArabicName(provinceKey) : "";

    // Format: "city, province" or just "province"
    const locationDisplay = city && province
      ? `${city}، ${province}`
      : province || "";

    return {
      id: listing.id,
      title: listing.title,
      price: displayPrice, // Already includes currency symbol from formatPrice()
      location: locationDisplay,
      accountType: listing.accountType as "individual" | "dealer" | "business",
      specs: viewFilteredSpecs, // Now using frontend view-filtered specs based on attribute flags
      images: listing.imageKeys || [],
      userId: listing.user?.id, // Pass user ID for favorite button ownership check
      isLiked: false, // TODO: Get from user favorites
    };
  });

  // Current sort from active filters or default to empty (shows disabled placeholder)
  const currentSort = (appliedFilters.sort as SortOption) || "";

  // Results count and pagination calculations
  const totalResults = pagination.total;
  const currentPage = pagination.page;
  const totalPages = Math.ceil(totalResults / pagination.limit);

  // Handle sort change with store coordination
  const handleSortChange = async (sort: SortOption) => {
    if (!categorySlug) return;

    setFilter("sort", sort);
    setSortFilter(sort);

    // Refetch listings with new sort
    // Always include listingType to ensure proper filtering for sale/rent separation
    try {
      const storeFilters = {
        categoryId: categorySlug,
        ...(listingType && { listingType }),
        ...getStoreFilters(),
        sort,
      };
      await fetchListingsByCategory(categorySlug, storeFilters, viewType);
    } catch (error) {
      // Silently fail - sort may still apply on next render
    }
  };

  // Handle pagination with store coordination
  const handlePageChange = async (page: number) => {
    if (!categorySlug) return;

    setPagination({ page });

    // Fetch listings for new page
    // Always include listingType to ensure proper filtering for sale/rent separation
    try {
      const storeFilters = {
        categoryId: categorySlug,
        ...(listingType && { listingType }),
        ...getStoreFilters()
      };
      await fetchListingsByCategory(categorySlug, storeFilters, viewType);
    } catch (error) {
      // Silently fail - pagination error state handled by store
    }
  };

  // Filter removal now handled directly by AppliedFilters through store

  return (
    <div className={`${styles.listingArea} ${className}`}>
      {/* Header with view controls */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {totalResults !== undefined && (
            <Text variant="paragraph" className={styles.resultsCount}>
              {countLoading ? (
                <Loading />
              ) : (
                `${totalResults} ${t("search.totalResults")}`
              )}
            </Text>
          )}
        </div>

        <div className={styles.headerRight}>
          <SortControls
            currentSort={currentSort}
            onSortChange={handleSortChange}
          />

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === "grid" ? styles.active : ""
                }`}
              onClick={() => handleViewModeChange("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 size={20} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === "list" ? styles.active : ""
                }`}
              onClick={() => handleViewModeChange("list")}
              aria-label="List view"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Applied Filters */}
      <AppliedFilters />

      {/* Loading state - Show skeleton cards */}
      {loading && (
        <div className={`${styles.listingsContainer} ${styles[viewMode]}`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <ListingCard
              key={`skeleton-${index}`}
              id=""
              title=""
              price=""
              location=""
              accountType="individual"
              viewMode={viewMode}
              isLoading={true}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && listingData.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Search size={48} /></div>
          <Text variant="h3" className={styles.emptyTitle}>
            {t("search.noResults")}
          </Text>
          <Text variant="paragraph" className={styles.emptyDescription}>
            {t("search.noResultsDescription")}
          </Text>
        </div>
      )}

      {/* Listings Grid/List */}
      {!loading && listingData.length > 0 && (
        <div className={`${styles.listingsContainer} ${styles[viewMode]}`}>
          {listingData.map((listing, index) => {
            // Calculate ad insertion frequency based on grid columns
            // Insert ad after every 2 full rows in grid mode
            const adFrequency = viewMode === 'grid' ? gridColumns * 2 : 6;
            const shouldShowAd = (index + 1) % adFrequency === 0 && index !== listingData.length - 1;

            return (
              <React.Fragment key={listing.id}>
                <ListingCard
                  {...listing}
                  viewMode={viewMode}
                  onClick={handleCardClick}
                  priority={index < 4}
                  categorySlug={categorySlug}
                  listingTypeSlug={listingTypeSlug}
                />
                {shouldShowAd && (
                  <div className={styles.adSlot} style={{ gridColumn: viewMode === 'grid' ? '1 / -1' : 'auto' }}>
                    <AdContainer
                      placement="between_listings"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && listingData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          previousLabel={t("pagination.previous")}
          nextLabel={t("pagination.next")}
          className={styles.pagination}
        />
      )}
    </div>
  );
};

export default ListingArea;
