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

/**
 * Format price for ad campaigns (stored as decimal dollars, not minor units)
 * @param price - Price in dollars (e.g., 150.00)
 * @param currency - Currency code (USD, EUR, SYP)
 * @returns Formatted price string (e.g., '$150.00' or '150.00 S£')
 */
export function formatAdPrice(price: number, currency: string = 'USD'): string {
  // Format with 2 decimal places and commas
  const formattedAmount = Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Get symbol
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'SYP': 'S£',
    'AED': 'د.إ',
    'SAR': 'ر.س'
  };

  const symbol = symbols[currency] || currency;

  // USD and EUR symbols go before, others go after
  if (currency === 'USD' || currency === 'EUR') {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${symbol}`;
  }
}
