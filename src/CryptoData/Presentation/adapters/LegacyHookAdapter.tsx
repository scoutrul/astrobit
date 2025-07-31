import { useState, useEffect } from 'react';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';

/**
 * Адаптер для обратной совместимости с существующим useCryptoData hook
 * Преобразует доменные CryptoData в формат, ожидаемый существующими компонентами
 */
export function createLegacyHookAdapter(getCryptoDataUseCase: GetCryptoDataUseCase) {
  return (symbol: string, timeframe: string) => {
    const [data, setData] = useState<Array<{
      symbol: string;
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
      let isMounted = true;

      const fetchData = async () => {
        if (!symbol || !timeframe) {
          console.log(`[LegacyHookAdapter] Пропуск загрузки: symbol=${symbol}, timeframe=${timeframe}`);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        try {
          if (isMounted) {
            setLoading(true);
            setError(null);
          }

          console.log(`[LegacyHookAdapter] 🔄 ЗАГРУЗКА ДАННЫХ: ${symbol} с таймфреймом ${timeframe}`);
          
          const result = await getCryptoDataUseCase.execute({
            symbol,
            timeframe,
            limit: 1000
          });

          if (!isMounted) return;

          if (result.isSuccess) {
            console.log(`[LegacyHookAdapter] ✅ Успешно загружено ${result.value.data.length} точек данных для ${timeframe}`);
            
            // Преобразуем доменные CryptoData в формат, ожидаемый существующими компонентами
            const legacyData = result.value.data.map(cryptoData => cryptoData.toApiFormat());
            
            setData(legacyData);
            setLastUpdated(result.value.lastUpdated);
            setError(null);
          } else {
            const errorMsg = `Ошибка загрузки данных: ${result.error}`;
            console.error(`[LegacyHookAdapter] ❌ ${errorMsg}`);
            setError(errorMsg);
          }
        } catch (err) {
          if (!isMounted) return;
          
          const errorMsg = err instanceof Error ? err.message : 'Ошибка сети';
          console.error(`[LegacyHookAdapter] ❌ Исключение при загрузке:`, err);
          setError(errorMsg);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      console.log(`[LegacyHookAdapter] 🎯 useEffect triggered: symbol=${symbol}, timeframe=${timeframe}`);
      fetchData();

      return () => {
        isMounted = false;
      };
    }, [symbol, timeframe]);

    return {
      data,
      loading,
      error,
      lastUpdated,
      isAuthenticated: true // Всегда true для новой архитектуры
    };
  };
} 