"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
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
import {
  RangeFilter,
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
    hasPriceDraftChanges,
    hasRangeDraftChanges,
  } = useSearchStore();

  // Store hooks
  const {
    isLoading: filtersLoading,
    fetchFilterData,
  } = useFiltersStore();
  const {
    isLoading: listingsLoading,
    fetchListingsByCategory,
  } = useListingsStore();

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Helper functions for draft values - price is in dollars
  const getDraftPriceMin = () => draftFilters.priceMinMinor ? draftFilters.priceMinMinor.toString() : "";
  const getDraftPriceMax = () => draftFilters.priceMaxMinor ? draftFilters.priceMaxMinor.toString() : "";
  const getDraftCurrency = () => draftFilters.priceCurrency || "USD";

  const setDraftPriceMin = (value: string) => {
    const dollarValue = value ? parseFloat(value) : undefined;
    setDraftFilter("priceMinMinor", dollarValue || undefined);
  };

  const setDraftPriceMax = (value: string) => {
    const dollarValue = value ? parseFloat(value) : undefined;
    setDraftFilter("priceMaxMinor", dollarValue || undefined);
  };

  const setDraftCurrency = (value: string) => {
    setDraftFilter("priceCurrency", value);
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

  // Organize attributes: mix of standalone fields and groups
  const getOrganizedAttributes = () => {
    const attributes = getFilterableAttributes();

    // Group by groupOrder AND group name
    const itemsByKey: Record<string, typeof attributes> = {};

    attributes.forEach(attr => {
      const key = attr.group && attr.group.trim() !== ''
        ? `${attr.groupOrder}|${attr.group}`
        : `${attr.groupOrder}|standalone-${attr.id}`;

      if (!itemsByKey[key]) {
        itemsByKey[key] = [];
      }
      itemsByKey[key].push(attr);
    });

    // Create ordered array
    const orderedItems: Array<{
      type: 'standalone' | 'group';
      groupOrder: number;
      groupName?: string;
      attributes: typeof attributes;
    }> = [];

    Object.entries(itemsByKey)
      .sort(([keyA], [keyB]) => {
        const orderA = Number(keyA.split('|')[0]);
        const orderB = Number(keyB.split('|')[0]);
        return orderA - orderB;
      })
      .forEach(([key, attrs]) => {
        const firstAttr = attrs[0];
        if (!firstAttr.group || firstAttr.group.trim() === '') {
          orderedItems.push({
            type: 'standalone',
            groupOrder: firstAttr.groupOrder,
            attributes: [firstAttr],
          });
        } else {
          orderedItems.push({
            type: 'group',
            groupOrder: firstAttr.groupOrder,
            groupName: firstAttr.group,
            attributes: attrs,
          });
        }
      });

    return orderedItems;
  };

  // Apply handler - triggers both draft apply and backend fetch
  const handleApplyFilter = async () => {
    applyDrafts();

    const storeFilters: any = { categoryId: categorySlug };

    // Price filters
    if (draftFilters.priceMinMinor) storeFilters.priceMinMinor = draftFilters.priceMinMinor;
    if (draftFilters.priceMaxMinor) storeFilters.priceMaxMinor = draftFilters.priceMaxMinor;
    if (draftFilters.priceCurrency) storeFilters.priceCurrency = draftFilters.priceCurrency;

    // Search
    const searchValue = draftFilters.specs?.search || draftFilters.search;
    if (searchValue && typeof searchValue === 'string' && searchValue.trim()) {
      storeFilters.search = searchValue.trim();
    }

    // Location
    const provinceValue = draftFilters.specs?.location || draftFilters.province;
    if (provinceValue) {
      storeFilters.province = provinceValue;
    }
    if (draftFilters.city) {
      storeFilters.city = draftFilters.city;
    }

    // Account Type
    const sellerTypeValue = draftFilters.specs?.accountType || draftFilters.accountType;
    if (sellerTypeValue) {
      storeFilters.accountType = sellerTypeValue;
    }

    // Brand/Model
    if (draftFilters.brandId) {
      if (!storeFilters.specs) storeFilters.specs = {};
      storeFilters.specs.brandId = draftFilters.brandId;
    }
    if (draftFilters.modelId) {
      if (!storeFilters.specs) storeFilters.specs = {};
      storeFilters.specs.modelId = draftFilters.modelId;
    }

    // Sort
    if (draftFilters.sort) storeFilters.sort = draftFilters.sort;

    // All other specs
    if (draftFilters.specs && Object.keys(draftFilters.specs).length > 0) {
      if (!storeFilters.specs) storeFilters.specs = {};
      Object.entries(draftFilters.specs).forEach(([key, value]) => {
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

    // SELECTOR (single dropdown)
    if (attribute.type === AttributeType.SELECTOR && attribute.processedOptions) {
      return (
        <SelectFilter
          key={attribute.id}
          attributeKey={attribute.key}
          label={attribute.name}
          options={attribute.processedOptions}
          value={getSingleSelectorValue(attribute.key)}
          onChange={(value) => handleSpecChange(attribute.key, value)}
        />
      );
    }

    // MULTI_SELECTOR (checkboxes or icon grid)
    if (attribute.type === AttributeType.MULTI_SELECTOR && attribute.processedOptions) {
      // Special icon-based selector for body_type
      if (attribute.key === "body_type") {
        return (
          <div key={attribute.id} className={styles.filterSection}>
            <Text variant="small" className={styles.sectionTitle}>
              {attribute.name}
            </Text>
            <IconGridSelector
              selected={getSelectedOptions(attribute.key)}
              onChange={(newSelected) => handleSpecChange(
                attribute.key,
                newSelected.length > 0 ? newSelected : undefined
              )}
              maxSelections={attribute.maxSelections}
              iconBasePath="/images/car-types"
              options={attribute.processedOptions.map((opt: any) => ({
                key: opt.key,
                label: opt.value,
                count: opt.count,
              }))}
            />
          </div>
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
          maxSelections={attribute.maxSelections}
        />
      );
    }

    // CURRENCY (price filter with currency selector)
    if (attribute.type === AttributeType.CURRENCY) {
      return (
        <PriceFilter
          key={attribute.id}
          label={attribute.name}
          minValue={getDraftPriceMin()}
          maxValue={getDraftPriceMax()}
          currency={getDraftCurrency()}
          onMinChange={setDraftPriceMin}
          onMaxChange={setDraftPriceMax}
          onCurrencyChange={setDraftCurrency}
          onApply={handleApplyFilter}
          applyDisabled={!hasPriceDraftChanges()}
          isLoading={listingsLoading}
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

      <Aside isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {filtersLoading && (
          <div className={styles.loading}>
            <Loading type="svg" />
            <Text variant="small">{t("common.loading")}</Text>
          </div>
        )}
        {!filtersLoading && (
          <>
            {getOrganizedAttributes().map((item) => {
              if (item.type === 'standalone') {
                return renderAttribute(item.attributes[0]);
              }

              // Grouped fields
              return (
                <Collapsible
                  key={`group-${item.groupOrder}-${item.groupName}`}
                  title={item.groupName || ''}
                  defaultOpen={true}
                  variant="compact"
                >
                  {item.attributes.map(renderAttribute)}
                </Collapsible>
              );
            })}
          </>
        )}
      </Aside>
    </>
  );
};

export default Filter;
