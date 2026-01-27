import React from "react";
import Image from "next/image";
import styles from "./Container.module.scss";

type PaddingSize = "none" | "sm" | "md" | "lg" | "xl" | "xxl";
type BackgroundVariant = "transparent" | "bg" | "surface" | "primary" | "secondary";

export interface ContainerProps {
  children: React.ReactNode;
  /** Max-width of inner container */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Vertical padding (top/bottom) on inner container - default: "md" */
  paddingY?: PaddingSize;
  /** Horizontal padding (left/right) on outer container - default: "md" */
  paddingX?: PaddingSize;
  /** Vertical padding (top/bottom) on outer container - default: "none" */
  outerPaddingY?: PaddingSize;
  /** Inner container background variant (uses theme colors) */
  background?: BackgroundVariant;
  /** Outer (full-width) background variant (uses theme colors) */
  outerBackground?: BackgroundVariant;
  /** Custom inner background color (overrides background prop) */
  backgroundColor?: string;
  /** Custom outer background color (overrides outerBackground prop) */
  outerBackgroundColor?: string;
  /** Inner container background image URL */
  backgroundImage?: string;
  /** Outer container background image URL */
  outerBackgroundImage?: string;
  /** Dark overlay on background image */
  overlay?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inner container padding (all sides) */
  innerPadding?: PaddingSize;
  /** Inner container border (adds border + border-radius) */
  innerBorder?: boolean;
  /** Load background image with priority (for above-the-fold LCP images) */
  priorityImage?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  paddingY = "md",
  paddingX = "md",
  outerPaddingY = "none",
  background = "transparent",
  outerBackground = "transparent",
  backgroundColor,
  outerBackgroundColor,
  backgroundImage,
  outerBackgroundImage,
  overlay = false,
  className = "",
  innerPadding,
  innerBorder = false,
  priorityImage = false,
}) => {
  // Build class names
  const outerClasses = [
    styles.outerContainer,
    styles[`outerBg_${outerBackground}`],
    styles[`px_${paddingX}`],
    styles[`outerPy_${outerPaddingY}`],
    outerBackgroundImage && styles.hasBackgroundImage,
    className,
  ].filter(Boolean).join(" ");

  const innerClasses = [
    styles.innerContainer,
    styles[size],
    styles[`bg_${background}`],
    styles[`py_${paddingY}`],
    innerPadding && styles[`innerP_${innerPadding}`],
    innerBorder && styles.innerBorder,
    backgroundImage && styles.hasBackgroundImage,
  ].filter(Boolean).join(" ");

  // Custom inline styles (override CSS classes if provided)
  // Note: background images now use next/image component, not CSS
  const outerStyles: React.CSSProperties = {
    ...(outerBackgroundColor && { backgroundColor: outerBackgroundColor }),
  };

  const innerStyles: React.CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
  };

  // Determine if overlay should show on outer or inner
  const hasOuterOverlay = outerBackgroundImage && overlay;
  const hasInnerOverlay = backgroundImage && overlay;

  return (
    <section className={outerClasses} style={outerStyles}>
      {/* Outer background image using next/image for optimization */}
      {outerBackgroundImage && (
        <Image
          src={outerBackgroundImage}
          alt=""
          fill
          sizes="100vw"
          priority={priorityImage}
          fetchPriority={priorityImage ? "high" : undefined}
          className={styles.backgroundImage}
        />
      )}
      {hasOuterOverlay && <div className={styles.overlay} />}
      <div className={innerClasses} style={innerStyles}>
        {/* Inner background image using next/image for optimization */}
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt=""
            fill
            sizes="100vw"
            priority={priorityImage}
            fetchPriority={priorityImage ? "high" : undefined}
            className={styles.backgroundImage}
          />
        )}
        {hasInnerOverlay && <div className={styles.overlay} />}
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
};

export default Container;
