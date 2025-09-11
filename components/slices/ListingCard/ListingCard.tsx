'use client';

import React, { useState } from "react";
import { Heart, MapPin, User, Fuel, Calendar, Gauge } from "lucide-react";
import { Image, Text, Button } from "../";
import styles from "./ListingCard.module.scss";

export interface ListingCardProps {
  id: string;
  title: string;
  price: string;
  currency: string;
  firstRegistration: string;
  mileage: string;
  fuelType: string;
  location: string;
  sellerType: "private" | "dealer" | "business";
  images?: string[];
  isLiked?: boolean;
  onLike?: (id: string, liked: boolean) => void;
  onClick?: (id: string) => void;
  viewMode?: "grid" | "list";
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency,
  firstRegistration,
  mileage,
  fuelType,
  location,
  sellerType,
  images,
  isLiked = false,
  onLike,
  onClick,
  viewMode = "grid",
  className = "",
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
      {/* Image Section */}
      <div className={styles.imageContainer}>
        <Image
          src={images?.[0] || "/placeholder-car.svg"}
          alt={title}
          aspectRatio={"4 / 3"}
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Like Button */}
        <button
          className={`${styles.likeButton} ${liked ? styles.liked : ""}`}
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
        </button>

        {/* Image Count Indicator */}
        {images && images.length > 1 && (
          <div className={styles.imageCount}>1 / {images.length}</div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Title */}
        <Text variant="h4" className={styles.title}>
          {title}
        </Text>

        {/* Price */}
        <div className={styles.price}>
          <Text variant="h3" className={styles.priceValue}>
            {price}
          </Text>
          <Text variant="small" className={styles.currency}>
            {currency}
          </Text>
        </div>

        {/* Specs Grid */}
        <div className={styles.specs}>
          <div className={styles.spec}>
            <Calendar size={16} className={styles.specIcon} />
            <Text variant="small" className={styles.specText}>
              {firstRegistration}
            </Text>
          </div>

          <div className={styles.spec}>
            <Gauge size={16} className={styles.specIcon} />
            <Text variant="small" className={styles.specText}>
              {mileage}
            </Text>
          </div>

          <div className={styles.spec}>
            <Fuel size={16} className={styles.specIcon} />
            <Text variant="small" className={styles.specText}>
              {fuelType}
            </Text>
          </div>

          <div className={styles.spec}>
            <MapPin size={16} className={styles.specIcon} />
            <Text variant="small" className={styles.specText}>
              {location}
            </Text>
          </div>

          <div className={styles.spec}>
            <User size={16} className={styles.specIcon} />
            <Text variant="small" className={styles.specText}>
              {sellerTypeLabels[sellerType]}
            </Text>
          </div>
        </div>

        {/* Actions (only in list view) */}
        {viewMode === "list" && (
          <div className={styles.actions}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button variant="primary" size="sm">
              Contact Seller
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
