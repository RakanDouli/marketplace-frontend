'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './FavoriteButton.module.scss';

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;

  onToggle?: (listingId: string, isFavorited: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  initialFavorited = false,

  onToggle,
}) => {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      // TODO: Add API call to toggle favorite
      // const response = await toggleFavorite(listingId);

      const newState = !isFavorited;
      setIsFavorited(newState);
      onToggle?.(listingId, newState);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`${styles.favoriteButton} ${styles.inline} ${isFavorited ? styles.favorited : ''
        }`}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Star size={20} fill={isFavorited ? 'currentColor' : 'none'} />
    </button>
  );
};

export default FavoriteButton;
