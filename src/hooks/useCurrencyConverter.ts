import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for real-time currency conversion using the custom API proxy.
 * Caches rates for the session to minimize API calls.
 */
export function useCurrencyConverter(homeCurrency: string = 'USD') {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exchange-rates/${base}`);
      if (!res.ok) throw new Error('Failed to fetch rates');
      const data = await res.json();
      setRates(data.rates);
    } catch (err: any) {
      console.error("[Vanti Finance] Currency fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates(homeCurrency);
  }, [homeCurrency, fetchRates]);

  const convert = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    if (!rates) return amount;
    
    // If we're converting from base to target
    if (fromCurrency === homeCurrency) {
        const rate = rates[toCurrency];
        return rate ? amount * rate : amount;
    }
    
    // If we're converting from foreign to base
    if (toCurrency === homeCurrency) {
        const rate = rates[fromCurrency];
        return rate ? amount / rate : amount;
    }

    // General case: convert from A to B via Base
    const rateA = rates[fromCurrency];
    const rateB = rates[toCurrency];
    if (rateA && rateB) {
        return (amount / rateA) * rateB;
    }

    return amount;
  }, [rates, homeCurrency]);

  return { rates, loading, error, convert, refresh: () => fetchRates(homeCurrency) };
}
