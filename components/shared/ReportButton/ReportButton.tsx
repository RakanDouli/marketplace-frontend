'use client';

import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/slices';
import { ReportModal } from './ReportModal/ReportModal';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './ReportButton.module.scss';

interface ReportButtonProps {
  // Entity details
  entityType: 'listing' | 'thread' | 'user';
  entityId: string;
  entityTitle: string; // Listing title, chat participant names, or user name

  // Reported user details
  reportedUserId: string;
  reportedUserName: string;

  // Optional: Owner ID to hide button for own content
  ownerId?: string;

  // Optional: Custom button styling
  variant?: 'link' | 'outline';
  className?: string;

  // Optional: Custom button text
  buttonText?: string;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  entityType,
  entityId,
  entityTitle,
  reportedUserId,
  reportedUserName,
  ownerId,
  variant = 'link',
  className,
  buttonText,
}) => {
  const { user: currentUser, isAuthenticated, openAuthModal } = useUserAuthStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Don't show button if user is the owner
  if (currentUser && currentUser.id === ownerId) {
    return null;
  }

  const handleReportClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setIsReportModalOpen(true);
  };

  // Default button text based on entity type
  const defaultButtonText = {
    listing: 'الإبلاغ عن الإعلان',
    thread: 'إبلاغ عن محتوى مسيء',
    user: 'الإبلاغ عن المستخدم',
  }[entityType];

  return (
    <>
      <div className={className || styles.reportButton}>
        <Button variant={variant} onClick={handleReportClick}>
          <Flag size={16} />
          {buttonText || defaultButtonText}
        </Button>
      </div>

      <ReportModal
        isVisible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
        reportedUserId={reportedUserId}
        reportedUserName={reportedUserName}
      />
    </>
  );
};
