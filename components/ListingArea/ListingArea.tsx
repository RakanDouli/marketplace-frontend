import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Grid3X3, List } from "lucide-react";
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
import styles from "./ListingArea.module.scss";

export interface ListingData {
  id: string;
  title: string;
  price: string;
  currency: string;
  location: string;
  sellerType: "private" | "dealer" | "business";
  specs?: Record<string, any>; // Dynamic specs from backend
  images: string[];
  isLiked?: boolean;
}

export interface ListingAreaProps {
  className?: string;
}

export const ListingArea: React.FC<ListingAreaProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const params = useParams();
  const categorySlug = params?.category as string;

  // Get data directly from stores
  const {
    listings,
    isLoading: loading,
    pagination,
    setSortFilter,
    setViewType,
    fetchListings,
    fetchListingsByCategory,
    setPagination,
  } = useListingsStore();

  const viewType = useListingsViewType();
  const { appliedFilters, getStoreFilters, setFilter } = useSearchStore();
  const { attributes, isLoading: countLoading } = useFiltersStore();
  const { getCategoryBySlug } = useCategoriesStore();

  // Store-based handlers (previously passed as props)
  const handleCardClick = (listingId: string) => {
    // TODO: Navigate to listing detail page
    console.log("Navigate to listing:", listingId);
  };

  const handleCardLike = (listingId: string, liked: boolean) => {
    // TODO: Update user favorites
    console.log("Toggle like:", listingId, liked);
  };

  // Filter toggle is now handled by Filter component itself (self-sufficient)

  // Fetch listings when component mounts or category changes
  useEffect(() => {
    const fetchInitialListings = async () => {
      if (!categorySlug) {
        console.log("❌ No categorySlug available");
        return;
      }

      // Convert slug to ID using cached categories
      const category = getCategoryBySlug(categorySlug);
      if (!category) {
        console.log("❌ Category not found for slug:", categorySlug);
        return;
      }

      try {
        // Get current filters from search store
        const storeFilters = { categoryId: category.id, ...getStoreFilters() };
        console.log("📋 Fetching listings with filters:", storeFilters);

        // Fetch listings for the current category (pass slug for URL, but use ID in filters)
        await fetchListingsByCategory(categorySlug, storeFilters, viewType);
        console.log("✅ Successfully fetched listings");
      } catch (error) {
        console.error("❌ Error fetching initial listings:", error);
      }
    };

    fetchInitialListings();
  }, [categorySlug, viewType, fetchListingsByCategory, getStoreFilters, getCategoryBySlug]);

  // Sync local viewMode with store viewType for backward compatibility
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    viewType === "detail" ? "list" : viewType === "list" ? "list" : "grid"
  );

  // Update store when viewMode changes and refetch data with appropriate view
  const handleViewModeChange = (newViewMode: "grid" | "list") => {
    setViewMode(newViewMode);
    setViewType(newViewMode);

    // Refetch listings with new view type for optimized payload
    const currentFilters = getStoreFilters();
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

    // Filter specs based on current view type and attribute flags
    const viewFilteredSpecs = filterSpecsByViewType(allSpecs, viewType);

    // Handle price formatting consistently
    const displayPrice = listing.prices?.[0]?.value
      ? listing.prices[0].value.toString()
      : ((listing.priceMinor || 0) / 100).toString();

    const displayCurrency = listing.prices?.[0]?.currency || "USD";

    return {
      id: listing.id,
      title: listing.title,
      price: displayPrice,
      currency: displayCurrency,
      location: (allSpecs as any).location || (listing as any).province || (listing as any).city || "",
      sellerType:
        listing.accountType === "INDIVIDUAL"
          ? "private"
          : listing.accountType === "DEALER"
            ? "dealer"
            : "business",
      specs: viewFilteredSpecs, // Now using frontend view-filtered specs based on attribute flags
      images: listing.imageKeys || [],
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
    try {
      const storeFilters = {
        categoryId: categorySlug,
        ...getStoreFilters(),
        sort,
      };
      await fetchListingsByCategory(categorySlug, storeFilters, viewType);
    } catch (error) {
      console.error("❌ Error applying sort:", error);
    }
  };

  // Handle pagination with store coordination
  const handlePageChange = async (page: number) => {
    if (!categorySlug) return;

    setPagination({ page });

    // Fetch listings for new page
    try {
      const storeFilters = { categoryId: categorySlug, ...getStoreFilters() };
      await fetchListingsByCategory(categorySlug, storeFilters, viewType);
    } catch (error) {
      console.error("❌ Error loading page:", page, error);
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

      {/* Loading state */}
      {loading && (
        <div className={styles.loadingState}>
          <Loading type="svg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && listingData.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚗</div>
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
          {listingData.map((listing, index) => (
            <ListingCard
              key={listing.id}
              {...listing}
              viewMode={viewMode}
              onClick={handleCardClick}
              onLike={handleCardLike}
              priority={index < 4}
            />
          ))}
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
