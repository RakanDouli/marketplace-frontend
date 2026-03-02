import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CATEGORIES_QUERY } from "../../stores/filtersStore/filtersStore.gql";
import { listingTypeToUrlSegment } from "../../utils/categoryRouting";
import { ListingType } from "../../common/enums";
import CategoryPreloaderClient from "./CategoryPreloaderClient";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

interface CategoryData {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
  isActive?: boolean;
  supportedListingTypes?: string[];
  isCollection?: boolean;
  parentCollectionId?: string | null;
}

// Fetch all categories and return the target category + child categories if collection
async function fetchCategoryData(categorySlug: string): Promise<{
  category: CategoryData | null;
  childCategories: CategoryData[];
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: CATEGORIES_QUERY }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    const data = await response.json();
    const categories: CategoryData[] = data.data?.categories || [];
    const category = categories.find((cat) => cat.slug === categorySlug) || null;

    // If this is a collection, get its child categories
    let childCategories: CategoryData[] = [];
    if (category?.isCollection) {
      childCategories = categories.filter(
        (cat) => cat.parentCollectionId === category.id && cat.isActive
      );
    }

    return { category, childCategories };
  } catch (error) {
    console.error("Error fetching category:", error);
    return { category: null, childCategories: [] };
  }
}

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const { category: categoryData } = await fetchCategoryData(category);

  if (!categoryData) {
    return {
      title: "الفئة غير موجودة | شام باي",
    };
  }

  // If this is a collection, show collection metadata
  if (categoryData.isCollection) {
    const title = `${categoryData.nameAr} | شام باي`;
    const description = `تصفح أقسام ${categoryData.nameAr} في سوريا.`;
    return {
      title,
      description,
      openGraph: { title, description, type: "website", locale: "ar_SY" },
      twitter: { card: "summary", title, description },
      alternates: { canonical: `https://shambay.com/${category}` },
    };
  }

  // DB stores lowercase ('sale', 'rent'), fallback to lowercase for consistency
  const types = categoryData.supportedListingTypes || ['sale'];

  // If only one type, this page will redirect - still provide metadata for crawlers
  if (types.length === 1) {
    // Compare case-insensitively (DB has lowercase, enum has uppercase)
    const typeLabel = types[0].toUpperCase() === ListingType.SALE ? "للبيع" : "للإيجار";
    return {
      title: `${categoryData.nameAr} ${typeLabel} في سوريا | شام باي`,
      description: `تصفح أحدث إعلانات ${categoryData.nameAr} ${typeLabel} في سوريا.`,
    };
  }

  // Pre-loader page metadata
  const title = `${categoryData.nameAr} للبيع والإيجار في سوريا | شام باي`;
  const description = `اختر نوع الإعلان الذي تبحث عنه: ${categoryData.nameAr} للبيع أو ${categoryData.nameAr} للإيجار في سوريا.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ar_SY",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `https://shambay.com/${category}`,
    },
  };
}

// Server Component - handles routing logic
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  // Fetch category data and child categories
  const { category: categoryData, childCategories } = await fetchCategoryData(category);

  // If category doesn't exist, show 404 page
  if (!categoryData) {
    notFound();
  }

  // If this is a collection, show child categories selector
  if (categoryData.isCollection) {
    return (
      <CategoryPreloaderClient
        categorySlug={category}
        categoryName={categoryData.name}
        categoryNameAr={categoryData.nameAr}
        categoryIcon={categoryData.icon}
        isCollection={true}
        childCategories={childCategories}
      />
    );
  }

  // DB stores lowercase ('sale', 'rent'), fallback to lowercase for consistency
  const types = categoryData.supportedListingTypes || ['sale'];

  // If category supports only one type, redirect to that type's listings page
  if (types.length === 1) {
    const typeSlug = listingTypeToUrlSegment(types[0]);
    redirect(`/${category}/${typeSlug}`);
  }

  // Category supports both types - show pre-loader UI (sell/rent selector)
  return (
    <CategoryPreloaderClient
      categorySlug={category}
      categoryName={categoryData.name}
      categoryNameAr={categoryData.nameAr}
      categoryIcon={categoryData.icon}
      isCollection={false}
    />
  );
}
