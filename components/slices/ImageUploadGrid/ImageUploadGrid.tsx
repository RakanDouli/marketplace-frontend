'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Text, Button, Image } from '@/components/slices';
import { Trash2 } from 'lucide-react';
import styles from './ImageUploadGrid.module.scss';

export interface ImageItem {
  id: string;
  url: string;
  file?: File;
}

interface ImageUploadGridProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({
  images,
  onChange,
  maxImages = 20,
  disabled = false,
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: ImageItem[] = [];

    // Single image mode: Replace existing image instead of adding
    const isSingleImageMode = maxImages === 1;
    const shouldReplace = isSingleImageMode && images.length === 1;

    const remainingSlots = shouldReplace ? 1 : maxImages - images.length;
    const filesToAdd = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToAdd; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const id = `${Date.now()}-${i}`;
        const url = URL.createObjectURL(file);
        newImages.push({ id, url, file });
      }
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
          الصور ({images.length}/{maxImages})
        </Text>
        {!disabled && canAddMore && (
          <Text variant="small" className={styles.hint}>
            اسحب الصور هنا أو انقر على + للإضافة
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
          <div key={image.id} className={styles.imageCard}>
            <Image
              src={image.url}
              alt="صورة"
              width={200}
              height={150}
              className={styles.image}
              showSkeleton={false}
              variant="public"
            />
            {!disabled && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(image.id)}
                className={styles.deleteButton}
                icon={<Trash2 size={16} />}
                aria-label="حذف الصورة"
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
              إضافة صورة
            </Text>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className={styles.fileInput}
      />
    </div>
  );
};
