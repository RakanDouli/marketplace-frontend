import React from "react";
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

export type TextColor = "primary" | "secondary" | "error" | "success" | "warning";

export interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
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

export const Text: React.FC<TextProps> = ({
  variant = "paragraph",
  color,
  children,
  className = "",
  as,
  ...props
}) => {
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
