"use client";
import React, { useState, useEffect } from "react";
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
import { useFiltersStore, useSearchStore } from "../../stores";
import styles from "./Filter.module.scss";

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

  // Brand/Model
  brandId?: string;
  modelId?: string;

  // Dynamic attributes (stored in specs) - matches backend structure
  specs?: Record<
    string,
    {
      selected?: string | string[];
      value?: number;
      from?: number;
      to?: number;
      text?: string;
      amount?: number;
      currency?: string;
    } | number[] // Support array format for range filters
  >;

  // Legacy support
  search?: string;
}

export interface FilterProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  categorySlug?: string;
  onApplyFilters?: (filters: FilterValues) => void;
  initialValues?: FilterValues;
}

export const Filter: React.FC<FilterProps> = ({
  isOpen = true,
  onClose,
  className = "",
  categorySlug,
  onApplyFilters,
  initialValues = {},
}) => {
  const { t } = useTranslation();

  // Use centralized search store instead of local state
  const {
    activeFilters,
    setFilter,
    setSpecFilter,
    clearAllFilters,
    getStoreFilters,
    hasActiveFilters,
  } = useSearchStore();

  // Initialize filters from props if provided (only once)
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitialized.current && initialValues && Object.keys(initialValues).length > 0) {
      console.log("🔧 Filter: Initializing from props", initialValues);
      hasInitialized.current = true;

      // Set initial values in store
      Object.entries(initialValues).forEach(([key, value]) => {
        if (key === 'specs' && value) {
          // Set each spec filter individually
          Object.entries(value as Record<string, any>).forEach(([specKey, specValue]) => {
            setSpecFilter(specKey, specValue);
          });
        } else {
          setFilter(key as any, value);
        }
      });
    }
  }, [initialValues]); // Remove setFilter and setSpecFilter from dependencies

  // Store hooks
  const {
    attributes, // All specs (including brands/models) are in attributes now
    provinces,
    cities,
    isLoading,
    fetchFilterData,
    fetchCities,
  } = useFiltersStore();

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

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
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

    // Apply filters immediately when user changes them
    const storeFilters = getStoreFilters();
    console.log("🚀 Filter: Applying store filters", storeFilters);
    onApplyFilters?.(storeFilters);
  };

  const handleSpecChange = (attributeKey: string, value: any) => {
    console.log("🎯 Filter: Spec change:", {
      attributeKey,
      value,
      valueType: typeof value,
      isArray: Array.isArray(value),
      currentSpecs: activeFilters.specs
    });

    // Set the spec filter in store - store values directly, not wrapped in objects
    setSpecFilter(attributeKey, value);

    // Apply filters immediately when user changes them
    const storeFilters = getStoreFilters();
    console.log("🚀 Filter: Applying store filters after spec change", storeFilters);
    onApplyFilters?.(storeFilters);
  };

  const handleClearAll = () => {
    console.log("🧹 Filter: Clearing all filters");
    clearAllFilters();
    // Apply cleared filters immediately
    const storeFilters = getStoreFilters();
    onApplyFilters?.(storeFilters);
  };

  return (
    <Aside isOpen={isOpen} className={`${styles.filterAside} ${className}`}>
      {/* Filter Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="small" className={styles.title}>
            التصنيفات
          </Text>
          <FilterIcon size={20} />
        </div>

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
            onClick={onClose}
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={styles.filterContent}>
        {isLoading && (
          <div className={styles.loading}>
            <Loading type="svg" />
            <Text>{t("common.loading")}</Text>
          </div>
        )}
        {!isLoading && (
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
                              {attribute.processedOptions.map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  className={`${styles.iconOption} ${
                                    (() => {
                                      const currentSpec = activeFilters.specs?.[attribute.key];
                                      if (!currentSpec) return false;
                                      if (Array.isArray(currentSpec)) {
                                        return currentSpec.includes(option.key);
                                      }
                                      return currentSpec === option.key;
                                    })()
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() => {
                                    const currentSpec = activeFilters.specs?.[attribute.key];
                                    let currentSelected = Array.isArray(currentSpec)
                                      ? currentSpec
                                      : typeof currentSpec === 'string'
                                        ? [currentSpec]
                                        : [];

                                    // Toggle selection
                                    let newSelected: string[] = currentSelected.includes(option.key)
                                      ? currentSelected.filter(key => key !== option.key)
                                      : [...currentSelected, option.key];

                                    handleSpecChange(
                                      attribute.key,
                                      newSelected.length > 0 ? newSelected : undefined
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
                              ))}
                            </div>
                          ) : attribute.type === "MULTI_SELECTOR" ? (
                            // Multi-select checkboxes for other MULTI_SELECTOR attributes
                            <div className={styles.checkboxGroup}>
                              {attribute.processedOptions.map((option) => {
                                const currentSpec = activeFilters.specs?.[attribute.key];
                                let currentSelected;

                                // Handle both array and string formats from store
                                currentSelected = currentSpec;

                                const isSelected = Array.isArray(currentSelected)
                                  ? currentSelected.includes(option.key)
                                  : currentSelected === option.key;

                                return (
                                  <label
                                    key={option.key}
                                    className={styles.checkboxOption}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        let newSelected: string[] = [];

                                        if (Array.isArray(currentSelected)) {
                                          newSelected = e.target.checked
                                            ? [...currentSelected, option.key]
                                            : currentSelected.filter(key => key !== option.key);
                                        } else if (currentSelected === option.key) {
                                          newSelected = e.target.checked ? [option.key] : [];
                                        } else {
                                          newSelected = e.target.checked
                                            ? currentSelected ? [currentSelected, option.key] : [option.key]
                                            : currentSelected ? [currentSelected] : [];
                                        }

                                        handleSpecChange(
                                          attribute.key,
                                          newSelected.length > 0 ? newSelected : undefined
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
                                const currentSpec = activeFilters.specs?.[attribute.key];
                                if (!currentSpec) return "";
                                // Handle string values directly from store
                                return typeof currentSpec === "string" ? currentSpec : "";
                              })()}
                              onChange={(e) =>
                                handleSpecChange(
                                  attribute.key,
                                  e.target.value || undefined
                                )
                              }
                              options={[
                                { value: "", label: t("search.selectOption") },
                                ...attribute.processedOptions.map((option) => ({
                                  value: option.key,
                                  label: `${option.value}${
                                    option.count !== undefined
                                      ? ` (${option.count})`
                                      : ""
                                  }`,
                                })),
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
                            placeholder={`${t("search.min")} ${attribute.name}`}
                            value={
                              Array.isArray(activeFilters.specs?.[attribute.key])
                                ? (activeFilters.specs[attribute.key] as number[])[0]?.toString() || ""
                                : ""
                            }
                            onChange={(e) => {
                              const currentSpecs = activeFilters.specs?.[attribute.key];
                              const currentArray = Array.isArray(currentSpecs) ? currentSpecs as number[] : [];
                              const minValue = e.target.value ? Number(e.target.value) : null;
                              const maxValue = currentArray[1] || null;

                              const newValue = [minValue, maxValue].filter(v => v !== null) as number[];

                              if (newValue.length > 0) {
                                setSpecFilter(attribute.key, newValue);
                              } else {
                                setSpecFilter(attribute.key, undefined);
                              }
                            }}
                            size="sm"
                          />
                          <Input
                            type="number"
                            placeholder={`${t("search.max")} ${attribute.name}`}
                            value={
                              Array.isArray(activeFilters.specs?.[attribute.key])
                                ? (activeFilters.specs[attribute.key] as number[])[1]?.toString() || ""
                                : ""
                            }
                            onChange={(e) => {
                              const currentSpecs = activeFilters.specs?.[attribute.key];
                              const currentArray = Array.isArray(currentSpecs) ? currentSpecs as number[] : [];
                              const minValue = currentArray[0] || null;
                              const maxValue = e.target.value ? Number(e.target.value) : null;

                              const newValue = [minValue, maxValue].filter(v => v !== null) as number[];

                              if (newValue.length > 0) {
                                setSpecFilter(attribute.key, newValue);
                              } else {
                                setSpecFilter(attribute.key, undefined);
                              }
                            }}
                            size="sm"
                          />
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            // Apply the range filter
                            const storeFilters = getStoreFilters();
                            onApplyFilters?.(storeFilters);
                          }}
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
              <Input
                type="search"
                placeholder={t("search.placeholder")}
                value={activeFilters.search || ""}
                onChange={(e) =>
                  handleFilterChange("search", e.target.value || undefined)
                }
              />
            </div>

            {/* Price Filter */}
            <div className={styles.filterSection}>
              <Text variant="small" className={styles.sectionTitle}>
                {t("search.priceRange")}
              </Text>
              <div className={styles.currencyInputs}>
                <div className={styles.priceInputs}>
                  <Input
                    type="number"
                    placeholder={t("search.minPrice")}
                    value={
                      activeFilters.priceMinMinor ? activeFilters.priceMinMinor / 100 : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMinMinor",
                        e.target.value
                          ? Number(e.target.value) * 100
                          : undefined
                      )
                    }
                    size="sm"
                  />
                  <Input
                    type="number"
                    placeholder={t("search.maxPrice")}
                    value={
                      activeFilters.priceMaxMinor ? activeFilters.priceMaxMinor / 100 : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMaxMinor",
                        e.target.value
                          ? Number(e.target.value) * 100
                          : undefined
                      )
                    }
                    size="sm"
                  />
                </div>
                <Input
                  type="select"
                  value={activeFilters.priceCurrency || "USD"}
                  onChange={(e) =>
                    handleFilterChange("priceCurrency", e.target.value)
                  }
                  size="sm"
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "SYP", label: "SYP" },
                    { value: "EUR", label: "EUR" },
                  ]}
                />
              </div>
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
                    handleFilterChange("province", e.target.value || undefined)
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
  );
};

export default Filter;
