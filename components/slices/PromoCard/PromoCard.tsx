"use client";

import React from "react";
import Image from "next/image";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import styles from "./PromoCard.module.scss";

export interface PromoCardProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonHref: string;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  badge?: string;
  variant?: "primary" | "secondary" | "accent" | "neutral";
  className?: string;
}

export const PromoCard: React.FC<PromoCardProps> = ({
  title,
  subtitle,
  buttonText,
  buttonHref,
  imageSrc,
  imageAlt = "",
  imagePosition = "left",
  badge,
  variant = "primary",
  className = "",
}) => {
  // Check if image is from Cloudflare
  const isCloudflareImage = imageSrc?.includes("imagedelivery.net") || imageSrc?.includes("cloudflare");

  return (
    <div className={`${styles.card} ${styles[variant]} ${styles[`image${imagePosition === "left" ? "Left" : "Right"}`]} ${className}`}>
      {/* Image */}
      {imageSrc && (
        <div className={styles.imageWrapper}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 150px"
            className={styles.image}
            unoptimized={isCloudflareImage}
          />
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <Text variant="h4" className={styles.title}>{title}</Text>
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>
        {subtitle && <Text variant="small" className={styles.subtitle}>{subtitle}</Text>}

        <Button variant="outline" size="sm" href={buttonHref} arrow className={styles.button}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default PromoCard;
