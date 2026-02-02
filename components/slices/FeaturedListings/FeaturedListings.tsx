"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ContainerProps } from "../Container/Container";
import { Slider } from "../Slider";
import { Grid } from "../Grid";
import { Button } from "../Button/Button";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useMetadataStore } from "@/stores/metadataStore";
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
  // Categories are hydrated from root layout - instant access, no waiting
  const { getCategoryById, getCategoryBySlug } = useCategoriesStore();
  const { provinces, fetchLocationMetadata } = useMetadataStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hydration-safe: track when we're on client to avoid SSR mismatch
  // Server has empty provinces, client may have cached provinces from metadataStore
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch provinces if not loaded (needed for Arabic location names)
  useEffect(() => {
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
  }, [provinces.length, fetchLocationMetadata]);

  // Helper to get Arabic province name from key (only after hydration to avoid mismatch)
  const getProvinceArabicName = (provinceKey: string): string => {
    if (!isHydrated) return provinceKey; // Return raw key during SSR/hydration
    const province = provinces.find((p) => p.key === provinceKey);
    return province?.nameAr || provinceKey;
  };

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

  // Categories are hydrated from root layout - no need to initialize here

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

  // Show skeleton while loading OR before hydration to prevent CLS and hydration mismatch
  // Server: categories store empty → category = null → show skeleton
  // Client (initial): isHydrated = false → show skeleton (matches server)
  // Client (after hydration): categories load → show real content
  // Use `limit` for skeleton count so height matches loaded content
  if (isLoading || !category || !isHydrated) {
    const skeletonCount = variant === "grid" ? limit : 5;
    const skeletonCards = Array.from({ length: skeletonCount }, (_, i) => (
      <ListingCard
        key={`skeleton-${i}`}
        id=""
        title=""
        price=""
        isLoading={true}
        viewMode="grid"
      />
    ));

    if (variant === "grid") {
      return (
        <Grid
          title={displayTitle}
          columns={columns}
          mobileColumns={mobileColumns}
          gap="lg"
          paddingY={paddingY}
          background={background}
          outerBackground={outerBackground}
          className={className}
        >
          {skeletonCards}
        </Grid>
      );
    }

    return (
      <Slider
        title={displayTitle}
        slidesToShow={5}
        slidesToShowTablet={2}
        slidesToShowMobile={1}
        showArrows={false}
        showDots={false}
        paddingY={paddingY}
        background={background}
        outerBackground={outerBackground}
        className={className}
      >
        {skeletonCards}
      </Slider>
    );
  }

  // Don't render if no listings after loading
  if (listings.length === 0) {
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

      // Extract location and translate province to Arabic
      const provinceKey = listing.location?.province;
      const city = listing.location?.city;
      const province = provinceKey ? getProvinceArabicName(provinceKey) : "";
      // Format: "city، province" or just "province"
      const locationDisplay = city && province
        ? `${city}، ${province}`
        : province || "";

      return (
        <ListingCard
          key={listing.id}
          id={listing.id}
          title={listing.title}
          price={formatPrice(listing.priceMinor)}
          location={locationDisplay}
          accountType={(listing.accountType as "individual" | "dealer" | "business") || "individual"}
          specs={filteredSpecs}
          images={listing.imageKeys}
          viewMode="grid"
          userId={listing.user?.id}
          categorySlug={listingCategory?.slug}
          listingTypeSlug="sell" // Default to sell for homepage featured listings
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
