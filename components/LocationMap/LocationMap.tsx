'use client';

import React, { useMemo } from 'react';
import type { LocationData, IMapProvider, MapProviderType } from './types';
import { OpenStreetMapProvider, PROVINCE_ARABIC_NAMES } from './providers/OpenStreetMapProvider';
import { GoogleMapsProvider } from './providers/GoogleMapsProvider';
import { ExternalLink } from 'lucide-react';
import styles from './LocationMap.module.scss';
import { Button } from '../slices';

interface LocationMapProps {
  location: LocationData;
  provider?: MapProviderType;
  showOpenInMapsLink?: boolean;
}

/**
 * LocationMap Component - Provider-agnostic map display
 *
 * Follows Liskov Substitution Principle:
 * - Can switch between OpenStreetMap, Google Maps, or any other provider
 * - Just change the 'provider' prop, no code changes needed
 *
 * @example
 * // Using OpenStreetMap (free, default)
 * <LocationMap location={listing.location} />
 *
 * // Switch to Google Maps (requires API key)
 * <LocationMap location={listing.location} provider="google" />
 */
export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  provider = 'openstreetmap', // Default to free provider
  showOpenInMapsLink = true,
}) => {
  // Factory pattern: Create the appropriate provider instance
  const mapProvider: IMapProvider = useMemo(() => {
    switch (provider) {
      case 'google':
        return new GoogleMapsProvider();
      case 'openstreetmap':
      default:
        return new OpenStreetMapProvider();
    }
  }, [provider]);

  // Calculate map configuration using the provider
  const mapConfig = useMemo(() => {
    return mapProvider.calculateMapConfig(location);
  }, [mapProvider, location]);

  // Generate text description of location (using Arabic names)
  const locationText = useMemo(() => {
    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.city) parts.push(location.city);
    if (location.province) {
      const arabicProvince = PROVINCE_ARABIC_NAMES[location.province.toLowerCase()] || location.province;
      parts.push(arabicProvince);
    }
    return parts.length > 0 ? parts.join(', ') : 'سوريا';
  }, [location]);

  // Generate Google Maps link for "Open in Maps" button (using Arabic names for accuracy)
  const mapsLink = useMemo(() => {
    if (location.link) return location.link;

    if (location.coordinates?.lat && location.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`;
    }

    // Use Arabic province names for better Google Maps accuracy
    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.city) parts.push(location.city);
    if (location.province) {
      const arabicProvince = PROVINCE_ARABIC_NAMES[location.province.toLowerCase()] || location.province;
      parts.push(arabicProvince);
    }

    if (parts.length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', ') + ', سوريا')}`;
    }

    return null;
  }, [location]);

  // If no valid location data, don't render anything
  if (!mapConfig) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Location text */}
      <div className={styles.locationText}>
        {/* <span className={styles.label}>الموقع:</span> */}
        <span className={styles.value}>{locationText}</span>
      </div>

      {/* Map display */}
      <div className={styles.mapWrapper}>
        {mapProvider.renderMap(mapConfig)}
      </div>

      {/* Open in Maps link */}
      {showOpenInMapsLink && mapsLink && (
        <Button
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          variant='outline'
        >
          <ExternalLink size={16} />
          فتح في خرائط جوجل
        </Button>
      )}
    </div>
  );
};
