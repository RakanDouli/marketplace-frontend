"use client";

import React from "react";
import styles from "./Grid.module.scss";

export interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  mobileColumns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 4,
  mobileColumns = 2,
  gap = "lg",
  className = "",
  style,
}) => {
  const mobileClass = styles[`mobile${mobileColumns}`] || "";

  return (
    <div
      className={`${styles.grid} ${styles[`cols${columns}`]} ${mobileClass} ${styles[`gap${gap}`]} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default Grid;
