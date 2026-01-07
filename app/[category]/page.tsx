import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPageClient from "./CategoryPageClient";
import type { Attribute, Listing } from "../../types/listing";
import { LISTINGS_GRID_QUERY } from "../../stores/listingsStore/listingsStore.gql";
import {
  GET_CATEGORY_ATTRIBUTES_QUERY,
  GET_LISTING_AGGREGATIONS_QUERY,
  CATEGORIES_QUERY,
} from "../../stores/filtersStore/filtersStore.gql";

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

// Fetch listings server-side using existing query from store
async function fetchListingsSSR(categorySlug: string): Promise<{
  listings: Listing[];
  totalResults: number;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: LISTINGS_GRID_QUERY,
        variables: {
          filter: {
            categoryId: categorySlug,
            status: "ACTIVE",
            viewType: "grid",
          },
          limit: 20,
          offset: 0,
        },
      }),
      next: { revalidate: 120 }, // Cache for 2 minutes (same as client-side)
    });

    const data = await response.json();
    const rawListings = data.data?.listingsSearch || [];
    const totalResults = data.data?.listingsAggregations?.totalResults || 0;

    // Parse listings (same logic as listingsStore.fetchListings)
    const listings: Listing[] = rawListings.map((item: any) => {
      let specs = {};
      try {
        specs = item.specs ? JSON.parse(item.specs) : {};
      } catch {
        specs = {};
      }

      let specsDisplay = {};
      try {
        specsDisplay = item.specsDisplay ? JSON.parse(item.specsDisplay) : {};
      } catch {
        specsDisplay = {};
      }

      return {
        id: item.id,
        title: item.title,
        priceMinor: item.priceMinor,
        prices: [{ currency: "USD", value: item.priceMinor?.toString() || "0" }],
        city: (specs as any).location || item.location?.city || "",
        status: "active" as const,
        allowBidding: false,
        specs,
        specsDisplay,
        imageKeys: item.imageKeys || [],
        accountType: item.accountType as "individual" | "dealer" | "business",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: item.user ? { id: item.user.id } : undefined,
      };
    });

    return { listings, totalResults };
  } catch (error) {
    console.error("Error fetching listings SSR:", error);
    return { listings: [], totalResults: 0 };
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

  // First, check if the category exists
  const categoryData = await fetchCategoryMetadata(category);

  // If category doesn't exist, show 404 page
  if (!categoryData) {
    notFound();
  }

  // Fetch filter attributes AND listings server-side (SSR) in parallel
  const [filterData, listingsData] = await Promise.all([
    fetchFilterAttributes(category),
    fetchListingsSSR(category),
  ]);

  return (
    <CategoryPageClient
      categorySlug={category}
      searchParams={resolvedSearchParams}
      initialAttributes={filterData.attributes}
      initialTotalResults={filterData.totalResults}
      initialListings={listingsData.listings}
    />
  );
}
