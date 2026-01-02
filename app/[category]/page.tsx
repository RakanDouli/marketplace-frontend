import type { Metadata } from "next";
import CategoryPageClient from "./CategoryPageClient";
import type { Attribute } from "../../types/listing";

// GraphQL query for server-side fetching
const GET_CATEGORY_ATTRIBUTES_QUERY = `
  query GetAttributesByCategorySlug($categorySlug: String!) {
    getAttributesByCategorySlug(categorySlug: $categorySlug) {
      id
      key
      name
      type
      validation
      sortOrder
      group
      groupOrder
      isActive
      isGlobal
      showInGrid
      showInList
      showInDetail
      showInFilter
      maxSelections
      options {
        id
        key
        value
        sortOrder
        isActive
        showInGrid
        showInList
        showInDetail
        showInFilter
      }
    }
  }
`;

const GET_LISTING_AGGREGATIONS_QUERY = `
  query GetListingAggregations($filter: ListingFilterInput) {
    listingsAggregations(filter: $filter) {
      totalResults
      provinces {
        value
        count
      }
      attributes {
        field
        totalCount
        options {
          value
          count
          key
        }
      }
    }
  }
`;

const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
    }
  }
`;

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
    brand?: string;
    model?: string;
    minPrice?: string;
    maxPrice?: string;
    province?: string;
    city?: string;
    search?: string;
  }>;
}

// Fetch filter attributes server-side
async function fetchFilterAttributes(categorySlug: string): Promise<{
  attributes: Attribute[];
  totalResults: number;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  try {
    // Fetch attributes and aggregations in parallel
    const [attributesResponse, aggregationsResponse] = await Promise.all([
      fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: GET_CATEGORY_ATTRIBUTES_QUERY,
          variables: { categorySlug },
        }),
        next: { revalidate: 300 }, // Cache for 5 minutes (ISR)
      }),
      fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: GET_LISTING_AGGREGATIONS_QUERY,
          variables: { filter: { categoryId: categorySlug } },
        }),
        next: { revalidate: 120 }, // Cache for 2 minutes (more dynamic)
      }),
    ]);

    const [attributesData, aggregationsData] = await Promise.all([
      attributesResponse.json(),
      aggregationsResponse.json(),
    ]);

    const rawAttributes: Attribute[] =
      attributesData.data?.getAttributesByCategorySlug || [];
    const aggregations = aggregationsData.data?.listingsAggregations || {};

    // Build aggregation lookup map
    const aggregationMap: Record<string, Record<string, number>> = {};
    (aggregations.attributes || []).forEach((attr: any) => {
      aggregationMap[attr.field] = {};
      (attr.options || []).forEach((option: any) => {
        const lookupKey = option.key || option.value;
        aggregationMap[attr.field][lookupKey] = option.count;
      });
    });

    // Add provinces as "location" attribute
    if (aggregations.provinces?.length > 0) {
      aggregationMap["location"] = {};
      aggregations.provinces.forEach((province: any) => {
        aggregationMap["location"][province.value] = province.count;
      });
    }

    // Process attributes with counts
    const attributesWithCounts = rawAttributes.map((attr) => {
      let processedOptions: any[] = [];

      if (attr.key === "brandId" || attr.key === "modelId") {
        // For brandId/modelId, get options from aggregation data
        const rawAttributeData = (aggregations.attributes || []).find(
          (a: any) => a.field === attr.key
        );
        if (rawAttributeData?.options) {
          processedOptions = rawAttributeData.options.map((option: any) => ({
            id: option.key || option.value,
            key: option.key || option.value,
            value: option.value,
            sortOrder: 0,
            isActive: true,
            count: option.count,
          }));
        }
      } else {
        // Regular attributes - use existing options with counts
        processedOptions = (attr.options || []).map((backendOption: any) => ({
          ...backendOption,
          count: aggregationMap[attr.key]?.[backendOption.key] || 0,
        }));
      }

      return {
        ...attr,
        processedOptions,
      };
    });

    return {
      attributes: attributesWithCounts,
      totalResults: aggregations.totalResults || 0,
    };
  } catch (error) {
    console.error("Error fetching filter attributes:", error);
    return { attributes: [], totalResults: 0 };
  }
}

// Fetch category metadata for SEO
async function fetchCategoryMetadata(categorySlug: string): Promise<{
  name: string;
  nameAr: string;
} | null> {
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
    return categories.find((cat: any) => cat.slug === categorySlug) || null;
  } catch (error) {
    return null;
  }
}

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await fetchCategoryMetadata(category);

  if (!categoryData) {
    return {
      title: "الفئة غير موجودة | السوق السوري",
    };
  }

  const title = `${categoryData.nameAr} للبيع في سوريا | السوق السوري`;
  const description = `تصفح أحدث إعلانات ${categoryData.nameAr} للبيع في سوريا. أسعار منافسة وتشكيلة واسعة من المعروضات.`;

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
      canonical: `https://akarkar.com/${category}`,
    },
  };
}

// Server Component - fetches data server-side, passes to client
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;

  // Fetch filter attributes server-side (SSR)
  const { attributes: initialAttributes, totalResults: initialTotalResults } =
    await fetchFilterAttributes(category);

  return (
    <CategoryPageClient
      categorySlug={category}
      searchParams={resolvedSearchParams}
      initialAttributes={initialAttributes}
      initialTotalResults={initialTotalResults}
    />
  );
}
