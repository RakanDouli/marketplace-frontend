import { Metadata } from 'next';
import { Language, translations, interpolate } from '@/utils/i18n';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  images?: string[];
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: Language;
  alternateLocales?: Language[];
}

export interface VehicleSEOData {
  make: string;
  model: string;
  year: number;
  price: number;
  city: string;
  mileage: number;
  condition: string;
  images: string[];
  id: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shambay.com';
const SITE_NAME = 'Shambay | شام باي';

// Generate meta tags for vehicle listings
export function generateVehicleMetadata(
  vehicle: VehicleSEOData,
  locale: Language = 'en'
): Metadata {
  const t = translations[locale];
  
  const title = interpolate(t.seo.listingTitle, {
    year: vehicle.year.toString(),
    make: vehicle.make,
    model: vehicle.model,
    city: vehicle.city,
    price: vehicle.price.toString(),
  });
  
  const description = interpolate(t.seo.listingDescription, {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year.toString(),
    city: vehicle.city,
    price: vehicle.price.toString(),
    mileage: vehicle.mileage.toString(),
    condition: vehicle.condition,
  });

  const url = `${SITE_URL}/${locale}/listings/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}-${vehicle.year}-${vehicle.city.toLowerCase()}-${vehicle.id}`;
  const images = vehicle.images.map(img => `${SITE_URL}${img}`);

  return {
    title,
    description,
    keywords: [
      `${vehicle.make} ${vehicle.model}`,
      `${vehicle.make} ${vehicle.year}`,
      `cars ${vehicle.city}`,
      `${vehicle.make} for sale`,
      locale === 'ar' ? `سيارات ${vehicle.city}` : `${vehicle.city} cars`,
      locale === 'ar' ? `${vehicle.make} للبيع` : `${vehicle.make} for sale`,
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: images.map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      })),
      type: 'article',
      locale: locale === 'ar' ? 'ar_SY' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: url,
      languages: {
        'en-US': url.replace(`/${locale}/`, '/en/'),
        'ar-SY': url.replace(`/${locale}/`, '/ar/'),
      },
    },
  };
}

// Generate meta tags for search results
export function generateSearchMetadata(
  searchParams: { make?: string; count?: number },
  locale: Language = 'en'
): Metadata {
  const t = translations[locale];
  
  const title = searchParams.make
    ? interpolate(t.seo.searchTitle, { make: searchParams.make })
    : t.seo.defaultTitle;
    
  const description = searchParams.make && searchParams.count
    ? interpolate(t.seo.searchDescription, {
        count: searchParams.count.toString(),
        make: searchParams.make,
      })
    : t.seo.defaultDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: 'website',
      locale: locale === 'ar' ? 'ar_SY' : 'en_US',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

// Generate default site metadata
export function generateDefaultMetadata(locale: Language = 'en'): Metadata {
  const t = translations[locale];
  
  return {
    title: {
      template: `%s | ${SITE_NAME}`,
      default: t.seo.defaultTitle,
    },
    description: t.seo.defaultDescription,
    keywords: [
      locale === 'ar' ? 'إعلانات سوريا' : 'Syria classifieds',
      locale === 'ar' ? 'بيع وشراء' : 'buy and sell',
      locale === 'ar' ? 'سوق سوريا' : 'Syria marketplace',
      locale === 'ar' ? 'شام باي' : 'shambay',
      locale === 'ar' ? 'إعلانات مبوبة' : 'classified ads',
      'Damascus', 'Aleppo', 'Syrian marketplace',
    ],
    authors: [{ name: 'Shambay' }],
    creator: 'Shambay',
    publisher: 'Shambay',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_SY' : 'en_US',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: t.seo.defaultTitle,
      description: t.seo.defaultDescription,
    },
    twitter: {
      card: 'summary',
      title: t.seo.defaultTitle,
      description: t.seo.defaultDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Generate JSON-LD structured data for vehicles
export function generateVehicleJsonLd(vehicle: VehicleSEOData, locale: Language = 'en') {
  const url = `${SITE_URL}/${locale}/listings/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}-${vehicle.year}-${vehicle.city.toLowerCase()}-${vehicle.id}`;
  
  return {
    '@context': 'https://schema.org/',
    '@type': 'Vehicle',
    '@id': url,
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    vehicleModelDate: vehicle.year.toString(),
    bodyType: 'Car',
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.mileage,
      unitCode: 'KMT',
    },
    vehicleCondition: vehicle.condition,
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: url,
      seller: {
        '@type': 'Organization',
        name: 'Shambay',
      },
    },
    image: vehicle.images.map(img => `${SITE_URL}${img}`),
    url: url,
    location: {
      '@type': 'Place',
      name: vehicle.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: vehicle.city,
        addressCountry: 'Syria',
      },
    },
  };
}