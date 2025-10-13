'use client';

import React from 'react';
import type { IMapProvider, LocationData, MapConfig } from '../types';

/**
 * Google Maps Provider Implementation (Placeholder)
 * To enable: Add Google Maps API key and implement renderMap
 *
 * Steps to switch to Google Maps:
 * 1. Get Google Maps API key from Google Cloud Console
 * 2. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
 * 3. Install @googlemaps/react-wrapper
 * 4. Implement renderMap method below
 * 5. Change provider in LocationMap component
 */
export class GoogleMapsProvider implements IMapProvider {
  getName(): string {
    return 'Google Maps';
  }

  calculateMapConfig(location: LocationData): MapConfig | null {
    // Same logic as OpenStreetMap
    if (location.coordinates?.lat && location.coordinates?.lng) {
      return {
        center: location.coordinates,
        zoom: 14,
        marker: location.coordinates,
      };
    }

    // Add province coordinates or geocoding logic here
    return null;
  }

  renderMap(config: MapConfig): React.ReactElement {
    // TODO: Implement Google Maps rendering when API key is available
    return (
      <div style={{
        height: '300px',
        width: '100%',
        borderRadius: '8px',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        Google Maps (Requires API Key)
      </div>
    );
  }
}
