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
  supportedListingTypes?: string[];
}

// Fetch category metadata including supportedListingTypes
async function fetchCategoryData(categorySlug: string): Promise<CategoryData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: CATEGORIES_QUERY }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    const data = await response.json();
    const categories = data.data?.categories || [];
    return categories.find((cat: CategoryData) => cat.slug === categorySlug) || null;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await fetchCategoryData(category);

  if (!categoryData) {
    return {
      title: "الفئة غير موجودة | السوق السوري",
    };
  }

  // DB stores lowercase ('sale', 'rent'), fallback to lowercase for consistency
  const types = categoryData.supportedListingTypes || ['sale'];

  // If only one type, this page will redirect - still provide metadata for crawlers
  if (types.length === 1) {
    // Compare case-insensitively (DB has lowercase, enum has uppercase)
    const typeLabel = types[0].toUpperCase() === ListingType.SALE ? "للبيع" : "للإيجار";
    return {
      title: `${categoryData.nameAr} ${typeLabel} في سوريا | السوق السوري`,
      description: `تصفح أحدث إعلانات ${categoryData.nameAr} ${typeLabel} في سوريا.`,
    };
  }

  // Pre-loader page metadata
  const title = `${categoryData.nameAr} للبيع والإيجار في سوريا | السوق السوري`;
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

  // Fetch category data
  const categoryData = await fetchCategoryData(category);

  // If category doesn't exist, show 404 page
  if (!categoryData) {
    notFound();
  }

  // DB stores lowercase ('sale', 'rent'), fallback to lowercase for consistency
  const types = categoryData.supportedListingTypes || ['sale'];

  // If category supports only one type, redirect to that type's listings page
  if (types.length === 1) {
    const typeSlug = listingTypeToUrlSegment(types[0]);
    redirect(`/${category}/${typeSlug}`);
  }

  // Category supports both types - show pre-loader UI
  return (
    <CategoryPreloaderClient
      categorySlug={category}
      categoryName={categoryData.name}
      categoryNameAr={categoryData.nameAr}
      categoryIcon={categoryData.icon}
    />
  );
}
