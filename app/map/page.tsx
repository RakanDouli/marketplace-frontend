"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Text, Button } from "../../components/slices";
import Container from "../../components/slices/Container/Container";
import { optimizeListingImage } from "../../utils/cloudflare-images";
import { useListingsStore } from "../../stores/listingsStore";
import { SYRIA_PROVINCE_COORDS } from "../../components/Filter/provinceCoords";
import styles from "./MapSearch.module.scss";

// Dynamically import Leaflet map (no SSR)
const MapContainer = dynamic(
  () => import("./MapClient").then((mod) => mod.MapClient),
  { ssr: false, loading: () => <div className={styles.mapLoading}>جاري تحميل الخريطة...</div> }
);

// Syria center
const SYRIA_CENTER = { lat: 34.8, lng: 38.0 };
const DEFAULT_ZOOM = 7;

export default function MapSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") || "";
  const listingType = searchParams.get("listingType") || "sell";

  const { listings, isLoading, fetchListingsByCategory } = useListingsStore();

  // Use same store as listings page
  useEffect(() => {
    if (category) {
      fetchListingsByCategory(category, {
        listingType: listingType === "rent" ? "RENT" : "SALE",
      }, "grid");
    }
  }, [category, listingType]);

  // Build markers from all listings - use coordinates or province center fallback
  const allMarkers = useMemo(() => {
    return listings.map((l) => {
      // Use exact coordinates if available
      let lat = l.location?.coordinates?.lat;
      let lng = l.location?.coordinates?.lng;

      // Fallback to province center with slight offset to avoid stacking
      if (!lat || !lng) {
        const province = l.location?.province?.toLowerCase();
        if (province && SYRIA_PROVINCE_COORDS[province]) {
          lat = SYRIA_PROVINCE_COORDS[province].lat + (Math.random() - 0.5) * 0.03;
          lng = SYRIA_PROVINCE_COORDS[province].lng + (Math.random() - 0.5) * 0.03;
        }
      }

      if (!lat || !lng) return null;

      return {
        id: l.id,
        lat,
        lng,
        title: l.title,
        price: l.priceMinor,
        image: l.imageKeys?.[0] ? optimizeListingImage(l.imageKeys[0], "small") : null,
        categorySlug: category,
        listingType: listingType === "sell" ? "sell" : "rent",
      };
    }).filter(Boolean) as { id: string; lat: number; lng: number; title: string; price: number; image: string | null; categorySlug: string; listingType: string }[];
  }, [listings, category, listingType]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <Container paddingY="sm" paddingX="md">
        <div className={styles.header}>
          <Text variant="h3">البحث على الخريطة</Text>
          <div className={styles.headerActions}>
            <Text variant="small" color="secondary">
              {isLoading ? 'جاري البحث...' : `${allMarkers.length} إعلان`}
            </Text>
            <Button variant="outline" arrow onClick={() => router.back()}>
              العودة
            </Button>
          </div>
        </div>
      </Container>

      {/* Map */}
      <div className={styles.mapWrapper}>
        <MapContainer
          center={SYRIA_CENTER}
          zoom={DEFAULT_ZOOM}
          markers={allMarkers}
        />
      </div>
    </div>
  );
}
