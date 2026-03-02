import Link from 'next/link';
import { SearchBarSection } from '@/components/SearchBarSection';
import { Container, Grid } from '@/components/slices';
import { Car, Home, Smartphone, Sofa, Shirt, Briefcase, Package } from 'lucide-react';
import { Category } from '@/types/listing';
import { ListingType } from '@/common/enums';
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

// GraphQL query for categories
const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      icon
      supportedListingTypes
      isCollection
      parentCollectionId
    }
  }
`;

// Server-side fetch for categories
async function fetchCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CATEGORIES_QUERY,
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return [];
    }

    return (data.data?.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr || cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
      icon: cat.icon,
      supportedListingTypes: (cat.supportedListingTypes || [ListingType.SALE]) as ListingType[],
      isCollection: cat.isCollection || false,
      parentCollectionId: cat.parentCollectionId || null,
      level: 0,
      createdAt: '',
      updatedAt: '',
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

function renderIcon(category: Category) {
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
}

// Server Component - fetches categories server-side
export default async function CategoriesPage() {
  const categories = await fetchCategories();

  // Filter active categories, excluding child categories of collections
  // Show: standalone categories + collection parents (not their children)
  const activeCategories = categories.filter(cat => cat.isActive && !cat.parentCollectionId);

  return (
    <main className={styles.categoriesPage}>
      {/* Sticky Search Bar Wrapper */}
      <div className={styles.fixedSearchWrapper}>
        <SearchBarSection />
      </div>

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
