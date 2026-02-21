"use client";

import React, { useMemo } from "react";
import { Input } from "../../slices/Input/Input";
import { SelectInputField } from "../../slices/Input/SelectInputField";
import { Text } from "../../slices";
import { useTranslation } from "../../../hooks";
import styles from "../Filter.module.scss";

export interface SelectOption {
  key: string;
  value: string;
  count?: number;
  /** Group key for optgroup display (e.g., modelId for variants) */
  groupKey?: string;
  /** Group label for optgroup display (e.g., modelName for variants) */
  groupLabel?: string;
  /** For models: true if this model has variants (renders as non-clickable header) */
  hasVariants?: boolean;
  /** For variantId filter: true if this is a model without variants (from modelId aggregation) */
  isModelWithoutVariants?: boolean;
}

export interface SelectFilterProps {
  /** Attribute key for the filter */
  attributeKey: string;
  /** Display label for the filter */
  label: string;
  /** Available options */
  options: SelectOption[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string | undefined) => void;
  /** Whether to show counts in options */
  showCounts?: boolean;
  /** Hide the label (when wrapped in Collapsible) */
  hideLabel?: boolean;
  /** Keep all options visible (don't hide zero-count options) - useful for brand filter */
  keepAllOptions?: boolean;
}

// Threshold for "long list" - hide zeros if more than this
const LONG_LIST_THRESHOLD = 10;

