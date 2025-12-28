'use client';

import React from 'react';
import Link from 'next/link';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Grid, Text } from '@/components/slices';
import styles from './CategorySection.module.scss';

interface CategorySectionProps {
  title?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  title = 'تصفح حسب الفئة',
}) => {
  const { categories } = useCategoriesStore();

  // Get active categories only
  const activeCategories = categories.filter(cat => cat.isActive);

  // Don't render if no categories
  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <Grid
      title={title}
      columns={6}
      mobileColumns={2}
      gap="md"
      paddingY="lg"
      outerBackground="surface"
    >
      {activeCategories.map((category) => (
        <Link
          key={category.id}
          href={`/${category.slug}`}
          className={styles.categoryCard}
        >
          <div className={styles.iconWrapper}>
            {category.icon && (
              <div
                className={styles.svgIcon}
                dangerouslySetInnerHTML={{ __html: category.icon }}
              />
            )}
          </div>
          <Text variant="small" className={styles.categoryName}>
            {category.nameAr || category.name}
          </Text>
        </Link>
      ))}
    </Grid>
  );
};

export default CategorySection;
