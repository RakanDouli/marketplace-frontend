"use client";

import React, { useMemo } from "react";
import { SelectInputField } from "../../slices/Input/SelectInputField";
import { Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import styles from "../Filter.module.scss";

interface BrandOption {
  key: string;
  value: string;
  count?: number;
}

interface ModelVariantOption {
  key: string;
  value: string;
  count?: number;
  /** Model ID for grouping variants */
  modelId?: string;
  /** Model name for group label */
  modelName?: string;
  /** True if this is a model without variants (from modelId aggregation) */
  isModelWithoutVariants?: boolean;
}

interface BrandModelFilterProps {
  /** Brand options from aggregation */
  brandOptions: BrandOption[];
  /** Model/Variant options from aggregation (variants + models without variants) */
  modelVariantOptions: ModelVariantOption[];
  /** Selected brand ID */
  selectedBrandId?: string;
  /** Selected model ID (for models without variants) */
  selectedModelId?: string;
  /** Selected variant ID */
  selectedVariantId?: string;
  /** Callback when brand changes */
  onBrandChange: (brandId: string | undefined) => void;
  /** Callback when model/variant changes */
  onModelVariantChange: (value: { modelId?: string; variantId?: string }) => void;
  /** Whether to show counts */
  showCounts?: boolean;
  /** Brand label */
  brandLabel?: string;
  /** Model/Variant label */
  modelLabel?: string;
}

export const BrandModelFilter: React.FC<BrandModelFilterProps> = ({
  brandOptions,
  modelVariantOptions,
  selectedBrandId,
  selectedModelId,
  selectedVariantId,
  onBrandChange,
  onModelVariantChange,
  showCounts = true,
  brandLabel,
  modelLabel,
}) => {
  const { t } = useTranslation();

  // Convert brand options to react-select format
  // Note: count is displayed by SelectInputField's formatOptionLabel, not in the label string
  const brandSelectOptions = useMemo(() => {
    return brandOptions.map(opt => ({
      value: opt.key,
      label: opt.value,
      count: showCounts ? opt.count : undefined,
    }));
  }, [brandOptions, showCounts]);

  // Get selected brand value for react-select
  const selectedBrandValue = useMemo(() => {
    if (!selectedBrandId) return null;
    const opt = brandOptions.find(o => o.key === selectedBrandId);
    if (opt) {
      return {
        value: opt.key,
        label: opt.value,
        count: showCounts ? opt.count : undefined,
      };
    }
    return null;
  }, [selectedBrandId, brandOptions, showCounts]);

  // Process model/variant options into grouped format for react-select
  // - Models without variants: standalone options in "موديلات" group
  // - Variants: grouped by model name
  const modelVariantGroupedOptions = useMemo(() => {
    if (!modelVariantOptions || modelVariantOptions.length === 0) return [];

    const standaloneModels: { value: string; label: string; count?: number; isModel: boolean }[] = [];
    const variantGroups: Record<string, { label: string; options: { value: string; label: string; count?: number }[] }> = {};

    modelVariantOptions.forEach(opt => {
      if (opt.isModelWithoutVariants) {
        // Model without variants - use model_ prefix to distinguish
        standaloneModels.push({
          value: `model_${opt.key}`,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
          isModel: true,
        });
      } else if (opt.modelId && opt.modelName) {
        // Variant - group by model
        if (!variantGroups[opt.modelId]) {
          variantGroups[opt.modelId] = { label: opt.modelName, options: [] };
        }
        variantGroups[opt.modelId].options.push({
          value: opt.key,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
        });
      }
    });

    // Build final grouped options
    const result: { label: string; options: { value: string; label: string; count?: number; isModel?: boolean }[] }[] = [];

    // Add standalone models first (if any)
    if (standaloneModels.length > 0) {
      result.push({
        label: t("common.models") || "موديلات",
        options: standaloneModels,
      });
    }

    // Add variant groups sorted alphabetically by model name
    const sortedGroups = Object.values(variantGroups).sort((a, b) => a.label.localeCompare(b.label));
    result.push(...sortedGroups);

    return result;
  }, [modelVariantOptions, showCounts, t]);

  // Get selected model/variant value for react-select
  const selectedModelVariantValue = useMemo(() => {
    // Check for selected variant first
    if (selectedVariantId) {
      const opt = modelVariantOptions.find(o => o.key === selectedVariantId && !o.isModelWithoutVariants);
      if (opt) {
        return {
          value: opt.key,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
        };
      }
    }

    // Check for selected model (without variants)
    if (selectedModelId) {
      const opt = modelVariantOptions.find(o => o.key === selectedModelId && o.isModelWithoutVariants);
      if (opt) {
        return {
          value: `model_${opt.key}`,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
          isModel: true,
        };
      }
    }

    return null;
  }, [selectedVariantId, selectedModelId, modelVariantOptions, showCounts]);

  // Handle brand selection change
  const handleBrandChange = (selected: { value: string } | null) => {
    onBrandChange(selected?.value || undefined);
  };

  // Handle model/variant selection change
  const handleModelVariantChange = (selected: { value: string; isModel?: boolean } | null) => {
    if (!selected) {
      onModelVariantChange({ modelId: undefined, variantId: undefined });
      return;
    }

    // Check if selected value is a model (has model_ prefix)
    if (selected.value.startsWith('model_')) {
      const modelId = selected.value.replace('model_', '');
      onModelVariantChange({ modelId, variantId: undefined });
    } else {
      // It's a variant
      onModelVariantChange({ modelId: undefined, variantId: selected.value });
    }
  };

  // Only show model/variant filter if brand is selected and there are options
  const showModelVariant = selectedBrandId && modelVariantOptions.length > 0;

  return (
    <div className={styles.brandModelFilter}>
      {/* Brand Filter */}
      <div className={styles.filterField}>
        <Text variant="small" className={styles.fieldLabel}>
          {brandLabel || t("search.brand") || "الماركة"}
        </Text>
        <SelectInputField
          id="filter-brandId"
          name="brandId"
          options={brandSelectOptions}
          value={selectedBrandValue}
          onChange={handleBrandChange}
          onFocus={() => {}}
          onBlur={() => {}}
          searchable
          placeholder={t("search.selectOption") || "اختر..."}
          aria-label={brandLabel || t("search.brand") || "الماركة"}
        />
      </div>

      {/* Model/Variant Filter - only show when brand is selected */}
      {showModelVariant && (
        <div className={styles.filterField}>
          <Text variant="small" className={styles.fieldLabel}>
            {modelLabel || t("search.model") || "الموديل"}
          </Text>
          <SelectInputField
            id="filter-modelVariant"
            name="modelVariant"
            options={modelVariantGroupedOptions}
            value={selectedModelVariantValue}
            onChange={handleModelVariantChange}
            onFocus={() => {}}
            onBlur={() => {}}
            searchable
            placeholder={t("search.selectOption") || "اختر..."}
            aria-label={modelLabel || t("search.model") || "الموديل"}
          />
        </div>
      )}
    </div>
  );
};

export default BrandModelFilter;
