import React from 'react';
import styles from './Spacer.module.scss';

export interface SpacerProps {
  /** Height of the spacer */
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'header';
  /** Custom height in px or rem */
  customHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  height = 'md',
  customHeight,
  className = '',
}) => {
  const spacerClasses = [
    styles.spacer,
    height && styles[height],
    className,
  ].filter(Boolean).join(' ');

  const style = customHeight ? { height: customHeight } : {};

  return <div className={spacerClasses} style={style} />;
};

export default Spacer;