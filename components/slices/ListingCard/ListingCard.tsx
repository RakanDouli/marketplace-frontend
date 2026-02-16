"use client";

import React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Text, ShareButton, FavoriteButton, Image } from "../";
import styles from "./ListingCard.module.scss";

export interface ListingCardProps {
  id: string;
  title: string;
  price: string;
  currency?: string; // Optional - defaults to 'USD' for SEO/share metadata
  location?: string;
  accountType?: "individual" | "dealer" | "business"; // Changed from sellerType to accountType
  specs?: Record<string, any>; // Dynamic specs from backend
  images?: string[];
  description?: string;
  onClick?: (id: string) => void;
  viewMode?: "grid" | "list" | "compact"; // compact = minimal card for sliders (image, title, price only)
  className?: string;
  priority?: boolean; // For LCP optimization
  isLoading?: boolean; // Skeleton loading state
  userId?: string; // ID of the user who owns the listing
  categorySlug?: string; // Category slug for URL structure /{category}/{listingType}/{id}
  listingTypeSlug?: string; // Listing type slug for URL structure (sell/rent)
  // Deprecated: isLiked and onLike - now using wishlist store directly
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency = 'USD',
  location,
  accountType,
  specs = {},
  images,
  description = "",
  onClick,
  viewMode = "grid",
  className = "",
  priority = false,
  isLoading = false,
  userId,
  categorySlug,
  listingTypeSlug = "sell", // Default to sell for backwards compatibility
}) => {
  // Build listing URL - use category-based URL with listing type
  // URL structure: /{category}/{listingType}/{id} (e.g., /cars/sell/123)
  const listingUrl = `/${categorySlug || 'cars'}/${listingTypeSlug}/${id}`;
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
    const accountTypeLabels: Record<string, string> = {
      individual: "فردي",
      dealer: "تاجر",
      business: "شركة",
    };
    return (accountType && accountTypeLabels[accountType]) || accountType || "فردي";
  };

  return (

    <div
      className={`
          ${styles.card}
          ${styles[viewMode]}
          ${className}
        `.trim()}
      onClick={handleCardClick}
    >    <Link href={listingUrl} className={styles.cardLink}>
        {/* Single Image - No gallery swiper (encourages clicking into detail page) */}
        <div className={styles.imageContainer}>
          {isLoading ? (
            <div className={styles.imageSkeleton} />
          ) : (
            <Image
              src={images?.[0] || ''}
              alt={title}
              variant="card"
              aspectRatio="4/3"
              sizes={
                viewMode === "list"
                  ? "(max-width: 768px) 100vw, 300px"
                  : "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              }
              containerClassName={styles.image}
              priority={priority}
              showSkeleton={false}
            />
          )}

          {/* Image count badge */}
          {/* {!isLoading && images && images.length > 1 && (
            <div className={styles.imageCount}>
              <span>{images.length}</span>
            </div>
          )} */}

          {/* Favorite Button */}
          {!isLoading && (
            <div className={styles.favorite}>
              <ShareButton
                metadata={{
                  title: title,
                  description: description || `${specs.year || ''} ${specs.make || ''} ${specs.model || ''}`,
                  url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shambay.com'}${listingUrl}`,
                  image: images?.[0],
                  siteName: 'شام باي',
                  type: 'product',
                  price: price,
                  currency: currency,
                }}
              />
              <FavoriteButton listingId={id} listingUserId={userId} />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={styles.content}>
          {/* Compact View - Only title and price */}
          {viewMode === 'compact' ? (
            <>
              <Text variant="h4" className={styles.title} skeleton={isLoading}>
                {title}
              </Text>
              <div className={styles.price}>
                <Text variant="h4" className={styles.priceValue} skeleton={isLoading} skeletonWidth="60%">
                  {price}
                </Text>
              </div>
            </>
          ) : (
            <>

              <Text variant="h4" className={styles.title} skeleton={isLoading}>
                {title}
              </Text>


              {/* Price */}
              <div className={styles.price}>
                <Text variant="h4" className={styles.priceValue} skeleton={isLoading} skeletonWidth="60%">
                  {price}
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
                  <Text variant="small" className={styles.specsCompactText} skeleton={isLoading} skeletonWidth="80%">
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
            </>
          )}
        </div>
      </Link>
    </div>

  );
};

export default ListingCard;
