'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container, ContainerProps } from '@/components/slices/Container/Container';
import styles from './GoogleAdSense.module.scss';

export interface GoogleAdSenseProps {
  client: string; // Google AdSense client ID (ca-pub-...)
  slot: string; // Ad slot ID
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
  // Container props - only applied when ad is visible
  paddingY?: ContainerProps["paddingY"];
  size?: ContainerProps["size"];
}

/**
 * GoogleAdSense component - renders a Google AdSense ad unit
 *
 * Strategy: Start HIDDEN, only show when ad is confirmed filled.
 * This prevents the "flash" effect where container shows then hides.
 */
export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  client,
  slot,
  format = 'auto',
  responsive = true,
  style,
  className,
  paddingY = 'md',
  size = 'lg',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  // Start hidden - only show when ad confirmed loaded
  const [isVisible, setIsVisible] = useState(false);
  const [adPushed, setAdPushed] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  // Push ad request to AdSense
  useEffect(() => {
    if (adPushed || !containerRef.current) return;

    const timer = setTimeout(() => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setAdPushed(true);
        } catch (err) {
          // Silently fail - ad blocker or network issue
          setAdFailed(true);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [adPushed]);

  // Monitor for ad load status using MutationObserver
  useEffect(() => {
    if (!adPushed || adFailed || !insRef.current) return;

    const ins = insRef.current;

    // Watch for data-ad-status attribute changes (set by AdSense SDK)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const adStatus = ins.getAttribute('data-ad-status');

          if (adStatus === 'filled') {
            // Ad loaded successfully - NOW show the container
            setIsVisible(true);
            observer.disconnect();
            return;
          }

          if (adStatus === 'unfilled') {
            // No ad available - keep hidden
            setAdFailed(true);
            observer.disconnect();
            return;
          }
        }
      }
    });

    observer.observe(ins, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    // Fallback timeout - if no "filled" status after 4 seconds, give up
    const fallbackTimer = setTimeout(() => {
      const adStatus = ins.getAttribute('data-ad-status');
      const hasContent = (ins.querySelector('iframe')?.offsetHeight ?? 0) > 50;

      if (adStatus === 'filled' || hasContent) {
        // Ad loaded - show it
        setIsVisible(true);
      } else {
        // Ad failed - stay hidden
        setAdFailed(true);
      }

      observer.disconnect();
    }, 4000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [adPushed, adFailed]);

  // If failed, return nothing
  if (adFailed) {
    return null;
  }

  // The ad content (hidden until loaded)
  const adContent = (
    <div
      ref={containerRef}
      className={`${styles.googleAdSense} ${className || ''}`}
      style={{
        ...style,
        // Hide completely until ad is confirmed loaded (no margin, no height, no visibility)
        visibility: isVisible ? 'visible' : 'hidden',
        height: isVisible ? 'auto' : 0,
        margin: isVisible ? undefined : 0,
        padding: isVisible ? undefined : 0,
        overflow: 'hidden',
      }}
    >
      {isVisible && <div className={styles.adLabel}>إعلان</div>}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );

  // Wrap in Container ONLY when ad is visible (to respect max-width limits)
  // When hidden, render without Container to avoid empty padding
  if (isVisible) {
    return (
      <Container paddingY={paddingY} size={size}>
        {adContent}
      </Container>
    );
  }

  // Render hidden ad content without Container wrapper
  return adContent;
};
