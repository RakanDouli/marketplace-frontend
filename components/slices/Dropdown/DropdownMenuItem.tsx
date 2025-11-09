'use client';

import React, { ReactNode } from 'react';
import { Text } from '../Text/Text';
import styles from './DropdownMenuItem.module.scss';

export interface DropdownMenuItemProps {
  /** Icon to display before the label */
  icon?: ReactNode;
  /** Label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Variant for styling */
  variant?: 'default' | 'danger';
  /** Disabled state */
  disabled?: boolean;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}) => {
  return (
    <button
      className={`${styles.menuItem} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <Text variant="paragraph">{label}</Text>
    </button>
  );
};

export default DropdownMenuItem;
