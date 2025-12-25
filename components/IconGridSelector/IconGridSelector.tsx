"use client";

import React from "react";
import Image from "next/image";
import { Text } from "../slices";
import styles from "./IconGridSelector.module.scss";

export interface IconGridOption {
  key: string;
  label: string;
  iconPath?: string;
  count?: number;
}

export interface IconGridSelectorProps {
  /** Currently selected keys */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Options to display */
  options: IconGridOption[];
  /** Base path for icon images (e.g., "/images/car-types") */
  iconBasePath?: string;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Size of the icon images */
  iconSize?: number;
  /** Whether to show counts */
  showCounts?: boolean;
}

export const IconGridSelector: React.FC<IconGridSelectorProps> = ({
  selected = [],
  onChange,
  options,
  iconBasePath,
  maxSelections,
  iconSize = 40,
  showCounts = true,
}) => {
  // Ensure selected is always an array
  const selectedArray = Array.isArray(selected) ? selected : [];

  const isSelected = (key: string) => selectedArray.includes(key);

  const isDisabled = (key: string) => {
    if (!maxSelections) return false;
    return !isSelected(key) && selectedArray.length >= maxSelections;
  };

  const isEmpty = (count?: number) => count === 0;

  const handleToggle = (key: string) => {
    if (isDisabled(key)) return;

    let newSelected: string[];
    if (isSelected(key)) {
      newSelected = selectedArray.filter((k) => k !== key);
    } else {
      newSelected = [...selectedArray, key];
    }

    onChange(newSelected);
  };

  const getSelectionText = () => {
    if (!maxSelections) return null;
    return `${selectedArray.length} / ${maxSelections}`;
  };

  const getIconSrc = (option: IconGridOption) => {
    if (option.iconPath) return option.iconPath;
    if (iconBasePath) return `${iconBasePath}/${option.key}.png`;
    return null;
  };

  return (
    <div className={styles.container}>
      {maxSelections && (
        <div className={styles.selectionCounter}>
          <Text variant="xs">{getSelectionText()}</Text>
        </div>
      )}

      <div className={styles.grid}>
        {options.map((option) => {
          const iconSrc = getIconSrc(option);

          const optionEmpty = isEmpty(option.count);

          return (
            <button
              key={option.key}
              type="button"
              disabled={isDisabled(option.key)}
              className={`${styles.option} ${isSelected(option.key) ? styles.selected : ""} ${
                isDisabled(option.key) ? styles.disabled : ""
              } ${optionEmpty ? styles.empty : ""}`}
              onClick={() => handleToggle(option.key)}
            >
              {iconSrc && (
                <Image
                  src={iconSrc}
                  alt={option.label}
                  width={iconSize}
                  height={iconSize}
                  className={styles.icon}
                />
              )}
              <span className={styles.label}>
                {option.label}
                {showCounts && option.count !== undefined && (
                  <span className={styles.count}>({option.count})</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconGridSelector;
