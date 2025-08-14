import { useState, useEffect, useRef } from 'react';
import { CryptoData } from '../../../types';
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

    const fetchData = async () => {
      if (!symbol || !timeframe) {
        console.log(`[useCryptoData] Пропуск загрузки: symbol=${symbol}, timeframe=${timeframe}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[useCryptoData] 🔄 ЗАГРУЗКА ДАННЫХ: ${symbol} с таймфреймом ${timeframe} (попытка ${retryCount + 1})`);
        
        // Получаем use case из DI контейнера
        console.log('[useCryptoData] 🔧 Getting DI container...');
        const container = DependencyContainer.getInstance();
        console.log('[useCryptoData] ✅ DI container obtained');
        
        console.log('[useCryptoData] 🔧 Resolving GetCryptoDataUseCase...');
        const getCryptoDataUseCase = container.resolve<GetCryptoDataUseCase>('GetCryptoDataUseCase');
        console.log('[useCryptoData] ✅ GetCryptoDataUseCase resolved:', getCryptoDataUseCase);
        
        // Выполняем use case
        console.log('[useCryptoData] 📊 Executing use case...');
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
          
          console.log(`[useCryptoData] ✅ Успешно загружено ${legacyData.length} точек данных для ${timeframe}`);
          console.log(`[useCryptoData] 📊 Sample data:`, {
            first: legacyData[0],
            last: legacyData[legacyData.length - 1]
          });

          setData(legacyData);
          setLastUpdated(new Date());
          setRetryCount(0); // Сбрасываем счетчик попыток при успехе
        } else {
          const errorMsg = `Ошибка загрузки данных: ${result.error}`;
          console.error(`[useCryptoData] ❌ ${errorMsg}`);
          
          // Если ошибка связана с недоступностью API, пробуем повторить
          if (result.error.includes('not available') && retryCount < 3) {
            console.log(`[useCryptoData] 🔄 Повторная попытка через 2 секунды...`);
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
          console.log(`[useCryptoData] 🔄 Повторная попытка через 2 секунды...`);
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
    console.log(`[useCryptoData] 🎯 useEffect triggered: symbol=${symbol}, timeframe=${timeframe}, retryCount=${retryCount}`);
    fetchData();

    return () => {
      isMounted = false;
      // Очищаем таймаут при размонтировании
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [symbol, timeframe, retryCount]); // Добавляем retryCount в зависимости

  return {
    data,
    loading,
    error,
    lastUpdated,
    isAuthenticated: true // Новая архитектура не требует аутентификации для публичных данных
  };
} 