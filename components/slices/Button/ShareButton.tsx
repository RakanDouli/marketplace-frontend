'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal, ShareMetadata } from '@/components/ShareModal/ShareModal';
import { Button } from './Button';

interface ShareButtonProps {
  metadata: ShareMetadata;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ metadata }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we're on mobile (native share works better on mobile)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Try native share API on mobile only
    if (isMobile && navigator.share) {
      navigator.share({
        title: metadata.title,
        text: metadata.description,
        url: metadata.url,
      }).catch(() => {
        // If native share fails or is cancelled, open modal
        setIsModalOpen(true);
      });
    } else {
      // Desktop or browsers without native share - always open modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        aria-label="مشاركة"
        icon={<Share2 size={20} />}
      />

      <ShareModal
        isVisible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={metadata}
      />
    </>
  );
};

export default ShareButton;
