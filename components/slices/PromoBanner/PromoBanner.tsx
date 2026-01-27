"use client";

import React from "react";
import Image from "next/image";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Container, ContainerProps } from "../Container/Container";
import styles from "./PromoBanner.module.scss";

export interface PromoBannerProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonHref: string;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  variant?: "primary" | "secondary" | "accent";
  className?: string;
  paddingY?: ContainerProps["paddingY"];
  /** Load image with priority for above-the-fold content (improves LCP) */
  priority?: boolean;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  title,
  subtitle,
  buttonText,
  buttonHref,
  imageSrc,
  imageAlt = "",
  imagePosition = "right",
  variant = "secondary",
  className = "",
  paddingY = "sm",
  priority = false,
}) => {
  // Check if image is from Cloudflare (contains cloudflare or our CDN domain)
  const isCloudflareImage = imageSrc?.includes("imagedelivery.net") || imageSrc?.includes("cloudflare");

  return (
    <Container paddingY={paddingY} outerBackground="transparent">
      <div className={`${styles.banner} ${styles[variant]} ${styles[`image${imagePosition === "left" ? "Left" : "Right"}`]} ${className}`}>
          {/* Image */}
          {imageSrc && (
            <div className={styles.imageWrapper}>
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className={styles.image}
                unoptimized={isCloudflareImage}
                priority={priority}
              />
            </div>
          )}

          {/* Content */}
          <div className={styles.content}>
            <Text variant="h3" className={styles.title}>{title}</Text>
            {subtitle && <Text variant="paragraph" className={styles.subtitle}>{subtitle}</Text>}
          </div>

          {/* Button */}
          <div className={styles.buttonWrapper}>
            <Button variant="outline" href={buttonHref} arrow className={styles.button}>
              {buttonText}
            </Button>
          </div>
      </div>
    </Container>
  );
};

export default PromoBanner;
