/**
 * Map Provider Types - Following Liskov Substitution Principle
 * Any map provider (OpenStreetMap, Google Maps, Mapbox, etc.) can be swapped
 * without changing the component code
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  province?: string;
  city?: string;
  area?: string;
  coordinates?: Coordinates;
  link?: string;
}

export type ZoomLevel = number; // 1-20, where higher = more zoomed in

export interface MapConfig {
  center: Coordinates;
  zoom: ZoomLevel;
  marker?: Coordinates;
}

/**
 * Abstract Map Provider Interface
 * All providers must implement this interface
 */
export interface IMapProvider {
  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Calculate map configuration based on location data
   * Determines center point and zoom level based on available location details
   */
  calculateMapConfig(location: LocationData): MapConfig | null;

  /**
   * Render the map component
   */
  renderMap(config: MapConfig): React.ReactElement;
}

/**
 * Map provider types
 */
export type MapProviderType = 'openstreetmap' | 'google' | 'mapbox';
