// Currency conversion utilities for price filtering
// Supports USD, SYP, EUR only

const GRAPHQL_ENDPOINT = '/api/graphql';

// Supported currencies (simplified)
export type Currency = "USD" | "SYP" | "EUR";

export const CURRENCIES: Currency[] = ["USD", "SYP", "EUR"];

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "USD ($) - الدولار الأمريكي",
  SYP: "SYP (S£) - الليرة السورية",
  EUR: "EUR (€) - اليورو"
};

// GraphQL query to convert currency
const CONVERT_CURRENCY_QUERY = `
  query ConvertCurrency($amount: Float!, $from: String!, $to: String!) {
    convertCurrency(amount: $amount, from: $from, to: $to)
  }
`;

// Simple GraphQL request function
async function graphqlRequest(query: string, variables: any): Promise<any> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Convert price amount from any currency to USD (for backend filtering)
 * @param amount - Amount in dollars
 * @param fromCurrency - Source currency
 * @returns Amount in USD dollars
 */
export async function convertToUSD(amount: number, fromCurrency: Currency): Promise<number> {
  if (fromCurrency === "USD") return amount;

  const data = await graphqlRequest(CONVERT_CURRENCY_QUERY, {
    amount,
    from: fromCurrency,
    to: "USD"
  });
  return Math.round(data.convertCurrency);
}

/**
 * Parse price input (returns dollars)
 */
export function parsePrice(priceString: string): number {
  const parsed = parseFloat(priceString);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed); // Returns dollars (whole numbers)
}