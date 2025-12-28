'use client';

import React from 'react';
import Link from 'next/link';
import { Car, Home, Briefcase, Package } from 'lucide-react';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Grid, Text } from '@/components/slices';
import styles from './CategorySection.module.scss';

// Default icons for common categories (fallback until backend supports icons)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  cars: <Car size={32} />,
  car: <Car size={32} />,
  'real-estate': <Home size={32} />,
  realestate: <Home size={32} />,
  jobs: <Briefcase size={32} />,
  default: <Package size={32} />,
};

// Get icon for category (uses backend icon if available, otherwise fallback)
const getCategoryIcon = (category: { slug: string; icon?: string }) => {
  // TODO: When backend supports icons, render them here
  // if (category.icon) {
  //   return <Icon name={category.icon} size={32} />;
  // }

  // Fallback to predefined icons based on slug
  return CATEGORY_ICONS[category.slug] || CATEGORY_ICONS.default;
};

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
            {getCategoryIcon(category)}
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
