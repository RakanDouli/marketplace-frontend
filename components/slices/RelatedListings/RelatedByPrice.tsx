"use client";

import React from "react";
import { RelatedListings } from "./RelatedListings";

export interface RelatedByPriceProps {
  listingId: string;
  className?: string;
}

/**
 * RelatedByPrice - Shows listings with similar price (±30%)
 * Displays as a grid with title "قد يعجبك أيضاً"
 * Hides itself if < 3 similar-priced listings found
 */
export const RelatedByPrice: React.FC<RelatedByPriceProps> = ({
  listingId,
  className = "",
}) => {
  return (
    <RelatedListings
      listingId={listingId}
      type="SIMILAR_PRICE"
      title="قد يعجبك أيضاً"
      displayMode="grid"
      limit={8}
      className={className}
    />
  );
};

export default RelatedByPrice;
