'use client';

import { useEffect, useState } from 'react';
import { useAdsStore } from '@/stores/adsStore';

/**
 * Dynamically loads the Google AdSense script with the client ID from database.
 * This ensures the script uses the same client ID as the ad containers.
 */
export const AdSenseScriptLoader: React.FC = () => {
  const { fetchAdSenseSettings } = useAdsStore();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await fetchAdSenseSettings();
      if (settings?.clientId) {
        setClientId(settings.clientId);
      }
    };
    loadSettings();
  }, [fetchAdSenseSettings]);

  useEffect(() => {
    // Only load script once we have a valid client ID
    if (!clientId || scriptLoaded) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    // Create and append the AdSense script
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      // Use warn instead of error to avoid Next.js 16 error overlay in development
      // This is expected to fail on localhost or with ad blockers
      console.warn('⚠️ AdSenseScriptLoader: Failed to load AdSense script (expected on localhost or with ad blockers)');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup - AdSense needs it to stay
    };
  }, [clientId, scriptLoaded]);

  // This component doesn't render anything visible
  return null;
};
