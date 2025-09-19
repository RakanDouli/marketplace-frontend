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
import { Aside, Text, Button } from "../slices";
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
  sellerType?: string;

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

  // Simplified apply handlers using draft functionality
  const handleApplyPriceFilter = () => {
    applyDrafts();
  };

  const handleApplySearchFilter = () => {
    applyDrafts();
  };

  const handleApplyRangeFilter = () => {
    applyDrafts();
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

      <Aside isOpen={isOpen} className={`${styles.filterAside} ${className}`}>
        {/* Filter Header */}
        <div className={styles.header}>
          <div className={styles.headertop}>
            <div className={styles.headerContent}>
              <Text variant="small" className={styles.title}>
                التصنيفات
              </Text>
              <FilterIcon size={20} />
            </div>
            {totalResults !== undefined && (
              <Text variant="paragraph" className={styles.resultsCount}>
                {listingsLoading ? (
                  <Loading />
                ) : (
                  `${totalResults} ${t("search.totalResults")}`
                )}
              </Text>
            )}
            <div className={styles.headerActions}>
              {/* Reset button */}
              <button
                className={styles.resetButton}
                onClick={handleClearAll}
                aria-label={t("search.clear")}
                title={t("search.clear")}
              >
                <RotateCcw size={18} />
              </button>

              {/* Close button for mobile */}
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={styles.appliedFilters}>
            <AppliedFilters />
          </div>
        </div>
        {/* Filter Content */}
        <div className={styles.filterContent}>
          {filtersLoading && (
            <div className={styles.loading}>
              <Loading type="svg" />
              <Text variant="small">{t("common.loading")}</Text>
            </div>
          )}
          {!filtersLoading && (
            <>
              {/* Brand and Model are now handled through dynamic attributes below */}

              {/* Location and SellerType are now handled through dynamic attributes below */}

              {/* Dynamic Attributes - Now using Arabic-only data from backend */}
              {getFilterableAttributes().map((attribute) => {
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
                                {attribute.processedOptions.map((option) => {
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
                                      className={`${styles.iconOption} ${
                                        isSelected ? styles.selected : ""
                                      } ${
                                        shouldDisable ? styles.disabled : ""
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

                                {attribute.processedOptions.map((option) => {
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
                                      className={`${styles.checkboxOption} ${
                                        shouldDisable ? styles.disabled : ""
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
                                    (option) => ({
                                      value: option.key,
                                      label: `${option.value}${
                                        option.count !== undefined
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

                      {(attribute.type === "RANGE" ||
                        attribute.type === "CURRENCY") && (
                        <div className={styles.rangeInputs}>
                          <div className={styles.rangeInputFields}>
                            <Input
                              type="number"
                              placeholder={`${t("search.min")} ${
                                attribute.name
                              }`}
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
                              placeholder={`${t("search.max")} ${
                                attribute.name
                              }`}
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
                            onClick={handleApplyRangeFilter}
                            className={styles.applyButton}
                          >
                            {t("common.apply")}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              {/* Search */}
              <div className={styles.filterSection}>
                <Text variant="small" className={styles.sectionTitle}>
                  {t("search.search")}
                </Text>
                <div className={styles.rangeInputs}>
                  <Input
                    type="search"
                    placeholder={t("search.placeholder")}
                    value={getDraftSearch()}
                    onChange={(e) => setDraftSearch(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    loading={listingsLoading}
                    disabled={!hasSearchDraftChanges()}
                    onClick={handleApplySearchFilter}
                    className={styles.applyButton}
                  >
                    {t("common.apply")}
                  </Button>
                </div>
              </div>

              {/* Price Filter */}
              <div className={styles.filterSection}>
                <Text variant="small" className={styles.sectionTitle}>
                  {t("search.priceRange")}
                </Text>
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
                    onClick={handleApplyPriceFilter}
                    className={styles.applyButton}
                  >
                    {t("common.apply")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Aside>
    </>
  );
};

export default Filter;
