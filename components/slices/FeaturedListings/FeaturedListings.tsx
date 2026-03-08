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
import { useCurrencyStore } from "@/stores/currencyStore";

import { cachedGraphQLRequest } from "@/utils/graphql-cache";
import { formatPrice } from "@/utils/formatPrice";

import { LISTINGS_GRID_QUERY } from "@/stores/listingsStore/listingsStore.gql";
import { GET_CATEGORY_ATTRIBUTES_QUERY } from "@/stores/filtersStore/filtersStore.gql";

import { ListingStatus } from "@/common/enums";

export interface FeaturedListingsProps {
  categoryId?: string;
  categorySlug?: string;
  title?: string;
  viewAllText?: string;
  limit?: number;

  variant?: "slider" | "grid";

  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  mobileColumns?: 1 | 2 | 3 | 4;

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
  const { getCategoryById, getCategoryBySlug } = useCategoriesStore();
  const { provinces, fetchLocationMetadata } = useMetadataStore();
  const { preferredCurrency } = useCurrencyStore();

  const [listings, setListings] = useState<Listing[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const category = categoryId
    ? getCategoryById(categoryId)
    : categorySlug
      ? getCategoryBySlug(categorySlug)
      : null;

  const displayTitle =
    title || (category?.nameAr ? `${category.nameAr} جديدة` : "إعلانات جديدة");

  const viewAllLink = category?.slug ? `/${category.slug}` : "/";

  useEffect(() => {
    if (provinces.length === 0) {
      fetchLocationMetadata();
    }
  }, [provinces.length, fetchLocationMetadata]);

  const getProvinceArabicName = (provinceKey?: string) => {
    if (!provinceKey) return "";
    const province = provinces.find((p) => p.key === provinceKey);
    return province?.nameAr || provinceKey;
  };

  const filterSpecsForGrid = (specs: Record<string, any>) => {
    if (!attributes.length) return specs;

    const filtered: Record<string, any> = {};

    Object.entries(specs).forEach(([key, value]) => {
      const attr = attributes.find((a) => a.key === key || a.name === key);

      if (attr?.showInGrid) {
        filtered[key] = value;
      }
    });

    return filtered;
  };

  useEffect(() => {
    const fetchData = async () => {
      const catId = categoryId || category?.id;
      const catSlug = categorySlug || category?.slug;

      if (!catId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [listingsData, attributesData] = await Promise.all([
          cachedGraphQLRequest(
            LISTINGS_GRID_QUERY,
            {
              filter: {
                categoryId: catId,
                status: ListingStatus.ACTIVE,
              },
              limit,
              offset: 0,
            },
            { ttl: 3 * 60 * 1000 }
          ),

          catSlug
            ? cachedGraphQLRequest(
              GET_CATEGORY_ATTRIBUTES_QUERY,
              { categorySlug: catSlug },
              { ttl: 30 * 60 * 1000 }
            )
            : Promise.resolve({ getAttributesByCategorySlug: [] }),
        ]);

        setListings(listingsData.listingsSearch || []);
        setAttributes(attributesData.getAttributesByCategorySlug || []);
      } catch (err) {
        console.error("FeaturedListings fetch failed:", err);
        setListings([]);
        setAttributes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, category?.id, category?.slug, categorySlug, limit]);

  const renderSkeleton = () => {
    const count = variant === "grid" ? limit : 5;

    const cards = Array.from({ length: count }).map((_, i) => (
      <ListingCard
        key={`skeleton-${i}`}
        id=""
        title=""
        price=""
        isLoading
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
        >
          {cards}
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
      >
        {cards}
      </Slider>
    );
  };

  if (isLoading) {
    return renderSkeleton();
  }

  if (!category || listings.length === 0) {
    return null;
  }

  const cards = listings.slice(0, limit).map((listing) => {
    const listingCategory = listing.categoryId
      ? getCategoryById(listing.categoryId)
      : null;

    let specs: Record<string, any> = {};

    try {
      const source = listing.specsDisplay || listing.specs;

      if (typeof source === "string") specs = JSON.parse(source);
      else if (typeof source === "object") specs = source;
    } catch { }

    const filteredSpecs = filterSpecsForGrid(specs);

    const province = getProvinceArabicName(listing.location?.province);
    const city = listing.location?.city;

    const locationDisplay =
      city && province ? `${city}، ${province}` : province;

    return (
      <ListingCard
        key={listing.id}
        id={listing.id}
        title={listing.title}
        price={formatPrice(listing.priceMinor)}
        location={locationDisplay}
        accountType={
          (listing.accountType as "individual" | "dealer" | "business") ||
          "individual"
        }
        specs={filteredSpecs}
        images={listing.imageKeys}
        viewMode="grid"
        userId={listing.user?.id}
        categorySlug={listingCategory?.slug}
        listingTypeSlug="sell"
      />
    );
  });

  const actionButton = (
    <Link href={viewAllLink}>
      <Button variant="link">{viewAllText}</Button>
    </Link>
  );

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
        {cards}
      </Grid>
    );
  }

  return (
    <Slider
      title={displayTitle}
      action={actionButton}
      slidesToShow={5}
      slidesToShowTablet={2}
      slidesToShowMobile={1}
      showArrows
      showDots
      paddingY={paddingY}
      background={background}
      outerBackground={outerBackground}
      className={className}
    >
      {cards}
    </Slider>
  );
};

export default FeaturedListings;