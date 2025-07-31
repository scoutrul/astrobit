import { useState, useEffect } from 'react';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';
import { CryptoData } from '../../Domain/entities/CryptoData';

export interface UseCryptoDataResult {
  data: CryptoData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

export function useCryptoData(
  getCryptoDataUseCase: GetCryptoDataUseCase,
  symbol: string,
  timeframe: string
): UseCryptoDataResult {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      
      const result = await getCryptoDataUseCase.execute({
        symbol,
        timeframe,
        limit: 1000
      });

      if (result.isSuccess) {
        console.log(`[useCryptoData] ✅ Успешно загружено ${result.value.data.length} точек данных для ${timeframe}`);
        setData(result.value.data);
        setLastUpdated(result.value.lastUpdated);
        setError(null);
      } else {
        const errorMsg = `Ошибка загрузки данных: ${result.error}`;
        console.error(`[useCryptoData] ❌ ${errorMsg}`);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ошибка сети';
      console.error(`[useCryptoData] ❌ Исключение при загрузке:`, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`[useCryptoData] 🎯 useEffect triggered: symbol=${symbol}, timeframe=${timeframe}`);
    fetchData();
  }, [symbol, timeframe]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch
  };
} 