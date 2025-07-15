import { useState, useEffect } from 'react';
import { CryptoData } from '../types';
import { bybitApi } from '../services/bybitApi';

interface UseCryptoDataResult {
  data: CryptoData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isAuthenticated: boolean;
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
        console.log(`[useCryptoData] Пропуск загрузки: symbol=${symbol}, timeframe=${timeframe}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[useCryptoData] 🔄 ЗАГРУЗКА ДАННЫХ: ${symbol} с таймфреймом ${timeframe}`);
        
        console.log(`[useCryptoData] Mapped interval: ${timeframe} → ${bybitApi.mapTimeframeToInterval(timeframe)}`);
        
        const response = await bybitApi.getKlineData(symbol, timeframe, 1000); // Pass timeframe directly

        if (!isMounted) return;

        if (response.success && response.data) {
          console.log(`[useCryptoData] ✅ Успешно загружено ${response.data.length} точек данных для ${timeframe}`);
          setData(response.data);
          setLastUpdated(new Date());
        } else {
          const errorMsg = `Ошибка загрузки данных: ${response.error || 'Неизвестная ошибка'}`;
          console.error(`[useCryptoData] ❌ ${errorMsg}`);
          setError(errorMsg);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMsg = err instanceof Error ? err.message : 'Ошибка сети';
        console.error(`[useCryptoData] ❌ Исключение при загрузке:`, err);
        setError(errorMsg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    console.log(`[useCryptoData] 🎯 useEffect triggered: symbol=${symbol}, timeframe=${timeframe}`);
    fetchData();

    // Обновляем данные каждые 30 секунд
    const intervalId = setInterval(fetchData, 30000);

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
    isAuthenticated: bybitApi.isAuthenticated()
  };
} 