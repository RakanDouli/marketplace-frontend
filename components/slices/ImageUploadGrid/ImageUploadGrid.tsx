'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Text, Button, Image } from '@/components/slices';
import { Trash2, Play, Check } from 'lucide-react';
import styles from './ImageUploadGrid.module.scss';

export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  isVideo?: boolean; // Track if this is a video file
  isUploading?: boolean; // Track if this image is currently uploading
  uploadProgress?: number; // Upload progress 0-100
  isUploaded?: boolean; // Track if upload completed successfully
}

interface ImageUploadGridProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  maxSize?: number; // Maximum file size in bytes (e.g., 2MB = 2 * 1024 * 1024)
  accept?: string; // File types (e.g., 'image/*', 'video/*', 'image/*,video/*')
  disabled?: boolean;
  onError?: (error: string) => void; // Optional error callback
  label?: string; // Label for the upload area (e.g., 'الصور', 'الفيديو')
}

export const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({
  images,
  onChange,
  maxImages = 20,
  maxSize = 2 * 1024 * 1024, // Default: 2MB
  accept = 'image/*',
  disabled = false,
  onError,
  label = 'الصور',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  // Helper to check if file matches accept pattern
  const isFileTypeAccepted = (file: File): boolean => {
    const acceptedTypes = accept.split(',').map(type => type.trim());

    return acceptedTypes.some(acceptType => {
      if (acceptType.endsWith('/*')) {
        // Handle wildcards like 'image/*' or 'video/*'
        const baseType = acceptType.split('/')[0];
        return file.type.startsWith(`${baseType}/`);
      } else {
        // Handle specific types like 'image/png'
        return file.type === acceptType;
      }
    });
  };

  // Helper to format file size for error messages
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: ImageItem[] = [];
    const errors: string[] = [];

    // Single image mode: Replace existing image instead of adding
    const isSingleImageMode = maxImages === 1;
    const shouldReplace = isSingleImageMode && images.length === 1;

    const remainingSlots = shouldReplace ? 1 : maxImages - images.length;
    const filesToAdd = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToAdd; i++) {
      const file = files[i];

      // Validate file type
      if (!isFileTypeAccepted(file)) {
        // Show user-friendly error message for images
        const isImageAccept = accept.includes('image/');
        const supportedFormats = isImageAccept
          ? 'JPEG, PNG, WebP, GIF'
          : accept.replace(/video\//g, '').replace(/,/g, ', ').toUpperCase();
        errors.push(`نوع الملف غير مدعوم: ${file.name}. الأنواع المسموحة: ${supportedFormats}`);
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        const fileSizeFormatted = formatFileSize(file.size);
        const maxSizeFormatted = formatFileSize(maxSize);
        errors.push(`حجم الملف كبير جداً: ${file.name} (${fileSizeFormatted}). الحد الأقصى: ${maxSizeFormatted}`);
        continue;
      }

      // File is valid - add it
      const id = `${Date.now()}-${i}`;
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      newImages.push({ id, url, file, isVideo });
    }

    // Show errors if any
    if (errors.length > 0 && onError) {
      onError(errors.join('\n'));
    }

    if (newImages.length > 0) {
      if (shouldReplace) {
        // Cleanup old blob URL
        const oldImage = images[0];
        if (oldImage?.url.startsWith('blob:')) {
          URL.revokeObjectURL(oldImage.url);
        }
        // Replace with new image
        onChange(newImages);
      } else {
        // Normal behavior: Add to existing images
        onChange([...images, ...newImages]);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (disabled) return;

    const imageToDelete = images.find(img => img.id === id);
    if (imageToDelete?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete.url);
    }

    onChange(images.filter(img => img.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleAddClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text variant="paragraph">
          {label} ({images.length}/{maxImages})
        </Text>
        {!disabled && canAddMore && (
          <Text variant="small" className={styles.hint}>
            اسحب الملفات هنا أو انقر على + للإضافة
          </Text>
        )}
      </div>

      <div
        className={`${styles.grid} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {images.map((image) => (
          <div key={image.id} className={`${styles.imageCard} ${image.isUploading ? styles.uploading : ''}`}>
            {image.isVideo ? (
              <div className={styles.videoPreview}>
                <video
                  src={image.url}
                  className={styles.video}
                  muted
                  playsInline
                />
                <div className={styles.videoOverlay}>
                  <Play size={32} />
                </div>
              </div>
            ) : (
              <Image
                src={image.url}
                alt={label}
                aspectRatio="1/1"
                containerClassName={styles.image}
                showSkeleton={false}
                variant="public"
              />
            )}

            {/* Upload progress overlay */}
            {image.isUploading && (
              <div className={styles.uploadOverlay}>
                <Text variant="small" className={styles.uploadText}>
                  جاري الرفع... {image.uploadProgress !== undefined ? `${image.uploadProgress}%` : ''}
                </Text>
                {image.uploadProgress !== undefined && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${image.uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Success indicator (top-left, aligned with delete button) */}
            {!image.isUploading && !image.file && (
              <div className={styles.successBadge}>
                <Check size={16} />
              </div>
            )}

            {!disabled && !image.isUploading && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleDelete(image.id)}
                className={styles.deleteButton}
                icon={<Trash2 size={16} />}
                aria-label={`حذف ${label}`}
              />
            )}
          </div>
        ))}

        {!disabled && canAddMore && (
          <div key="add-button" className={styles.addButton} onClick={handleAddClick}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Text variant="small">
              إضافة {label}
            </Text>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxImages > 1}
        onChange={(e) => handleFileSelect(e.target.files)}
        className={styles.fileInput}
      />
    </div>
  );
};
