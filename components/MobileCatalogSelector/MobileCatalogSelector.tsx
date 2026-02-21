"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Text, MobileBackButton } from "../slices";
import styles from "./MobileCatalogSelector.module.scss";

interface CatalogOption {
  id: string;
  name: string;
  count?: number;
  /** Model name for grouping variants */
  modelName?: string;
  /** Model ID for variants (to identify which model this variant belongs to) */
  modelId?: string;
}

interface ModelOption {
  id: string;
  name: string;
  count?: number;
}

interface MobileCatalogSelectorProps {
  /** Current step: 'brand' or 'variant' */
  step: "brand" | "variant";
  /** Category slug for URL building */
  categorySlug: string;
  /** Listing type: 'sell' or 'rent' */
  listingType: string;
  /** Category name in Arabic for display */
  categoryNameAr: string;
  /** List of options (brands or variants) */
  options: CatalogOption[];
  /** List of models (for showing models without variants as clickable items) */
  modelOptions?: ModelOption[];
  /** Currently selected brand ID (when on variant step) */
  selectedBrandId?: string;
  /** Currently selected brand name (when on variant step) */
  selectedBrandName?: string;
  /** Total count for "Show All" option */
  totalCount?: number;
  /** Whether options are loading */
  isLoading?: boolean;
}

