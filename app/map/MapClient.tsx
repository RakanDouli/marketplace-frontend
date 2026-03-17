"use client";

import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useRouter } from "next/navigation";
import { formatPrice } from "../../utils/formatPrice";
import styles from "./MapSearch.module.scss";

// Fix marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: number;
  image: string | null;
  categorySlug: string;
  listingType: string;
}

interface MapClientProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Marker[];
}

export function MapClient({ center, zoom, markers }: MapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const router = useRouter();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Create cluster group
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!clusterGroupRef.current) return;

    const cluster = clusterGroupRef.current;
    cluster.clearLayers();

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng]);

      // Popup with listing preview
      const popupContent = `
        <div style="direction: rtl; text-align: right; min-width: 220px; cursor: pointer; position: relative;" onclick="window.__mapNavigate('/${m.categorySlug}/${m.listingType}/${m.id}')">
          <button onclick="event.stopPropagation(); window.__mapClosePopup();" style="position: absolute; top: 6px; left: 6px; z-index: 10; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.85); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #666;">✕</button>
          ${m.image ? `<img src="${m.image}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 8px 8px 0 0;" />` : ""}
          <div style="padding: 8px 12px 10px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; line-height: 1.4;">${m.title}</div>
            <div style="color: #2563eb; font-weight: 700; font-size: 14px;">$${(m.price / 100).toLocaleString()}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 250, closeButton: false, className: 'map-listing-popup' });
      cluster.addLayer(marker);
    });
  }, [markers]);

  // Global handlers for popup interactions
  useEffect(() => {
    (window as any).__mapNavigate = (path: string) => {
      router.push(path);
    };
    (window as any).__mapClosePopup = () => {
      if (mapRef.current) {
        mapRef.current.closePopup();
      }
    };
    return () => {
      delete (window as any).__mapNavigate;
      delete (window as any).__mapClosePopup;
    };
  }, [router]);

  return <div ref={containerRef} className={styles.map} />;
}
