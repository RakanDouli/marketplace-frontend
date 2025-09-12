"use client";
import React, { useState, useEffect } from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import { 
  SedanIcon, 
  SuvIcon, 
  HatchbackIcon, 
  CoupeIcon, 
  ConvertibleIcon, 
  WagonIcon, 
  PickupIcon 
} from "../icons/CarIcons";
import { Aside, Text, Button } from "../slices";
import { useTranslation } from "../../hooks/useTranslation";
import { useFiltersStore } from "../../stores";
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
    }
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

  // Filter state
  const [filters, setFilters] = useState<FilterValues>(initialValues);
  
  // Store hooks
  const {
    attributes,
    brands, 
    models,
    provinces,
    cities,
    isLoading,
    error,
    fetchFilterData,
    fetchModels,
    fetchCities
  } = useFiltersStore();

  // Load filter data when category changes
  useEffect(() => {
    if (!categorySlug) return;
    fetchFilterData(categorySlug);
  }, [categorySlug, fetchFilterData]);

  // Update models when brand changes
  useEffect(() => {
    if (filters.brandId) {
      fetchModels(filters.brandId);
    }
  }, [filters.brandId, fetchModels]);

  // Update cities when province changes
  useEffect(() => {
    if (filters.province) {
      fetchCities(filters.province);
    }
  }, [filters.province, fetchCities]);

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Clear dependent filters
      if (key === "brandId" && value !== prev.brandId) {
        newFilters.modelId = undefined;
      }
      if (key === "province" && value !== prev.province) {
        newFilters.city = undefined;
      }

      return newFilters;
    });
  };

  const handleSpecChange = (attributeKey: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [attributeKey]: value,
      },
    }));
  };

  const handleClearAll = () => {
    setFilters({});
  };

  const handleApplyFilters = () => {
    onApplyFilters?.(filters);
    onClose?.();
  };
  return (
    <Aside isOpen={isOpen} className={`${styles.filterAside} ${className}`}>
      {/* Filter Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="h4" className={styles.title}>
            التصنيفات
          </Text>
          <FilterIcon size={20} />
        </div>

        {/* Close button for mobile */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={20} />
        </button>
      </div>

      {/* Filter Content */}
      <div className={styles.filterContent}>
        {isLoading ? (
          <div className={styles.loading}>
            <Text>{t("common.loading")}</Text>
          </div>
        ) : (
          <>
            {/* Brand */}
            {brands.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {t("search.make")}
                </Text>
                <select
                  value={filters.brandId || ""}
                  onChange={(e) =>
                    handleFilterChange("brandId", e.target.value || undefined)
                  }
                  className={styles.select}
                >
                  <option value="">{t("search.selectMake")}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                      {brand.count !== undefined && ` (${brand.count})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Model */}
            {filters.brandId && models.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {t("search.model")}
                </Text>
                <select
                  value={filters.modelId || ""}
                  onChange={(e) =>
                    handleFilterChange("modelId", e.target.value || undefined)
                  }
                  className={styles.select}
                >
                  <option value="">{t("search.selectModel")}</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                      {model.count !== undefined && ` (${model.count})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Attributes - Now using Arabic-only data from backend */}
            {attributes
              .filter(
                (attr) =>
                  attr.type === "SELECTOR" ||
                  attr.type === "RANGE" ||
                  attr.type === "CURRENCY"
              )
              .map((attribute) => {
                return (
                  <div key={attribute.id} className={styles.filterSection}>
                    <Text variant="h4" className={styles.sectionTitle}>
                      {attribute.name}
                    </Text>

                    {attribute.type === "SELECTOR" && attribute.processedOptions && (
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
                                    const currentSelected = filters.specs?.[attribute.key]?.selected;
                                    return Array.isArray(currentSelected) 
                                      ? currentSelected.includes(option.key)
                                      : currentSelected === option.key;
                                  })() ? styles.selected : ""
                                }`}
                                onClick={() => {
                                  const currentSelected = filters.specs?.[attribute.key]?.selected;
                                  let newSelected: string[] = [];
                                  
                                  // Handle multiple selections
                                  if (Array.isArray(currentSelected)) {
                                    newSelected = currentSelected.includes(option.key)
                                      ? currentSelected.filter(key => key !== option.key)
                                      : [...currentSelected, option.key];
                                  } else if (currentSelected === option.key) {
                                    newSelected = [];
                                  } else {
                                    newSelected = currentSelected ? [currentSelected, option.key] : [option.key];
                                  }
                                  
                                  handleSpecChange(
                                    attribute.key,
                                    newSelected.length > 0 ? { selected: newSelected } : undefined
                                  );
                                }}
                              >
                                {getCarBodyTypeIcon(option.key)}
                                <span className={styles.optionLabel}>
                                  {option.value}
                                  {option.count !== undefined && (
                                    <span className={styles.optionCount}>({option.count})</span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          // Regular dropdown for other selectors
                          <select
                            value={filters.specs?.[attribute.key]?.selected || ""}
                            onChange={(e) =>
                              handleSpecChange(
                                attribute.key,
                                e.target.value
                                  ? { selected: e.target.value }
                                  : undefined
                              )
                            }
                            className={styles.select}
                          >
                            <option value="">{t("search.selectOption")}</option>
                            {attribute.processedOptions.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.value}
                                {option.count !== undefined && ` (${option.count})`}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    {(attribute.type === "RANGE" ||
                      attribute.type === "CURRENCY") && (
                      <div className={styles.rangeInputs}>
                        <input
                          type="number"
                          placeholder={`${t("search.min")} ${attribute.name}`}
                          value={filters.specs?.[attribute.key]?.from || ""}
                          onChange={(e) =>
                            handleSpecChange(attribute.key, {
                              ...filters.specs?.[attribute.key],
                              from: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className={styles.rangeInput}
                        />
                        <input
                          type="number"
                          placeholder={`${t("search.max")} ${attribute.name}`}
                          value={filters.specs?.[attribute.key]?.to || ""}
                          onChange={(e) =>
                            handleSpecChange(attribute.key, {
                              ...filters.specs?.[attribute.key],
                              to: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className={styles.rangeInput}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Price Filter */}
            <div className={styles.filterSection}>
              <Text variant="h4" className={styles.sectionTitle}>
                {t("search.priceRange")}
              </Text>
              <div className={styles.currencyInputs}>
                <div className={styles.priceInputs}>
                  <input
                    type="number"
                    placeholder={t("search.minPrice")}
                    value={
                      filters.priceMinMinor ? filters.priceMinMinor / 100 : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMinMinor",
                        e.target.value
                          ? Number(e.target.value) * 100
                          : undefined
                      )
                    }
                    className={styles.priceInput}
                  />
                  <input
                    type="number"
                    placeholder={t("search.maxPrice")}
                    value={
                      filters.priceMaxMinor ? filters.priceMaxMinor / 100 : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMaxMinor",
                        e.target.value
                          ? Number(e.target.value) * 100
                          : undefined
                      )
                    }
                    className={styles.priceInput}
                  />
                </div>
                <select
                  value={filters.priceCurrency || "USD"}
                  onChange={(e) =>
                    handleFilterChange("priceCurrency", e.target.value)
                  }
                  className={styles.currencySelect}
                >
                  <option value="USD">USD</option>
                  <option value="SYP">SYP</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Location */}
            {provinces.length > 0 && (
              <div className={styles.filterSection}>
                <Text variant="h4" className={styles.sectionTitle}>
                  {t("search.location")}
                </Text>
                <select
                  value={filters.province || ""}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value || undefined)
                  }
                  className={styles.select}
                >
                  <option value="">{t("search.selectProvince")}</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>

                {filters.province && cities.length > 0 && (
                  <select
                    value={filters.city || ""}
                    onChange={(e) =>
                      handleFilterChange("city", e.target.value || undefined)
                    }
                    className={styles.select}
                  >
                    <option value="">{t("search.selectCity")}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Search */}
            <div className={styles.filterSection}>
              <Text variant="h4" className={styles.sectionTitle}>
                {t("search.search")}
              </Text>
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={filters.search || ""}
                onChange={(e) =>
                  handleFilterChange("search", e.target.value || undefined)
                }
                className={styles.searchInput}
              />
            </div>
          </>
        )}
      </div>

      {/* Filter Actions */}
      <div className={styles.actions}>
        <Button
          variant="outline"
          className={styles.clearButton}
          onClick={handleClearAll}
        >
          {t("search.clear")}
        </Button>
        <Button
          variant="primary"
          className={styles.applyButton}
          onClick={handleApplyFilters}
        >
          {t("search.applyFilters")}
        </Button>
      </div>
    </Aside>
  );
};

export default Filter;
