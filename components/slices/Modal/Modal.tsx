"use client";

import React, { useEffect, useState } from 'react';
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

const ANIMATION_DURATION = 300; // ms - match CSS animation duration

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
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      // Start closing animation
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeable && onClose) {
        onClose();
      }
    };

    if (shouldRender && !isClosing) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [shouldRender, isClosing, closeable, onClose]);

  if (!shouldRender) {
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
      className={`${styles.modalBg} ${isClosing ? styles.closing : ''}`}
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
          ${isClosing ? styles.closing : ''}
          ${className}
        `.trim()}
      >
        {/* Close Button */}

        {/* <div className={styles.modalHeader}> */}

        {closeable && (
          <Button
            variant='outline'
            className={styles.modalClose}
            onClick={handleCloseClick}
            aria-label="Close modal"
            type="button"
            icon={<X size={20} />}
          />


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