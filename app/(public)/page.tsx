'use client';

import { Container, Button, ThemeToggle } from '@/components/slices';
import { useI18n } from '@/contexts/I18nContext';
import { useNotificationStore } from '@/store';

export default function HomePage() {
  const { t, language } = useI18n();
  const { addNotification } = useNotificationStore();

  const handleBrowseCars = () => {
    addNotification({
      type: 'info',
      title: t('notifications.info'),
      message: language === 'ar' 
        ? 'قريباً.. وظيفة تصفح السيارات قيد التطوير' 
        : 'Browse cars functionality coming soon!',
    });
  };

  const handleAddListing = () => {
    addNotification({
      type: 'success',
      title: t('notifications.success'),
      message: language === 'ar'
        ? 'قريباً.. وظيفة إضافة الإعلانات قيد التطوير'
        : 'Add listing functionality coming soon!',
    });
  };

  return (
    <main className="min-h-screen">
      <Container outer>
        <Container inner padding="2rem 1rem">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className="text-center">
            <h1 className="mb-8" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {t('nav.home')} - مرحباً بكم في سوق سوريا
            </h1>
            <p className="text-muted mb-8" style={{ fontSize: '1.125rem' }}>
              {t('seo.defaultDescription')}
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" size="lg" onClick={handleBrowseCars}>
                {t('nav.listings')}
              </Button>
              <Button variant="ghost" size="lg" onClick={handleAddListing}>
                {t('nav.sell')}
              </Button>
            </div>
          </div>
        </Container>
      </Container>
    </main>
  );
}