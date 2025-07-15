import { useState, useEffect } from 'react';
import { bybitApiEnhanced } from '../services/bybitApiEnhanced';
import { CryptoData } from '../types';

interface UseCryptoDataResult {
  data: CryptoData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isAuthenticated: boolean;
  apiConfig: any;
}

export function useCryptoData(symbol: string, timeframe: string): UseCryptoDataResult {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!symbol || !timeframe) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[useCryptoData] Fetching data for ${symbol} with timeframe ${timeframe}`);
        
        const interval = bybitApiEnhanced.mapTimeframeToInterval(timeframe);
        const response = await bybitApiEnhanced.getKlineData(symbol, interval, 200);

        if (!isMounted) return;

        if (response.success && response.data) {
          console.log(`[useCryptoData] Successfully fetched ${response.data.length} data points`);
          setData(response.data);
          setLastUpdated(new Date());
          setError(null);
        } else {
          console.error('[useCryptoData] API error:', response.error);
          setError(response.error || 'Failed to fetch crypto data');
          setData([]);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('[useCryptoData] Network error:', errorMessage);
        setError(errorMessage);
        setData([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [symbol, timeframe]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isAuthenticated: bybitApiEnhanced.isAuthenticated(),
    apiConfig: bybitApiEnhanced.getConfig(),
  };
} 