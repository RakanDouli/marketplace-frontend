'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Bot, Sparkles, Search, Rocket, TrendingUp, CheckCircle } from 'lucide-react';
import { Text } from '@/components/slices';
import styles from './ListingSubmitLoader.module.scss';

interface ListingSubmitLoaderProps {
  isVisible: boolean;
}

// Loading messages with Lucide icons
const LOADING_MESSAGES = [
  { text: 'جاري رفع الصور', Icon: Upload },
  { text: 'نحلل المحتوى بالذكاء الاصطناعي', Icon: Bot },
  { text: 'نتحقق من جودة الإعلان', Icon: Sparkles },
  { text: 'نفحص الصور تلقائياً', Icon: Search },
  { text: 'نجهز إعلانك للنشر', Icon: Rocket },
  { text: 'نحسّن ظهور إعلانك...', Icon: TrendingUp },
  { text: 'اللمسات الأخيرة', Icon: CheckCircle },
];

export const ListingSubmitLoader: React.FC<ListingSubmitLoaderProps> = ({ isVisible }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      return;
    }

    // Change message every 2 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last message
      });
    }, 2000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const currentMessage = LOADING_MESSAGES[currentMessageIndex];
  const CurrentIcon = currentMessage.Icon;

  return (
    <div className={styles.inlineLoader}>
      <div className={styles.iconWrapper}>
        <CurrentIcon size={18} className={styles.icon} />
      </div>
      <Text variant="paragraph" className={styles.text}>
        {currentMessage.text}
      </Text>
      <div className={styles.dots}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
    </div>
  );
};

export default ListingSubmitLoader;
