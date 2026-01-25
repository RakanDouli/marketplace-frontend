"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Key, ArrowRight } from "lucide-react";
import Container from "../../components/slices/Container/Container";
import { Text, MobileBackButton } from "../../components/slices";
import styles from "./CategoryPreloader.module.scss";

interface CategoryPreloaderClientProps {
  categorySlug: string;
  categoryName: string;
  categoryNameAr: string;
  categoryIcon?: string;
}

export default function CategoryPreloaderClient({
  categorySlug,
  categoryNameAr,
  categoryIcon,
}: CategoryPreloaderClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/categories");
  };

  return (
    <Container className={styles.preloaderPage}>
      <MobileBackButton onClick={handleBack} title={categoryNameAr} />

      <div className={styles.content}>
        {/* Category Icon */}
        {categoryIcon && (
          <div
            className={styles.categoryIcon}
            dangerouslySetInnerHTML={{ __html: categoryIcon }}
          />
        )}

        {/* Title */}
        <Text variant="h2" className={styles.title}>
          {categoryNameAr}
        </Text>

        <Text variant="paragraph" color="secondary" className={styles.subtitle}>
          اختر نوع الإعلانات التي تبحث عنها
        </Text>

        {/* Type Selection Cards */}
        <div className={styles.optionsGrid}>
          {/* For Sale Option */}
          <Link href={`/${categorySlug}/sell`} className={styles.optionCard}>
            <div className={styles.optionIcon}>
              <ShoppingBag size={48} />
            </div>
            <div className={styles.optionContent}>
              <Text variant="h3" className={styles.optionTitle}>
                للبيع
              </Text>
              <Text variant="small" color="secondary">
                تصفح إعلانات {categoryNameAr} المعروضة للبيع
              </Text>
            </div>
            <ArrowRight size={24} className={styles.arrow} />
          </Link>

          {/* For Rent Option */}
          <Link href={`/${categorySlug}/rent`} className={styles.optionCard}>
            <div className={styles.optionIcon}>
              <Key size={48} />
            </div>
            <div className={styles.optionContent}>
              <Text variant="h3" className={styles.optionTitle}>
                للإيجار
              </Text>
              <Text variant="small" color="secondary">
                تصفح إعلانات {categoryNameAr} المعروضة للإيجار
              </Text>
            </div>
            <ArrowRight size={24} className={styles.arrow} />
          </Link>
        </div>
      </div>
    </Container>
  );
}
