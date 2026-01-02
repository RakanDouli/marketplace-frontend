'use client';

import { useState, useEffect } from 'react';
import { useCurrencyStore, CURRENCY_SYMBOLS, type Currency } from '@/stores/currencyStore';

interface ClientPriceProps {
  /** Price in USD (minor units or whole dollars depending on your data) */
  price: number;
  /** Fallback text when price is not available */
  fallback?: string;
  /** Optional class name for styling */
  className?: string;
}

/**
 * SSR-safe price display component.
 *
 * Renders USD on server/initial hydration, then updates to user's
 * preferred currency on client after mount. This prevents hydration
 * mismatches when server renders USD but client prefers SYP/EUR.
 *
 * Usage:
 * ```tsx
 * <ClientPrice price={16697} fallback="السعر غير محدد" />
 * ```
 */
export const ClientPrice: React.FC<ClientPriceProps> = ({
  price,
  fallback = 'السعر غير محدد',
  className,
}) => {
  // Start with USD to match server render
  const [displayPrice, setDisplayPrice] = useState<string>(() => {
    if (price === null || price === undefined || isNaN(price)) {
      return fallback;
    }
    return formatPriceInCurrency(price, 'USD');
  });

  const { preferredCurrency, convertPrice } = useCurrencyStore();

  // Update to user's preferred currency after hydration
  useEffect(() => {
    if (price === null || price === undefined || isNaN(price)) {
      setDisplayPrice(fallback);
      return;
    }

    const formattedPrice = formatPriceWithConversion(
      price,
      preferredCurrency,
      convertPrice
    );
    setDisplayPrice(formattedPrice);
  }, [price, preferredCurrency, convertPrice, fallback]);

  return (
    <span className={className} suppressHydrationWarning>
      {displayPrice}
    </span>
  );
};

/**
 * Format price in a specific currency (no conversion)
 */
function formatPriceInCurrency(price: number, currency: Currency): string {
  const isWholeNumber = price % 1 === 0;
  const formattedAmount = price.toLocaleString('en-US', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const symbol = CURRENCY_SYMBOLS[currency];

  // USD and EUR symbols go before, SYP goes after
  if (currency === 'USD' || currency === 'EUR') {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${symbol}`;
  }
}

/**
 * Format price with currency conversion
 */
function formatPriceWithConversion(
  price: number,
  targetCurrency: Currency,
  convertPrice: (price: number, to: Currency) => number
): string {
  // Convert to target currency
  const convertedAmount = targetCurrency === 'USD'
    ? price
    : convertPrice(price, targetCurrency);

  return formatPriceInCurrency(convertedAmount, targetCurrency);
}

export default ClientPrice;
