"use client";

import React, { useEffect, useState } from "react";
import { Container } from "../Container/Container";
import { Text } from "../Text/Text";
import { Slider } from "../Slider";
import { Grid } from "../Grid/Grid";
import { ListingCard } from "../ListingCard/ListingCard";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useFiltersStore } from "@/stores/filtersStore";
import { useRelatedListingsStore, RelatedListing, RelatedType } from "@/stores/relatedListingsStore";
import { formatPrice } from "@/utils/formatPrice";
import styles from "./RelatedListings.module.scss";

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

  return (
    <section className={`${styles.section} ${className}`}>
      <Container>
        <div className={styles.header}>
          <Text variant="h3">{title}</Text>
        </div>

        {displayMode === 'slider' ? (
          <Slider
            slidesToShow={4}
            slidesToShowTablet={2}
            slidesToShowMobile={1}
            showArrows={true}
            showDots={true}
          >
            {renderListingCards()}
          </Slider>
        ) : (
          <Grid columns={4} mobileColumns={2} gap="md">
            {renderListingCards()}
          </Grid>
        )}
      </Container>
    </section>
  );
};

export default RelatedListings;
