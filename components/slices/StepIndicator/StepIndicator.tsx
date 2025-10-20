'use client';

import React from 'react';
import { Text } from '@/components/slices';
import styles from './StepIndicator.module.scss';

export interface StepIndicatorProps {
  steps: Array<{
    title: string;
    isValid: boolean;
  }>;
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <div
            key={index}
            className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''
              } ${isClickable ? styles.clickable : ''}`}
            onClick={() => isClickable && onStepClick(index)}
          >
            <div className={styles.indicator}>
              {isCompleted ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className={styles.stepNumber}>{index + 1}</span>
              )}
            </div>
            <Text
              variant="small"
              className={`${styles.stepTitle} ${isActive ? styles.activeTitle : ''}`}
            >
              {step.title}
            </Text>
            {index < steps.length - 1 && <div className={styles.connector} />}
          </div>
        );
      })}
    </div>
  );
};
