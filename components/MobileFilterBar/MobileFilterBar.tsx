'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSearchStore, useFiltersStore, useListingsStore } from '@/stores';
import { AttributeType } from '@/common/enums';
import { Button, Text } from '../slices';
import styles from './MobileFilterBar.module.scss';

interface MobileFilterBarProps {
  onFilterClick: () => void;
}

export const MobileFilterBar: React.FC<MobileFilterBarProps> = ({
  onFilterClick,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const chipsContainerRef = useRef<HTMLDivElement>(null);

  // Store hooks
  const {
    appliedFilters: filters,
    removeFilter,
    removeSpecFilter,
    clearAllFilters,
    getStoreFilters,
    getBackendFilters,
  } = useSearchStore();
  const { attributes, updateFiltersWithCascading, currentCategorySlug } = useFiltersStore();
  const { fetchListingsByCategory, setPagination } = useListingsStore();

  // MobileFilterBar should always stay visible (unlike MobileBackButton)
  // It only hides when user scrolls up to reveal MobileBackButton
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Always visible, but position changes based on MobileBackButton visibility
      if (currentScrollY < 50 || scrollDelta < -5) {
        setIsVisible(true); // MobileBackButton is visible, filter bar below it
      } else if (scrollDelta > 5) {
        setIsVisible(false); // MobileBackButton hidden, filter bar moves to top
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper function to get display name for attribute values
  const getAttributeDisplayName = (attributeKey: string, value: any) => {
    const attribute = attributes.find((attr) => attr.key === attributeKey);

    if (Array.isArray(value)) {
      if (
        attribute &&
        (attribute.type === AttributeType.MULTI_SELECTOR ||
          attributeKey === 'body_type' ||
          attributeKey === 'engine_size')
      ) {
        const optionsToSearch =
          (attribute as any).processedOptions || attribute.options || [];
        const displayValues = value.map((val) => {
          const option = optionsToSearch.find((opt: any) => opt.key === val);
          return option ? option.value : val;
        });
        return displayValues.join(', ');
      }
      return value.join(' - ');
    }

    if (!attribute) return value;

    const optionsToSearch =
      (attribute as any).processedOptions || attribute.options || [];

    if (attributeKey === 'brandId' || attributeKey === 'modelId') {
      const option = optionsToSearch.find((opt: any) => opt.key === value);
      return option ? option.value : value;
    }

    if (optionsToSearch && optionsToSearch.length > 0) {
      const option = optionsToSearch.find(
        (opt: any) => opt.key === value || opt.value === value
      );
      if (option) return option.value;
    }

    return value;
  };

  // Collect active filters
  const activeFilters: Array<{ key: string; label: string; value: any }> = [];

  // Add spec filters
  if (filters.specs) {
    Object.entries(filters.specs).forEach(([specKey, specValue]) => {
      if (specValue != null && specValue !== '') {
        let actualValue = specValue;
        if (typeof specValue === 'object' && (specValue as any).selected !== undefined) {
          actualValue = (specValue as any).selected;
        }

        if (actualValue == null || actualValue === '') return;

        const attribute = attributes.find((attr) => attr.key === specKey);
        const displayName = getAttributeDisplayName(specKey, actualValue);
        activeFilters.push({
          key: `specs.${specKey}`,
          label: attribute?.name || specKey,
          value: displayName,
        });
      }
    });
  }

  // Add price filter
  if (filters.priceMinMinor || filters.priceMaxMinor) {
    const currency = filters.priceCurrency || 'USD';
    const min = filters.priceMinMinor ? filters.priceMinMinor.toLocaleString() : '';
    const max = filters.priceMaxMinor ? filters.priceMaxMinor.toLocaleString() : '';

    let priceLabel = '';
    if (min && max) {
      priceLabel = `${min} - ${max} ${currency}`;
    } else if (min) {
      priceLabel = `> ${min} ${currency}`;
    } else if (max) {
      priceLabel = `< ${max} ${currency}`;
    }

    if (priceLabel) {
      activeFilters.push({
        key: 'price',
        label: t('search.price'),
        value: priceLabel,
      });
    }
  }

  // Add location filters
  if (filters.province) {
    activeFilters.push({
      key: 'province',
      label: t('search.province'),
      value: filters.province,
    });
  }

  if (filters.city) {
    activeFilters.push({
      key: 'city',
      label: t('search.city'),
      value: filters.city,
    });
  }

  // Add account type
  if (filters.accountType) {
    const accountTypeAttribute = attributes.find((attr) => attr.key === 'accountType');
    const displayValue = getAttributeDisplayName('accountType', filters.accountType);
    activeFilters.push({
      key: 'accountType',
      label: accountTypeAttribute?.name || 'نوع الحساب',
      value: displayValue,
    });
  }

  // Add search filter
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: t('search.searchTerm'),
      value: filters.search,
    });
  }

  const filterCount = activeFilters.length;

  // Handle filter removal
  const handleRemoveFilter = async (filterKey: string) => {
    if (!currentCategorySlug) return;

    if (filterKey.startsWith('specs.')) {
      const specKey = filterKey.replace('specs.', '');
      removeSpecFilter(specKey);
    } else if (filterKey === 'price') {
      removeFilter('priceMinMinor');
      removeFilter('priceMaxMinor');
      removeFilter('priceCurrency');
    } else {
      removeFilter(filterKey as any);
    }

    try {
      const backendFilters = { categoryId: currentCategorySlug, ...getBackendFilters() };
      await updateFiltersWithCascading(currentCategorySlug, backendFilters);

      const storeFilters = { categoryId: currentCategorySlug, ...getStoreFilters() };
      setPagination({ page: 1 });
      await fetchListingsByCategory(currentCategorySlug, storeFilters, 'grid');
    } catch (error) {
      console.error('Error removing filter:', error);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (!currentCategorySlug) return;

    clearAllFilters();

    try {
      const backendFilters = { categoryId: currentCategorySlug, ...getBackendFilters() };
      await updateFiltersWithCascading(currentCategorySlug, backendFilters);

      const storeFilters = { categoryId: currentCategorySlug, ...getStoreFilters() };
      setPagination({ page: 1 });
      await fetchListingsByCategory(currentCategorySlug, storeFilters, 'grid');
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  // Get total results count from listingsStore
  const { pagination } = useListingsStore();
  const totalResults = pagination?.total || 0;

  return (
    <div className={`${styles.mobileFilterBar} ${isVisible ? styles.belowHeader : styles.atTop}`}>
      {/* Line 1: Total count + Clear all (clear button only shows when filters applied) */}
      <div className={styles.topRow}>
        <Text variant="small" className={styles.totalCount}>
          {totalResults} {t('search.results')}
        </Text>
        {true && (
          <span
            className={styles.clearButton}
            onClick={handleClearAll}
          >

            {t('search.clearAllFilters')}
            <Trash2 size={14} />
          </span>
        )}
      </div>

      {/* Line 2: Filter button + Applied chips */}
      <div className={styles.bottomRow}>
        <button
          type="button"
          className={styles.filterButton}
          onClick={onFilterClick}
        >
          <SlidersHorizontal size={18} />
          {t('search.filters')}
          {filterCount > 0 && (
            <span className={styles.filterCount}>{filterCount}</span>
          )}
        </button>

        {/* Applied Filters - Horizontal Scroll */}
        {activeFilters.length > 0 && (
          <div ref={chipsContainerRef} className={styles.filtersList}>
            {activeFilters.map((filter) => (
              <div key={filter.key} className={styles.filterTag}>
                <Text variant="small" className={styles.filterValue}>
                  {filter.value}
                </Text>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveFilter(filter.key)}
                  aria-label={t('search.removeFilter')}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFilterBar;
