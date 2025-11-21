'use client';

import React, { useEffect } from 'react';
import styles from './GoogleAdSense.module.scss';

export interface GoogleAdSenseProps {
  client: string; // Google AdSense client ID (ca-pub-...)
  slot: string; // Ad slot ID
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  style?: React.CSSProperties;
}

export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  client,
  slot,
  format = 'auto',
  responsive = true,
  style,
}) => {
  useEffect(() => {
    try {
      // Push ad to Google AdSense queue
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('❌ GoogleAdSense: Failed to load ad:', error);
    }
  }, []);

  return (
    <div className={styles.googleAdSense} style={style}>
      <div className={styles.adLabel}>إعلان</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};
