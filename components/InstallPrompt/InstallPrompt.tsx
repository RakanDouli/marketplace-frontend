'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Modal, Button, Text } from '@/components/slices';
import styles from './InstallPrompt.module.scss';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently (don't show for 1 day)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 1) return;
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For mobile (iOS or Android), show after 2 seconds
    // This ensures it shows even if beforeinstallprompt doesn't fire
    if (!standalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome - trigger native prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        handleDismiss();
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <Modal isVisible={showPrompt} onClose={handleDismiss} maxWidth="md">
      <div className={styles.content}>
        <div className={styles.appIcon}>
          <Image src="/icons/icon-96x96.png" alt="شام باي" width={64} height={64} />
        </div>

        <Text variant="h3" className={styles.title}>تطبيق شام باي</Text>
        <Text variant="paragraph" color="secondary" className={styles.subtitle}>
          أضف التطبيق للشاشة الرئيسية للوصول السريع
        </Text>

        {isIOS ? (
          <div className={styles.iosInstructions}>
            <Text variant="paragraph">
              اضغط على زر المشاركة <span className={styles.shareIcon}>⬆</span> ثم اختر "إضافة للشاشة الرئيسية"
            </Text>
          </div>
        ) : (
          <div className={styles.actions}>
            <Button onClick={handleInstall}>تحميل التطبيق</Button>
            <Button variant="outline" onClick={handleDismiss}>لاحقاً</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
