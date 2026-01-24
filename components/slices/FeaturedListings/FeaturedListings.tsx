"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ContainerProps } from "../Container/Container";
import { Slider } from "../Slider";
import { Grid } from "../Grid";
import { Button } from "../Button/Button";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { cachedGraphQLRequest } from "@/utils/graphql-cache";
import { formatPrice } from "@/utils/formatPrice";
import { LISTINGS_GRID_QUERY } from "@/stores/listingsStore/listingsStore.gql";
import { GET_CATEGORY_ATTRIBUTES_QUERY } from "@/stores/filtersStore/filtersStore.gql";

export interface FeaturedListingsProps {
  categoryId?: string;    // Pass category ID - component fetches nameAr and listings
  categorySlug?: string;  // OR pass slug - component looks up category by slug
  title?: string;         // Optional override for title (defaults to category nameAr)
  viewAllText?: string;
  limit?: number;
  // Display variant
  variant?: "slider" | "grid";  // Default: "slider"
  columns?: 1 | 2 | 3 | 4 | 5 | 6;  // Grid columns on desktop (default: 5)
  mobileColumns?: 1 | 2 | 3 | 4;   // Grid columns on mobile (default: 2)
  // Container props (passed to Slider/Grid)
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

interface Attribute {
  id: string;
  key: string;
  name: string;
  showInGrid?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
}

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
  categoryId,
  categorySlug,
  title,
  viewAllText = "عرض الكل",
  limit = 10,
  variant = "slider",
  columns = 5,
  mobileColumns = 2,
  paddingY = "lg",
  background = "transparent",
  outerBackground = "bg",
  className = "",
}) => {
  const { categories, getCategoryById, getCategoryBySlug, initializeCategories } = useCategoriesStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter specs based on showInGrid flag from attributes (same as ListingArea)
  const filterSpecsForGrid = (allSpecs: Record<string, any>): Record<string, any> => {
    // If no attributes loaded yet, return all specs
    if (!attributes || attributes.length === 0) {
      return allSpecs;
    }

    const filteredSpecs: Record<string, any> = {};

    // Check each spec against attribute display flags
    Object.entries(allSpecs).forEach(([specKey, specValue]) => {
      // Find the corresponding attribute definition
      const attribute = attributes.find(
        (attr) =>
          attr.key === specKey ||
          attr.name === specKey
      );

      if (attribute) {
        // Only show if showInGrid is true
        if (attribute.showInGrid === true) {
          filteredSpecs[specKey] = specValue;
        }
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

  // Fetch listings and attributes for this category
  useEffect(() => {
    const fetchData = async () => {
      const catId = categoryId || category?.id;
      const catSlug = categorySlug || category?.slug;
      if (!catId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch listings and attributes in parallel
        const [listingsData, attributesData] = await Promise.all([
          cachedGraphQLRequest(
            LISTINGS_GRID_QUERY,
            {
              filter: { categoryId: catId },
              limit,
              offset: 0
            },
            { ttl: 3 * 60 * 1000 }
          ),
          catSlug ? cachedGraphQLRequest(
            GET_CATEGORY_ATTRIBUTES_QUERY,
            { categorySlug: catSlug },
            { ttl: 30 * 60 * 1000 } // Cache attributes for 30 minutes
          ) : Promise.resolve({ getAttributesByCategorySlug: [] })
        ]);

        setListings(listingsData.listingsSearch || []);
        setAttributes(attributesData.getAttributesByCategorySlug || []);
      } catch (error) {
        console.error("Failed to fetch category data:", error);
        setListings([]);
        setAttributes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, category?.id, category?.slug, categorySlug, limit]);

  // Don't render if loading or no listings
  if (isLoading || listings.length === 0) {
    return null;
  }

  // Render listing cards (shared between grid and slider)
  const renderListingCards = () =>
    listings.slice(0, limit).map((listing) => {
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
    });

  // Action button (shared)
  const actionButton = (
    <Link href={viewAllLink}>
      <Button variant="link">{viewAllText}</Button>
    </Link>
  );

  // Grid variant
  if (variant === "grid") {
    return (
      <Grid
        title={displayTitle}
        action={actionButton}
        columns={columns}
        mobileColumns={mobileColumns}
        gap="lg"
        paddingY={paddingY}
        background={background}
        outerBackground={outerBackground}
        className={className}
      >
        {renderListingCards()}
      </Grid>
    );
  }

  // Slider variant (default)
  return (
    <Slider
      title={displayTitle}
      action={actionButton}
      slidesToShow={5}
      slidesToShowTablet={2}
      slidesToShowMobile={1}
      showArrows={true}
      showDots={true}
      paddingY={paddingY}
      background={background}
      outerBackground={outerBackground}
      className={className}
    >
      {renderListingCards()}
    </Slider>
  );
};

export default FeaturedListings;
