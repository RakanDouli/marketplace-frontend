'use client';

import React, { useState, useEffect } from 'react';
import { Text } from '@/components/slices';
import styles from './ListingSubmitLoader.module.scss';

interface ListingSubmitLoaderProps {
  isVisible: boolean;
}

// Creative Arabic messages for the loading process
const LOADING_MESSAGES = [
  { text: 'جاري رفع الصور...', icon: '📸' },
  { text: 'نحلل المحتوى بالذكاء الاصطناعي...', icon: '🤖' },
  { text: 'نتحقق من جودة الإعلان...', icon: '✨' },
  { text: 'نفحص الصور تلقائياً...', icon: '🔍' },
  { text: 'نجهز إعلانك للنشر...', icon: '🚀' },
  { text: 'نحسّن ظهور إعلانك...', icon: '📈' },
  { text: 'اللمسات الأخيرة...', icon: '🎯' },
];

export const ListingSubmitLoader: React.FC<ListingSubmitLoaderProps> = ({ isVisible }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      setProgress(0);
      return;
    }

    // Change message every 2.5 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last message
      });
    }, 2500);

    // Update progress smoothly
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          // Slow down as it approaches 95%
          const increment = prev < 50 ? 3 : prev < 80 ? 2 : 1;
          return Math.min(prev + increment, 95);
        }
        return prev;
      });
    }, 200);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const currentMessage = LOADING_MESSAGES[currentMessageIndex];

  return (
    <div className={styles.overlay}>
      <div className={styles.loaderCard}>
        {/* AI Brain Animation */}
        <div className={styles.iconContainer}>
          <div className={styles.pulseRing}></div>
          <div className={styles.pulseRing} style={{ animationDelay: '0.5s' }}></div>
          <span className={styles.mainIcon}>{currentMessage.icon}</span>
        </div>

        {/* Current Message */}
        <Text variant="h3" className={styles.message}>
          {currentMessage.text}
        </Text>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <Text variant="small" color="secondary" className={styles.progressText}>
            {progress}%
          </Text>
        </div>

        {/* Subtitle */}
        <Text variant="small" color="secondary" className={styles.subtitle}>
          نستخدم الذكاء الاصطناعي لضمان جودة إعلانك
        </Text>

        {/* Animated Dots */}
        <div className={styles.dotsContainer}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>
      </div>
    </div>
  );
};

export default ListingSubmitLoader;
