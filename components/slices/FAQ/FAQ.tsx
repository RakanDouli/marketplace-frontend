"use client";

import React from "react";
import { Container, ContainerProps } from "../Container/Container";
import { Text } from "../Text/Text";
import { Collapsible } from "../Collapsible/Collapsible";
import styles from "./FAQ.module.scss";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  items: FAQItem[];
  title?: string;
  // Container props
  paddingY?: ContainerProps["paddingY"];
  background?: ContainerProps["background"];
  outerBackground?: ContainerProps["outerBackground"];
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({
  items,
  title,
  paddingY = "xl",
  background = "transparent",
  outerBackground = "transparent",
  className = "",
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Container
      paddingY={paddingY}
      background={background}
      outerBackground={outerBackground}
      className={className}
    >
      {title && (
        <Text variant="h2" className={styles.title}>
          {title}
        </Text>
      )}

      <div className={styles.list}>
        {items.map((item, index) => (
          <Collapsible key={index} title={item.question} variant="accent">
            <Text variant="paragraph" color="secondary">
              {item.answer}
            </Text>
          </Collapsible>
        ))}
      </div>
    </Container>
  );
};

export default FAQ;
