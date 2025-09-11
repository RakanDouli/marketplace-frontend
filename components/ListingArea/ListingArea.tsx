import React, { useState } from 'react';
import { Grid3X3, List, Filter as FilterIcon } from 'lucide-react';
import { ListingCard, Button, Text } from '../slices';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './ListingArea.module.scss';

export interface ListingData {
  id: string;
  title: string;
  price: string;
  currency: string;
  firstRegistration: string;
  mileage: string;
  fuelType: string;
  location: string;
  sellerType: 'private' | 'dealer' | 'business';
  images: string[];
  isLiked?: boolean;
}

export interface ListingAreaProps {
  listings: ListingData[];
  loading?: boolean;
  onCardClick?: (id: string) => void;
  onCardLike?: (id: string, liked: boolean) => void;
  onToggleFilters?: () => void;
  className?: string;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const ListingArea: React.FC<ListingAreaProps> = ({
  listings,
  loading = false,
  onCardClick,
  onCardLike,
  onToggleFilters,
  className = '',
  total = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { t } = useTranslation();

  return (
    <div className={`${styles.listingArea} ${className}`}>
      {/* Header with view controls */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.filterToggle}
            onClick={onToggleFilters}
            aria-label={t('search.filters')}
          >
            <FilterIcon size={20} />
            <span>{t('search.filters')}</span>
          </button>
          
          <Text variant="paragraph" className={styles.resultsCount}>
            {loading ? t('common.loading') : `${listings.length} ${t('search.results')}`}
          </Text>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3X3 size={20} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={styles.loadingCard}>
                <div className={styles.loadingImage} />
                <div className={styles.loadingContent}>
                  <div className={styles.loadingLine} />
                  <div className={styles.loadingLine} />
                  <div className={styles.loadingLine} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚗</div>
          <Text variant="h3" className={styles.emptyTitle}>
            {t('search.noResults')}
          </Text>
          <Text variant="paragraph" className={styles.emptyDescription}>
            {t('search.noResultsDescription')}
          </Text>
          <Button variant="primary" onClick={onToggleFilters}>
            {t('search.modifyFilters')}
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
            {t('pagination.previous')}
          </Button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  className={`${styles.pageButton} ${currentPage === pageNum ? styles.active : ''}`}
                  onClick={() => onPageChange?.(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className={styles.ellipsis}>...</span>}
          </div>
          
          <Button 
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            {t('pagination.next')}
          </Button>
        </div>
      )}

      {/* Floating Filter Button for Mobile */}
      <button
        className={styles.floatingFilterButton}
        onClick={onToggleFilters}
        aria-label={t('search.filters')}
      >
        <FilterIcon size={24} />
        <span>{t('search.filters')}</span>
      </button>
    </div>
  );
};

export default ListingArea;