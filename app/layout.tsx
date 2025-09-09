import '../styles/main.scss';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { NotificationToast } from '@/components/slices/NotificationToast/NotificationToast';
import { generateDefaultMetadata } from '@/utils/seo';

export const metadata: Metadata = generateDefaultMetadata('ar');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-theme="light">
      <body>
        <I18nProvider defaultLanguage="ar">
          <ThemeProvider>
            {children}
            <NotificationToast />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}