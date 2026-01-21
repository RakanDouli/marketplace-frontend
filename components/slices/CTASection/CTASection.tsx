"use client";

import React from "react";
import Link from "next/link";
import { Container, ContainerProps } from "../Container/Container";
import { Text } from "../Text/Text";
import { Button } from "../Button/Button";
import styles from "./CTASection.module.scss";

export interface CTAButton {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
  icon?: React.ReactNode;
  arrow?: boolean;
}

export interface CTASectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  buttons?: CTAButton[];
  variant?: "primary" | "secondary" | "gradient";
  align?: "left" | "center" | "right";
  paddingY?: ContainerProps["paddingY"];
  outerPaddingY?: ContainerProps["outerPaddingY"];
  className?: string;
}

// Map variant to Container background (inner)
const variantToBackground: Record<string, ContainerProps["background"]> = {
  primary: "surface",
  secondary: "surface",
  gradient: "primary",
};

export const CTASection: React.FC<CTASectionProps> = ({
  title,
  subtitle,
  description,
  buttons = [],
  variant = "primary",
  align = "center",
  paddingY = "xxl",
  outerPaddingY = "none",
  className = "",
}) => {
  const alignClass = styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`];

  return (
    <Container
      paddingY={paddingY}
      outerPaddingY={outerPaddingY}
      outerBackground="transparent"
      background={variantToBackground[variant]}
      innerPadding="lg"
      innerBorder={variant !== "gradient"}
      className={`${styles.cta} ${styles[variant]} ${alignClass} ${className}`}
    >
      <div className={styles.content}>
        {subtitle && (
          <Text variant="small" className={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        <Text variant="h1" className={styles.title}>
          {title}
        </Text>
        {description && (
          <Text variant="paragraph" className={styles.description}>
            {description}
          </Text>
        )}
        {buttons.length > 0 && (
          <div className={styles.buttons}>
            {buttons.map((button, index) => (
              <Link key={index} href={button.href}>
                <Button
                  variant={button.variant || (index === 0 ? "primary" : "outline")}
                  size="lg"
                  icon={button.icon}
                  arrow={button.arrow}
                >
                  {button.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default CTASection;
