import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = "USD" | "EUR" | "SYP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  SYP: "S£",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "الدولار الأمريكي",
  EUR: "اليورو",
  SYP: "الليرة السورية",
};

interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: Date;
}

interface CurrencyStore {
  preferredCurrency: Currency;
  exchangeRates: Record<string, number>; // Key: "USD_SYP", "EUR_SYP", etc.
  lastUpdated: Date | null;

  setPreferredCurrency: (currency: Currency) => void;
  fetchExchangeRates: () => Promise<void>;
  getRate: (from: Currency, to: Currency) => number;
  convertPrice: (amountUSD: number, toCurrency?: Currency) => number;
}

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

async function fetchRate(from: Currency, to: Currency): Promise<number> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetExchangeRate($from: String!, $to: String!) {
            getExchangeRate(from: $from, to: $to)
          }
        `,
        variables: { from, to },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      // Return 1 on error - the API should handle fallback to database
      return 1;
    }

    return result.data.getExchangeRate;
  } catch (error) {
    // Return 1 on error - backend handles fallback to last saved rate
    return 1;
  }
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      preferredCurrency: 'SYP',
      exchangeRates: {
        // Initial rates - will be fetched from API on mount
        USD_USD: 1,
        EUR_EUR: 1,
        SYP_SYP: 1,
        USD_EUR: 1,
        USD_SYP: 1,
        EUR_USD: 1,
        EUR_SYP: 1,
        SYP_USD: 1,
        SYP_EUR: 1,
      },
      lastUpdated: null,

      setPreferredCurrency: (currency) => {
        set({ preferredCurrency: currency });
      },

      fetchExchangeRates: async () => {
        try {
          const currencies: Currency[] = ['USD', 'EUR', 'SYP'];
          const rates: Record<string, number> = {};

          // Fetch all combinations
          const ratePromises: Promise<void>[] = [];

          for (const from of currencies) {
            for (const to of currencies) {
              if (from === to) {
                rates[`${from}_${to}`] = 1;
              } else {
                ratePromises.push(
                  fetchRate(from, to).then(rate => {
                    rates[`${from}_${to}`] = rate;
                  })
                );
              }
            }
          }

          await Promise.all(ratePromises);

          set({ exchangeRates: rates, lastUpdated: new Date() });
        } catch (error) {
          // Silently fail - rates will remain at fallback values
        }
      },

      getRate: (from, to) => {
        if (from === to) return 1;
        const key = `${from}_${to}`;
        return get().exchangeRates[key] || 1;
      },

      convertPrice: (amountUSD, toCurrency) => {
        const currency = toCurrency || get().preferredCurrency;
        const rate = get().getRate('USD', currency);
        return Math.round(amountUSD * rate);
      },
    }),
    {
      name: 'currency-storage',
      // Only persist user preference, NOT exchange rates
      // Rates should always be fetched fresh from API
      partialize: (state) => ({
        preferredCurrency: state.preferredCurrency,
      }),
    }
  )
);
