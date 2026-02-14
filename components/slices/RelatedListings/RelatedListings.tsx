"use client";

import React, { useEffect, useState } from "react";
import { Slider } from "../Slider";
import { Grid } from "../Grid/Grid";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useMetadataStore } from "@/stores/metadataStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useRelatedListingsStore, RelatedListing, RelatedType } from "@/stores/relatedListingsStore";
import { cachedGraphQLRequest } from "@/utils/graphql-cache";
import { formatPrice } from "@/utils/formatPrice";
import { GET_CATEGORY_ATTRIBUTES_QUERY } from "@/stores/filtersStore/filtersStore.gql";

export type { RelatedType };
export type DisplayMode = 'slider' | 'grid';

interface Attribute {
  id: string;
  key: string;
  name: string;
  showInGrid?: boolean;
}

export interface RelatedListingsProps {
  listingId: string;
  type: RelatedType;
  title: string;
  displayMode?: DisplayMode;
  limit?: number;
  className?: string;
  listingTypeSlug?: string; // URL segment (sell/rent) for listing links
}

export const RelatedListings: React.FC<RelatedListingsProps> = ({
  listingId,
  type,
  title,
  displayMode = 'slider',
  limit = 8,
  className = "",
  listingTypeSlug = "sell",
}) => {
  const { getCategoryById } = useCategoriesStore();
  const { provinces, fetchLocationMetadata } = useMetadataStore();
  const { fetchRelatedListings } = useRelatedListingsStore();
  // Subscribe to currency changes to re-render prices when user changes currency
  const { preferredCurrency } = useCurrencyStore();
  const [listings, setListings] = useState<RelatedListing[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hydration-safe: track when we're on client to avoid SSR mismatch
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

  // Helper to get Arabic province name from key
  const getProvinceArabicName = (provinceKey: string): string => {
    if (!isHydrated) return provinceKey;
    const province = provinces.find((p) => p.key === provinceKey);
    return province?.nameAr || provinceKey;
  };

  // Filter specs based on showInGrid flag from attributes (same as FeaturedListings)
  const filterSpecsForGrid = (allSpecs: Record<string, unknown>): Record<string, unknown> => {
    // If no attributes loaded yet, return empty to avoid showing all specs
    if (!attributes || attributes.length === 0) {
      return {};
    }

    const filteredSpecs: Record<string, unknown> = {};

    // Check each spec against attribute display flags
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

  // Fetch related listings, then fetch attributes based on first listing's category
  useEffect(() => {
    const loadData = async () => {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // First fetch listings
      const results = await fetchRelatedListings(listingId, type, limit);
      setListings(results);

      // Get category slug from first listing's categoryId
      if (results.length > 0 && results[0].categoryId) {
        const category = getCategoryById(results[0].categoryId);
        if (category?.slug) {
          const attributesData = await cachedGraphQLRequest(
            GET_CATEGORY_ATTRIBUTES_QUERY,
            { categorySlug: category.slug },
            { ttl: 30 * 60 * 1000 }
          );
          setAttributes(attributesData.getAttributesByCategorySlug || []);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [listingId, type, limit, fetchRelatedListings, getCategoryById]);

  // Don't render if loading or no listings
  if (isLoading || listings.length === 0) {
    return null;
  }

  // Render listing cards with filtered specs
  const renderListingCards = () => {
    return listings.map((listing) => {
      const listingCategory = listing.categoryId ? getCategoryById(listing.categoryId) : null;

      // Parse specsDisplay/specs from JSON string if needed
      let parsedSpecs: Record<string, unknown> = {};
      try {
        const specsSource = listing.specsDisplay || listing.specs;
        if (typeof specsSource === 'string') {
          parsedSpecs = JSON.parse(specsSource);
        } else if (specsSource && typeof specsSource === 'object') {
          parsedSpecs = specsSource as Record<string, unknown>;
        }
      } catch {
        parsedSpecs = {};
      }

      // Filter specs to only show ones with showInGrid=true
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
          listingTypeSlug={listingTypeSlug}
        />
      );
    });
  };

  // Slider mode
  if (displayMode === 'slider') {
    return (
      <Slider
        title={title}
        slidesToShow={5}
        slidesToShowTablet={2}
        slidesToShowMobile={1}
        showArrows={true}
        showDots={true}
        paddingY='lg'
        outerBackground="surface"
        className={className}
      >
        {renderListingCards()}
      </Slider>
    );
  }

  // Grid mode
  return (
    <Grid
      title={title}
      columns={5}
      mobileColumns={2}
      gap="sm"
      paddingY='lg'
      outerBackground="surface"
      className={className}
    >
      {renderListingCards()}
    </Grid>
  );
};

export default RelatedListings;
