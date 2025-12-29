"use client";

import React from "react";
import { Text } from "../Text/Text";
import styles from "./FeatureCard.module.scss";

export interface FeatureCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: "default" | "card" | "icon-row" | "minimal";
  color?: "bg" | "surface" | "primary" | "accent";
  children?: React.ReactNode;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  variant = "default",
  color,
  children,
  className = "",
}) => {
  const colorClass = color ? styles[`color-${color}`] : "";

  return (
    <div className={`${styles.feature} ${styles[variant]} ${colorClass} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        {title && <Text variant="h4">{title}</Text>}
        {description && (
          <Text variant="small" color="secondary">
            {description}
          </Text>
        )}
        {children}
      </div>
    </div>
  );
};

export default FeatureCard;
