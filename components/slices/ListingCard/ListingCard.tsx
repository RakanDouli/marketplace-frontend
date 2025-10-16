"use client";

import React from "react";
import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { ImageGallery, Text, ShareButton, FavoriteButton } from "../";
import styles from "./ListingCard.module.scss";

export interface ListingCardProps {
  id: string;
  title: string;
  price: string;
  currency: string;
  location: string;
  accountType: "individual" | "dealer" | "business"; // Changed from sellerType to accountType
  specs?: Record<string, any>; // Dynamic specs from backend
  images?: string[];
  description?: string;
  isLiked?: boolean;
  onLike?: (id: string, liked: boolean) => void;
  onClick?: (id: string) => void;
  viewMode?: "grid" | "list";
  className?: string;
  priority?: boolean; // For LCP optimization
  isLoading?: boolean; // Skeleton loading state
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency,
  location,
  accountType,
  specs = {},
  images,
  description = "",
  isLiked = false,
  onLike,
  onClick,
  viewMode = "grid",
  className = "",
  priority = false,
  isLoading = false,
}) => {
  const handleCardClick = () => {
    onClick?.(id);
  };

  // Get Arabic account type label from specs if available, fallback to English labels
  const getAccountTypeLabel = () => {
    // Check specs for Arabic account type value (from backend specsDisplay)
    if (specs?.accountType) {
      return typeof specs.accountType === 'object' ? specs.accountType.value : specs.accountType;
    }
    if (specs?.account_type) {
      return typeof specs.account_type === 'object' ? specs.account_type.value : specs.account_type;
    }

    // Fallback to English labels if not in specs
    const accountTypeLabels = {
      individual: "فردي",
      dealer: "تاجر",
      business: "شركة",
    };
    return accountTypeLabels[accountType] || accountType;
  };

  return (

    <div
      className={`
          ${styles.card}
          ${styles[viewMode]}
          ${className}
        `.trim()}
      onClick={handleCardClick}
    >    <Link href={`/listing/${id}`} className={styles.cardLink}>
        {/* Image Gallery Section */}
        <div className={styles.imageContainer}>
          <ImageGallery
            images={images || []}
            alt={title}
            aspectRatio="3 / 2"
            className={styles.image}
            viewMode={viewMode === "grid" ? "small" : "card"}
            priority={priority}
            skeleton={isLoading}
            sizes={
              viewMode === "list"
                ? "(max-width: 768px) 100vw, 300px"
                : "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            }
          />

          {/* Favorite Button */}
          {!isLoading && (
            <div className={styles.favorite}>
              <FavoriteButton
                listingId={id}
                initialFavorited={isLiked}
                onToggle={onLike}
              />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={styles.content}>
          {/* Title with Share Button (only in list view) */}
          {viewMode === 'list' ? (
            <div className={styles.titleRow}>
              <Text variant="h4" className={styles.title} skeleton={isLoading}>
                {title}
              </Text>
              {!isLoading && (
                <div
                  className={styles.shareButtonWrapper}
                  onClick={(e) => e.preventDefault()}
                >
                  <ShareButton
                    metadata={{
                      title: title,
                      description: description || `${specs.year || ''} ${specs.make || ''} ${specs.model || ''}`,
                      url: typeof window !== 'undefined' ? `${window.location.origin}/listing/${id}` : '',
                      image: images?.[0],
                      siteName: 'السوق السوري للسيارات',
                      type: 'product',
                      price: price,
                      currency: currency,
                    }}
                    variant="outline"
                  />
                </div>
              )}
            </div>
          ) : (
            <Text variant="h4" className={styles.title} skeleton={isLoading}>
              {title}
            </Text>
          )}

          {/* Price */}
          <div className={styles.price}>
            <Text variant="h4" className={styles.priceValue} skeleton={isLoading} skeletonWidth="60%">
              {price}
            </Text>
            <Text variant="xs" className={styles.currency} skeleton={isLoading} skeletonWidth="20%">
              {currency}
            </Text>
          </div>

          {/* Location - Always show */}
          {location && (
            <div className={styles.spec}>
              {!isLoading && <MapPin size={16} className={styles.specIcon} />}
              <Text variant="xs" className={styles.specText} skeleton={isLoading} skeletonWidth="50%">
                {location}
              </Text>
            </div>
          )}

          {/* Grid View Specs - Compact single line with | separator (like AutoScout24) */}
          {viewMode === "grid" && specs && Object.keys(specs).length > 0 && (
            <div className={styles.specsCompact}>
              <Text variant="xs" className={styles.specsCompactText} skeleton={isLoading} skeletonWidth="80%">
                {Object.entries(specs)
                  .filter(([key]) => key !== 'accountType' && key !== 'account_type')
                  .map(([, value]) => {
                    if (!value) return null;
                    const displayValue = typeof value === 'object' ? value.value : value;
                    if (!displayValue || displayValue === "") return null;
                    return displayValue;
                  })
                  .filter(Boolean)
                  .join(' | ')}
              </Text>
            </div>
          )}

          {/* List View Specs - Detailed layout */}
          {viewMode === "list" && specs && Object.keys(specs).length > 0 && (
            <div className={styles.specsList}>
              {Object.entries(specs)
                .filter(([key]) => key !== 'accountType' && key !== 'account_type')
                .map(([key, value]) => {
                  if (!value) return null;
                  const displayLabel = typeof value === 'object' ? value.label : key;
                  const displayValue = typeof value === 'object' ? value.value : value;
                  if (!displayValue || displayValue === "") return null;

                  return (
                    <div key={key} className={styles.specList}>
                      <Text variant="xs" className={styles.specLabel}>
                        {displayLabel}:
                      </Text>
                      <Text variant="xs" className={styles.specText}>
                        {displayValue}
                      </Text>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Account Type - At the end with border-top */}
          <div className={styles.sellerSection}>
            {!isLoading && <User size={16} className={styles.specIcon} />}
            <Text variant="xs" className={styles.specText} skeleton={isLoading} skeletonWidth="40%">
              {getAccountTypeLabel()}
            </Text>
          </div>
        </div>    </Link>
    </div>

  );
};

export default ListingCard;
