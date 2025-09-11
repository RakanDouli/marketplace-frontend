import React from "react";
import styles from "./Container.module.scss";

export interface ContainerProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  backgroundImage?: string;
  outerBackgroundImage?: string;
  backgroundColor?: string;
  outerBackgroundColor?: string;
  padding?: boolean;
  overlay?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  backgroundImage,
  outerBackgroundImage,
  backgroundColor,
  outerBackgroundColor = "transparent",
  padding = true,
  overlay = false,
  className = "",
}) => {
  const outerStyles = {
    backgroundColor: outerBackgroundColor,
    backgroundImage: outerBackgroundImage
      ? `url(${outerBackgroundImage})`
      : undefined,
  };

  const innerStyles = {
    backgroundColor: backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
  };

  return (
    <div
      className={`${styles.outerContainer} ${className}`.trim()}
      style={outerStyles}
    >
      <div
        className={`${styles.innerContainer} ${styles[size]} ${
          !padding ? styles.noPadding : ""
        }`}
        style={innerStyles}
      >
        {backgroundImage && overlay && <div className={styles.overlay} />}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Container;
