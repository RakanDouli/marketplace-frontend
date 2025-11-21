import '../styles/main.scss';
import type { Metadata } from 'next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ErrorBoundary } from '../components/slices';
import { generateDefaultMetadata } from '../utils/seo';
import { PublicLayoutClient } from '../components/layouts/PublicLayoutClient';

export const metadata: Metadata = generateDefaultMetadata('ar');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Google AdSense Client ID
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-8877772671863002';

  return (
    <html lang="ar" dir="rtl" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google AdSense Script */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LanguageProvider defaultLanguage="ar">
          <ThemeProvider>
            <ErrorBoundary>
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