import { useState, useEffect, useRef, useMemo } from 'react';
import { CryptoData } from '../../Domain/types';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';

interface UseMultiCryptoDataResult {
  data: Array<{
    symbol: string;
    data: CryptoData[];
  }>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Хук для загрузки данных нескольких криптовалютных символов параллельно
 * @param symbols Массив символов для загрузки
 * @param timeframe Таймфрейм для всех символов
 * @returns Данные, сгруппированные по символам
 */
export function useMultiCryptoData(
  symbols: string[],
  timeframe: string
): UseMultiCryptoDataResult {
  const [data, setData] = useState<Array<{ symbol: string; data: CryptoData[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchInProgressRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Фильтруем пустые символы
      const validSymbols = symbols.filter(s => s && s.trim().length > 0);
      
      if (validSymbols.length === 0 || !timeframe) {
        setData([]);
        setLoading(false);
        return;
      }

      const requestKey = `${validSymbols.join(',')}@${timeframe}`;
      
      // Предотвращаем дублирование запросов
      if (fetchInProgressRef.current === requestKey) {
        return;
      }
      
      // Очищаем предыдущие данные при новом запросе
      setData([]);
      setError(null);
      fetchInProgressRef.current = requestKey;

      try {
        setLoading(true);
        setError(null);

        // Получаем use case из DI контейнера
        const container = DependencyContainer.getInstance();
        const getCryptoDataUseCase = container.resolve<GetCryptoDataUseCase>('GetCryptoDataUseCase');
        
        // Загружаем данные для всех символов параллельно
        const fetchPromises = validSymbols.map(async (symbol) => {
          try {
            const result = await getCryptoDataUseCase.execute({
              symbol: symbol,
              timeframe: timeframe,
              limit: 3000
            });

            if (result.isSuccess) {
              // Конвертируем доменные сущности в старый формат для обратной совместимости
              const legacyData: CryptoData[] = result.value.data.map(cryptoData => {
                let timeString: string;
                if (cryptoData.timestamp instanceof Date) {
                  timeString = cryptoData.timestamp.toISOString();
                } else if (typeof cryptoData.timestamp === 'number') {
                  if (cryptoData.timestamp > 1000000000000) {
                    timeString = new Date(cryptoData.timestamp).toISOString();
                  } else {
                    timeString = new Date(cryptoData.timestamp * 1000).toISOString();
                  }
                } else {
                  timeString = String(cryptoData.timestamp);
                }
                
                return {
                  symbol: cryptoData.symbol.toString(),
                  time: timeString,
                  open: cryptoData.open,
                  high: cryptoData.high,
                  low: cryptoData.low,
                  close: cryptoData.close,
                  volume: cryptoData.volume
                };
              });

              return { symbol, data: legacyData, error: null };
            } else {
              return { symbol, data: [], error: result.error };
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Ошибка загрузки';
            return { symbol, data: [], error: errorMsg };
          }
        });

        const results = await Promise.all(fetchPromises);

        if (!isMounted) return;

        // Проверяем наличие ошибок
        const errors = results.filter(r => r.error);
        const successfulResults = results.filter(r => !r.error);

        if (successfulResults.length === 0 && errors.length > 0) {
          // Все запросы завершились с ошибкой
          const errorMsg = `Ошибка загрузки данных: ${errors[0].error}`;
          console.error(`[useMultiCryptoData] ❌ ${errorMsg}`);
          
          if (errors[0].error?.includes('not available') && retryCount < 3) {
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
              }
            }, 2000);
            return;
          }
          
          setError(errorMsg);
        } else {
          // Есть успешные результаты
          setData(successfulResults.map(r => ({ symbol: r.symbol, data: r.data })));
          
          if (errors.length > 0) {
            // Частичная ошибка - показываем предупреждение, но не блокируем
            console.warn(`[useMultiCryptoData] ⚠️ Некоторые символы не загружены:`, errors);
          }
        }

        setLastUpdated(new Date());
        setRetryCount(0);
        fetchInProgressRef.current = null;
      } catch (err) {
        if (!isMounted) return;
        
        const errorMsg = err instanceof Error ? err.message : 'Ошибка сети';
        console.error(`[useMultiCryptoData] ❌ Исключение при загрузке:`, err);
        
        if (errorMsg.includes('not available') && retryCount < 3) {
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
            }
          }, 2000);
          return;
        }
        
        setError(errorMsg);
      } finally {
        if (isMounted) {
          setLoading(false);
          fetchInProgressRef.current = null;
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [symbols.join(','), timeframe, retryCount]);

  // Принудительно очищаем кэш при смене symbols/timeframe
  useEffect(() => {
    fetchInProgressRef.current = null;
  }, [symbols.join(','), timeframe]);

  // Стабилизируем данные, чтобы избежать лишних обновлений
  const stableData = useMemo(() => data, [data]);

  return {
    data: stableData,
    loading,
    error,
    lastUpdated,
  };
}
