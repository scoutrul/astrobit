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
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[useCryptoData] Загрузка данных для ${symbol} с таймфреймом ${timeframe}`);
        
        const interval = bybitApi.mapTimeframeToInterval(timeframe);
        const response = await bybitApi.getKlineData(symbol, interval, 200);

        if (!isMounted) return;

        if (response.success && response.data) {
          console.log(`[useCryptoData] Успешно загружено ${response.data.length} точек данных`);
          
          // Проверяем качество данных
          if (response.data.length < 10) {
            console.warn(`[useCryptoData] Получено мало данных: ${response.data.length} точек`);
          }
          
          setData(response.data);
          setLastUpdated(new Date());
          setError(null);
        } else {
          console.error('[useCryptoData] Ошибка API:', response.error);
          setError(response.error || 'Не удалось загрузить данные');
          setData([]);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
        console.error('[useCryptoData] Сетевая ошибка:', errorMessage);
        setError(errorMessage);
        setData([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

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