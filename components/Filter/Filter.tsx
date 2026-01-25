"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import { IconGridSelector } from "../IconGridSelector";
import { Aside, Text, Button, Collapsible } from "../slices";
import { Loading } from "../slices/Loading/Loading";
import {
  useTranslation,
  useFilterActions,
  useAttributeFilters
} from "../../hooks";
import { AttributeType } from "../../common/enums";
import {
  useFiltersStore,
  useListingsStore,
  useSearchStore,
} from "../../stores";
import { useCurrencyStore } from "../../stores/currencyStore";
import {
  RangeFilter,
  RangeSelectorFilter,
  SelectFilter,
  MultiSelectFilter,
  SearchFilter,
  PriceFilter,
} from "./components";
import styles from "./Filter.module.scss";


export interface FilterValues {
  // Standard filters
  priceMinMinor?: number;
  priceMaxMinor?: number;
  priceCurrency?: string;
  city?: string;
  province?: string;
  accountType?: string;

  // Brand/Model
  brandId?: string;
  modelId?: string;

  // Dynamic attributes (stored in specs) - matches backend structure
  specs?: Record<
    string,
    | {
      selected?: string | string[];
      value?: number;
      from?: number;
      to?: number;
      text?: string;
      amount?: number;
      currency?: string;
    }
    | number[] // Support array format for range filters
  >;

  // Legacy support
  search?: string;
}

export interface FilterProps {
  className?: string;
  /** Controlled open state (for MobileFilterBar integration) */
  isOpen?: boolean;
  /** Callback when aside should close */
  onOpenChange?: (open: boolean) => void;
}

