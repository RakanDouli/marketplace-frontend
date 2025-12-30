'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from '../Text/Text';
import styles from './CollapsibleSection.module.scss';

interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Whether this section is currently expanded */
  isExpanded?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Callback when section is toggled */
  onToggle?: (expanded: boolean) => void;
  /** Children content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  children,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled or internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newState = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newState);
    }
    onToggle?.(newState);
  };

  return (
    <div className={`${styles.section} ${isExpanded ? styles.expanded : ''} ${className}`}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <Text variant="h4" className={styles.title}>
          {title}
        </Text>
        <ChevronDown
          size={20}
          className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}
        />
      </button>

      <div className={`${styles.content} ${isExpanded ? styles.open : ''}`}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
