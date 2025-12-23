"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "../Container/Container";
import { Text } from "../Text/Text";
import { Slider } from "../Slider";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useFiltersStore } from "@/stores/filtersStore";
import { cachedGraphQLRequest } from "@/utils/graphql-cache";
import { formatPrice } from "@/utils/formatPrice";
import { LISTINGS_GRID_QUERY } from "@/stores/listingsStore/listingsStore.gql";
import styles from "./FeaturedListings.module.scss";

export interface FeaturedListingsProps {
  categoryId?: string;    // Pass category ID - component fetches nameAr and listings
  categorySlug?: string;  // OR pass slug - component looks up category by slug
  title?: string;         // Optional override for title (defaults to category nameAr)
  viewAllText?: string;
  limit?: number;
  className?: string;
}

interface Listing {
  id: string;
  title: string;
  priceMinor: number;
  imageKeys?: string[];
  categoryId?: string;
  accountType?: string;
  location?: { province?: string; city?: string };
  specs?: string | Record<string, any>; // Can be JSON string from GraphQL
  specsDisplay?: string | Record<string, any>; // Can be JSON string from GraphQL
  user?: { id: string };
}

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
  categoryId,
  categorySlug,
  title,
  viewAllText = "عرض الكل",
  limit = 8,
  className = "",
}) => {
  const { categories, getCategoryById, getCategoryBySlug, initializeCategories } = useCategoriesStore();
  const { attributes } = useFiltersStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter specs based on showInGrid attribute flags (same as ListingArea)
  const filterSpecsForGrid = (allSpecs: Record<string, any>): Record<string, any> => {
    if (!attributes || attributes.length === 0) {
      return allSpecs;
    }

    const filteredSpecs: Record<string, any> = {};
    Object.entries(allSpecs).forEach(([specKey, specValue]) => {
      const attribute = attributes.find(
        (attr) => attr.key === specKey || attr.name === specKey
      );

      if (attribute && attribute.showInGrid === true) {
        filteredSpecs[specKey] = specValue;
      }
    });

    return filteredSpecs;
  };

  // Find the category from store
  const category = categoryId
    ? getCategoryById(categoryId)
    : categorySlug
      ? getCategoryBySlug(categorySlug)
      : null;

  // Dynamic title - "categoryNameAr جديدة" (e.g. "سيارات جديدة")
  const displayTitle = title || (category?.nameAr ? `${category.nameAr} جديدة` : "إعلانات جديدة");

  // Dynamic link - use category slug
  const viewAllLink = category?.slug ? `/${category.slug}` : "/listings";

  // Initialize categories if not loaded
  useEffect(() => {
    if (categories.length === 0) {
      initializeCategories();
    }
  }, [categories.length, initializeCategories]);

  // Fetch listings for this category
  useEffect(() => {
    const fetchListings = async () => {
      // Need category ID to fetch listings
      const catId = categoryId || category?.id;
      if (!catId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await cachedGraphQLRequest(
          LISTINGS_GRID_QUERY,
          {
            filter: { categoryId: catId },
            limit,
            offset: 0
          },
          { ttl: 3 * 60 * 1000 } // 3 minute cache
        );
        setListings(data.listingsSearch || []);
      } catch (error) {
        console.error("Failed to fetch category listings:", error);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [categoryId, category?.id, limit]);

  // Don't render if loading or no listings
  if (isLoading) {
    return null;
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.section} ${className}`}>
      <Container>
        <div className={styles.header}>
          <Text variant="h3">{displayTitle}</Text>
          <Link href={viewAllLink} className={styles.viewAllLink}>
            {viewAllText}
          </Link>
        </div>

        <Slider
          slidesToShow={4}
          slidesToShowTablet={2}
          slidesToShowMobile={1}
          showArrows={true}
          showDots={true}
        >
          {listings.slice(0, limit).map((listing) => {
            // Get category slug from categories store using categoryId
            const listingCategory = listing.categoryId ? getCategoryById(listing.categoryId) : null;

            // Parse specsDisplay/specs from JSON string if needed (GraphQL returns JSON strings)
            let parsedSpecs: Record<string, any> = {};
            try {
              const specsSource = listing.specsDisplay || listing.specs;
              if (typeof specsSource === 'string') {
                parsedSpecs = JSON.parse(specsSource);
              } else if (specsSource && typeof specsSource === 'object') {
                parsedSpecs = specsSource;
              }
            } catch {
              parsedSpecs = {};
            }

            // Filter specs to only show those with showInGrid=true (same as ListingArea)
            const filteredSpecs = filterSpecsForGrid(parsedSpecs);

            return (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={formatPrice(listing.priceMinor)}
                location={listing.location?.city || listing.location?.province || ""}
                accountType={(listing.accountType as "individual" | "dealer" | "business") || "individual"}
                specs={filteredSpecs}
                images={listing.imageKeys}
                viewMode="grid"
                userId={listing.user?.id}
                categorySlug={listingCategory?.slug}
              />
            );
          })}
        </Slider>
      </Container>
    </section>
  );
};

export default FeaturedListings;
