import '../styles/main.scss';
import type { Metadata } from 'next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ErrorBoundary } from '../components/slices';
import { generateDefaultMetadata } from '../utils/seo';
import { PublicLayoutClient } from '../components/layouts/PublicLayoutClient';
import { AdSenseScriptLoader } from '../components/ads/AdSenseScriptLoader';
import { EnvironmentBadge } from '../components/EnvironmentBadge';

export const metadata: Metadata = generateDefaultMetadata('ar');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* AdSense script is loaded dynamically by AdSenseScriptLoader with client ID from database */}
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
              <EnvironmentBadge />
            </ErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}