"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Key, ArrowRight } from "lucide-react";
import Container from "../../components/slices/Container/Container";
import { Text, MobileBackButton } from "../../components/slices";
import styles from "./CategoryPreloader.module.scss";

interface ChildCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
}

interface CategoryPreloaderClientProps {
  categorySlug: string;
  categoryName: string;
  categoryNameAr: string;
  categoryIcon?: string;
  isCollection?: boolean;
  childCategories?: ChildCategory[];
}

export default function CategoryPreloaderClient({
  categorySlug,
  categoryNameAr,
  categoryIcon,
  isCollection = false,
  childCategories = [],
}: CategoryPreloaderClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    router.push("/");
  };

  // Preserve search params when navigating
  const getHrefWithParams = (path: string) => {
    const params = searchParams.toString();
    return params ? `${path}?${params}` : path;
  };

  // If this is a collection, show child categories
  if (isCollection) {
    return (
      <Container className={styles.preloaderPage}>
        <MobileBackButton onClick={handleBack} title={categoryNameAr} />

        <div className={styles.content}>
          {/* Collection Icon */}
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
            اختر القسم الذي تبحث عنه
          </Text>

          {/* Child Categories Grid */}
          <div className={styles.optionsGrid}>
            {childCategories.map((child) => (
              <Link
                key={child.id}
                href={getHrefWithParams(`/${child.slug}`)}
                className={styles.optionCard}
              >
                {child.icon ? (
                  <div
                    className={styles.optionIcon}
                    dangerouslySetInnerHTML={{ __html: child.icon }}
                  />
                ) : (
                  <div className={styles.optionIcon}>
                    <ShoppingBag size={48} />
                  </div>
                )}
                <div className={styles.optionContent}>
                  <Text variant="h3" className={styles.optionTitle}>
                    {child.nameAr || child.name}
                  </Text>
                </div>
                <ArrowRight size={24} className={styles.arrow} />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  // Normal flow: show sell/rent selector
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
          <Link href={getHrefWithParams(`/${categorySlug}/sell`)} className={styles.optionCard}>
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
          <Link href={getHrefWithParams(`/${categorySlug}/rent`)} className={styles.optionCard}>
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
