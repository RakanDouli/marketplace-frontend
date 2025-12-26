"use client";

import React from "react";
import { Container, ContainerProps } from "../Container/Container";
import { Text } from "../Text/Text";
import styles from "./Grid.module.scss";

export interface GridProps {
  children: React.ReactNode;
  // Header (when used as section)
  title?: string;
  action?: React.ReactNode;
  // Grid settings
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  mobileColumns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg" | "xl";
  // Container props (only used when title is provided)
  paddingY?: ContainerProps["paddingY"];
  background?: ContainerProps["background"];
  outerBackground?: ContainerProps["outerBackground"];
  className?: string;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({
  children,
  // Header
  title,
  action,
  // Grid settings
  columns = 4,
  mobileColumns = 2,
  gap = "lg",
  // Container props
  paddingY = "xl",
  background = "transparent",
  outerBackground = "transparent",
  className = "",
  style,
}) => {
  const mobileClass = styles[`mobile${mobileColumns}`] || "";

  const gridElement = (
    <div
      className={`${styles.grid} ${styles[`cols${columns}`]} ${mobileClass} ${styles[`gap${gap}`]} ${!title && !action ? className : ''}`}
      style={style}
    >
      {children}
    </div>
  );

  // If title or action is provided, wrap in Container with header
  if (title || action) {
    return (
      <Container
        paddingY={paddingY}
        background={background}
        outerBackground={outerBackground}
        className={className}
      >
        <div className={styles.header}>
          {title && <Text variant="h3">{title}</Text>}
          {action}
        </div>
        {gridElement}
      </Container>
    );
  }

  // Otherwise, just return the grid
  return gridElement;
};

export default Grid;
