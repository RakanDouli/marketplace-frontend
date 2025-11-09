'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
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
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'left',
  className = '',
  menuClassName = '',
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    if (!isOpen || !dropdownRef.current || !menuRef.current) return;

    const adjustPosition = () => {
      const dropdown = dropdownRef.current;
      const menu = menuRef.current;
      if (!dropdown || !menu) return;

      const dropdownRect = dropdown.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let horizontal: 'left' | 'right' = align;
      let vertical: 'bottom' | 'top' = 'bottom';

      // Set CSS variables for dynamic max-width calculation
      menu.style.setProperty('--dropdown-left', `${dropdownRect.left}px`);
      menu.style.setProperty('--dropdown-right', `${dropdownRect.right}px`);

      // Check horizontal overflow
      if (align === 'left' && dropdownRect.left + menuRect.width > viewportWidth) {
        // If menu overflows right, align to right instead
        horizontal = 'right';
      } else if (align === 'right' && dropdownRect.right - menuRect.width < 0) {
        // If menu overflows left, align to left instead
        horizontal = 'left';
      }

      // Check vertical overflow
      const spaceBelow = viewportHeight - dropdownRect.bottom;
      const spaceAbove = dropdownRect.top;

      if (spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
        // If not enough space below but more space above, show above
        vertical = 'top';
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
  }, [isOpen, align]);

  return (
    <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
      {trigger}
      {isOpen && (
        <div
          ref={menuRef}
          className={`${styles.menu} ${styles[position.horizontal]} ${styles[position.vertical]} ${menuClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
