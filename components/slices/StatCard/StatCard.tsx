"use client";

import React from "react";
import Text from "@/components/slices/Text/Text";
import { Loading } from "@/components/slices";
import styles from "./StatCard.module.scss";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  error,
  className = "",
}) => {
  return (
    <div className={`${styles.statCard} ${className}`}>
      {icon && <div className={styles.iconWrapper}>{icon}</div>}

      <div className={styles.content}>
        <Text variant="small" className={styles.title}>
          {title}
        </Text>

        {loading ? (
          <div className={styles.loadingWrapper}>
            <Loading type="svg" />
          </div>
        ) : error ? (
          <Text variant="small" color="error" className={styles.error}>
            خطأ
          </Text>
        ) : (
          <>
            <Text variant="h3" className={styles.value}>
              {value}
            </Text>
            {subtitle && (
              <Text variant="small" color="success" className={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;
