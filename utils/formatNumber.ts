/**
 * Format number with commas (e.g., 5000 -> 5,000)
 */
export function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(num)) return '';
  
  // Format with commas, no decimals
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Remove commas from formatted number string (e.g., "5,000" -> 5000)
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}
