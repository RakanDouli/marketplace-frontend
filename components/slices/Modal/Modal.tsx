"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../';
import styles from './Modal.module.scss';

export interface ModalProps {
  isVisible: boolean;
  closeable?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  closeable = true,
  onClose,
  children,
  className = '',
  maxWidth = 'md',
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

  return (
    <div 
      className={styles.modalBg}
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`
          ${styles.modal} 
          ${styles[maxWidth]} 
          ${className}
        `.trim()}
      >
        {/* Close Button */}
        {closeable && (
          <Button
            variant="outline"
            className={styles.modalClose}
            onClick={handleCloseClick}
            aria-label="Close modal"
          >
            <X size={24} />
          </Button>
        )}

        {/* Modal Content */}
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;