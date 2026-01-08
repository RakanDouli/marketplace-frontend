import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * JSON-LD structured data component for SEO
 * Renders Schema.org markup in <script type="application/ld+json">
 */
export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

/**
 * Generate Product schema for a listing
 * Works for any listing type (cars, real estate, computers, etc.)
 */
export function generateListingSchema(listing: {
  id: string;
  title: string;
  description?: string;
  priceMinor?: number;
  imageKeys?: string[];
  location?: { city?: string; province?: string };
  user?: { name?: string };
  category?: { name?: string; slug?: string };
  createdAt?: string;
  updatedAt?: string;
  specs?: Record<string, any>;
  specsDisplay?: Record<string, any>;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';
  const cloudflareUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL || 'https://imagedelivery.net';

  // Get first image or use placeholder
  const imageUrl = listing.imageKeys?.[0]
    ? `${cloudflareUrl}/${listing.imageKeys[0]}/public`
    : `${baseUrl}/placeholder.jpg`;

  // Get price in dollars (priceMinor is in cents)
  const price = listing.priceMinor ? (listing.priceMinor / 100).toFixed(2) : undefined;

  // Build location string
  const locationParts = [listing.location?.city, listing.location?.province].filter(Boolean);
  const locationString = locationParts.join('، ') || 'سوريا';

  // Get brand/make from specs if available (for vehicles)
  const specs = listing.specsDisplay || listing.specs || {};
  const brand = specs.brand || specs.make || specs.الماركة;
  const model = specs.model || specs.الموديل;
  const year = specs.year || specs.السنة;

  // Base Product schema
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description || listing.title,
    image: imageUrl,
    url: `${baseUrl}/${listing.category?.slug || 'cars'}/${listing.id}`,
    sku: listing.id,
    category: listing.category?.name || 'إعلانات',
  };

  // Add price if available
  if (price) {
    schema.offers = {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: listing.user?.name || 'بائع',
      },
      areaServed: {
        '@type': 'Place',
        name: locationString,
      },
    };
  }

  // Add brand if available
  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: typeof brand === 'object' ? brand.value : brand,
    };
  }

  // Add model if available
  if (model) {
    schema.model = typeof model === 'object' ? model.value : model;
  }

  // Add production date if year available
  if (year) {
    const yearValue = typeof year === 'object' ? year.value : year;
    schema.productionDate = yearValue.toString();
  }

  // Add dates
  if (listing.createdAt) {
    schema.datePublished = listing.createdAt;
  }
  if (listing.updatedAt) {
    schema.dateModified = listing.updatedAt;
  }

  return schema;
}

/**
 * Generate Vehicle schema (more specific for cars)
 */
export function generateVehicleSchema(listing: {
  id: string;
  title: string;
  description?: string;
  priceMinor?: number;
  imageKeys?: string[];
  location?: { city?: string; province?: string };
  user?: { name?: string };
  category?: { name?: string; slug?: string };
  specs?: Record<string, any>;
  specsDisplay?: Record<string, any>;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';
  const cloudflareUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL || 'https://imagedelivery.net';

  const specs = listing.specsDisplay || listing.specs || {};

  // Extract vehicle-specific specs
  const brand = specs.brand || specs.make || specs.الماركة;
  const model = specs.model || specs.الموديل;
  const year = specs.year || specs.السنة;
  const mileage = specs.mileage || specs.المسافة_المقطوعة;
  const fuelType = specs.fuelType || specs.نوع_الوقود;
  const transmission = specs.transmission || specs.ناقل_الحركة;
  const color = specs.color || specs.اللون;

  const getValue = (val: any) => (typeof val === 'object' ? val.value : val);

  const imageUrl = listing.imageKeys?.[0]
    ? `${cloudflareUrl}/${listing.imageKeys[0]}/public`
    : `${baseUrl}/placeholder.jpg`;

  const price = listing.priceMinor ? (listing.priceMinor / 100).toFixed(2) : undefined;

  const locationParts = [listing.location?.city, listing.location?.province].filter(Boolean);
  const locationString = locationParts.join('، ') || 'سوريا';

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: listing.title,
    description: listing.description || listing.title,
    image: imageUrl,
    url: `${baseUrl}/${listing.category?.slug || 'cars'}/${listing.id}`,
    vehicleIdentificationNumber: listing.id, // Using listing ID as unique identifier
  };

  // Add brand
  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: getValue(brand),
    };
    schema.manufacturer = {
      '@type': 'Organization',
      name: getValue(brand),
    };
  }

  // Add model
  if (model) {
    schema.model = getValue(model);
  }

  // Add year
  if (year) {
    schema.modelDate = getValue(year).toString();
    schema.vehicleModelDate = getValue(year).toString();
  }

  // Add mileage
  if (mileage) {
    schema.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      value: parseInt(getValue(mileage)) || 0,
      unitCode: 'KMT', // Kilometers
    };
  }

  // Add fuel type
  if (fuelType) {
    schema.fuelType = getValue(fuelType);
  }

  // Add transmission
  if (transmission) {
    schema.vehicleTransmission = getValue(transmission);
  }

  // Add color
  if (color) {
    schema.color = getValue(color);
  }

  // Add offer/price
  if (price) {
    schema.offers = {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: listing.user?.name || 'بائع',
      },
      areaServed: {
        '@type': 'Place',
        name: locationString,
      },
    };
  }

  return schema;
}

/**
 * Generate Organization schema for the website
 */
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'شمباي',
    alternateName: 'Shambay',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'أكبر سوق إلكتروني في سوريا لبيع وشراء السيارات والعقارات',
    areaServed: {
      '@type': 'Country',
      name: 'سوريا',
    },
    sameAs: [
      // Add social media links when available
    ],
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'شمباي',
    alternateName: 'Shambay',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/cars?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export default JsonLd;