export const MobileCatalogSelector: React.FC<MobileCatalogSelectorProps> = ({
  step,
  categorySlug,
  listingType,
  categoryNameAr,
  options,
  modelOptions = [],
  selectedBrandId,
  selectedBrandName,
  totalCount,
  isLoading = false,
}) => {
  const router = useRouter();

  // Process options for mixed display (variant step only)
  // - Group variants by model name
  // - Add models without variants as standalone clickable items
  const processedDisplay = useMemo(() => {
    if (step !== "variant") return null;

    // Get model names that have variants
    const modelsWithVariants = new Set<string>();
    options.forEach((opt) => {
      if (opt.modelName) {
        modelsWithVariants.add(opt.modelName);
      }
      if (opt.modelId) {
        modelsWithVariants.add(opt.modelId);
      }
    });

    // Find models without variants (appear in modelOptions but not in variants' modelName)
    const modelsWithoutVariants = modelOptions.filter((model) => {
      // Check if this model has any variants
      const hasVariants = options.some(
        (opt) => opt.modelId === model.id || opt.modelName === model.name
      );
      return !hasVariants;
    });

    // Group variants by model name
    const variantGroups: Record<string, CatalogOption[]> = {};
    options.forEach((opt) => {
      const modelName = opt.modelName || "أخرى";
      if (!variantGroups[modelName]) {
        variantGroups[modelName] = [];
      }
      variantGroups[modelName].push(opt);
    });

    // Sort model names alphabetically
    const sortedModelNames = Object.keys(variantGroups).sort();
    const groups = sortedModelNames.map((modelName) => ({
      modelName,
      variants: variantGroups[modelName],
      isGroup: true as const,
    }));

    // Sort models without variants alphabetically
    const standaloneModels = modelsWithoutVariants
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((model) => ({
        id: model.id,
        name: model.name,
        count: model.count,
        isGroup: false as const,
      }));

    return { groups, standaloneModels };
  }, [step, options, modelOptions]);

  // Handle back navigation
  const handleBack = () => {
    if (step === "variant" && selectedBrandId) {
      // Go back to brand selection
      router.push(`/${categorySlug}/${listingType}`);
    } else {
      // Go back to category/type selection
      router.push(`/${categorySlug}`);
    }
  };

  // Build "Show All" URL - skip to listings without further selection
  const showAllUrl = step === "brand"
    ? `/${categorySlug}/${listingType}?showListings=true`
    : `/${categorySlug}/${listingType}?brandId=${selectedBrandId}&showListings=true`;

  // Handle option selection
  const handleOptionSelect = (option: CatalogOption) => {
    if (step === "brand") {
      // Navigate to variant selection for this brand
      router.push(`/${categorySlug}/${listingType}?brandId=${option.id}`);
    } else {
      // Navigate to listings with brand + variant filter
      router.push(`/${categorySlug}/${listingType}?brandId=${selectedBrandId}&variantId=${option.id}`);
    }
  };

  // Handle model selection (for models without variants)
  const handleModelSelect = (model: ModelOption) => {
    // Navigate to listings with brand + model filter (no variant)
    router.push(`/${categorySlug}/${listingType}?brandId=${selectedBrandId}&modelId=${model.id}`);
  };

  // Get header title based on step
  const getTitle = () => {
    if (step === "brand") {
      return `${categoryNameAr} - اختر الماركة`;
    }
    return selectedBrandName || "اختر الطراز";
  };

  return (
    <div className={styles.container}>
      <MobileBackButton onClick={handleBack} title={getTitle()} />

      <div className={styles.content}>
        {/* Show All Button - Using Link for better navigation */}
        <Link
          href={showAllUrl}
          className={styles.showAllButton}
        >
          <div className={styles.showAllContent}>
            <Text variant="h4" className={styles.showAllText}>
              {step === "brand" ? "عرض كل الإعلانات" : `عرض كل طرازات ${selectedBrandName}`}
            </Text>
            {totalCount !== undefined && (
              <Text variant="small" className={styles.showAllCount}>
                ({totalCount} إعلان)
              </Text>
            )}
          </div>
          <ChevronLeft size={20} className={styles.chevron} />
        </Link>

        {/* Divider */}
        <div className={styles.divider}>
          <Text variant="small" className={styles.dividerText}>
            {step === "brand" ? "أو اختر ماركة" : "أو اختر طراز"}
          </Text>
        </div>

        {/* Options List */}
        {isLoading ? (
          <div className={styles.loading}>
            <Text variant="paragraph" color="secondary">جاري التحميل...</Text>
          </div>
        ) : step === "variant" && processedDisplay ? (
          // Mixed display: grouped variants + standalone models
          <div className={styles.optionsList}>
            {/* First: Groups (models with variants) */}
            {processedDisplay.groups.map((group) => (
              <div key={group.modelName}>
                {/* Model Section Header */}
                <div className={styles.sectionHeader}>
                  <Text variant="h4" className={styles.sectionHeaderText}>
                    {group.modelName}
                  </Text>
                </div>

                {/* Variants under this model */}
                {group.variants.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.optionItem}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className={styles.optionContent}>
                      <Text variant="paragraph" className={styles.optionName}>
                        {option.name}
                      </Text>
                      {option.count !== undefined && (
                        <Text variant="small" className={styles.optionCount}>
                          ({option.count})
                        </Text>
                      )}
                    </div>
                    <ChevronLeft size={20} className={styles.chevron} />
                  </button>
                ))}
              </div>
            ))}

            {/* Second: Standalone models (models without variants) */}
            {processedDisplay.standaloneModels.length > 0 && (
              <>
                {/* Divider between groups and standalone models */}
                {processedDisplay.groups.length > 0 && (
                  <div className={styles.sectionDivider}>
                    <Text variant="small" className={styles.sectionDividerText}>
                      موديلات أخرى
                    </Text>
                  </div>
                )}
                {processedDisplay.standaloneModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    className={styles.optionItem}
                    onClick={() => handleModelSelect(model)}
                  >
                    <div className={styles.optionContent}>
                      <Text variant="paragraph" className={styles.optionName}>
                        {model.name}
                      </Text>
                      {model.count !== undefined && (
                        <Text variant="small" className={styles.optionCount}>
                          ({model.count})
                        </Text>
                      )}
                    </div>
                    <ChevronLeft size={20} className={styles.chevron} />
                  </button>
                ))}
              </>
            )}

            {options.length === 0 && processedDisplay.standaloneModels.length === 0 && (
              <div className={styles.empty}>
                <Text variant="paragraph" color="secondary">
                  لا توجد طرازات متاحة
                </Text>
              </div>
            )}
          </div>
        ) : (
          // Regular flat list (for brands)
          <div className={styles.optionsList}>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.optionItem}
                onClick={() => handleOptionSelect(option)}
              >
                <div className={styles.optionContent}>
                  <Text variant="paragraph" className={styles.optionName}>
                    {option.name}
                  </Text>
                  {option.count !== undefined && (
                    <Text variant="small" className={styles.optionCount}>
                      ({option.count})
                    </Text>
                  )}
                </div>
                <ChevronLeft size={20} className={styles.chevron} />
              </button>
            ))}

            {options.length === 0 && !isLoading && (
              <div className={styles.empty}>
                <Text variant="paragraph" color="secondary">
                  لا توجد ماركات متاحة
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCatalogSelector;
