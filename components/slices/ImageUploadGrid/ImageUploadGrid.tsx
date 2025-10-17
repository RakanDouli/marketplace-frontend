'use client';

import React, { useState, useRef } from 'react';
import { Text, Button } from '@/components/slices';
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: ImageItem[] = [];
    const remainingSlots = maxImages - images.length;
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
      onChange([...images, ...newImages]);
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
        <Text variant="body2" weight="medium">
          الصور ({images.length}/{maxImages})
        </Text>
        {!disabled && canAddMore && (
          <Text variant="caption" className={styles.hint}>
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
            <img
              src={image.url}
              alt="Listing"
              className={styles.image}
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
          <div className={styles.addButton} onClick={handleAddClick}>
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
            <Text variant="caption">
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
