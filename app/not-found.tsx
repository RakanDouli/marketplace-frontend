"use client";

import React from "react";
import Link from "next/link";
import Container from "../components/slices/Container/Container";
import Text from "../components/slices/Text/Text";
import Button from "../components/slices/Button/Button";
import { useTranslation } from "../hooks/useTranslation";
import styles from "./not-found.module.scss";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className={styles.notFound}>
      <Container size="lg">
        <div className={styles.content}>
          <div className={styles.errorCode}>
            <Text variant="h1" className={styles.errorCodeText}>
              404
            </Text>
          </div>

          <div className={styles.message}>
            <Text variant="h1" className={styles.title}>
              {t("errors.notFound.title")}
            </Text>
            <Text variant="paragraph" className={styles.description}>
              {t("errors.notFound.description")}
            </Text>
          </div>

          <div className={styles.actions}>
            <Link href="/">
              <Button variant="primary" size="lg">
                {t("errors.notFound.goHome")}
              </Button>
            </Link>
            <Link href="/car">
              <Button variant="outline" size="lg">
                {t("errors.notFound.viewListings")}
              </Button>
            </Link>
          </div>

          <div className={styles.suggestions}>
            <Text variant="small" className={styles.suggestionsTitle}>
              {t("errors.notFound.suggestions.title")}
            </Text>
            <ul className={styles.suggestionsList}>
              <li>
                <Link href="/car" className={styles.suggestionLink}>
                  {t("errors.notFound.suggestions.browseListings")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={styles.suggestionLink}>
                  {t("errors.notFound.suggestions.dashboard")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={styles.suggestionLink}>
                  {t("errors.notFound.suggestions.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </main>
  );
}
