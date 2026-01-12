'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Text } from '../Text/Text';
import { Collapsible } from '../Collapsible/Collapsible';
import styles from './FormSection.module.scss';

export type FormSectionStatus = 'incomplete' | 'required' | 'complete';

interface FormSectionProps {
  /** Section number (1, 2, 3...) - shown when incomplete */
  number: number;
  /** Section title */
  title: string;
  /** Section completion status:
   * - 'incomplete': Required fields missing (gray border, shows X/Y or number)
   * - 'required': Required fields filled (success border + success check)
   * - 'complete': All fields filled (success background + white check)
   */
  status: FormSectionStatus;
  /** Number of filled fields (for X/Y display when incomplete) */
  filledCount?: number;
  /** Total number of fields (for X/Y display when incomplete) */
  totalCount?: number;
  /** Whether this section has validation errors (shows red border) */
  hasError?: boolean;
  /** Whether this section contains required fields (shows asterisk next to title) */
  hasRequiredFields?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Callback when section is toggled */
  onToggle?: (expanded: boolean) => void;
  /** Content padding size: 'sm' | 'md' | 'lg' (default: 'lg') */
  contentPadding?: 'sm' | 'md' | 'lg';
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
  hasRequiredFields = false,
  defaultExpanded = false,
  onToggle,
  contentPadding = 'lg',
  children,
  className = '',
}) => {
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

  // Custom header content as ReactNode
  const headerContent = (
    <div className={styles.headerLeft}>
      <div className={`${styles.indicator} ${statusClass}`}>
        {renderIndicatorContent()}
      </div>
      <div className={styles.titleGroup}>
        <Text variant="h4" className={styles.title}>
          {title}
          {hasRequiredFields && <span className={styles.asterisk}>*</span>}
        </Text>
        {showFieldCount && (
          <Text variant="small" className={styles.fieldCount}>
            {filledCount}/{totalCount}
          </Text>
        )}
      </div>
    </div>
  );

  return (
    <Collapsible
      title={headerContent}
      defaultOpen={defaultExpanded}
      onToggle={onToggle}
      variant="default"
      contentPadding={contentPadding}
      className={`${styles.section} ${statusClass} ${className}`}
    >
      {children}
    </Collapsible>
  );
};

export default FormSection;
