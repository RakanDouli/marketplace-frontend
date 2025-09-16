import React, { useState } from "react";
import { Grid3X3, List, Filter as FilterIcon } from "lucide-react";
import { ListingCard, Button, Text } from "../slices";
import { Loading } from "../slices/Loading/Loading";
import { useTranslation } from "../../hooks/useTranslation";
import { AppliedFilters } from "../AppliedFilters/AppliedFilters";
import { SortControls, SortOption } from "../slices/SortControls/SortControls";
import { useListingsStore, useSearchStore, useFiltersStore } from "../../stores";
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
  onCardClick?: (id: string) => void;
  onCardLike?: (id: string, liked: boolean) => void;
  onToggleFilters?: () => void;
  className?: string;
}

export const ListingArea: React.FC<ListingAreaProps> = ({
  onCardClick,
  onCardLike,
  onToggleFilters,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { t } = useTranslation();

  // Get data directly from stores
  const {
    listings,
    isLoading: loading,
    pagination,
    setSortFilter
  } = useListingsStore();

  const {
    activeFilters,
    removeFilter,
    removeSpecFilter,
    clearAllFilters
  } = useSearchStore();

  const {
    attributes,
    isLoading: countLoading
  } = useFiltersStore();

  // Convert store listings to component format
  const listingData: ListingData[] = (listings || []).map((listing) => {
    const specs = listing.specs || {};

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
      location: listing.city || "",
      sellerType: listing.sellerType === "PRIVATE" ? "private"
                 : listing.sellerType === "DEALER" ? "dealer"
                 : "business",
      specs: specs, // Pass all dynamic specs
      images: listing.imageKeys || [],
      isLiked: false, // TODO: Get from user favorites
    };
  });

  // Current sort from active filters or default
  const currentSort = (activeFilters.sort as SortOption) || "createdAt_desc";

  // Results count and pagination calculations
  const totalResults = pagination.total;
  const currentPage = pagination.page;
  const totalPages = Math.ceil(totalResults / pagination.limit);

  // Handle sort change
  const handleSortChange = (sort: SortOption) => {
    setSortFilter(sort);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    // Update pagination in the listings store
    // The store will automatically refetch data with new page
    // TODO: Add setPagination method to listingsStore
    console.log('Page change requested:', page);
  };

  // Handle filter removal
  const handleRemoveFilter = (filterKey: string) => {
    if (filterKey.includes('.')) {
      // It's a spec filter
      removeSpecFilter(filterKey);
    } else {
      removeFilter(filterKey as any);
    }
  };

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
              className={`${styles.viewButton} ${
                viewMode === "grid" ? styles.active : ""
              }`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 size={20} />
            </button>
            <button
              className={`${styles.viewButton} ${
                viewMode === "list" ? styles.active : ""
              }`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Applied Filters */}
      <AppliedFilters
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
        attributes={attributes}
      />

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
          <Button variant="primary" onClick={onToggleFilters}>
            {t("search.modifyFilters")}
          </Button>
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
              onClick={onCardClick}
              onLike={onCardLike}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && listingData.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            {t("pagination.previous")}
          </Button>

          <div className={styles.pageNumbers}>
            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(
                1,
                currentPage - Math.floor(maxVisiblePages / 2)
              );
              let endPage = Math.min(
                totalPages,
                startPage + maxVisiblePages - 1
              );

              // Adjust start if we're near the end
              if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              const pages = [];

              // Show first page and ellipsis if needed
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    className={`${styles.pageButton} ${
                      currentPage === 1 ? styles.active : ""
                    }`}
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" className={styles.ellipsis}>
                      ...
                    </span>
                  );
                }
              }

              // Show visible page range
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`${styles.pageButton} ${
                      currentPage === i ? styles.active : ""
                    }`}
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </button>
                );
              }

              // Show ellipsis and last page if needed
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" className={styles.ellipsis}>
                      ...
                    </span>
                  );
                }
                pages.push(
                  <button
                    key={totalPages}
                    className={`${styles.pageButton} ${
                      currentPage === totalPages ? styles.active : ""
                    }`}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            {t("pagination.next")}
          </Button>
        </div>
      )}

      {/* Floating Filter Button for Mobile */}
      <Button
        className={styles.floatingFilterButton}
        onClick={onToggleFilters}
        variant="outline"
        aria-label={t("search.filters")}
      >
        <FilterIcon size={24} />
        {t("search.filters")}
      </Button>
    </div>
  );
};

export default ListingArea;
