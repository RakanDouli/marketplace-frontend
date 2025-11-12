"use client";

import React, { forwardRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Target } from "lucide-react";
import Loading from "../Loading/Loading";
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "outline" | "link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  arrow?: boolean | string;
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

    const buttonContent = (
      <>
        {/* Ripple effect */}
        {!href ||
          (variant !== "link" && (
            <span
              className={`${styles.round} ${styles.ripple}`}
              style={{
                left: `${rippleCoords.x}px`,
                top: `${rippleCoords.y}px`,
              }}
            />
          ))}

        {/* Loading state */}
        {loading ? (
          <div className={styles.loadingIcon}>
            <Loading />
          </div>
        ) : (
          <>
            {/* Content */}
            {children && (
              <span className={styles.title}>
                {children}
                {icon && <span className={styles.icon}>{icon}</span>}
              </span>
            )}

            {/* No content - just icon button */}
            {!children && icon && <span className={styles.icon}>{icon}</span>}

            {/* Arrow */}
            {arrow !== undefined && arrow !== false && (
              <div className={styles.arrow}>
                <ArrowRight className={styles.arrowRight} size={20} />
                <ArrowLeft className={styles.arrowLeft} size={20} />
              </div>
            )}
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
            } ${margin ? styles.withMargin : ""} ${className} ${loading ? styles.loading : ""}`}
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
          } ${margin ? styles.withMargin : ""} ${className} ${loading ? styles.loading : ""}`}
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
