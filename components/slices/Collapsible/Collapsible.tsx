'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import styles from './Collapsible.module.scss';

interface CollapsibleProps {
  /** Title can be a string or ReactNode for custom headers */
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  /** Custom toggle icon - when provided, replaces Plus/Minus icons */
  toggleIcon?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'card' | 'compact';
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
  toggleIcon,
  variant = 'default',
  className,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <div className={`${styles.collapsible} ${styles[variant]} ${className || ''}`}>
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
      >
        <div className={styles.triggerContent}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        <span className={styles.toggleIcon}>
          {toggleIcon ?? (isOpen ? <Minus size={20} /> : <Plus size={20} />)}
        </span>
      </button>

      <div
        className={`${styles.content} ${isOpen ? styles.open : styles.closed}`}
        id="collapsible-content"
      >
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
};