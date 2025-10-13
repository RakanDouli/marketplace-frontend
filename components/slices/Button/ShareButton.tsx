'use client';

import React, { useState } from 'react';
import { Share } from 'lucide-react';
import { Button } from '@/components/slices';
import { ShareModal, ShareMetadata } from '@/components/ShareModal/ShareModal';

interface ShareButtonProps {
  metadata: ShareMetadata;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  metadata,
  variant = 'outline',
  icon = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    // Try native share API first (mainly for mobile)
    if (navigator.share) {
      navigator.share({
        title: metadata.title,
        text: metadata.description,
        url: metadata.url,
      }).catch(() => {
        // If native share fails or is cancelled, open modal
        setIsModalOpen(true);
      });
    } else {
      // Desktop or browsers without native share - open modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleButtonClick}
        icon={icon ? <Share size={20} /> : undefined}
        aria-label="مشاركة"
      >
        {!icon && 'مشاركة'}
      </Button>

      <ShareModal
        isVisible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={metadata}
      />
    </>
  );
};

export default ShareButton;
