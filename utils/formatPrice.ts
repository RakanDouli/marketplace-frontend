import { useCurrencyStore, CURRENCY_SYMBOLS, type Currency } from '@/stores/currencyStore';

/**
 * Format price in dollars to user's preferred currency
 * @param price - Price in dollars (e.g., 500 for $500, 29.99 for $29.99)
 * @param toCurrency - Target currency (optional, uses preferredCurrency from store)
 * @returns Formatted price string (e.g., '$500' or '6,500,000 S£')
 */
export function formatPrice(price: number, toCurrency?: Currency): string {
  // Handle invalid values
  if (price === null || price === undefined || isNaN(price)) {
    return '$0';
  }

  const { preferredCurrency, convertPrice } = useCurrencyStore.getState();
  const targetCurrency = toCurrency || preferredCurrency;

  // Convert to target currency
  const convertedAmount = targetCurrency === 'USD'
    ? price
    : convertPrice(price, targetCurrency);

  // Format with commas, no decimals for whole numbers
  const isWholeNumber = convertedAmount % 1 === 0;
  const formattedAmount = convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2
  });

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
export function formatPriceRange(min: number, max: number, toCurrency?: Currency): string {
  return `${formatPrice(min, toCurrency)} - ${formatPrice(max, toCurrency)}`;
}

/**
 * @deprecated Use formatPrice() instead - same function, kept for compatibility
 */
export function formatAdPrice(price: number, currency: string = 'USD'): string {
  return formatPrice(price);
}
