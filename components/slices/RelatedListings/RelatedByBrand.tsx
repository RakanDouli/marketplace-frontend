"use client";

import React, { useEffect, useState } from "react";
import { RelatedListings } from "./RelatedListings";
import { cachedGraphQLRequest } from "@/utils/graphql-cache";

// Query to get brand name for the listing
const LISTING_BRAND_NAME_QUERY = `
  query ListingBrandName($listingId: ID!) {
    listingBrandName(listingId: $listingId)
  }
`;

export interface RelatedByBrandProps {
  listingId: string;
  className?: string;
}

/**
 * RelatedByBrand - Shows listings from the same brand
 * Displays as a slider with dynamic title "المزيد من [Brand Name]"
 * Hides itself if brand has < 3 listings or no brand set
 */
export const RelatedByBrand: React.FC<RelatedByBrandProps> = ({
  listingId,
  className = "",
}) => {
  const [brandName, setBrandName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch brand name
  useEffect(() => {
    const fetchBrandName = async () => {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await cachedGraphQLRequest(
          LISTING_BRAND_NAME_QUERY,
          { listingId },
          { ttl: 5 * 60 * 1000 } // 5 minute cache
        );
        setBrandName(data.listingBrandName);
      } catch (error) {
        console.error("Failed to fetch brand name:", error);
        setBrandName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandName();
  }, [listingId]);

  // Don't render if no brand name (listing has no brand)
  if (isLoading || !brandName) {
    return null;
  }

  return (
    <RelatedListings
      listingId={listingId}
      type="SAME_BRAND"
      title={`المزيد من ${brandName}`}
      displayMode="slider"
      limit={8}
      className={className}
    />
  );
};

export default RelatedByBrand;
