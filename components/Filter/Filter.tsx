"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Filter as FilterIcon, X, RotateCcw } from "lucide-react";
import {
  SedanIcon,
  SuvIcon,
  HatchbackIcon,
  CoupeIcon,
  ConvertibleIcon,
  WagonIcon,
  PickupIcon,
} from "../icons/CarIcons";
import { Aside, Text, Button, Collapsible } from "../slices";
import { Loading } from "../slices/Loading/Loading";
import { Input } from "../slices/Input/Input";
import {
  useTranslation,
  useFilterActions,
  useAttributeFilters
} from "../../hooks";
import {
  useFiltersStore,
  useListingsStore,
  useSearchStore,
} from "../../stores";
import {
  CURRENCY_LABELS,
} from "../../utils/currency";
import styles from "./Filter.module.scss";
import { AppliedFilters } from "../AppliedFilters/AppliedFilters";

// Car body type icons mapping with custom SVG icons
const getCarBodyTypeIcon = (key: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    sedan: <SedanIcon size={18} />,
    hatchback: <HatchbackIcon size={18} />,
    suv: <SuvIcon size={18} />,
    pickup: <PickupIcon size={18} />,
    coupe: <CoupeIcon size={18} />,
    convertible: <ConvertibleIcon size={18} />,
    wagon: <WagonIcon size={18} />,
    van: <WagonIcon size={18} />, // Using wagon icon for van
    truck: <PickupIcon size={18} />, // Using pickup icon for truck
  };
  return iconMap[key] || <SedanIcon size={18} />;
};

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
}

