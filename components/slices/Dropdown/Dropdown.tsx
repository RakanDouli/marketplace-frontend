'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dropdown.module.scss';

export interface DropdownProps {
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Function to close the dropdown */
  onClose: () => void;
  /** The trigger button/element */
  trigger: ReactNode;
  /** The dropdown content */
  children: ReactNode;
  /** Alignment of the dropdown menu */
  align?: 'left' | 'right';
  /** Custom className for the dropdown container */
  className?: string;
  /** Custom className for the menu */
  menuClassName?: string;
  /** Render menu in a portal (useful when parent has opacity < 1) */
  usePortal?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'left',
  className = '',
  menuClassName = '',
  usePortal = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    horizontal: 'left' | 'right';
    vertical: 'bottom' | 'top';
  }>({
    horizontal: align,
    vertical: 'bottom',
  });
  const [portalPosition, setPortalPosition] = useState<{
    top: number;
    left: number;
    right: number;
  }>({ top: 0, left: 0, right: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);

      if (isOutsideDropdown && isOutsideMenu) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Smart positioning: adjust dropdown position to stay in viewport
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const adjustPosition = () => {
      const dropdown = dropdownRef.current;
      const menu = menuRef.current;
      if (!dropdown) return;

      const dropdownRect = dropdown.getBoundingClientRect();
      const menuRect = menu?.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let horizontal: 'left' | 'right' = align;
      let vertical: 'bottom' | 'top' = 'bottom';

      // For portal mode, calculate absolute position
      if (usePortal) {
        setPortalPosition({
          top: dropdownRect.bottom + 4, // 4px gap
          left: dropdownRect.left,
          right: viewportWidth - dropdownRect.right,
        });
      }

      // Set CSS variables for dynamic max-width calculation
      if (menu) {
        menu.style.setProperty('--dropdown-left', `${dropdownRect.left}px`);
        menu.style.setProperty('--dropdown-right', `${dropdownRect.right}px`);
      }

      // Check horizontal overflow
      const menuWidth = menuRect?.width || 200;
      if (align === 'left' && dropdownRect.left + menuWidth > viewportWidth) {
        horizontal = 'right';
      } else if (align === 'right' && dropdownRect.right - menuWidth < 0) {
        horizontal = 'left';
      }

      // Check vertical overflow
      const isMobile = viewportWidth < 768;
      const bottomOffset = isMobile ? 80 : 0;
      const spaceBelow = viewportHeight - dropdownRect.bottom - bottomOffset;
      const spaceAbove = dropdownRect.top;
      const menuHeight = menuRect?.height || 150;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        vertical = 'top';
        if (usePortal) {
          setPortalPosition(prev => ({
            ...prev,
            top: dropdownRect.top - (menuRect?.height || 150) - 4,
          }));
        }
      }

      setPosition({ horizontal, vertical });
    };

    // Adjust on open
    adjustPosition();

    // Adjust on scroll/resize
    window.addEventListener('scroll', adjustPosition, true);
    window.addEventListener('resize', adjustPosition);

    return () => {
      window.removeEventListener('scroll', adjustPosition, true);
      window.removeEventListener('resize', adjustPosition);
    };
  }, [isOpen, align, usePortal]);

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className={`${styles.menu} ${styles[position.horizontal]} ${styles[position.vertical]} ${usePortal ? styles.portal : ''} ${menuClassName}`}
      style={usePortal ? {
        position: 'fixed',
        top: portalPosition.top,
        ...(position.horizontal === 'right'
          ? { right: portalPosition.right }
          : { left: portalPosition.left }
        ),
      } : undefined}
    >
      {children}
    </div>
  );

  return (
    <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
      {trigger}
      {usePortal && typeof document !== 'undefined'
        ? createPortal(menuContent, document.body)
        : menuContent
      }
    </div>
  );
};

export default Dropdown;
