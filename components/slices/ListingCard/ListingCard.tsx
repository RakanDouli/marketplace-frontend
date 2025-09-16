"use client";

import React, { useState } from "react";
import { Heart, MapPin, User } from "lucide-react";
import { ImageGallery, Text } from "../";
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
  isLiked = false,
  onLike,
  onClick,
  viewMode = "grid",
  className = "",
  priority = false,
}) => {
  const [liked, setLiked] = useState(isLiked);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    onLike?.(id, newLiked);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  const sellerTypeLabels = {
    private: "Private",
    dealer: "Dealer",
    business: "Business",
  };

  return (
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
          viewMode={viewMode}
          priority={priority}
          sizes={
            viewMode === "list"
              ? "(max-width: 768px) 100vw, 300px"
              : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
        />

        {/* Like Button */}
        <button
          className={`${styles.likeButton} ${liked ? styles.liked : ""}`}
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Title */}
        <Text variant="h4" className={styles.title}>
          {title}
        </Text>

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
              if (!value || value === "") return null;

              return (
                <div key={key} className={styles.specGrid}>
                  <Text variant="xs" className={styles.specTextGrid}>
                    {key}: {value}
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
              if (!value || value === "") return null;

              return (
                <div key={key} className={styles.specList}>
                  <Text variant="xs" className={styles.specLabel}>
                    {key}:
                  </Text>
                  <Text variant="xs" className={styles.specText}>
                    {value}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
