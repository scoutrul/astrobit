import { useState, useEffect, useRef, useMemo } from 'react';
import { CryptoData } from '../../Domain/types';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { GetCryptoDataUseCase } from '../../Application/use-cases/GetCryptoDataUseCase';

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
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Очищаем данные при смене символа для предотвращения кэширования
    setData([]);
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      if (!symbol || !timeframe) {
        console.warn(`[useCryptoData] ⚠️ Missing symbol or timeframe:`, { symbol, timeframe });
        setLoading(false);
        return;
      }
      
      console.log(`[useCryptoData] 🔄 Fetching data for:`, { symbol, timeframe });

      try {
        setLoading(true);
        setError(null);

        // Получаем use case из DI контейнера
        const container = DependencyContainer.getInstance();
        const getCryptoDataUseCase = container.resolve<GetCryptoDataUseCase>('GetCryptoDataUseCase');
        
        // Выполняем use case
        const result = await getCryptoDataUseCase.execute({
          symbol: symbol,
          timeframe: timeframe,
          limit: 3000
        });

        if (!isMounted) return;

        if (result.isSuccess) {
          // Конвертируем доменные сущности в старый формат для обратной совместимости
          const legacyData: CryptoData[] = result.value.data.map(cryptoData => {
            // Убеждаемся, что timestamp в правильном формате
            let timeString: string;
            if (cryptoData.timestamp instanceof Date) {
              timeString = cryptoData.timestamp.toISOString();
            } else if (typeof cryptoData.timestamp === 'number') {
              // Если это timestamp в миллисекундах
              if (cryptoData.timestamp > 1000000000000) {
                timeString = new Date(cryptoData.timestamp).toISOString();
              } else {
                // Если это timestamp в секундах
                timeString = new Date(cryptoData.timestamp * 1000).toISOString();
              }
            } else {
              // Если это строка, используем как есть
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


          
          setData(legacyData);
          setLastUpdated(new Date());
          setRetryCount(0); // Сбрасываем счетчик попыток при успехе
        } else {
          const errorMsg = `Ошибка загрузки данных: ${result.error}`;
          console.error(`[useCryptoData] ❌ ${errorMsg}`);
          
          // Если ошибка связана с недоступностью API, пробуем повторить
          if (result.error.includes('not available') && retryCount < 3) {
            // Очищаем предыдущий таймаут
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
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMsg = err instanceof Error ? err.message : 'Ошибка сети';
        console.error(`[useCryptoData] ❌ Исключение при загрузке:`, err);
        
        // Если ошибка связана с недоступностью API, пробуем повторить
        if (errorMsg.includes('not available') && retryCount < 3) {
          // Очищаем предыдущий таймаут
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
        }
      }
    };

    // Примечание: В режиме разработки React.StrictMode может вызывать useEffect дважды
    // Это нормальное поведение для обнаружения побочных эффектов
    fetchData();

    return () => {
      isMounted = false;
      // Очищаем таймаут при размонтировании
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [symbol, timeframe, retryCount]); // Добавляем retryCount в зависимости

  // Стабилизируем данные криптовалют, чтобы избежать лишних обновлений
  const stableData = useMemo(() => data, [data]);

  return {
    data: stableData,
    loading,
    error,
    lastUpdated,
    isAuthenticated: true // Новая архитектура не требует аутентификации для публичных данных
  };
} 