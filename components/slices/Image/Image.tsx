"use client";

import React, { useState, useMemo } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import Loading from "../Loading/Loading";
import { optimizeListingImage } from "@/utils/cloudflare-images";
import styles from "./Image.module.scss";

export interface ImageProps extends Omit<NextImageProps, 'onLoad' | 'onError'> {
  skeletonClassName?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties; // Additional container styles
  showSkeleton?: boolean;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  priority?: boolean; // For LCP optimization
  variant?: "card" | "small" | "large" | "desktop" | "mobile" | "tablet" | "thumbnail" | "public"; // Cloudflare variant
}

export const Image: React.FC<ImageProps> = ({
  skeletonClassName = "",
  containerClassName = "",
  containerStyle,
  showSkeleton = true,
  aspectRatio,
  priority = false,
  variant = "public",
  alt,
  className = "",
  src,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Automatically convert Cloudflare image IDs to full URLs
  const processedSrc = useMemo(() => {
    if (!src) return src;

    const srcString = typeof src === 'string' ? src : '';

    // Skip if already a full URL (starts with http/https or blob)
    if (srcString.startsWith('http') || srcString.startsWith('blob:') || srcString.startsWith('data:')) {
      return src;
    }

    // Check if it's a Cloudflare image ID (UUID format)
    const isCloudflareId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srcString);

    if (isCloudflareId) {
      // Convert Cloudflare ID to full URL
      return optimizeListingImage(srcString, variant);
    }

    // Return as-is for paths or other formats
    return src;
  }, [src, variant]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const containerStyles = {
    ...(aspectRatio ? { aspectRatio } : {}),
    ...containerStyle,
  };

  return (
    <div
      className={`${styles.imageContainer} ${containerClassName}`.trim()}
      style={containerStyles}
    >
      {/* Skeleton loader */}
      {isLoading && showSkeleton && (
        <div className={`${styles.skeleton} ${skeletonClassName}`.trim()}>
          <Loading />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>📷</div>
          <span className={styles.errorText}>Failed to load image</span>
        </div>
      )}
      
      {/* Actual image */}
      {!hasError && (
        <NextImage
          {...props}
          src={processedSrc}
          alt={alt}
          priority={priority}
          className={`${styles.image} ${className} ${isLoading ? styles.loading : styles.loaded}`.trim()}
          onLoad={handleLoad}
          onError={handleError}
          fill={!!aspectRatio} // Use fill when aspect ratio is set
          quality={85} // Optimize image quality vs file size
          sizes={props.sizes || "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        />
      )}
    </div>
  );
};

export default Image;