"use client";

import React, { forwardRef, useState } from "react";
import Link from "next/link";
import { FiArrowLeftCircle } from "react-icons/fi";
import Loading from "../Loading/Loading";
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "outline" | "link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  /** Icon to display after text. If provided, arrow prop is ignored. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  /** Show arrow icon after text. Ignored if icon prop is provided. */
  arrow?: boolean;
  href?: string;
  margin?: boolean;
  target?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      children,
      arrow,
      target,
      href,
      margin = false,
      className = "",
      onMouseEnter,
      ...props
    },
    ref
  ) => {
    const [rippleCoords, setRippleCoords] = useState({ x: -1, y: -1 });
    const isDisabled = loading || disabled;
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setRippleCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      onMouseEnter?.(e);
    };

    // Determine which icon to show (icon prop takes priority over arrow)
    const showIcon = icon || (arrow && !icon ? <FiArrowLeftCircle size={18} /> : null);

    const buttonContent = (
      <>
        {/* Ripple effect - show for all variants except link */}
        {variant !== "link" && (
          <span
            className={`${styles.round} ${styles.ripple}`}
            style={{
              left: `${rippleCoords.x}px`,
              top: `${rippleCoords.y}px`,
            }}
          />
        )}

        {/* Loading state */}
        {loading ? (
          <div className={styles.loadingIcon}>
            <Loading />
          </div>
        ) : (
          <>
            {/* Text content */}
            {children && <span className={styles.title}>{children}</span>}

            {/* Icon (always after text, in same position) */}
            {showIcon && <span className={styles.icon}>{showIcon}</span>}
          </>
        )}
      </>
    );

    // If href provided, render as Link
    if (href && !isDisabled) {
      return (
        <Link
          target={target}
          href={href}
          className={`${styles.btn} ${children ? styles.btnPadding : ""} ${styles[`btn--${variant}`]
            } ${size !== "md" ? styles[`btn--${size}`] : ""} ${margin ? styles.withMargin : ""} ${className} ${loading ? styles.loading : ""}`}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setRippleCoords({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
        >
          {buttonContent}
        </Link>
      );
    }

    // Regular button
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${styles.btn} ${children ? styles.btnPadding : ""} ${styles[`btn--${variant}`]
          } ${size !== "md" ? styles[`btn--${size}`] : ""} ${margin ? styles.withMargin : ""} ${className} ${loading ? styles.loading : ""}`}
        onMouseEnter={handleMouseEnter}
        aria-label={
          loading ? "Loading..." : children ? String(children) : "Button"
        }
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
