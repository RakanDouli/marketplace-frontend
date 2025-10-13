"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Aside.module.scss";

export interface AsideProps {
  children: React.ReactNode;
  isOpen?: boolean;
  position?: "left" | "right";
  className?: string;
  onClose?: () => void;
  fullHeight?: boolean; // No header offset (for dashboard)
}

export const Aside: React.FC<AsideProps> = ({
  children,
  isOpen = true,
  position = "left",
  className = "",
  onClose,
  fullHeight = false,
}) => {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose && isOpen) {
        onClose();
      }
    };

    if (isOpen && onClose) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when aside is open on mobile
      if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const asideContent = (
    <>
      {/* Overlay for mobile when aside is open */}
      {isOpen && onClose && (
        <div
          className={styles.overlay}
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && onClose) {
              onClose();
            }
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Aside panel */}
      <aside
        className={`
          ${styles.aside}
          ${styles[position]}
          ${isOpen ? styles.open : ''}
          ${fullHeight ? styles.fullHeight : ''}
          ${className}
        `.trim()}
      >
        {/* Fixed close button - only on mobile */}
        {onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={24} />
          </button>
        )}

        <div className={styles.content}>{children}</div>
      </aside>
    </>
  );

  // Use portal on mobile to escape stacking context
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;

  if (!mounted) {
    // Server-side render without portal
    return asideContent;
  }

  // Client-side: use portal on mobile, normal render on desktop
  return isMobile && onClose ? createPortal(asideContent, document.body) : asideContent;
};

export default Aside;
