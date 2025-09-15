import React, { useState } from "react";
import { Grid3X3, List, Filter as FilterIcon } from "lucide-react";
import { ListingCard, Button, Text } from "../slices";
import { Loading } from "../slices/Loading/Loading";
import { useTranslation } from "../../hooks/useTranslation";
import { AppliedFilters } from "../AppliedFilters/AppliedFilters";
import { SortControls, SortOption } from "../SortControls/SortControls";
import styles from "./ListingArea.module.scss";

export interface ListingData {
  id: string;
  title: string;
  price: string;
  currency: string;
  firstRegistration: string;
  mileage: string;
  fuelType: string;
  location: string;
  sellerType: "private" | "dealer" | "business";
  images: string[];
  isLiked?: boolean;
}

export interface ListingAreaProps {
  listings: ListingData[];
  loading?: boolean;
  countLoading?: boolean; // Separate loading state for results count
  onCardClick?: (id: string) => void;
  onCardLike?: (id: string, liked: boolean) => void;
  onToggleFilters?: () => void;
  className?: string;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // New props for sorting
  totalResults?: number;
  currentSort?: SortOption;
  onRemoveFilter?: (filterKey: string) => void;
  onClearAllFilters?: () => void;
  onSortChange?: (sort: SortOption) => void;
  attributes?: Array<{
    key: string;
    name: string;
    type: string;
    options?: Array<{
      key: string;
      value: string;
    }>;
  }>;
}

export const ListingArea: React.FC<ListingAreaProps> = ({
  listings,
  loading = false,
  countLoading = false,
  onCardClick,
  onCardLike,
  onToggleFilters,
  className = "",
  total = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalResults,
  currentSort = "createdAt_desc",
  onRemoveFilter,
  onClearAllFilters,
  onSortChange,
  attributes = [],
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { t } = useTranslation();

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
          {onSortChange && (
            <SortControls
              currentSort={currentSort}
              onSortChange={onSortChange}
            />
          )}

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
      {onRemoveFilter && onClearAllFilters && (
        <AppliedFilters
          onRemoveFilter={onRemoveFilter}
          onClearAllFilters={onClearAllFilters}
          attributes={attributes}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className={styles.loadingState}>
          <Loading type="svg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
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
      {!loading && listings.length > 0 && (
        <div className={`${styles.listingsContainer} ${styles[viewMode]}`}>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              {...listing}
              viewMode={viewMode}
              onClick={onCardClick}
              onLike={onCardLike}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && listings.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1)}
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
                    onClick={() => onPageChange?.(1)}
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
                    onClick={() => onPageChange?.(i)}
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
                    onClick={() => onPageChange?.(totalPages)}
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
            onClick={() => onPageChange?.(currentPage + 1)}
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
