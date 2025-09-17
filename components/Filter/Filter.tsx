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
import { useTranslation } from "../../hooks/useTranslation";
import {
  useFiltersStore,
  useSearchStore,
  useListingsStore,
} from "../../stores";
import {
  CURRENCY_LABELS,
  convertToUSD,
  parsePrice,
  type Currency,
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

  // Use centralized search store instead of local state
  const {
    activeFilters,
    setFilter,
    setSpecFilter,
    clearAllFilters,
    getStoreFilters,
    getBackendFilters,
  } = useSearchStore();

  // Local state for price inputs (before applying)
  const [localPriceMin, setLocalPriceMin] = useState<string>("");
  const [localPriceMax, setLocalPriceMax] = useState<string>("");
  const [localCurrency, setLocalCurrency] = useState<string>("USD");

  // Local state for range inputs (before applying)
  const [localRangeInputs, setLocalRangeInputs] = useState<
    Record<string, { min: string; max: string }>
  >({});

  // Local state for search input (before applying)
  const [localSearchText, setLocalSearchText] = useState<string>("");

  // Note: isLoading already available from useFiltersStore above - reusing DRY

  // Check if price values have changed from applied values
  const hasPriceChanges = () => {
    const currentMin = activeFilters.priceMinMinor
      ? (activeFilters.priceMinMinor / 100).toString()
      : "";
    const currentMax = activeFilters.priceMaxMinor
      ? (activeFilters.priceMaxMinor / 100).toString()
      : "";
    const currentCurrency = activeFilters.priceCurrency || "USD";

    return (
      localPriceMin !== currentMin ||
      localPriceMax !== currentMax ||
      localCurrency !== currentCurrency
    );
  };

  // Check if range values have changed for a specific attribute
  const hasRangeChanges = (attributeKey: string) => {
    const local = localRangeInputs[attributeKey] || { min: "", max: "" };
    const applied = activeFilters.specs?.[attributeKey];
    const appliedMin = Array.isArray(applied)
      ? applied[0]?.toString() || ""
      : "";
    const appliedMax = Array.isArray(applied)
      ? applied[1]?.toString() || ""
      : "";

    return local.min !== appliedMin || local.max !== appliedMax;
  };

  // Check if search text has changed from applied value
  const hasSearchChanges = () => {
    const applied = activeFilters.search || "";
    return localSearchText.trim() !== applied.trim();
  };

  // Filters are now initialized directly from the store, no need for initialValues initialization

  // Initialize local price inputs with applied values
  React.useEffect(() => {
    const currentMin = activeFilters.priceMinMinor
      ? (activeFilters.priceMinMinor / 100).toString()
      : "";
    const currentMax = activeFilters.priceMaxMinor
      ? (activeFilters.priceMaxMinor / 100).toString()
      : "";
    const currentCurrency = activeFilters.priceCurrency || "USD";

    setLocalPriceMin(currentMin);
    setLocalPriceMax(currentMax);
    setLocalCurrency(currentCurrency);
  }, [
    activeFilters.priceMinMinor,
    activeFilters.priceMaxMinor,
    activeFilters.priceCurrency,
  ]);

  // Initialize local search text with applied value
  React.useEffect(() => {
    const currentSearch = activeFilters.search || "";
    setLocalSearchText(currentSearch);
  }, [activeFilters.search]);

  // Initialize local range inputs with applied values
  React.useEffect(() => {
    if (activeFilters.specs) {
      const newLocalRangeInputs: Record<string, { min: string; max: string }> =
        {};

      Object.entries(activeFilters.specs).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          newLocalRangeInputs[key] = {
            min: value[0]?.toString() || "",
            max: value[1]?.toString() || "",
          };
        }
      });

      setLocalRangeInputs((prev) => ({ ...prev, ...newLocalRangeInputs }));
    }
  }, [activeFilters.specs]);

  // Store hooks
  const {
    attributes, // All specs (including brands/models) are in attributes now
    provinces,
    cities,
    isLoading: filtersLoading,
    fetchFilterData,
    fetchCities,
    updateFiltersWithCascading,
  } = useFiltersStore();
  const {
    pagination,
    fetchListingsByCategory,
    setPagination,
    isLoading: listingsLoading,
  } = useListingsStore();

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Models are now handled through dynamic attributes with cascading counts

  // Update cities when province changes
  useEffect(() => {
    if (activeFilters.province) {
      fetchCities(activeFilters.province);
    }
  }, [activeFilters.province, fetchCities]);

  const handleFilterChange = async (key: keyof FilterValues, value: any) => {
    if (!categorySlug) return;

    console.log(`🔧 Filter: Setting ${key} =`, value);

    // Clear dependent filters
    if (key === "brandId" && value !== activeFilters.brandId) {
      setFilter("modelId", undefined);
    }
    if (key === "province" && value !== activeFilters.province) {
      setFilter("city", undefined);
    }

    // Set the filter in store
    setFilter(key as any, value);

    // Apply filters with store coordination
    try {
      await applyFiltersToStores();
    } catch (error) {
      console.error("❌ Error applying filter:", error);
    }
  };

  const handleSpecChange = async (attributeKey: string, value: any) => {
    if (!categorySlug) return;

    console.log("🎯 Filter: Spec change:", {
      attributeKey,
      value,
      valueType: typeof value,
      isArray: Array.isArray(value),
      currentSpecs: activeFilters.specs,
    });

    // Set the spec filter in store - store values directly, not wrapped in objects
    setSpecFilter(attributeKey, value);

    // Apply filters with store coordination
    try {
      await applyFiltersToStores();
    } catch (error) {
      console.error("❌ Error applying spec filter:", error);
    }
  };

  // Common function to apply filters to stores after changes
  const applyFiltersToStores = async () => {
    if (!categorySlug) return;

    const backendFilters = {
      categoryId: categorySlug,
      ...getBackendFilters(),
    };
    await updateFiltersWithCascading(categorySlug, backendFilters);

    const storeFilters = { categoryId: categorySlug, ...getStoreFilters() };
    setPagination({ page: 1 });
    await fetchListingsByCategory(categorySlug, storeFilters, "grid");
  };

  // Handle range filter apply (for numeric ranges like mileage, year, etc.)
  const handleApplyRangeFilter = async (attributeKey: string) => {
    if (!categorySlug) return;

    try {
      // Apply the local range values to the store
      const local = localRangeInputs[attributeKey] || { min: "", max: "" };
      const minValue = local.min ? Number(local.min) : null;
      const maxValue = local.max ? Number(local.max) : null;
      const newValue = [minValue, maxValue].filter((v) => v !== null) as number[];

      if (newValue.length > 0) {
        setSpecFilter(attributeKey, newValue);
      } else {
        setSpecFilter(attributeKey, undefined);
      }

      // Apply filters with store coordination
      await applyFiltersToStores();
    } catch (error) {
      console.error("❌ Error applying range filter:", error);
    }
  };

  // Handle price filter apply (with currency conversion)
  const handleApplyPriceFilter = async () => {
    if (!categorySlug) return;

    try {
      let minUSD: number | undefined;
      let maxUSD: number | undefined;

      // Convert prices to USD if provided
      if (localPriceMin && localPriceMin.trim() !== "") {
        const minMinor = parsePrice(localPriceMin);
        minUSD = await convertToUSD(minMinor, localCurrency as Currency);
      }
      if (localPriceMax && localPriceMax.trim() !== "") {
        const maxMinor = parsePrice(localPriceMax);
        maxUSD = await convertToUSD(maxMinor, localCurrency as Currency);
      }

      // Update filters
      setFilter("priceMinMinor", minUSD);
      setFilter("priceMaxMinor", maxUSD);
      setFilter("priceCurrency", localCurrency);

      // Apply filters with store coordination
      await applyFiltersToStores();
    } catch (error) {
      console.error("Error applying price filter:", error);
    }
  };

  // Handle search filter apply
  const handleApplySearchFilter = async () => {
    if (!categorySlug) return;

    try {
      // Update search filter in store
      const searchValue = localSearchText.trim() || undefined;
      setFilter("search", searchValue);

      // Apply filters with store coordination
      await applyFiltersToStores();
    } catch (error) {
      console.error("Error applying search filter:", error);
    }
  };

  const handleClearAll = async () => {
    if (!categorySlug) return;

    console.log("🧹 Filter: Clearing all filters");
    clearAllFilters();

    // Apply cleared filters with store coordination
    try {
      await applyFiltersToStores();
    } catch (error) {
      console.error("❌ Error clearing filters:", error);
    }
  };

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
          {t("search.filters")}سسس
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

              {/* Dynamic Attributes - Now using Arabic-only data from backend */}
              {attributes
                .filter(
                  (attr) =>
                    attr.type === "SELECTOR" ||
                    attr.type === "MULTI_SELECTOR" ||
                    attr.type === "RANGE" ||
                    attr.type === "CURRENCY"
                )
                .map((attribute) => {
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
                                      {(() => {
                                        const currentSpec =
                                          activeFilters.specs?.[attribute.key];
                                        const selectedCount = Array.isArray(
                                          currentSpec
                                        )
                                          ? currentSpec.length
                                          : currentSpec
                                          ? 1
                                          : 0;
                                        return `${selectedCount}/${attribute.maxSelections} selected`;
                                      })()}
                                    </Text>
                                  </div>
                                )}
                                {attribute.processedOptions.map((option) => {
                                  const currentSpec =
                                    activeFilters.specs?.[attribute.key];
                                  const currentSelected = Array.isArray(
                                    currentSpec
                                  )
                                    ? currentSpec
                                    : typeof currentSpec === "string"
                                    ? [currentSpec]
                                    : [];
                                  const isSelected = currentSelected.includes(
                                    option.key
                                  );
                                  const isAtLimit =
                                    attribute.maxSelections &&
                                    currentSelected.length >=
                                      attribute.maxSelections;
                                  const shouldDisable =
                                    isAtLimit && !isSelected;

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

                                        // Toggle selection
                                        let newSelected: string[] = isSelected
                                          ? currentSelected.filter(
                                              (key) => key !== option.key
                                            )
                                          : [...currentSelected, option.key];

                                        handleSpecChange(
                                          attribute.key,
                                          newSelected.length > 0
                                            ? newSelected
                                            : undefined
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
                                      {(() => {
                                        const currentSpec =
                                          activeFilters.specs?.[attribute.key];
                                        const selectedCount = Array.isArray(
                                          currentSpec
                                        )
                                          ? currentSpec.length
                                          : currentSpec
                                          ? 1
                                          : 0;
                                        return `${selectedCount}/${attribute.maxSelections} selected`;
                                      })()}
                                    </Text>
                                  </div>
                                )}

                                {attribute.processedOptions.map((option) => {
                                  const currentSpec =
                                    activeFilters.specs?.[attribute.key];
                                  let currentSelected: string[];

                                  // Handle both array and string formats from store
                                  if (Array.isArray(currentSpec)) {
                                    currentSelected = currentSpec;
                                  } else if (typeof currentSpec === "string") {
                                    currentSelected = [currentSpec];
                                  } else {
                                    currentSelected = [];
                                  }

                                  const isSelected = currentSelected.includes(
                                    option.key
                                  );
                                  const isAtLimit =
                                    attribute.maxSelections &&
                                    currentSelected.length >=
                                      attribute.maxSelections;
                                  const shouldDisable =
                                    isAtLimit && !isSelected;

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

                                          let newSelected: string[] = e.target
                                            .checked
                                            ? [...currentSelected, option.key]
                                            : currentSelected.filter(
                                                (key) => key !== option.key
                                              );

                                          handleSpecChange(
                                            attribute.key,
                                            newSelected.length > 0
                                              ? newSelected
                                              : undefined
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
                                value={(() => {
                                  const currentSpec =
                                    activeFilters.specs?.[attribute.key];
                                  if (!currentSpec) return "";
                                  // Handle string values directly from store
                                  return typeof currentSpec === "string"
                                    ? currentSpec
                                    : "";
                                })()}
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
                              value={localRangeInputs[attribute.key]?.min || ""}
                              onChange={(e) => {
                                setLocalRangeInputs((prev) => ({
                                  ...prev,
                                  [attribute.key]: {
                                    ...prev[attribute.key],
                                    min: e.target.value,
                                    max: prev[attribute.key]?.max || "",
                                  },
                                }));
                              }}
                              size="sm"
                            />
                            <Input
                              type="number"
                              placeholder={`${t("search.max")} ${
                                attribute.name
                              }`}
                              value={localRangeInputs[attribute.key]?.max || ""}
                              onChange={(e) => {
                                setLocalRangeInputs((prev) => ({
                                  ...prev,
                                  [attribute.key]: {
                                    ...prev[attribute.key],
                                    min: prev[attribute.key]?.min || "",
                                    max: e.target.value,
                                  },
                                }));
                              }}
                              size="sm"
                            />
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={listingsLoading}
                            disabled={!hasRangeChanges(attribute.key)}
                            onClick={() => handleApplyRangeFilter(attribute.key)}
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
                    value={localSearchText}
                    onChange={(e) => setLocalSearchText(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    loading={listingsLoading}
                    disabled={!hasSearchChanges()}
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
                      value={localPriceMin}
                      onChange={(e) => setLocalPriceMin(e.target.value)}
                      size="sm"
                    />
                    <Input
                      type="number"
                      placeholder={t("search.maxPrice")}
                      value={localPriceMax}
                      onChange={(e) => setLocalPriceMax(e.target.value)}
                      size="sm"
                    />
                  </div>
                  <Input
                    type="select"
                    value={localCurrency}
                    onChange={(e) => setLocalCurrency(e.target.value)}
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
                    disabled={!hasPriceChanges()}
                    onClick={handleApplyPriceFilter}
                    className={styles.applyButton}
                  >
                    {t("common.apply")}
                  </Button>
                </div>
              </div>

              {/* Seller Type */}
              <div className={styles.filterSection}>
                <Text variant="small" className={styles.sectionTitle}>
                  {t("search.sellerType")}
                </Text>
                <Input
                  type="select"
                  value={activeFilters.sellerType || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "sellerType",
                      e.target.value || undefined
                    )
                  }
                  options={[
                    { value: "", label: t("search.allSellers") },
                    { value: "PRIVATE", label: t("search.privateSeller") },
                    { value: "DEALER", label: t("search.dealer") },
                    { value: "BUSINESS", label: t("search.business") },
                  ]}
                  size="sm"
                />
              </div>

              {/* Location */}
              {provinces.length > 0 && (
                <div className={styles.filterSection}>
                  <Text variant="small" className={styles.sectionTitle}>
                    {t("search.location")}
                  </Text>
                  <Input
                    type="select"
                    value={activeFilters.province || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "province",
                        e.target.value || undefined
                      )
                    }
                    options={[
                      { value: "", label: t("search.selectProvince") },
                      ...provinces.map((province) => ({
                        value: province,
                        label: province,
                      })),
                    ]}
                  />

                  {activeFilters.province && cities.length > 0 && (
                    <Input
                      type="select"
                      value={activeFilters.city || ""}
                      onChange={(e) =>
                        handleFilterChange("city", e.target.value || undefined)
                      }
                      options={[
                        { value: "", label: t("search.selectCity") },
                        ...cities.map((city) => ({
                          value: city,
                          label: city,
                        })),
                      ]}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Aside>
    </>
  );
};

export default Filter;
