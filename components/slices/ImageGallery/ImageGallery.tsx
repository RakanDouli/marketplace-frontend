"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Image } from "../Image/Image";
import { Skeleton } from "../Skeleton";
import { ImagePreview } from "../ImagePreview/ImagePreview";
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
  skeleton?: boolean;
  enablePreview?: boolean; // Enable click to open preview modal
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  aspectRatio = "4 / 3",
  className = "",
  viewMode = "card",
  priority = false,
  sizes,
  skeleton = false,
  enablePreview = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  if (skeleton) {
    return (
      <div className={`${styles.gallery} ${className}`}>
        <Skeleton
          width="100%"
          aspectRatio={aspectRatio}
          variant="rectangular"
        />
      </div>
    );
  }

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

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    if (enablePreview) {
      setShowPreview(true);
    }
  };

  // Prepare images for preview modal (use high quality 'public' variant)
  const previewImages = images.map((img, index) => ({
    url: optimizeListingImage(img, 'public'),
    alt: `${alt} - ${index + 1}`,
  }));

  // Single image case
  if (images.length === 1) {
    return (
      <>
        <div
          className={`${styles.gallery} ${className} ${enablePreview ? styles.clickable : ''}`}
          onClick={handleImageClick}
        >
          <Image
            src={optimizeListingImage(images[0], viewMode)}
            alt={alt}
            aspectRatio={aspectRatio}
            className={styles.image}
            sizes={sizes}
            priority={priority}
          />
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <ImagePreview
            images={previewImages}
            initialIndex={0}
            onClose={() => setShowPreview(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`${styles.gallery} ${className} ${enablePreview ? styles.clickable : ''}`}
        onClick={handleImageClick}
      >
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
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ImagePreview
          images={previewImages}
          initialIndex={currentIndex}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default ImageGallery;
