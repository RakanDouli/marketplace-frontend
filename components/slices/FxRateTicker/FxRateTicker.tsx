'use client';

import React, { useEffect } from 'react';
import { useCurrencyStore, CURRENCY_SYMBOLS, type Currency } from '@/stores/currencyStore';
import { Text } from '@/components/slices';
import styles from './FxRateTicker.module.scss';

interface FxRateTickerProps {
  className?: string;
}

export const FxRateTicker: React.FC<FxRateTickerProps> = ({ className }) => {
  const { exchangeRates, fetchExchangeRates } = useCurrencyStore();

  // Fetch rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Build list of all currencies (except SYP) to show rates against SYP
  const currencies: Currency[] = ['USD', 'EUR']; // Dynamic - add more here
  const rates = currencies.map(currency => ({
    currency,
    rate: exchangeRates[`${currency}_SYP`] || 1,
  }));

  const formatRate = (rate: number): string => {
    return Math.round(rate).toLocaleString('en-US');
  };

  if (rates.length === 0) return null;

  // Create enough duplicates to ensure seamless infinite scroll
  const repeatedRates = [...rates, ...rates];

  return (
    <div className={styles.fxRateTicker}>
      <div className={styles.tickerTrack}>
        {repeatedRates.map((item, i) => (
          <div key={i} className={styles.tickerItem}>
            <Text variant="small">
              {CURRENCY_SYMBOLS[item.currency]}1 = {formatRate(item.rate)} SYP
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};
