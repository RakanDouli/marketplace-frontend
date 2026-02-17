"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { SlidersHorizontal, Trash2, ChevronRight } from "lucide-react";
import { IconGridSelector } from "../IconGridSelector";
import { Aside, Text, Button, Collapsible } from "../slices";
import { SelectInputField } from "../slices/Input/SelectInputField";
import { MobileFilterContent, MobileFilterScreen } from "./MobileFilterContent";
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

  // Get categorySlug and listingType from URL params (self-sufficient)
  const categorySlug = params?.category as string;
  const listingTypeSlug = params?.listingType as string;

  // Convert URL slug to enum value (sell -> SALE, rent -> RENT)
  const listingType = listingTypeSlug === 'rent' ? 'RENT' : listingTypeSlug === 'sell' ? 'SALE' : undefined;

  // Support both controlled and uncontrolled modes
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<MobileFilterScreen>({ type: 'list' });

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
  // Pass listingType to ensure proper filtering for sale/rent separation
  const filterActions = useFilterActions(categorySlug, listingType);
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

  // Load filter data when category or listingType changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug, listingType);
  }, [categorySlug, listingType, fetchFilterData]);

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

  // Get attributes from store for building grouped model options
  const { attributes: allAttributes } = useFiltersStore();

  // Build grouped model options (Sahibinden-style: variants grouped under model headers)
  // This combines modelId and variantId into a single dropdown
  const groupedModelOptions = useMemo(() => {
    // Get variantId attribute which has variants with groupKey (modelId) and groupLabel (modelName)
    const variantAttr = allAttributes.find(attr => attr.key === 'variantId');
    const modelAttr = allAttributes.find(attr => attr.key === 'modelId');

    if (!variantAttr?.processedOptions || variantAttr.processedOptions.length === 0) {
      // No variants available - show plain models if available
      if (modelAttr?.processedOptions) {
        return modelAttr.processedOptions.map((model: any) => ({
          value: model.key,
          label: model.count !== undefined ? `${model.value} (${model.count})` : model.value,
          isModel: true, // Flag to identify this is a model, not variant
        }));
      }
      return [];
    }

    // Group variants by their parent model
    const modelGroups = new Map<string, { modelName: string; variants: any[] }>();

    variantAttr.processedOptions.forEach((variant: any) => {
      const modelId = variant.groupKey;
      const modelName = variant.groupLabel || 'أخرى';

      if (!modelGroups.has(modelId)) {
        modelGroups.set(modelId, { modelName, variants: [] });
      }
      modelGroups.get(modelId)!.variants.push(variant);
    });

    // Build grouped options for react-select
    const groups: { label: string; options: { value: string; label: string; modelId: string }[] }[] = [];

    modelGroups.forEach((group, modelId) => {
      groups.push({
        label: group.modelName, // Model name as group header (non-clickable)
        options: group.variants.map((variant: any) => ({
          value: variant.key, // variantId
          label: variant.count !== undefined ? `${variant.value} (${variant.count})` : variant.value,
          modelId: modelId, // Store modelId for setting both filters
        })),
      });
    });

    // Sort groups alphabetically by model name
    groups.sort((a, b) => a.label.localeCompare(b.label, 'ar'));

    return groups;
  }, [allAttributes]);

  // Get current selected model value for the grouped dropdown
  const selectedModelValue = useMemo(() => {
    const variantId = draftFilters.specs?.variantId as string | undefined;
    const modelId = draftFilters.specs?.modelId as string | undefined;

    if (!variantId && !modelId) return null;

    // If we have a variantId, find it in the grouped options
    if (variantId && groupedModelOptions.length > 0) {
      for (const group of groupedModelOptions) {
        if ('options' in group) {
          const found = group.options.find((opt: any) => opt.value === variantId);
          if (found) {
            return {
              value: found.value,
              label: found.label,
              modelId: found.modelId,
            };
          }
        }
      }
    }

    // Fallback: if only modelId is set (from old selection), try to show something
    return null;
  }, [draftFilters.specs?.variantId, draftFilters.specs?.modelId, groupedModelOptions]);

  // Check if we have grouped model options (variants available)
  const hasGroupedModelOptions = groupedModelOptions.length > 0 &&
    groupedModelOptions.some((g: any) => 'options' in g);

  // Handle model/variant selection from grouped dropdown
  const handleModelSelection = (option: any) => {
    if (!option) {
      // Clear both modelId and variantId
      handleSpecChange('modelId', undefined);
      handleSpecChange('variantId', undefined);
      return;
    }

    if (option.isModel) {
      // Plain model selected (no variants)
      handleSpecChange('modelId', option.value);
      handleSpecChange('variantId', undefined);
    } else {
      // Variant selected - set both modelId and variantId
      handleSpecChange('modelId', option.modelId);
      handleSpecChange('variantId', option.value);
    }
  };

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

    // Skip listingType - it's managed by routing (/cars/sell vs /cars/rent)
    if (attribute.key === 'listingType') {
      return null;
    }

    // Skip variantId - it's now combined into modelId dropdown (Sahibinden-style)
    if (attribute.key === 'variantId') {
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

      // Special handling for modelId - use grouped dropdown with variants (Sahibinden-style)
      if (attribute.key === "modelId" && hasGroupedModelOptions) {
        return (
          <div className={styles.selectFieldWrapper} key={attribute.id}>
            <SelectInputField
              id="filter-model-select"
              name="modelId"
              options={groupedModelOptions}
              value={selectedModelValue}
              onChange={(option) => handleModelSelection(option as any)}
              onFocus={() => {}}
              onBlur={() => {}}
              disabled={false}
              isLoading={false}
              searchable={true}
              placeholder="اختر الموديل..."
              aria-label="الموديل"
            />
          </div>
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
          keepAllOptions={attribute.key === 'brandId'}
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
        onClose={() => {
          setIsOpen(false);
          setMobileScreen({ type: 'list' }); // Reset to list when closing
        }}
        header={
          <>
            {/* Desktop: Clear all button */}
            <button
              type="button"
              className={styles.resetButton}
              onClick={async () => {
                clearAllFilters();
                // Preserve listingType when clearing other filters
                const filters: any = { categoryId: categorySlug };
                if (listingType) filters.listingType = listingType;
                await fetchListingsByCategory(categorySlug, filters, "grid");
              }}
            >
              {t("search.clearAllFilters")}
              <Trash2 size={14} />
            </button>

            {/* Mobile: Back button + title when on detail screen */}
            {mobileScreen.type === 'detail' && (
              <div className={styles.mobileHeader}>
                <button
                  type="button"
                  className={styles.mobileBackButton}
                  onClick={() => setMobileScreen({ type: 'list' })}
                >
                  <ChevronRight size={24} />
                  <span>{mobileScreen.attribute.name}</span>
                </button>
              </div>
            )}

            {/* Mobile: Back button + title when on range-select screen */}
            {mobileScreen.type === 'range-select' && (
              <div className={styles.mobileHeader}>
                <button
                  type="button"
                  className={styles.mobileBackButton}
                  onClick={() => setMobileScreen({ type: 'detail', attribute: mobileScreen.attribute })}
                >
                  <ChevronRight size={24} />
                  <div className={styles.mobileBackButtonText}>
                    <span className={styles.mobileBackButtonTitle}>{mobileScreen.attribute.name}</span>
                    <span className={styles.mobileBackButtonSubtitle}>{mobileScreen.field === 'min' ? 'من' : 'إلى'}</span>
                  </div>
                </button>
              </div>
            )}
          </>
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
            {/* Desktop Content - hidden on mobile via CSS */}
            <div className={styles.desktopContent}>
              {getSortedAttributes()
                .filter(attr => !['search', 'listingType', 'variantId'].includes(attr.key))
                .map((attribute, index) => (
                  <Collapsible
                    key={attribute.id}
                    title={attribute.name}
                    defaultOpen={index < 7}
                    variant="compact"
                  >
                    {renderAttribute(attribute)}
                  </Collapsible>
                ))}
            </div>

            {/* Mobile Content - hidden on desktop via CSS */}
            <div className={styles.mobileContent}>
              <MobileFilterContent
                attributes={getSortedAttributes().filter(attr =>
                  !['search', 'listingType', 'variantId'].includes(attr.key)
                )}
                categorySlug={categorySlug}
                screen={mobileScreen}
                onScreenChange={setMobileScreen}
                totalResults={totalResults}
                onFilterChange={handleSpecChange}
                onPriceChange={(min, max) => {
                  setDraftFilter("priceMinMinor", min);
                  setDraftFilter("priceMaxMinor", max);
                  handleApplyFilter({ min, max });
                }}
                onApply={() => {
                  setMobileScreen({ type: 'list' }); // Reset to first filter page
                  setIsOpen(false);
                }}
                onClear={async () => {
                  clearAllFilters();
                  // Preserve listingType when clearing other filters
                  const filters: any = { categoryId: categorySlug };
                  if (listingType) filters.listingType = listingType;
                  await fetchListingsByCategory(categorySlug, filters, "grid");
                }}
                isLoading={listingsLoading}
              />
            </div>
          </>
        )}
      </Aside>
    </>
  );
};

export default Filter;
