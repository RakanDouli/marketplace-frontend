'use client';

import React from 'react';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Text } from '../Text/Text';
import { Button } from '../Button/Button';
import styles from './WizardStep.module.scss';

export type WizardStepStatus = 'incomplete' | 'required' | 'complete';

interface WizardStepProps {
  /** Step number (1, 2, 3...) */
  number: number;
  /** Step title */
  title: string;
  /** Step completion status:
   * - 'incomplete': Required fields missing (gray border, shows X/Y or number)
   * - 'required': Required fields filled (success border + success check)
   * - 'complete': All fields filled (success background + white check)
   */
  status: WizardStepStatus;
  /** Number of filled fields (for X/Y display) */
  filledCount?: number;
  /** Total number of fields (for X/Y display) */
  totalCount?: number;
  /** Whether this step has validation errors (shows red border) */
  hasError?: boolean;
  /** Whether this step contains required fields (shows asterisk next to title) */
  hasRequiredFields?: boolean;
  /** Whether this step is currently active/visible */
  isActive?: boolean;
  /** Animation direction: 'forward' | 'backward' | 'none' */
  animationDirection?: 'forward' | 'backward' | 'none';
  /** Children content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Navigation: callback for previous step */
  onPrevious?: () => void;
  /** Navigation: callback for next step */
  onNext?: () => void;
  /** Navigation: is this the first step? */
  isFirstStep?: boolean;
  /** Navigation: is this the last step? */
  isLastStep?: boolean;
  /** Navigation: custom content for the right side (e.g., submit button) */
  rightAction?: React.ReactNode;
}

export const WizardStep: React.FC<WizardStepProps> = ({
  number,
  title,
  status,
  filledCount,
  totalCount,
  hasError = false,
  hasRequiredFields = false,
  isActive = false,
  animationDirection = 'none',
  children,
  className = '',
  onPrevious,
  onNext,
  isFirstStep = false,
  isLastStep = false,
  rightAction,
}) => {
  // Determine CSS classes based on status (error takes priority)
  const statusClass = hasError
    ? styles.error
    : status === 'complete'
      ? styles.complete
      : status === 'required'
        ? styles.required
        : '';

  // Animation class
  const animationClass = animationDirection === 'forward'
    ? styles.slideInFromRight
    : animationDirection === 'backward'
      ? styles.slideInFromLeft
      : '';

  // Show field count
  const showFieldCount = filledCount !== undefined && totalCount !== undefined;

  // Show navigation footer
  const showNavigation = onPrevious || onNext || rightAction;

  if (!isActive) {
    return null;
  }

  return (
    <div className={`${styles.step} ${statusClass} ${animationClass} ${className}`}>
      {/* <div className={styles.stepHeader}>
        <div className={`${styles.indicator} ${statusClass}`}>
          {status === 'complete' || status === 'required' ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <span className={styles.number}>{number}</span>
          )}
        </div>
        <div className={styles.titleGroup}>
          <Text variant="h3" className={styles.title}>
            {title}
            {hasRequiredFields && <span className={styles.asterisk}>*</span>}
          </Text>
          {showFieldCount && (
            <Text variant="small" className={styles.fieldCount}>
              {filledCount}/{totalCount}
            </Text>
          )}
        </div>
      </div> */}
      <div className={styles.stepContent}>
        {children}
      </div>
      {showNavigation && (
        <div className={styles.stepFooter}>
          <div className={styles.footerLeft}>
            {!isFirstStep && onPrevious && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                icon={<ArrowRight size={18} />}
              >
                السابق
              </Button>
            )}
          </div>
          <div className={styles.footerRight}>
            {rightAction ? (
              rightAction
            ) : (
              !isLastStep && onNext && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={onNext}
                  icon={<ArrowLeft size={18} />}
                >
                  التالي
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardStep;
