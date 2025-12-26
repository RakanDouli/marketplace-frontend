"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ContainerProps } from "../Container/Container";
import { Slider } from "../Slider";
import { Button } from "../Button/Button";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useFiltersStore } from "@/stores/filtersStore";
import { cachedGraphQLRequest } from "@/utils/graphql-cache";
import { formatPrice } from "@/utils/formatPrice";
import { LISTINGS_GRID_QUERY } from "@/stores/listingsStore/listingsStore.gql";

export interface FeaturedListingsProps {
  categoryId?: string;    // Pass category ID - component fetches nameAr and listings
  categorySlug?: string;  // OR pass slug - component looks up category by slug
  title?: string;         // Optional override for title (defaults to category nameAr)
  viewAllText?: string;
  limit?: number;
  // Container props (passed to Slider)
  paddingY?: ContainerProps["paddingY"];
  background?: ContainerProps["background"];
  outerBackground?: ContainerProps["outerBackground"];
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
  specs?: string | Record<string, any>;
  specsDisplay?: string | Record<string, any>;
  user?: { id: string };
}

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
  categoryId,
  categorySlug,
  title,
  viewAllText = "عرض الكل",
  limit = 8,
  paddingY = "xl",
  background = "transparent",
  outerBackground = "bg",
  className = "",
}) => {
  const { categories, getCategoryById, getCategoryBySlug, initializeCategories } = useCategoriesStore();
  const { attributes } = useFiltersStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter specs based on showInGrid attribute flags
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
  const viewAllLink = category?.slug ? `/${category.slug}` : "/cars";

  // Initialize categories if not loaded
  useEffect(() => {
    if (categories.length === 0) {
      initializeCategories();
    }
  }, [categories.length, initializeCategories]);

  // Fetch listings for this category
  useEffect(() => {
    const fetchListings = async () => {
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
          { ttl: 3 * 60 * 1000 }
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
  if (isLoading || listings.length === 0) {
    return null;
  }

  return (
    <Slider
      title={displayTitle}
      action={
        <Link href={viewAllLink}>
          <Button variant="link">{viewAllText}</Button>
        </Link>
      }
      slidesToShow={4}
      slidesToShowTablet={2}
      slidesToShowMobile={1}
      showArrows={true}
      showDots={true}
      paddingY={paddingY}
      background={background}
      outerBackground={outerBackground}
      className={className}
    >
      {listings.slice(0, limit).map((listing) => {
        const listingCategory = listing.categoryId ? getCategoryById(listing.categoryId) : null;

        // Parse specs from JSON string if needed
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
  );
};

export default FeaturedListings;
