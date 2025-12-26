import React from "react";
import { Container, ContainerProps } from "../Container/Container";
import { Text } from "@/components/slices";
import { Image } from "@/components/slices";
import styles from "./TextSection.module.scss";

export interface TextSectionProps {
  // Text content - only rendered if provided
  title?: string;
  subtitle?: string;
  body?: string;
  small?: string;

  // Layout options
  align?: "start" | "center" | "end";
  flex?: "row" | "row-reverse" | "column" | "column-reverse";
  nostyle?: boolean;

  // Image
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;

  // Container props passthrough
  paddingY?: ContainerProps["paddingY"];
  paddingX?: ContainerProps["paddingX"];
  background?: ContainerProps["background"];
  outerBackground?: ContainerProps["outerBackground"];
  backgroundImage?: string;
  backgroundColor?: string;

  // Additional content via children
  children?: React.ReactNode;

  className?: string;
}

export const TextSection: React.FC<TextSectionProps> = ({
  title,
  subtitle,
  body,
  small,
  align = "start",
  flex = "",
  nostyle = false,
  imageUrl,
  imageAlt = "",
  imageWidth = 600,
  imageHeight = 400,
  paddingY = "lg",
  paddingX = "md",
  background = "transparent",
  outerBackground = "transparent",
  backgroundImage,
  backgroundColor,
  children,
  className = "",
}) => {
  return (
    <Container
      paddingY={paddingY}
      paddingX={paddingX}
      background={background}
      outerBackground={outerBackground}
      backgroundImage={backgroundImage}
      backgroundColor={backgroundColor}
    >
      <div
        className={`
          ${styles.textSection}
          ${flex ? styles[`flex_${flex}`] : ""}
          ${nostyle ? "" : styles.textSectionBg}
          ${className}
        `.trim()}
      >
        <div className={`${styles.content} ${styles[`align_${align}`]}`}>
          {/* Only render text elements if content is provided */}
          {title && <Text variant="h2">{title}</Text>}
          {subtitle && <Text variant="h4">{subtitle}</Text>}
          {body && <Text variant="paragraph">{body}</Text>}
          {small && <Text variant="small">{small}</Text>}

          {/* Custom children content */}
          {children}
        </div>

        {/* Image container - only if imageUrl provided */}
        {imageUrl && (
          <div className={styles.imgContainer}>
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className={styles.image}
            />
          </div>
        )}
      </div>
    </Container>
  );
};

export default TextSection;
