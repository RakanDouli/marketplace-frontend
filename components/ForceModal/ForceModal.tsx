"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForceModalStore } from '@/stores/forceModalStore';
import { Text } from '@/components/slices';
import styles from './ForceModal.module.scss';

/**
 * ForceModal - A non-closeable modal for required actions
 *
 * Cannot be closed by:
 * - ESC key
 * - Background click
 * - X button (no X button rendered)
 *
 * Use this for:
 * - INACTIVE user reactivation
 * - Required authentication
 * - Payment required
 * - Email verification required
 */
export const ForceModal: React.FC = () => {
  const { isVisible, content, title, maxWidth } = useForceModalStore();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const modalContent = (
    <div
      className={styles.modalBg}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "force-modal-title" : undefined}
    >
      <div
        className={`
          ${styles.modal}
          ${styles[maxWidth || 'md']}
        `.trim()}
      >
        {/* No close button - this is a forced modal */}

        {/* Modal Content */}
        <div className={styles.modalContent}>
          {title && (
            <Text variant="h2" id="force-modal-title" className={styles.modalTitle}>
              {title}
            </Text>
          )}
          {content}
        </div>
      </div>
    </div>
  );

  // Render modal at document body level using portal
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};

export default ForceModal;
