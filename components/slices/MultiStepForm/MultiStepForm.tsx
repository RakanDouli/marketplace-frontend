'use client';

import React from 'react';
import { Button, StepIndicator, Text } from '@/components/slices';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MultiStepForm.module.scss';

export interface MultiStepFormProps {
  steps: Array<{
    title: string;
    isValid: boolean;
  }>;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onStepClick?: (stepIndex: number) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  children: React.ReactNode;
  error?: string | null;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onStepClick,
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'إنشاء الإعلان',
  children,
  error,
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];
  const canProceed = currentStepData?.isValid;

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <div className={styles.container}>
      {/* Step Indicator */}
      <div className={styles.indicatorWrapper}>
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={onStepClick}
        />
      </div>

      {/* Content Area */}
      <div className={styles.content}>{children}</div>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <Text variant="body2" color="danger">
            {error}
          </Text>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className={styles.navigation}>
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
          icon={<ChevronRight size={20} />}
        >
          السابق
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          loading={isSubmitting}
          icon={<ChevronLeft size={20} />}
        >
          {isLastStep ? submitButtonText : 'التالي'}
        </Button>
      </div>
    </div>
  );
};