export const Filter: React.FC<FilterProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const params = useParams();

  // Get categorySlug from URL params (self-sufficient)
  const categorySlug = params?.category as string;

  // Manage own visibility state (self-sufficient)
  const [isOpen, setIsOpen] = useState(false);

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
    hasSearchDraftChanges,
    getStoreFilters,
  } = useSearchStore();

  // Note: isLoading already available from useFiltersStore above - reusing DRY

  // Store hooks
  const {
    isLoading: filtersLoading,
    fetchFilterData,
  } = useFiltersStore();
  const {
    pagination,
    isLoading: listingsLoading,
    fetchListingsByCategory,
  } = useListingsStore();

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Helper functions for draft values
  const getDraftPriceMin = () => draftFilters.priceMinMinor ? (draftFilters.priceMinMinor / 100).toString() : "";
  const getDraftPriceMax = () => draftFilters.priceMaxMinor ? (draftFilters.priceMaxMinor / 100).toString() : "";
  const getDraftCurrency = () => draftFilters.priceCurrency || "USD";
  const getDraftSearch = () => draftFilters.search || "";

  const setDraftPriceMin = (value: string) => {
    const minorValue = value ? parseFloat(value) * 100 : undefined;
    setDraftFilter("priceMinMinor", minorValue || undefined);
  };

  const setDraftPriceMax = (value: string) => {
    const minorValue = value ? parseFloat(value) * 100 : undefined;
    setDraftFilter("priceMaxMinor", minorValue || undefined);
  };

  const setDraftCurrency = (value: string) => {
    setDraftFilter("priceCurrency", value);
  };

  const setDraftSearch = (value: string) => {
    setDraftFilter("search", value);
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

  const {
    handleSpecChange,
    handleClearAll,
  } = filterActions;

  // Organize attributes: mix of standalone fields and groups
  // groupOrder determines position for BOTH individual fields and groups
  const getOrganizedAttributes = () => {
    const attributes = getFilterableAttributes();

    // Group by groupOrder AND group name to properly separate standalone items from grouped items
    const itemsByKey: Record<string, typeof attributes> = {};

    attributes.forEach(attr => {
      // Create a unique key for each group or standalone item
      // Format: "groupOrder|groupName" or "groupOrder|standalone-attributeId" for standalone items
      const key = attr.group && attr.group.trim() !== ''
        ? `${attr.groupOrder}|${attr.group}` // Grouped item
        : `${attr.groupOrder}|standalone-${attr.id}`; // Standalone item

      if (!itemsByKey[key]) {
        itemsByKey[key] = [];
      }
      itemsByKey[key].push(attr);
    });

    // Create ordered array of items (groups or standalone fields)
    const orderedItems: Array<{
      type: 'standalone' | 'group';
      groupOrder: number;
      groupName?: string;
      attributes: typeof attributes;
    }> = [];

    Object.entries(itemsByKey)
      .sort(([keyA], [keyB]) => {
        // Extract groupOrder from key (before the pipe)
        const orderA = Number(keyA.split('|')[0]);
        const orderB = Number(keyB.split('|')[0]);
        return orderA - orderB;
      })
      .forEach(([key, attrs]) => {
        const firstAttr = attrs[0];
        if (!firstAttr.group || firstAttr.group.trim() === '') {
          // Standalone attribute
          orderedItems.push({
            type: 'standalone',
            groupOrder: firstAttr.groupOrder,
            attributes: [firstAttr], // Only one attribute for standalone
          });
        } else {
          // Grouped attributes - add as a single group item
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
    console.log('🔍 Applying filter:', { draftFilters });

    // Apply drafts to appliedFilters
    applyDrafts();

    // Build store filters from draftFilters directly (to avoid state timing issues)
    const storeFilters: any = { categoryId: categorySlug };

    // Price filters
    if (draftFilters.priceMinMinor) storeFilters.priceMinMinor = draftFilters.priceMinMinor;
    if (draftFilters.priceMaxMinor) storeFilters.priceMaxMinor = draftFilters.priceMaxMinor;
    if (draftFilters.priceCurrency) storeFilters.priceCurrency = draftFilters.priceCurrency;

    // Search - top-level filter (searches title, brand, model)
    // Check both specs.search and top-level search for compatibility
    const searchValue = draftFilters.specs?.search || draftFilters.search;
    if (searchValue && typeof searchValue === 'string' && searchValue.trim()) {
      storeFilters.search = searchValue.trim();
    }

    // Location - send as top-level filters for JSONB location structure
    // Check both specs.location (from attribute selector) and top-level province
    const provinceValue = draftFilters.specs?.location || draftFilters.province;
    if (provinceValue) {
      storeFilters.province = provinceValue;
    }
    if (draftFilters.city) {
      storeFilters.city = draftFilters.city;
    }

    // Account Type - send as top-level filter (it's a column, not in specs JSONB)
    // Check both specs.sellerType (from attribute selector) and top-level sellerType
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

    // All other specs (excluding search, location, and sellerType since they're top-level)
    if (draftFilters.specs && Object.keys(draftFilters.specs).length > 0) {
      if (!storeFilters.specs) storeFilters.specs = {};
      Object.entries(draftFilters.specs).forEach(([key, value]) => {
        // Skip search, location, and sellerType - they're already handled as top-level
        if (key !== 'search' && key !== 'location' && key !== 'sellerType') {
          storeFilters.specs[key] = value;
        }
      });
    }

    console.log('🔍 Sending to backend:', storeFilters);
    await fetchListingsByCategory(categorySlug, storeFilters, "grid");
  };

  const {
    getFilterableAttributes,
    isOptionSelectedInMulti,
    getSelectedOptions,
    shouldDisableOption,
    getSingleSelectorValue,
    getSelectionCounterText,
    toggleMultiSelection,
    handleCheckboxChange,
  } = attributeFilters;

  const totalResults = pagination.total;

  return (
    <>
      {/* Floating Filter Button for opening filters */}
      {!isOpen && (
        <Button
          className={styles.floatingFilterButton}
          onClick={() => setIsOpen(true)}
          variant="outline"
          aria-label={t("search.filters")}
        >
          <FilterIcon size={24} />
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
            {/* Brand and Model are now handled through dynamic attributes below */}

            {/* Location and Account Type are now handled through dynamic attributes below */}

            {/* Dynamic Attributes - Mix of standalone fields and groups */}
            {(() => {
              const orderedItems = getOrganizedAttributes();

              // Render helper function for a single attribute
              const renderAttribute = (attribute: any) => {
                return (
                  <div key={attribute.id} className={styles.filterSection}>
                    <Text variant="small" className={styles.sectionTitle}>
                      {attribute.name}
                    </Text>

                    {(attribute.type === "SELECTOR" ||
                      attribute.type === "MULTI_SELECTOR") &&
                      attribute.processedOptions && (
                        <>
                          {attribute.key === "body_type" ? (
                            // Special icon-based selector for car body types
                            <div className={styles.iconSelector}>
                              {/* Selection Counter for Limited Multi-Selectors */}
                              {attribute.maxSelections && (
                                <div className={styles.selectionCounter}>
                                  <Text variant="xs">
                                    {getSelectionCounterText(
                                      attribute.key,
                                      attribute.maxSelections
                                    )}
                                  </Text>
                                </div>
                              )}
                              {attribute.processedOptions.map((option: any) => {
                                const currentSelected = getSelectedOptions(
                                  attribute.key
                                );
                                const isSelected = isOptionSelectedInMulti(
                                  attribute.key,
                                  option.key
                                );
                                const shouldDisable = shouldDisableOption(
                                  attribute.key,
                                  option.key,
                                  attribute.maxSelections || undefined
                                );

                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    disabled={!!shouldDisable}
                                    className={`${styles.iconOption} ${isSelected ? styles.selected : ""
                                      } ${shouldDisable ? styles.disabled : ""
                                      }`}
                                    onClick={() => {
                                      if (shouldDisable) return;

                                      const newSelected = toggleMultiSelection(
                                        attribute.key,
                                        option.key,
                                        currentSelected
                                      );

                                      handleSpecChange(
                                        attribute.key,
                                        newSelected
                                      );
                                    }}
                                  >
                                    {getCarBodyTypeIcon(option.key)}
                                    <span className={styles.optionLabel}>
                                      {option.value}
                                      {option.count !== undefined && (
                                        <span className={styles.optionCount}>
                                          ({option.count})
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : attribute.type === "MULTI_SELECTOR" ? (
                            // Multi-select checkboxes for other MULTI_SELECTOR attributes
                            <div className={styles.checkboxGroup}>
                              {/* Selection Counter for Limited Multi-Selectors */}
                              {attribute.maxSelections && (
                                <div className={styles.selectionCounter}>
                                  <Text variant="xs">
                                    {getSelectionCounterText(
                                      attribute.key,
                                      attribute.maxSelections
                                    )}
                                  </Text>
                                </div>
                              )}

                              {attribute.processedOptions.map((option: any) => {
                                const currentSelected = getSelectedOptions(
                                  attribute.key
                                );
                                const isSelected = isOptionSelectedInMulti(
                                  attribute.key,
                                  option.key
                                );
                                const shouldDisable = shouldDisableOption(
                                  attribute.key,
                                  option.key,
                                  attribute.maxSelections || undefined
                                );

                                return (
                                  <label
                                    key={option.key}
                                    className={`${styles.checkboxOption} ${shouldDisable ? styles.disabled : ""
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={!!shouldDisable}
                                      onChange={(e) => {
                                        if (shouldDisable) return;

                                        const newSelected =
                                          handleCheckboxChange(
                                            attribute.key,
                                            option.key,
                                            e.target.checked,
                                            currentSelected
                                          );

                                        handleSpecChange(
                                          attribute.key,
                                          newSelected
                                        );
                                      }}
                                    />
                                    <span className={styles.checkboxLabel}>
                                      {option.value}
                                      {option.count !== undefined && (
                                        <span className={styles.optionCount}>
                                          ({option.count})
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            // Regular dropdown for single SELECTOR attributes
                            <Input
                              type="select"
                              value={getSingleSelectorValue(attribute.key)}
                              onChange={(e) =>
                                handleSpecChange(
                                  attribute.key,
                                  e.target.value || undefined
                                )
                              }
                              options={[
                                {
                                  value: "",
                                  label: t("search.selectOption"),
                                },
                                ...attribute.processedOptions.map(
                                  (option: any) => ({
                                    value: option.key,
                                    label: `${option.value}${option.count !== undefined
                                      ? ` (${option.count})`
                                      : ""
                                      }`,
                                  })
                                ),
                              ]}
                            />
                          )}
                        </>
                      )}

                    {attribute.type === "CURRENCY" && (
                      <div className={styles.rangeInputs}>
                        <div className={styles.rangeInputFields}>
                          <Input
                            type="number"
                            placeholder={t("search.minPrice")}
                            value={getDraftPriceMin()}
                            onChange={(e) => setDraftPriceMin(e.target.value)}
                            size="sm"
                          />
                          <Input
                            type="number"
                            placeholder={t("search.maxPrice")}
                            value={getDraftPriceMax()}
                            onChange={(e) => setDraftPriceMax(e.target.value)}
                            size="sm"
                          />
                        </div>
                        <Input
                          type="select"
                          value={getDraftCurrency()}
                          onChange={(e) => setDraftCurrency(e.target.value)}
                          size="sm"
                          options={[
                            { value: "USD", label: CURRENCY_LABELS.USD },
                            { value: "SYP", label: CURRENCY_LABELS.SYP },
                            { value: "EUR", label: CURRENCY_LABELS.EUR },
                          ]}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          loading={listingsLoading}
                          disabled={!hasPriceDraftChanges()}
                          onClick={handleApplyFilter}
                          className={styles.applyButton}
                        >
                          {t("common.apply")}
                        </Button>
                      </div>
                    )}

                    {attribute.type === "RANGE" && (
                      <div className={styles.rangeInputs}>
                        <div className={styles.rangeInputFields}>
                          <Input
                            type="number"
                            placeholder={`${t("search.min")} ${attribute.name}`}
                            value={getDraftRangeValue(attribute.key, "min")}
                            onChange={(e) =>
                              updateDraftRangeInput(
                                attribute.key,
                                "min",
                                e.target.value
                              )
                            }
                            size="sm"
                          />
                          <Input
                            type="number"
                            placeholder={`${t("search.max")} ${attribute.name}`}
                            value={getDraftRangeValue(attribute.key, "max")}
                            onChange={(e) =>
                              updateDraftRangeInput(
                                attribute.key,
                                "max",
                                e.target.value
                              )
                            }
                            size="sm"
                          />
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={listingsLoading}
                          disabled={!hasRangeDraftChanges(attribute.key)}
                          onClick={handleApplyFilter}
                          className={styles.applyButton}
                        >
                          {t("common.apply")}
                        </Button>
                      </div>
                    )}

                    {attribute.type === "TEXT" && (
                      <div className={styles.rangeInputs}>
                        <Input
                          type="text"
                          placeholder={attribute.name}
                          value={(draftFilters.specs?.[attribute.key] as string) || ''}
                          onChange={(e) => setDraftSpecFilter(attribute.key, e.target.value || undefined)}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          loading={listingsLoading}
                          disabled={!(draftFilters.specs?.[attribute.key] as string)?.trim()}
                          onClick={handleApplyFilter}
                          className={styles.applyButton}
                        >
                          {t("common.apply")}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {orderedItems.map((item) => {
                    if (item.type === 'standalone') {
                      // Render standalone field directly
                      return renderAttribute(item.attributes[0]);
                    } else {
                      // Render grouped fields inside Collapsible
                      return (
                        <Collapsible
                          key={`group-${item.groupOrder}-${item.groupName}`}
                          title={item.groupName || ''}
                          defaultOpen={true}
                          variant="default"
                        >
                          {item.attributes.map(renderAttribute)}
                        </Collapsible>
                      );
                    }
                  })}
                </>
              );
            })()}
          </>
        )}
      </Aside>
    </>
  );
};

export default Filter;