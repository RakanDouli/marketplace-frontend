'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './GoogleAdSense.module.scss';

export interface GoogleAdSenseProps {
  client: string; // Google AdSense client ID (ca-pub-...)
  slot: string; // Ad slot ID
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  client,
  slot,
  format = 'auto',
  responsive = true,
  style,
  className,
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Only load ad once
    if (adLoaded) return;

    try {
      // Wait longer for container to be fully rendered and measured
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && adRef.current) {
          const width = adRef.current.offsetWidth;
          const height = adRef.current.offsetHeight;

          console.log(`📐 GoogleAdSense: Container dimensions - width: ${width}px, height: ${height}px`);

          if (width > 0) {
            console.log('✅ GoogleAdSense: Loading ad with valid dimensions');
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              setAdLoaded(true);
            } catch (pushError) {
              console.error('❌ GoogleAdSense: Failed to push ad:', pushError);
              setAdError(true);
            }
          } else {
            console.warn('⚠️ GoogleAdSense: Container width is 0, retrying in 300ms...');
            // Retry after a longer delay
            setTimeout(() => {
              if (adRef.current) {
                const retryWidth = adRef.current.offsetWidth;
                console.log(`📐 GoogleAdSense: Retry - width: ${retryWidth}px`);

                if (retryWidth > 0) {
                  console.log('✅ GoogleAdSense: Loading ad on retry');
                  try {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                    setAdLoaded(true);
                  } catch (pushError) {
                    console.error('❌ GoogleAdSense: Failed to push ad on retry:', pushError);
                    setAdError(true);
                  }
                } else {
                  console.error('❌ GoogleAdSense: Container still has no width after retry');
                  setAdError(true);
                  setShouldRender(false);
                }
              }
            }, 300);
          }
        }
      }, 300);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('❌ GoogleAdSense: Failed to load ad:', error);
      setAdError(true);
    }
  }, [adLoaded]);

  console.log(`✅ GoogleAdSense: Rendering ad container - client: ${client}, slot: ${slot}, adError: ${adError}, shouldRender: ${shouldRender}`);

  return (
    <>
      {/* Only render container if no errors and should render */}
      {!adError && shouldRender && (
        <div ref={adRef} className={`${styles.googleAdSense} ${className || ''}`} style={style}>
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
      )}

      {/* Log when returning null */}
      {(adError || !shouldRender) && (
        <>
          {console.log(`📢 GoogleAdSense: NOT rendering (returning NULL) - adError: ${adError}, shouldRender: ${shouldRender}, client: ${client}, slot: ${slot}`)}
          {null}
        </>
      )}
    </>
  );
};
