import React from "react";
import styles from "./Container.module.scss";

type PaddingSize = "none" | "sm" | "md" | "lg" | "xl" | "xxl";
type BackgroundVariant = "transparent" | "bg" | "surface" | "primary" | "secondary";

export interface ContainerProps {
  children: React.ReactNode;
  /** Max-width of inner container */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Vertical padding (top/bottom) - default: "md" */
  paddingY?: PaddingSize;
  /** Horizontal padding (left/right) - default: "md" */
  paddingX?: PaddingSize;
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
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  paddingY = "md",
  paddingX = "md",
  background = "transparent",
  outerBackground = "transparent",
  backgroundColor,
  outerBackgroundColor,
  backgroundImage,
  outerBackgroundImage,
  overlay = false,
  className = "",
}) => {
  // Build class names
  const outerClasses = [
    styles.outerContainer,
    styles[`outerBg_${outerBackground}`],
    styles[`px_${paddingX}`],
    className,
  ].filter(Boolean).join(" ");

  const innerClasses = [
    styles.innerContainer,
    styles[size],
    styles[`bg_${background}`],
    styles[`py_${paddingY}`],
  ].filter(Boolean).join(" ");

  // Custom inline styles (override CSS classes if provided)
  const outerStyles: React.CSSProperties = {
    ...(outerBackgroundColor && { backgroundColor: outerBackgroundColor }),
    ...(outerBackgroundImage && { backgroundImage: `url(${outerBackgroundImage})` }),
  };

  const innerStyles: React.CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
    ...(backgroundImage && { backgroundImage: `url(${backgroundImage})` }),
  };

  return (
    <section className={outerClasses} style={outerStyles}>
      <div className={innerClasses} style={innerStyles}>
        {backgroundImage && overlay && <div className={styles.overlay} />}
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
};

export default Container;
