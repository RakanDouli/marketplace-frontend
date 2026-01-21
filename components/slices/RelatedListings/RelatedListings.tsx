"use client";

import React, { useEffect, useState } from "react";
import { Slider } from "../Slider";
import { Grid } from "../Grid/Grid";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useFiltersStore } from "@/stores/filtersStore";
import { useRelatedListingsStore, RelatedListing, RelatedType } from "@/stores/relatedListingsStore";
import { formatPrice } from "@/utils/formatPrice";

export type { RelatedType };
export type DisplayMode = 'slider' | 'grid';

export interface RelatedListingsProps {
  listingId: string;
  type: RelatedType;
  title: string;
  displayMode?: DisplayMode;
  limit?: number;
  className?: string;
}

export const RelatedListings: React.FC<RelatedListingsProps> = ({
  listingId,
  type,
  title,
  displayMode = 'slider',
  limit = 8,
  className = "",
}) => {
  const { getCategoryById } = useCategoriesStore();
  const { attributes } = useFiltersStore();
  const { fetchRelatedListings } = useRelatedListingsStore();
  const [listings, setListings] = useState<RelatedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter specs based on showInGrid attribute flags
  const filterSpecsForGrid = (allSpecs: Record<string, unknown>): Record<string, unknown> => {
    if (!attributes || attributes.length === 0) {
      return allSpecs;
    }

    const filteredSpecs: Record<string, unknown> = {};
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

  // Fetch related listings via store
  useEffect(() => {
    const loadListings = async () => {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const results = await fetchRelatedListings(listingId, type, limit);
      setListings(results);
      setIsLoading(false);
    };

    loadListings();
  }, [listingId, type, limit, fetchRelatedListings]);

  // Don't render if loading or no listings (backend returns [] if < 3)
  if (isLoading || listings.length === 0) {
    return null;
  }

  // Render listing cards
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
  };

  // Slider mode - Slider has its own Container
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

  // Grid mode - Grid has its own Container when title provided
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