export const Filter: React.FC<FilterProps> = ({
  className = "",
  isOpen: controlledIsOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const params = useParams();

  // Get categorySlug from URL params (self-sufficient)
  const categorySlug = params?.category as string;

  // Support both controlled and uncontrolled modes
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Mobile "show more" state - only show first 7 filters on mobile by default
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // Custom hooks for filter management
  const filterActions = useFilterActions(categorySlug);
  const attributeFilters = useAttributeFilters();

  // Search store for draft functionality
  const {
    draftFilters,
    setDraftFilter,
    setDraftSpecFilter,
    applyDrafts,
    hasRangeDraftChanges,
    clearAllFilters,
  } = useSearchStore();

  // Store hooks
  const {
    isLoading: filtersLoading,
    fetchFilterData,
  } = useFiltersStore();
  const {
    isLoading: listingsLoading,
    fetchListingsByCategory,
    pagination,
  } = useListingsStore();

  // Get totalResults from listings pagination (updates after each filter)
  const totalResults = pagination?.total ?? 0;

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Helper functions for draft values - price is in dollars (USD)
  const getDraftPriceMin = () => draftFilters.priceMinMinor ? draftFilters.priceMinMinor.toString() : "";
  const getDraftPriceMax = () => draftFilters.priceMaxMinor ? draftFilters.priceMaxMinor.toString() : "";

  const setDraftPriceMin = (value: string) => {
    const dollarValue = value ? parseFloat(value) : undefined;
    setDraftFilter("priceMinMinor", dollarValue || undefined);
  };

  const setDraftPriceMax = (value: string) => {
    const dollarValue = value ? parseFloat(value) : undefined;
    setDraftFilter("priceMaxMinor", dollarValue || undefined);
  };

  // Helper for range inputs
  const getDraftRangeValue = (attributeKey: string, field: 'min' | 'max') => {
    const value = draftFilters.specs?.[attributeKey];
    if (Array.isArray(value)) {
      return field === 'min' ? value[0]?.toString() || "" : value[1]?.toString() || "";
    }
    return "";
  };

  const updateDraftRangeInput = (attributeKey: string, field: 'min' | 'max', value: string) => {
    const currentValue = draftFilters.specs?.[attributeKey] || [undefined, undefined];
    const newValue = [...currentValue];
    const numValue = value ? parseFloat(value) : undefined;

    if (field === 'min') {
      newValue[0] = numValue;
    } else {
      newValue[1] = numValue;
    }

    // Remove undefined values and set to undefined if empty
    const cleanValue = newValue.filter(v => v !== undefined);
    setDraftSpecFilter(attributeKey, cleanValue.length > 0 ? newValue : undefined);
  };

  const { handleSpecChange } = filterActions;

  const {
    getFilterableAttributes,
    getSelectedOptions,
    getSingleSelectorValue,
  } = attributeFilters;

  // Get sorted attributes for filters (no grouping - each attribute is its own section)
  const getSortedAttributes = () => {
    const attributes = getFilterableAttributes();
    // Sort by groupOrder FIRST, then by sortOrder within each group
    // This matches the create form order:
    //   groupOrder 1 = Car selection (brand, model, year, mileage)
    //   groupOrder 2 = Basic info (listingType, condition, price)
    //   groupOrder 3 = Specs (fuel, transmission, body_type, etc.)
    //   groupOrder 4 = Location & seller (location, accountType)
    const sorted = attributes.sort((a, b) => {
      if (a.groupOrder !== b.groupOrder) {
        return a.groupOrder - b.groupOrder;
      }
      return a.sortOrder - b.sortOrder;
    });

    // Move location to appear right after price
    const locationIndex = sorted.findIndex(attr => attr.key === 'location');
    const priceIndex = sorted.findIndex(attr => attr.type === AttributeType.CURRENCY);

    if (locationIndex !== -1 && priceIndex !== -1 && locationIndex > priceIndex) {
      const [locationAttr] = sorted.splice(locationIndex, 1);
      sorted.splice(priceIndex + 1, 0, locationAttr);
    }

    return sorted;
  };

  // Apply handler - triggers both draft apply and backend fetch
  // Optional priceOverride allows immediate price filter without waiting for Zustand state
  const handleApplyFilter = async (priceOverride?: { min?: number; max?: number }) => {
    applyDrafts();

    // Get fresh state from store (not stale component state)
    const freshDraftFilters = useSearchStore.getState().draftFilters;
    // Get current currency from currency store (set by user in header)
    const currentCurrency = useCurrencyStore.getState().preferredCurrency;

    const storeFilters: any = { categoryId: categorySlug };

    // Price filters - use override value if the key exists in override, otherwise use fresh store state
    // This ensures the changed value is sent immediately while other values come from fresh state
    const priceMin = priceOverride && 'min' in priceOverride
      ? priceOverride.min
      : freshDraftFilters.priceMinMinor;
    const priceMax = priceOverride && 'max' in priceOverride
      ? priceOverride.max
      : freshDraftFilters.priceMaxMinor;

    if (priceMin) storeFilters.priceMinMinor = priceMin;
    if (priceMax) storeFilters.priceMaxMinor = priceMax;
    if (priceMin || priceMax) {
      storeFilters.priceCurrency = currentCurrency;
    }

    // Search
    const searchValue = freshDraftFilters.specs?.search || freshDraftFilters.search;
    if (searchValue && typeof searchValue === 'string' && searchValue.trim()) {
      storeFilters.search = searchValue.trim();
    }

    // Location
    const provinceValue = freshDraftFilters.specs?.location || freshDraftFilters.province;
    if (provinceValue) {
      storeFilters.province = provinceValue;
    }
    if (freshDraftFilters.city) {
      storeFilters.city = freshDraftFilters.city;
    }

    // Account Type
    const sellerTypeValue = freshDraftFilters.specs?.accountType || freshDraftFilters.accountType;
    if (sellerTypeValue) {
      storeFilters.accountType = sellerTypeValue;
    }

    // Brand/Model
    if (freshDraftFilters.brandId) {
      if (!storeFilters.specs) storeFilters.specs = {};
      storeFilters.specs.brandId = freshDraftFilters.brandId;
    }
    if (freshDraftFilters.modelId) {
      if (!storeFilters.specs) storeFilters.specs = {};
      storeFilters.specs.modelId = freshDraftFilters.modelId;
    }

    // Sort
    if (freshDraftFilters.sort) storeFilters.sort = freshDraftFilters.sort;

    // All other specs
    if (freshDraftFilters.specs && Object.keys(freshDraftFilters.specs).length > 0) {
      if (!storeFilters.specs) storeFilters.specs = {};
      Object.entries(freshDraftFilters.specs).forEach(([key, value]) => {
        if (key !== 'search' && key !== 'location' && key !== 'sellerType') {
          storeFilters.specs[key] = value;
        }
      });
    }

    await fetchListingsByCategory(categorySlug, storeFilters, "grid");
  };

  // Render a single attribute filter
  const renderAttribute = (attribute: any) => {
    // Skip search attribute - it's now in the header (MobileBackButton on mobile, desktop search bar)
    if (attribute.key === 'search') {
      return null;
    }

    // SELECTOR (single dropdown) - with special icon grid for body_type
    if (attribute.type === AttributeType.SELECTOR && attribute.processedOptions) {
      // Special icon-based selector for body_type (multi-select with icons)
      if (attribute.key === "body_type") {
        return (
          <IconGridSelector
            key={attribute.id}
            selected={getSelectedOptions(attribute.key)}
            onChange={(newSelected) => handleSpecChange(
              attribute.key,
              newSelected.length > 0 ? newSelected : undefined
            )}
            iconBasePath="/images/car-types"
            options={attribute.processedOptions.map((opt: any) => ({
              key: opt.key,
              label: opt.value,
              count: opt.count,
            }))}
          />
        );
      }

      return (
        <SelectFilter
          key={attribute.id}
          attributeKey={attribute.key}
          label={attribute.name}
          options={attribute.processedOptions}
          value={getSingleSelectorValue(attribute.key)}
          onChange={(value) => handleSpecChange(attribute.key, value)}
          hideLabel
        />
      );
    }

    // MULTI_SELECTOR (checkboxes or icon grid)
    if (attribute.type === AttributeType.MULTI_SELECTOR && attribute.processedOptions) {
      // Special icon-based selector for body_type
      if (attribute.key === "body_type") {
        return (
          <IconGridSelector
            key={attribute.id}
            selected={getSelectedOptions(attribute.key)}
            onChange={(newSelected) => handleSpecChange(
              attribute.key,
              newSelected.length > 0 ? newSelected : undefined
            )}
            iconBasePath="/images/car-types"
            options={attribute.processedOptions.map((opt: any) => ({
              key: opt.key,
              label: opt.value,
              count: opt.count,
            }))}
          />
        );
      }

      // Regular multi-select checkboxes
      return (
        <MultiSelectFilter
          key={attribute.id}
          attributeKey={attribute.key}
          label={attribute.name}
          options={attribute.processedOptions}
          selected={getSelectedOptions(attribute.key)}
          onChange={(newSelected) => handleSpecChange(
            attribute.key,
            newSelected.length > 0 ? newSelected : undefined
          )}
          hideLabel
        />
      );
    }

    // CURRENCY (price filter with dropdown selectors)
    if (attribute.type === AttributeType.CURRENCY) {
      return (
        <PriceFilter
          key={attribute.id}
          label={attribute.name}
          minValue={getDraftPriceMin()}
          maxValue={getDraftPriceMax()}
          categoryKey={categorySlug}
          resultCount={totalResults}
          onMinChange={(value) => {
            const numValue = value ? parseFloat(value) : undefined;
            setDraftPriceMin(value || "");
            // Only pass min in override - let max come from fresh store state
            handleApplyFilter({ min: numValue });
          }}
          onMaxChange={(value) => {
            const numValue = value ? parseFloat(value) : undefined;
            setDraftPriceMax(value || "");
            // Only pass max in override - let min come from fresh store state
            handleApplyFilter({ max: numValue });
          }}
          onReset={() => {
            setDraftFilter("priceMinMinor", undefined);
            setDraftFilter("priceMaxMinor", undefined);
            // Pass explicit undefined values to clear price filters
            handleApplyFilter({ min: undefined, max: undefined });
          }}
          hideLabel
        />
      );
    }

    // RANGE (min-max numeric inputs)
    if (attribute.type === AttributeType.RANGE) {
      return (
        <RangeFilter
          key={attribute.id}
          attributeKey={attribute.key}
          label={attribute.name}
          minValue={getDraftRangeValue(attribute.key, "min")}
          maxValue={getDraftRangeValue(attribute.key, "max")}
          onMinChange={(value) => updateDraftRangeInput(attribute.key, "min", value)}
          onMaxChange={(value) => updateDraftRangeInput(attribute.key, "max", value)}
          onApply={handleApplyFilter}
          applyDisabled={!hasRangeDraftChanges(attribute.key)}
          isLoading={listingsLoading}
          hideLabel
        />
      );
    }

    // RANGE_SELECTOR (min-max dropdown selects with options)
    // Same logic as RANGE but auto-applies on selection change (no Apply button)
    if (attribute.type === AttributeType.RANGE_SELECTOR && attribute.processedOptions) {
      return (
        <RangeSelectorFilter
          key={attribute.id}
          attributeKey={attribute.key}
          label={attribute.name}
          options={attribute.processedOptions}
          minValue={getDraftRangeValue(attribute.key, "min")}
          maxValue={getDraftRangeValue(attribute.key, "max")}
          resultCount={totalResults}
          onMinChange={(value) => {
            updateDraftRangeInput(attribute.key, "min", value || "");
            handleApplyFilter();
          }}
          onMaxChange={(value) => {
            updateDraftRangeInput(attribute.key, "max", value || "");
            handleApplyFilter();
          }}
          onReset={() => {
            // Clear the filter from draftFilters, then applyDrafts syncs to appliedFilters
            setDraftSpecFilter(attribute.key, undefined);
            // Fetch with cleared filter
            handleApplyFilter();
          }}
          hideLabel
        />
      );
    }

    // TEXT (search input)
    if (attribute.type === AttributeType.TEXT) {
      return (
        <SearchFilter
          key={attribute.id}
          attributeKey={attribute.key}
          label={attribute.name}
          value={(draftFilters.specs?.[attribute.key] as string) || ''}
          onChange={(value) => setDraftSpecFilter(attribute.key, value || undefined)}
          onApply={handleApplyFilter}
          applyDisabled={!(draftFilters.specs?.[attribute.key] as string)?.trim()}
          isLoading={listingsLoading}
          hideLabel
        />
      );
    }

    return null;
  };

  return (
    <>
      {/* Floating Filter Button */}
      {!isOpen && (
        <Button
          className={styles.floatingFilterButton}
          onClick={() => setIsOpen(true)}
          variant="outline"
          aria-label={t("search.filters")}
        >
          <SlidersHorizontal size={24} />
          {t("search.filters")}
        </Button>
      )}

      <Aside
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        header={
          <button
            type="button"
            className={styles.resetButton}
            onClick={async () => {
              clearAllFilters();
              await fetchListingsByCategory(categorySlug, { categoryId: categorySlug }, "grid");
            }}
          >
            {t("search.clearAllFilters")}
            <Trash2 size={14} />
          </button>
        }
      >
        {filtersLoading && (
          <div className={styles.loading}>
            <Loading type="svg" />
            <Text variant="small">{t("common.loading")}</Text>
          </div>
        )}
        {!filtersLoading && (
          <>
            {/* Filter content with bottom padding for fixed footer */}
            <div className={styles.filterContent}>
              {(() => {
                const allAttributes = getSortedAttributes().filter(attr => attr.key !== 'search');
                const visibleAttributes = isMobile && !showAllFilters
                  ? allAttributes.slice(0, 7)
                  : allAttributes;
                const hiddenCount = allAttributes.length - 7;

                return (
                  <>
                    {visibleAttributes.map((attribute, index) => (
                      <Collapsible
                        key={attribute.id}
                        title={attribute.name}
                        defaultOpen={index < 7}
                        variant="compact"
                      >
                        {renderAttribute(attribute)}
                      </Collapsible>
                    ))}

                    {/* Show more/less button - only on mobile when there are hidden filters */}
                    {isMobile && hiddenCount > 0 && (
                      <Button
                        variant="link"
                        onClick={() => setShowAllFilters(!showAllFilters)}
                        className={styles.showMoreButton}
                      >
                        {showAllFilters ? 'عرض أقل' : `عرض المزيد من الفلاتر (${hiddenCount})`}
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Fixed footer with apply button - mobile only */}
            <div className={styles.stickyFooter}>
              <Button
                variant="primary"
                onClick={() => setIsOpen(false)}
                className={styles.applyFooterButton}
              >
                تطبيق
                <Text variant="small" > ( {totalResults} نتيجه )</Text>
              </Button>
            </div>
          </>
        )}
      </Aside>
    </>
  );
};

export default Filter;