export const SelectFilter: React.FC<SelectFilterProps> = ({
  attributeKey,
  label,
  options,
  value,
  onChange,
  showCounts = true,
  hideLabel = false,
  keepAllOptions = false,
}) => {
  const { t } = useTranslation();

  // Check if options have groups (for variants grouped by model)
  const hasGroups = useMemo(() => {
    return options.some(opt => opt.groupKey && opt.groupLabel);
  }, [options]);

  // Check if we have models without variants (merged into variantId)
  const hasModelsWithoutVariants = useMemo(() => {
    return options.some(opt => opt.isModelWithoutVariants === true);
  }, [options]);

  // Check if this is a model selector with hasVariants options
  const hasModelVariants = useMemo(() => {
    return attributeKey === "modelId" && options.some(opt => opt.hasVariants === true);
  }, [attributeKey, options]);

  // Process options: for long lists, hide zeros and sort by count
  const processedOptions = useMemo(() => {
    const isLongList = options.length > LONG_LIST_THRESHOLD;

    let filtered = options;
    // Only hide zeros if it's a long list AND keepAllOptions is false
    if (isLongList && !keepAllOptions) {
      // Long list: hide zeros
      filtered = options.filter(opt => opt.count === undefined || opt.count > 0);
    }

    // If grouped, sort by group then by count within group
    if (hasGroups) {
      return filtered.sort((a, b) => {
        // First sort by group label
        const groupCompare = (a.groupLabel || '').localeCompare(b.groupLabel || '');
        if (groupCompare !== 0) return groupCompare;
        // Then by count descending within group
        return (b.count ?? 0) - (a.count ?? 0);
      });
    }

    // Non-grouped: sort by count descending
    if (isLongList) {
      return filtered.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    }

    return filtered;
  }, [options, hasGroups, keepAllOptions]);

  // Group options by groupKey for react-select GroupedOption format
  // Also separate models without variants (standalone options)
  const { reactSelectGroupedOptions, standaloneModels } = useMemo(() => {
    if (!hasGroups && !hasModelsWithoutVariants) return { reactSelectGroupedOptions: null, standaloneModels: [] };

    const groups: Record<string, { label: string; options: { value: string; label: string; count?: number; isModelOnly?: boolean }[] }> = {};
    const standalone: { value: string; label: string; count?: number; isModelOnly: boolean }[] = [];

    processedOptions.forEach(opt => {
      // Models without variants go to standalone list
      if (opt.isModelWithoutVariants) {
        standalone.push({
          value: opt.key,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
          isModelOnly: true,
        });
      } else if (opt.groupKey && opt.groupLabel) {
        // Variants grouped by model
        const groupKey = opt.groupKey;
        const groupLabel = opt.groupLabel;

        if (!groups[groupKey]) {
          groups[groupKey] = { label: groupLabel, options: [] };
        }
        groups[groupKey].options.push({
          value: opt.key,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
        });
      } else {
        // Fallback: ungrouped
        const groupKey = '__ungrouped__';
        const groupLabel = t("common.other");

        if (!groups[groupKey]) {
          groups[groupKey] = { label: groupLabel, options: [] };
        }
        groups[groupKey].options.push({
          value: opt.key,
          label: opt.value,
          count: showCounts ? opt.count : undefined,
        });
      }
    });

    // Build final grouped options for react-select
    // First add standalone models as a group "موديلات أخرى", then add variant groups
    const result: { label: string; options: { value: string; label: string; count?: number; isModelOnly?: boolean }[] }[] = [];

    if (standalone.length > 0) {
      result.push({
        label: t("common.otherModels") || "موديلات أخرى",
        options: standalone,
      });
    }

    // Add variant groups sorted alphabetically
    const sortedGroups = Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
    result.push(...sortedGroups);

    return { reactSelectGroupedOptions: result, standaloneModels: standalone };
  }, [processedOptions, hasGroups, hasModelsWithoutVariants, t, showCounts]);

  // Get selected value for react-select
  const selectedValue = useMemo(() => {
    if (!value) return null;

    // Find the option in processedOptions
    const opt = processedOptions.find(o => o.key === value);
    if (opt) {
      return {
        value: opt.key,
        label: opt.value,
        count: showCounts ? opt.count : undefined,
        isModelOnly: opt.isModelWithoutVariants,
      };
    }
    return null;
  }, [value, processedOptions, showCounts]);

  // For modelId filter with hasVariants: convert to flat list (models without variants only)
  const modelFlatOptions = useMemo(() => {
    if (!hasModelVariants) return [];

    return processedOptions
      .filter(opt => !opt.hasVariants)
      .map(opt => ({
        value: opt.key,
        label: opt.value,
        count: showCounts ? opt.count : undefined,
      }));
  }, [processedOptions, showCounts, hasModelVariants]);

  // Handle selection change for react-select
  const handleSelectChange = (selected: { value: string; isModelOnly?: boolean } | null) => {
    if (selected) {
      onChange(selected.value);
    } else {
      onChange(undefined);
    }
  };

  // Render grouped select using react-select (consistent with create form)
  if ((hasGroups || hasModelsWithoutVariants) && reactSelectGroupedOptions) {
    return (
      <div className={styles.filterField}>
        {!hideLabel && (
          <Text variant="small" className={styles.fieldLabel}>
            {label}
          </Text>
        )}
        <SelectInputField
          id={`filter-${attributeKey}`}
          name={attributeKey}
          options={reactSelectGroupedOptions}
          value={selectedValue}
          onChange={handleSelectChange}
          onFocus={() => {}}
          onBlur={() => {}}
          searchable
          placeholder={t("search.selectOption")}
          aria-label={label}
        />
      </div>
    );
  }

  // Render model select with hasVariants headers using react-select
  if (hasModelVariants) {
    return (
      <div className={styles.filterField}>
        {!hideLabel && (
          <Text variant="small" className={styles.fieldLabel}>
            {label}
          </Text>
        )}
        <SelectInputField
          id={`filter-${attributeKey}`}
          name={attributeKey}
          options={modelFlatOptions}
          value={selectedValue}
          onChange={handleSelectChange}
          onFocus={() => {}}
          onBlur={() => {}}
          searchable
          placeholder={t("search.selectOption")}
          aria-label={label}
        />
      </div>
    );
  }

  // Render regular select (no groups)
  return (
    <div className={styles.filterField}>
      {!hideLabel && (
        <Text variant="small" className={styles.fieldLabel}>
          {label}
        </Text>
      )}
      <Input
        type="select"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        options={[
          { value: "", label: t("search.selectOption") },
          ...processedOptions.map((option) => ({
            value: option.key,
            label: option.value,
            count: showCounts ? option.count : undefined,
          })),
        ]}
      />
    </div>
  );
};

export default SelectFilter;
