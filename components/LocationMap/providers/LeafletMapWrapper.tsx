'use client';

import React, { useEffect, useRef } from 'react';
import type { MapConfig } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapWrapperProps {
  config: MapConfig;
}

/**
 * LeafletMapWrapper - Uses vanilla Leaflet instead of react-leaflet
 * to properly handle React 18 Strict Mode double-invocation of effects
 */
export const LeafletMapWrapper: React.FC<LeafletMapWrapperProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Don't initialize if container doesn't exist
    if (!containerRef.current) return;

    // If map already exists, just update the view
    if (mapRef.current) {
      mapRef.current.setView([config.center.lat, config.center.lng], config.zoom);
      return;
    }

    // Create new map instance
    const map = L.map(containerRef.current, {
      center: [config.center.lat, config.center.lng],
      zoom: config.zoom,
      scrollWheelZoom: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add marker if specified
    if (config.marker) {
      L.marker([config.marker.lat, config.marker.lng])
        .addTo(map)
        .bindPopup('الموقع');
    }

    mapRef.current = map;

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [config.center.lat, config.center.lng, config.zoom, config.marker]);

  return (
    <div
      ref={containerRef}
      style={{ height: '300px', width: '100%', borderRadius: '8px' }}
    />
  );
};
