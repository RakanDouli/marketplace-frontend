"use client";

import React, { useState } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import Loading from "../Loading/Loading";
import styles from "./Image.module.scss";

export interface ImageProps extends Omit<NextImageProps, 'onLoad' | 'onError'> {
  skeletonClassName?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

export const Image: React.FC<ImageProps> = ({
  skeletonClassName = "",
  containerClassName = "",
  showSkeleton = true,
  aspectRatio,
  alt,
  className = "",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const containerStyles = aspectRatio ? { aspectRatio } : {};

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
          alt={alt}
          className={`${styles.image} ${className} ${isLoading ? styles.loading : styles.loaded}`.trim()}
          onLoad={handleLoad}
          onError={handleError}
          fill={!!aspectRatio} // Use fill when aspect ratio is set
        />
      )}
    </div>
  );
};

export default Image;