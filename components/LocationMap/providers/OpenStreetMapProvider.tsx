'use client';

import React, { useEffect, useId, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IMapProvider, LocationData, MapConfig, Coordinates } from '../types';

// Dynamically import the entire map component to avoid SSR issues
// This ensures the map only renders on the client side
const LeafletMap = dynamic(
  () => import('./LeafletMapWrapper').then((mod) => mod.LeafletMapWrapper),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '300px', width: '100%', borderRadius: '8px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>جاري تحميل الخريطة...</span>
      </div>
    )
  }
);

/**
 * Map English keys to Arabic province names for accurate geocoding
 */
export const PROVINCE_ARABIC_NAMES: Record<string, string> = {
  damascus: 'دمشق',
  aleppo: 'حلب',
  homs: 'حمص',
  hama: 'حماة',
  latakia: 'اللاذقية',
  tartous: 'طرطوس',
  daraa: 'درعا',
  sweida: 'السويداء',
  quneitra: 'القنيطرة',
  idlib: 'إدلب',
  raqqa: 'الرقة',
  deir_ez_zor: 'دير الزور',
  hasakah: 'الحسكة',
  rif_damascus: 'ريف دمشق',
};

/**
 * Reverse mapping: Arabic province names to English keys
 * Allows lookups by either English or Arabic name
 */
export const PROVINCE_ARABIC_TO_ENGLISH: Record<string, string> = {
  'دمشق': 'damascus',
  'حلب': 'aleppo',
  'حمص': 'homs',
  'حماة': 'hama',
  'اللاذقية': 'latakia',
  'طرطوس': 'tartous',
  'درعا': 'daraa',
  'السويداء': 'sweida',
  'القنيطرة': 'quneitra',
  'إدلب': 'idlib',
  'الرقة': 'raqqa',
  'دير الزور': 'deir_ez_zor',
  'الحسكة': 'hasakah',
  'ريف دمشق': 'rif_damascus',
};

/**
 * Syria province coordinates - verified centers
 */
const SYRIA_PROVINCE_COORDS: Record<string, Coordinates> = {
  damascus: { lat: 33.5138, lng: 36.2765 },      // دمشق
  aleppo: { lat: 36.2021, lng: 37.1343 },        // حلب
  homs: { lat: 34.7298, lng: 36.7184 },          // حمص
  hama: { lat: 35.1324, lng: 36.7540 },          // حماة
  latakia: { lat: 35.5304, lng: 35.7850 },       // اللاذقية
  tartous: { lat: 34.8899, lng: 35.8869 },       // طرطوس
  daraa: { lat: 32.6189, lng: 36.1021 },         // درعا
  sweida: { lat: 32.7088, lng: 36.5698 },        // السويداء
  quneitra: { lat: 33.1261, lng: 35.8246 },      // القنيطرة
  idlib: { lat: 35.9248, lng: 36.6333 },         // إدلب
  raqqa: { lat: 35.9505, lng: 39.0089 },         // الرقة
  deir_ez_zor: { lat: 35.3364, lng: 40.1407 },   // دير الزور
  hasakah: { lat: 36.5024, lng: 40.7478 },       // الحسكة
  rif_damascus: { lat: 33.6844, lng: 36.5135 },  // ريف دمشق
};

/**
 * OpenStreetMap Provider Implementation
 * Uses Leaflet.js and OpenStreetMap tiles (100% free)
 */
export class OpenStreetMapProvider implements IMapProvider {
  getName(): string {
    return 'OpenStreetMap';
  }

  /**
   * Calculate map configuration based on location detail level
   */
  calculateMapConfig(location: LocationData): MapConfig | null {
    // Priority 1: Use exact coordinates if available
    if (location.coordinates?.lat && location.coordinates?.lng) {
      return {
        center: location.coordinates,
        zoom: 14, // Close zoom for exact location
        marker: location.coordinates,
      };
    }

    // Priority 2: Use province coordinates
    if (location.province) {
      // Try to find province by English key first (lowercase)
      let provinceKey = location.province.toLowerCase();
      let provinceCoords = SYRIA_PROVINCE_COORDS[provinceKey];

      // If not found, try Arabic-to-English lookup
      if (!provinceCoords) {
        const englishKey = PROVINCE_ARABIC_TO_ENGLISH[location.province];
        if (englishKey) {
          provinceCoords = SYRIA_PROVINCE_COORDS[englishKey];
        }
      }

      if (provinceCoords) {
        // Determine zoom based on detail level
        let zoom = 8; // Default province-level zoom
        if (location.city) zoom = 11; // City-level zoom
        if (location.area) zoom = 13; // Area-level zoom

        return {
          center: provinceCoords,
          zoom,
          marker: provinceCoords, // Show marker at province center
        };
      }
    }

    // No valid location data
    return null;
  }

  /**
   * Render OpenStreetMap with Leaflet
   */
  renderMap(config: MapConfig): React.ReactElement {
    return <LeafletMap config={config} />;
  }
}
