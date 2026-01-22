import '../styles/main.scss';
import type { Metadata } from 'next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ErrorBoundary } from '../components/slices';
import { generateDefaultMetadata } from '../utils/seo';
import { PublicLayoutClient } from '../components/layouts/PublicLayoutClient';
import { AdSenseScriptLoader } from '../components/ads/AdSenseScriptLoader';
import { JsonLd, generateOrganizationSchema, generateWebsiteSchema } from '../components/seo';

export const metadata: Metadata = generateDefaultMetadata('ar');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-theme="light">
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3D5CB6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
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
              <PublicLayoutClient>
                {children}
              </PublicLayoutClient>
            </ErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}