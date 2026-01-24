'use client';

import Link from 'next/link';
import { HomeSearchBar } from '@/components/HomeSearchBar';
import { Container, Grid } from '@/components/slices';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Car, Home, Smartphone, Sofa, Shirt, Briefcase, Package } from 'lucide-react';
import styles from './Categories.module.scss';

// Fallback icons for categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'cars': <Car size={32} />,
  'real-estate': <Home size={32} />,
  'electronics': <Smartphone size={32} />,
  'furniture': <Sofa size={32} />,
  'fashion': <Shirt size={32} />,
  'jobs': <Briefcase size={32} />,
};

export default function CategoriesPage() {
  const { categories } = useCategoriesStore();
  const activeCategories = categories.filter(cat => cat.isActive);

  const renderIcon = (category: typeof activeCategories[0]) => {
    // If category has custom SVG icon, render it
    if (category.icon) {
      return (
        <span
          className={styles.categoryIcon}
          dangerouslySetInnerHTML={{ __html: category.icon }}
        />
      );
    }

    // Fallback to predefined icons
    const fallbackIcon = CATEGORY_ICONS[category.slug];
    if (fallbackIcon) {
      return <span className={styles.categoryIcon}>{fallbackIcon}</span>;
    }

    // Default icon
    return <span className={styles.categoryIcon}><Package size={32} /></span>;
  };

  return (
    <main className={styles.categoriesPage}>
      {/* Search Bar */}
      <HomeSearchBar />

      {/* Categories Grid */}
      <Container paddingY="lg">
        <h1 className={styles.title}>تصفح الأقسام</h1>

        <Grid columns={6} mobileColumns={2} gap="md">
          {activeCategories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className={styles.categoryCard}
            >
              {renderIcon(category)}
              <span className={styles.categoryName}>
                {category.nameAr || category.name}
              </span>
            </Link>
          ))}
        </Grid>
      </Container>
    </main>
  );
}
