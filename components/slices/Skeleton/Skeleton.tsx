import React from 'react';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  aspectRatio?: string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  borderRadius,
  aspectRatio,
  className = '',
  variant = 'rectangular',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    borderRadius: borderRadius ? (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius) : undefined,
    aspectRatio: aspectRatio,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

export default Skeleton;
