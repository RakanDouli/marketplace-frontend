'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import styles from './CollapsibleSection.module.scss';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  badge?: string | number;
  actions?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  onToggle,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  badge,
  actions
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (disabled) return;

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const sectionClasses = [
    styles.collapsibleSection,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  const headerClasses = [
    styles.header,
    isExpanded ? styles.expanded : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses}>
      <div
        className={headerClasses}
        onClick={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isExpanded}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className={styles.headerContent}>
          <div className={styles.chevron}>
            {isExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </div>

          <div className={styles.titleSection}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && (
              <p className={styles.subtitle}>{subtitle}</p>
            )}
          </div>

          {badge && (
            <div className={styles.badge}>
              {badge}
            </div>
          )}
        </div>

        {actions && (
          <div
            className={styles.actions}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>

      <div
        className={`${styles.content} ${isExpanded ? styles.expanded : styles.collapsed}`}
        aria-hidden={!isExpanded}
      >
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
};