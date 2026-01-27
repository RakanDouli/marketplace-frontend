import '../styles/main.scss';
import type { Metadata } from 'next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ErrorBoundary } from '../components/slices';
import { generateDefaultMetadata } from '../utils/seo';
import { PublicLayoutClient } from '../components/layouts/PublicLayoutClient';
import { AdSenseScriptLoader } from '../components/ads/AdSenseScriptLoader';
import { JsonLd, generateOrganizationSchema, generateWebsiteSchema } from '../components/seo';
import { CategoriesProvider } from '../providers/CategoriesProvider';
import { Category } from '../stores/types';
import { ListingType } from '../common/enums';

export const metadata: Metadata = generateDefaultMetadata('ar');

// GraphQL query for categories - fetched ONCE at root level
const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      icon
      supportedListingTypes
    }
  }
`;

// Server-side fetch for categories - runs once, cached for 60 seconds
async function fetchCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATEGORIES_QUERY }),
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return [];
    }

    // Map to Category type
    return (data.data?.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr || cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
      icon: cat.icon,
      supportedListingTypes: (cat.supportedListingTypes || [ListingType.SALE]) as ListingType[],
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch categories server-side - available to ALL pages instantly
  const categories = await fetchCategories();

  return (
    <html lang="ar" dir="rtl" data-theme="light">
      <head>
        {/* Favicon for browser tabs */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3D5CB6" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload critical fonts to reduce CLS from font swapping */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Beiruti:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Beiruti:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap"
        />
        {/* AdSense script is loaded dynamically by AdSenseScriptLoader with client ID from database */}
        {/* Schema.org structured data for SEO */}
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateWebsiteSchema()} />
      </head>
      <body>
        <LanguageProvider defaultLanguage="ar">
          <ThemeProvider>
            <ErrorBoundary>
              {/* Dynamic AdSense script loader - fetches client ID from database */}
              <AdSenseScriptLoader />
              {/* Categories hydrated from server - available to all components instantly */}
              <CategoriesProvider categories={categories}>
                <PublicLayoutClient>
                  {children}
                </PublicLayoutClient>
              </CategoriesProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}