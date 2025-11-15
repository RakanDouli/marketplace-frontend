import { useCurrencyStore, CURRENCY_SYMBOLS, type Currency } from '@/stores/currencyStore';

/**
 * Format price from USD minor units (cents) to user's preferred currency
 * @param priceMinorUSD - Price in USD minor units (e.g., 50000 for $500.00)
 * @param toCurrency - Target currency (optional, uses preferredCurrency from store)
 * @returns Formatted price string (e.g., '$500' or '6,500,000 S£')
 */
export function formatPrice(priceMinorUSD: number, toCurrency?: Currency): string {
  const { preferredCurrency, convertPrice } = useCurrencyStore.getState();
  const targetCurrency = toCurrency || preferredCurrency;

  // Convert USD cents to USD dollars
  const usdDollars = priceMinorUSD / 100;

  // Convert to target currency
  const convertedAmount = targetCurrency === 'USD'
    ? usdDollars
    : convertPrice(usdDollars, targetCurrency);

  // Format with commas
  const formattedAmount = Math.round(convertedAmount).toLocaleString('en-US');

  // Get symbol
  const symbol = CURRENCY_SYMBOLS[targetCurrency];

  // USD and EUR symbols go before, SYP goes after
  if (targetCurrency === 'USD' || targetCurrency === 'EUR') {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${symbol}`;
  }
}

/**
 * Format price range (min-max)
 */
export function formatPriceRange(minMinorUSD: number, maxMinorUSD: number, toCurrency?: Currency): string {
  const min = formatPrice(minMinorUSD, toCurrency);
  const max = formatPrice(maxMinorUSD, toCurrency);
  return `${min} - ${max}`;
}
