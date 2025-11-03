'use client';

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import styles from './FavoriteButton.module.scss';

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;
  onToggle?: () => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  initialFavorited = false,
  onToggle,
}) => {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const [isLoading, setIsLoading] = useState(false);

  // Use wishlist store state as source of truth
  const isFavorited = isInWishlist(listingId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      await toggleWishlist(listingId);
      onToggle?.();
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
