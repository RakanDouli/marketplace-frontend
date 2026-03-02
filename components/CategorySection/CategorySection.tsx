'use client';

import React from 'react';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Container, Text, CategoryCard } from '@/components/slices';
import { CMS_ASSETS } from '@/constants/cms-assets';
import { Category } from '@/types/listing';
import styles from './CategorySection.module.scss';

// Coming soon categories (by slug) - can be moved to backend later
// Note: Categories that need brands/models synced via admin panel will show "coming soon"
// until their data is populated
const COMING_SOON_CATEGORIES: string[] = [];

interface CategorySectionProps {
  /** Categories passed from server-side fetch (instant display) */
  categories?: Category[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ categories: serverCategories }) => {
  // Use server-side categories if provided, otherwise fall back to store (for other pages)
  const storeCategories = useCategoriesStore((state) => state.categories);
  const categories = serverCategories && serverCategories.length > 0 ? serverCategories : storeCategories;

  // Get active categories only, excluding child categories of collections
  // Show: standalone categories + collection parents (not their children)
  const activeCategories = categories.filter(cat =>
    cat.isActive && !cat.parentCollectionId
  );

  // Count visible cards on mobile (excludes coming soon)
  const mobileVisibleCount = activeCategories.filter(
    cat => !COMING_SOON_CATEGORIES.includes(cat.slug)
  ).length;

  // Desktop grid class (based on all active categories, max 4 columns)
  const getDesktopGridClass = () => {
    const count = activeCategories.length;
    if (count <= 2) return styles.grid2;
    if (count === 3) return styles.grid3;
    return styles.grid4; // 4+ = 4 columns max
  };

  // Mobile grid class (based on visible cards only)
  const getMobileGridClass = () => {
    if (mobileVisibleCount <= 1) return styles.mobileGrid1;
    if (mobileVisibleCount === 2) return styles.mobileGrid2;
    return styles.mobileGrid3; // 3+ = 3 columns max
  };

  return (
    <div className={styles.heroSection}>
      {/* Hero Background with Overlay - Desktop only */}
      <Container
        outerBackgroundImage={CMS_ASSETS.home.searchBar.background}
        overlay
        paddingY="xl"
        size="lg"
        className={styles.heroContainer}
        priorityImage
      >
        <div className={styles.heroContent}>
          <Text variant="h1" className={styles.heroTitle}>
            مرحباً بكم في شام باي
          </Text>
          <Text variant="paragraph" className={styles.heroSubtitle}>
            منصتك الأولى للبيع والشراء في سوريا
          </Text>
        </div>
      </Container>

      {/* Category Cards */}
      {activeCategories.length > 0 && (
        <div className={styles.cardsWrapper}>
          <Container paddingY="none" size="lg">
            <div className={`${styles.cardsGrid} ${getDesktopGridClass()} ${getMobileGridClass()}`}>
              {activeCategories.map((category) => {
                const isComingSoon = COMING_SOON_CATEGORIES.includes(category.slug);

                return (
                  <CategoryCard
                    key={category.id}
                    href={`/${category.slug}`}
                    nameAr={category.nameAr}
                    name={category.name}
                    icon={category.icon}
                    comingSoon={isComingSoon}
                  />
                );
              })}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
};

export default CategorySection;
