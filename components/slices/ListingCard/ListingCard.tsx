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
  sellerType: "private" | "dealer" | "business";
  specs?: Record<string, any>; // Dynamic specs from backend
  images?: string[];
  description?: string;
  isLiked?: boolean;
  onLike?: (id: string, liked: boolean) => void;
  onClick?: (id: string) => void;
  viewMode?: "grid" | "list";
  className?: string;
  priority?: boolean; // For LCP optimization
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency,
  location,
  sellerType,
  specs = {},
  images,
  description = "",
  isLiked = false,
  onLike,
  onClick,
  viewMode = "grid",
  className = "",
  priority = false,
}) => {
  const handleCardClick = () => {
    onClick?.(id);
  };

  const sellerTypeLabels = {
    private: "Private",
    dealer: "Dealer",
    business: "Business",
  };

  return (
    <Link href={`/listing/${id}`} className={styles.cardLink}>
      <div
        className={`
          ${styles.card}
          ${styles[viewMode]}
          ${className}
        `.trim()}
        onClick={handleCardClick}
      >
        {/* Image Gallery Section */}
        <div className={styles.imageContainer}>
          <ImageGallery
            images={images || []}
            alt={title}
            aspectRatio="4 / 3"
            className={styles.image}
            viewMode={viewMode === "grid" ? "small" : "card"}
            priority={priority}
            sizes={
              viewMode === "list"
                ? "(max-width: 768px) 100vw, 300px"
                : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
          />

          {/* Favorite Button */}
          <div className={styles.favorite}>
            <FavoriteButton
              listingId={id}
              initialFavorited={isLiked}
              onToggle={onLike}
            /></div>
        </div>

        {/* Content Section */}
        <div className={styles.content}>
          {/* Title with Share Button (only in list view) */}
          {viewMode === 'list' ? (
            <div className={styles.titleRow}>
              <Text variant="h4" className={styles.title}>
                {title}
              </Text>
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
            </div>
          ) : (
            <Text variant="h4" className={styles.title}>
              {title}
            </Text>
          )}

          {/* Price */}
          <div className={styles.price}>
            <Text variant="h4" className={styles.priceValue}>
              {price}
            </Text>
            <Text variant="xs" className={styles.currency}>
              {currency}
            </Text>
          </div>

          {/* Location - Always show */}
          {location && (
            <div className={styles.spec}>
              <MapPin size={16} className={styles.specIcon} />
              <Text variant="xs" className={styles.specText}>
                {location}
              </Text>
            </div>
          )}

          {/* Seller Type - Always show */}
          <div className={styles.spec}>
            <User size={16} className={styles.specIcon} />
            <Text variant="xs" className={styles.specText}>
              {sellerTypeLabels[sellerType]}
            </Text>
          </div>

          {/* Grid View Specs - Minimal layout */}
          {viewMode === "grid" && specs && Object.keys(specs).length > 0 && (
            <div className={styles.specsGrid}>
              {Object.entries(specs).map(([key, value]) => {
                if (!value) return null;
                const displayLabel = typeof value === 'object' ? value.label : key;
                const displayValue = typeof value === 'object' ? value.value : value;
                if (!displayValue || displayValue === "") return null;

                return (
                  <div key={key} className={styles.specGrid}>
                    <Text variant="xs" className={styles.specTextGrid}>
                      {displayLabel}: {displayValue}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View Specs - Detailed layout */}
          {viewMode === "list" && specs && Object.keys(specs).length > 0 && (
            <div className={styles.specsList}>
              {Object.entries(specs).map(([key, value]) => {
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
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
