"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, Text } from '../';
import styles from './Modal.module.scss';

export interface ModalProps {
  isVisible: boolean;
  closeable?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'md' | 'lg' | 'xl';
  title?: string;
  description?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  closeable = true,
  onClose,
  children,
  className = '',
  maxWidth = 'md',
  title,
  description,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeable && onClose) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, closeable, onClose]);

  if (!isVisible) {
    return null;
  }

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeable && onClose) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (closeable && onClose) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={styles.modalBg}
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        className={`
          ${styles.modal}
          ${styles[maxWidth]}
          ${className}
        `.trim()}
      >
        {/* Close Button */}

        {/* <div className={styles.modalHeader}> */}

        {closeable && (
          <button
            className={styles.modalClose}
            onClick={handleCloseClick}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
        )}

        {/* </div> */}
        {/* Modal Content */}
        <div className={styles.modalContent}>
          {title && (
            <Text variant="h3" className={styles.modalTitle}>
              {title} {""}
            </Text>
          )}
          {description && (
            <p id="modal-description" className={styles.modalDescription}>
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal at document body level using portal
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};

export default Modal;