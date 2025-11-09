/**
 * Format price from minor units (cents) to readable currency format
 * @param priceMinor - Price in minor units (e.g., 50000 for $500.00)
 * @param currency - Currency code (e.g., 'USD', 'EUR', 'SYP')
 * @returns Formatted price string (e.g., '$500' or '500,000 ل.س')
 */
export function formatPrice(priceMinor: number, currency: string): string {
  const priceInMajor = priceMinor / 100;

  // Currency symbols and formatting
  const currencyConfig: Record<string, { symbol: string; position: 'before' | 'after' }> = {
    USD: { symbol: '$', position: 'before' },
    EUR: { symbol: '€', position: 'before' },
    SYP: { symbol: 'ل.س', position: 'after' },
    SAR: { symbol: 'ر.س', position: 'after' },
    AED: { symbol: 'د.إ', position: 'after' },
  };

  const config = currencyConfig[currency] || { symbol: currency, position: 'after' };
  const formattedAmount = Math.round(priceInMajor).toLocaleString('en-US');

  if (config.position === 'before') {
    return `${config.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${config.symbol}`;
  }
}
