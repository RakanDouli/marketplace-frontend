import React from "react";
import { Skeleton } from "../Skeleton";
import styles from "./Text.module.scss";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "paragraph"
  | "small"
  | "xs"
  | "navlink";

export type TextColor = "primary" | "secondary" | "error" | "success" | "warning" | "info";

export interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  skeleton?: boolean;
  skeletonWidth?: string | number;
  [key: string]: any;
}

const variantToElement: Record<TextVariant, keyof JSX.IntrinsicElements> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  xs: "span",
  paragraph: "span",
  small: "span",
  navlink: "span",
};

const variantToHeight: Record<TextVariant, string> = {
  h1: "2.5rem",
  h2: "2rem",
  h3: "1.75rem",
  h4: "1.5rem",
  paragraph: "1.25rem",
  small: "1rem",
  xs: "0.875rem",
  navlink: "1rem",
};

export const Text: React.FC<TextProps> = ({
  variant = "paragraph",
  color,
  children,
  className = "",
  as,
  skeleton = false,
  skeletonWidth = "100%",
  ...props
}) => {
  if (skeleton) {
    return (
      <Skeleton
        width={skeletonWidth}
        height={variantToHeight[variant]}
        variant="text"
        className={className}
      />
    );
  }

  const Element = as || variantToElement[variant];
  const variantClass = styles[variant];
  const colorClass = color ? styles[color] : '';

  return (
    <Element className={`${variantClass} ${colorClass} ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
};

export default Text;
