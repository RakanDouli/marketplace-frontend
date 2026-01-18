"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Aside.module.scss";
import Button from "../Button";

export interface AsideProps {
  children: React.ReactNode;
  isOpen?: boolean;
  position?: "left" | "right";
  className?: string;
  onClose?: () => void;
  fullHeight?: boolean; // No header offset (for dashboard)
  /** Custom header content (renders next to close button on mobile) */
  header?: React.ReactNode;
}

const ANIMATION_DURATION = 300; // ms - match CSS animation duration

export const Aside: React.FC<AsideProps> = ({
  children,
  isOpen = true,
  position = "left",
  className = "",
  onClose,
  fullHeight = false,
  header,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle open/close with animation (same pattern as Modal)
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, shouldRender]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose && isOpen) {
        onClose();
      }
    };

    if (shouldRender && !isClosing && onClose) {
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
  }, [shouldRender, isClosing, isOpen, onClose]);

  // Use portal on mobile to escape stacking context
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;

  // For desktop, always render (no animation needed)
  // For mobile with onClose, use shouldRender to control mounting
  const shouldShow = isMobile && onClose ? shouldRender : true;

  const asideContent = (
    <>
      {/* Overlay for mobile when aside is open */}
      {shouldShow && onClose && (
        <div
          className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}
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
          ${(isMobile && onClose) ? (shouldRender && !isClosing ? styles.open : '') : (isOpen ? styles.open : '')}
          ${isClosing ? styles.closing : ''}
          ${fullHeight ? styles.fullHeight : ''}
          ${className}
        `.trim()}
      >
        {/* Fixed close button + header - only on mobile */}
        {onClose && (
          <div className={styles.mobileHeader}>
            <Button
              variant="outline"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="إغلاق"
              icon={<X size={24} />}
            />

            {header && <div className={styles.headerContent}>{header}</div>}
          </div>
        )}

        <div className={styles.content}>{children}</div>
      </aside>
    </>
  );

  if (!mounted) {
    // Server-side render without portal
    return asideContent;
  }

  // Client-side: use portal on mobile, normal render on desktop
  if (isMobile && onClose) {
    return shouldShow ? createPortal(asideContent, document.body) : null;
  }

  return asideContent;
};

export default Aside;
