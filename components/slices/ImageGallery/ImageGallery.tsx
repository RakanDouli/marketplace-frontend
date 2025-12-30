"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Image } from "../Image/Image";
import { Skeleton } from "../Skeleton";
import { ImagePreview } from "../ImagePreview/ImagePreview";
import { optimizeListingImage } from "../../../utils/cloudflare-images";
import { isVideoUrl, MediaItem } from "../../../utils/media-helpers";
import styles from "./ImageGallery.module.scss";

export interface ImageGalleryProps {
  images: string[];
  alt: string;
  videoUrl?: string | null; // Video URL for premium listings
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
  videoUrl,
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

  // Create unified media items array (images + video at end)
  const mediaItems: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = [];

    // Add images
    if (images && images.length > 0) {
      images.forEach((img, index) => {
        items.push({
          url: img,
          type: 'image',
          alt: `${alt} - ${index + 1}`,
          id: img,
        });
      });
    }

    // Add video at the end if exists
    if (videoUrl) {
      items.push({
        url: videoUrl,
        type: 'video',
        alt: 'فيديو',
        id: 'video',
      });
    }

    return items;
  }, [images, videoUrl, alt]);

  // Get current media item
  const currentMedia = mediaItems[currentIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

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

  if (mediaItems.length === 0) {
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
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    if (enablePreview) {
      setShowPreview(true);
    }
  };

  // Prepare media items for preview modal (use high quality 'public' variant for images)
  const previewImages = mediaItems.map((item, index) => ({
    url: item.type === 'image' ? optimizeListingImage(item.url, 'public') : item.url,
    alt: item.alt || `${alt} - ${index + 1}`,
    type: item.type,
  }));

  // Render current media (image or video thumbnail with play overlay)
  const renderCurrentMedia = () => {
    if (!currentMedia) return null;

    if (isCurrentVideo) {
      // Show video thumbnail with play overlay (clicking opens preview modal)
      return (
        <div className={styles.videoContainer} style={{ aspectRatio }}>
          <video
            src={currentMedia.url}
            className={styles.videoThumbnail}
            playsInline
            muted
            preload="metadata"
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
          <div className={styles.videoPlayOverlay}>
            <Play size={48} fill="white" />
          </div>
        </div>
      );
    }

    return (
      <Image
        src={optimizeListingImage(currentMedia.url, viewMode)}
        alt={currentMedia.alt || alt}
        aspectRatio={aspectRatio}
        className={styles.image}
        sizes={sizes}
        priority={priority}
      />
    );
  };

  // Single media item case
  if (mediaItems.length === 1) {
    return (
      <>
        <div
          className={`${styles.gallery} ${className} ${enablePreview ? styles.clickable : ''}`}
          onClick={handleImageClick}
        >
          {renderCurrentMedia()}
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
        {renderCurrentMedia()}

        {/* Navigation Buttons */}
        <button
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={handlePrevious}
          aria-label="السابق"
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

        {/* Media Counter */}
        <div className={styles.counter}>
          {currentIndex + 1} / {mediaItems.length}
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
