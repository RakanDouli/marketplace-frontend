'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { IMapProvider, LocationData, MapConfig, Coordinates } from '../types';

// Dynamically import react-leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
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
      const provinceCoords = SYRIA_PROVINCE_COORDS[location.province.toLowerCase()];
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
    // Import Leaflet CSS dynamically
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');

      // Fix for default marker icon in Leaflet with Next.js
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      });
    }

    return (
      <MapContainer
        center={[config.center.lat, config.center.lng]}
        zoom={config.zoom}
        style={{ height: '300px', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {config.marker && (
          <Marker position={[config.marker.lat, config.marker.lng]}>
            <Popup>الموقع</Popup>
          </Marker>
        )}
      </MapContainer>
    );
  }
}
