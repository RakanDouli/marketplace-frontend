"use client";

import React, { useEffect, useState } from "react";
import { RelatedListings } from "./RelatedListings";
import { useRelatedListingsStore } from "@/stores/relatedListingsStore";

export interface RelatedByBrandProps {
  listingId: string;
  displayMode?: 'slider' | 'grid';
  className?: string;
}

/**
 * RelatedByBrand - Shows listings from the same brand
 * Displays with dynamic title "المزيد من [Brand Name]"
 * Hides itself if brand has < 3 listings or no brand set
 */
export const RelatedByBrand: React.FC<RelatedByBrandProps> = ({
  listingId,
  displayMode = 'slider',
  className = "",
}) => {
  const { fetchBrandName } = useRelatedListingsStore();
  const [brandName, setBrandName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch brand name via store
  useEffect(() => {
    const loadBrandName = async () => {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      const name = await fetchBrandName(listingId);
      setBrandName(name);
      setIsLoading(false);
    };

    loadBrandName();
  }, [listingId, fetchBrandName]);

  // Don't render if no brand name (listing has no brand)
  if (isLoading || !brandName) {
    return null;
  }

  return (
    <RelatedListings
      listingId={listingId}
      type="SAME_BRAND"
      title={`المزيد من ${brandName}`}
      displayMode={displayMode}
      limit={8}
      className={className}
    />
  );
};

export default RelatedByBrand;
