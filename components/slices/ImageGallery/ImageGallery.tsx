"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Image } from "../Image/Image";
import { optimizeListingImage } from "../../../utils/cloudflare-images";
import styles from "./ImageGallery.module.scss";

export interface ImageGalleryProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
  className?: string;
  viewMode?: "card" | "small" | "large" | "desktop" | "mobile" | "tablet" | "thumbnail" | "public";
  priority?: boolean;
  sizes?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  aspectRatio = "4 / 3",
  className = "",
  viewMode = "grid",
  priority = false,
  sizes,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`${styles.gallery} ${className}`}>
        <Image
          src="/placeholder-car.svg"
          alt={alt}
          aspectRatio={aspectRatio}
          className={styles.image}
          sizes={sizes}
          priority={priority}
        />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`${styles.gallery} ${className}`}>
        <Image
          src={optimizeListingImage(images[0], viewMode)}
          alt={alt}
          aspectRatio={aspectRatio}
          className={styles.image}
          sizes={sizes}
          priority={priority}
        />
      </div>
    );
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`${styles.gallery} ${className}`}>
      <Image
        src={optimizeListingImage(images[currentIndex], viewMode)}
        alt={`${alt} - Image ${currentIndex + 1}`}
        aspectRatio={aspectRatio}
        className={styles.image}
        sizes={sizes}
        priority={priority}
      />

      {/* Navigation Buttons */}
      <button
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={handlePrevious}
        aria-label="Previous image"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={handleNext}
        aria-label="Next image"
      >
        <ChevronRight size={20} />
      </button>

      {/* Image Counter */}
      <div className={styles.counter}>
        {currentIndex + 1} / {images.length}
      </div>

      {/* Dots Indicator
      <div className={styles.dots}>
        {images.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${
              index === currentIndex ? styles.active : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div> */}
    </div>
  );
};

export default ImageGallery;
