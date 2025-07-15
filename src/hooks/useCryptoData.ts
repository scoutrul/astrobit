import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { bybitApi } from '../services/bybitApi';
import { validateChartData, calculateTimeRange } from '../utils/chartHelpers';

/**
 * Custom hook for managing cryptocurrency data
 * Implements data fetching, caching, and real-time updates
 */
export function useCryptoData() {
  const {
    cryptoData,
    symbol,
    timeframe,
    isLoading,
    error,
    setCryptoData,
    setLoading,
    setError,
    setChartRange
  } = useStore();
  
  /**
   * Fetch cryptocurrency data for current symbol and timeframe
   */
  const fetchCryptoData = useCallback(async () => {
    if (!symbol || !timeframe) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const interval = bybitApi.mapTimeframeToInterval(timeframe);
      const response = await bybitApi.getKlineData(symbol, interval, 200);
      
      if (response.success && response.data) {
        // Validate data integrity
        if (validateChartData(response.data)) {
          setCryptoData(response.data);
          
          // Update chart time range based on data
          const timeRange = calculateTimeRange(timeframe);
          setChartRange(timeRange);
          
          console.log(`[useCryptoData] Loaded ${response.data.length} candles for ${symbol} ${timeframe}`);
        } else {
          throw new Error('Invalid chart data received');
        }
      } else {
        throw new Error(response.error || 'Failed to fetch crypto data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useCryptoData] Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, setCryptoData, setLoading, setError, setChartRange]);
  
  /**
   * Refresh data (force reload)
   */
  const refreshData = useCallback(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);
  
  /**
   * Auto-fetch data when symbol or timeframe changes
   */
  useEffect(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);
  
  /**
   * Set up periodic data refresh for real-time updates
   * Refresh interval depends on timeframe
   */
  useEffect(() => {
    if (!symbol || !timeframe) return;
    
    // Calculate refresh interval based on timeframe
    const refreshIntervals: Record<string, number> = {
      '1m': 60 * 1000,        // 1 minute
      '5m': 5 * 60 * 1000,    // 5 minutes
      '15m': 10 * 60 * 1000,  // 10 minutes
      '30m': 15 * 60 * 1000,  // 15 minutes
      '1h': 30 * 60 * 1000,   // 30 minutes
      '4h': 60 * 60 * 1000,   // 1 hour
      '1d': 30 * 60 * 1000,   // 30 minutes (for demo)
      '1w': 60 * 60 * 1000,   // 1 hour
    };
    
    const refreshInterval = refreshIntervals[timeframe] || 30 * 60 * 1000;
    
    const intervalId = setInterval(() => {
      console.log(`[useCryptoData] Auto-refreshing data for ${symbol} ${timeframe}`);
      fetchCryptoData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [symbol, timeframe, fetchCryptoData]);
  
  return {
    // Data
    cryptoData,
    symbol,
    timeframe,
    isLoading,
    error,
    
    // Actions
    fetchData: fetchCryptoData,
    refreshData,
    
    // Computed values
    hasData: cryptoData.length > 0,
    dataCount: cryptoData.length,
    lastUpdate: cryptoData.length > 0 ? new Date(cryptoData[cryptoData.length - 1].time) : null,
  };
} 