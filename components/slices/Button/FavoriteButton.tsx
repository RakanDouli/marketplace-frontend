'use client';

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './FavoriteButton.module.scss';

interface FavoriteButtonProps {
  listingId: string;
  listingUserId?: string; // User ID of listing owner
  initialFavorited?: boolean;
  onToggle?: () => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  listingUserId,
  initialFavorited = false,
  onToggle,
}) => {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isAuthenticated, openAuthModal, user: currentUser } = useUserAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Simple check: Hide button if user owns this listing
  if (currentUser && listingUserId && currentUser.id === listingUserId) {
    return null;
  }

  // Use wishlist store state as source of truth
  const isFavorited = isInWishlist(listingId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

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
