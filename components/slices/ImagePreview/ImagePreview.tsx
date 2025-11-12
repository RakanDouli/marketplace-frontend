'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, MoreVertical } from 'lucide-react';
import { Button, Text, Dropdown, DropdownMenuItem } from '@/components/slices';
import styles from './ImagePreview.module.scss';

export interface ImagePreviewImage {
  url: string;
  alt?: string;
  id?: string;
}

export interface ImagePreviewProps {
  images: ImagePreviewImage[];
  initialIndex?: number;
  onClose?: () => void;
  onDelete?: (imageId: string, index: number) => void;
  onDownload?: (imageUrl: string, index: number) => void;
  showActions?: boolean;
  className?: string;
}

/**
 * ImagePreview Component
 *
 * Reusable image preview component following Liskov Substitution Principle.
 * Can be used in:
 * - Chat messages (view sent/received images)
 * - Listing detail page (view listing photos)
 * - Any other image gallery needs
 *
 * @example
 * ```tsx
 * <ImagePreview
 *   images={[{ url: 'image1.jpg' }, { url: 'image2.jpg' }]}
 *   onClose={() => setPreviewOpen(false)}
 *   showActions={true}
 *   onDelete={(id, idx) => handleDelete(id)}
 * />
 * ```
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  initialIndex = 0,
  onClose,
  onDelete,
  onDownload,
  showActions = false,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Adjust currentIndex if it's out of bounds after images array changes
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(images.length - 1);
    }
  }, [images.length, currentIndex]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = async () => {
    if (!onDownload) return;
    onDownload(images[currentIndex].url, currentIndex);
  };

  const handleDelete = () => {
    if (!onDelete || !images[currentIndex].id) return;
    onDelete(images[currentIndex].id!, currentIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.key === 'ArrowLeft') handleNext(); // RTL: Left arrow = Next
      if (e.key === 'ArrowRight') handlePrevious(); // RTL: Right arrow = Previous
    } else if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  if (images.length === 0) return null;

  // Safety check: ensure currentIndex is valid
  const safeIndex = Math.min(currentIndex, images.length - 1);
  const currentImage = images[safeIndex];

  return (
    <div
      className={`${styles.overlay} ${className}`}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="معاينة الصور"
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>


          <div className={styles.headerActions}>
            {/* Three-dots menu for actions */}
            {showActions && (onDownload || onDelete) && (
              <Dropdown
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                trigger={
                  <span
                    // variant="outline"
                    className={styles.previewbuttons}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    title="الخيارات"
                    aria-label="الخيارات"
                  >
                    <MoreVertical size={20} />
                  </span>
                }
                align="left"
              >
                {onDownload && (
                  <DropdownMenuItem
                    icon={<Download size={16} />}
                    label="تحميل"
                    onClick={() => {
                      handleDownload();
                      setIsMenuOpen(false);
                    }}
                  />
                )}
                {onDelete && currentImage.id && (
                  <DropdownMenuItem
                    icon={<Trash2 size={16} />}
                    label="حذف"
                    onClick={() => {
                      handleDelete();
                      setIsMenuOpen(false);
                    }}
                  />
                )}
              </Dropdown>
            )}
            <div className={styles.counter}>
              <Text variant="small">
                {safeIndex + 1} / {images.length}
              </Text>
            </div>
            {/* X close button */}
            {onClose && (
              <span
                className={styles.previewbuttons}
                onClick={onClose}
                title="إغلاق"
                aria-label="إغلاق"
              >
                <X size={24} />
              </span>
            )}
          </div>
        </div>

        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img
            src={currentImage.url}
            alt={currentImage.alt || `صورة ${currentIndex + 1}`}
            className={styles.image}
            draggable={false}
          />
        </div>

        {/* Navigation Arrows (only if more than 1 image) */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.navButton} ${styles.navButtonLeft}`}
              onClick={handleNext}
              aria-label="الصورة التالية"
              title="الصورة التالية"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className={`${styles.navButton} ${styles.navButtonRight}`}
              onClick={handlePrevious}
              aria-label="الصورة السابقة"
              title="الصورة السابقة"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Thumbnail Navigation (if more than 1 image) */}
        {images.length > 1 && (
          <div className={styles.thumbnails}>
            {images.map((image, index) => (
              <button
                key={index}
                className={`${styles.thumbnail} ${index === safeIndex ? styles.thumbnailActive : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`الذهاب إلى الصورة ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt={image.alt || `صورة ${index + 1}`}
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
