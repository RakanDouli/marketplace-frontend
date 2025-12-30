'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Text } from '../Text/Text';
import styles from './FormSection.module.scss';

export type FormSectionStatus = 'incomplete' | 'required' | 'complete';

interface FormSectionProps {
  /** Section number (1, 2, 3...) - shown when incomplete */
  number: number;
  /** Section title */
  title: string;
  /** Section completion status:
   * - 'incomplete': Required fields missing (gray border, shows X/Y or number)
   * - 'required': Required fields filled (primary border + primary check)
   * - 'complete': All fields filled (primary background + white check)
   */
  status: FormSectionStatus;
  /** Number of filled fields (for X/Y display when incomplete) */
  filledCount?: number;
  /** Total number of fields (for X/Y display when incomplete) */
  totalCount?: number;
  /** Whether this section has validation errors (shows red border) */
  hasError?: boolean;
  /** Whether this section is currently expanded */
  isExpanded?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Callback when section is toggled */
  onToggle?: (expanded: boolean) => void;
  /** Children content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  number,
  title,
  status,
  filledCount,
  totalCount,
  hasError = false,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  children,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled or internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newState = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newState);
    }
    onToggle?.(newState);
  };

  // Determine CSS classes based on status (error takes priority)
  const statusClass = hasError
    ? styles.error
    : status === 'complete'
      ? styles.complete
      : status === 'required'
        ? styles.required
        : '';

  // Determine what to show in the indicator (number or checkmark only)
  const renderIndicatorContent = () => {
    if (status === 'complete' || status === 'required') {
      return <Check size={16} strokeWidth={3} />;
    }
    return <span className={styles.number}>{number}</span>;
  };

  // Show field count next to title (always, if counts provided)
  const showFieldCount = filledCount !== undefined && totalCount !== undefined;

  return (
    <div className={`${styles.section} ${isExpanded ? styles.expanded : ''} ${statusClass} ${className}`}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          <div className={`${styles.indicator} ${statusClass}`}>
            {renderIndicatorContent()}
          </div>
          <div className={styles.titleGroup}>
            <Text variant="h4" className={styles.title}>
              {title}
            </Text>
            {showFieldCount && (
              <Text variant="small" className={styles.fieldCount}>
                {filledCount}/{totalCount}
              </Text>
            )}
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}
        />
      </button>

      <div className={`${styles.content} ${isExpanded ? styles.open : ''}`}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormSection;
