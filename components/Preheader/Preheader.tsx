'use client';

import React from 'react';
import { Container, Input } from '@/components/slices';
import { FxRateTicker } from '@/components/slices/FxRateTicker';
import { useCurrencyStore, CURRENCY_SYMBOLS, CURRENCY_LABELS, type Currency } from '@/stores/currencyStore';
import styles from './Preheader.module.scss';

export const Preheader: React.FC = () => {
  const { preferredCurrency, setPreferredCurrency } = useCurrencyStore();

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreferredCurrency(e.target.value as Currency);
  };

  return (
    <div className={styles.preheader}>
      <Container padding={false}>
        <div className={styles.preheaderContent}>
          <FxRateTicker className={styles.ticker} />
          <div className={styles.currencySelector}>
            <Input
              type="select"
              value={preferredCurrency}
              onChange={handleCurrencyChange}
              options={[
                { value: 'USD', label: `${CURRENCY_SYMBOLS.USD} ${CURRENCY_LABELS.USD}` },
                { value: 'EUR', label: `${CURRENCY_SYMBOLS.EUR} ${CURRENCY_LABELS.EUR}` },
                { value: 'SYP', label: `${CURRENCY_SYMBOLS.SYP} ${CURRENCY_LABELS.SYP}` },
              ]}

            />
          </div>


        </div>
      </Container>
    </div>
  );
};
