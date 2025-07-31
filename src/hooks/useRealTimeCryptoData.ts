import { useState, useEffect, useCallback } from 'react';
import { DependencyContainer } from '../Shared/infrastructure/DependencyContainer';
import { SubscribeToRealTimeDataUseCase } from '../CryptoData/Application/use-cases/SubscribeToRealTimeDataUseCase';
import { BinanceKlineWebSocketData } from '../CryptoData/Infrastructure/external-services/BinanceWebSocketService';
import { Symbol } from '../CryptoData/Domain/value-objects/Symbol';
import { Timeframe } from '../CryptoData/Domain/value-objects/Timeframe';

export interface UseRealTimeCryptoDataResult {
  isConnected: boolean;
  currentSubscription: { symbol: string; interval: string } | null;
  lastUpdate: BinanceKlineWebSocketData | null;
  error: string | null;
  subscribe: (symbol: string, timeframe: string) => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function useRealTimeCryptoData(): UseRealTimeCryptoDataResult {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{ symbol: string; interval: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<BinanceKlineWebSocketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Получаем Use Case из DI контейнера
  const getUseCase = useCallback(() => {
    const container = DependencyContainer.getInstance();
    return container.resolve<SubscribeToRealTimeDataUseCase>('SubscribeToRealTimeDataUseCase');
  }, []);

  // Обработчик обновления данных
  const handleDataUpdate = useCallback((data: BinanceKlineWebSocketData) => {
    console.log('[useRealTimeCryptoData] Получено обновление:', data);
    setLastUpdate(data);
    setError(null);
  }, []);

  // Подписка на real-time данные
  const subscribe = useCallback(async (symbol: string, timeframe: string) => {
    try {
      console.log('[useRealTimeCryptoData] Подписка на:', symbol, timeframe);
      
      setError(null);
      const useCase = getUseCase();

      const result = await useCase.execute({
        symbol: new Symbol(symbol),
        timeframe: new Timeframe(timeframe as '1h' | '8h' | '1d' | '1w' | '1M'),
        onDataUpdate: handleDataUpdate
      });

      if (result.isSuccess) {
        setIsConnected(true);
        setCurrentSubscription({ symbol, interval: timeframe });
        console.log('[useRealTimeCryptoData] ✅ Подписка установлена');
      } else {
        setError(result.error);
        console.error('[useRealTimeCryptoData] ❌ Ошибка подписки:', result.error);
      }
    } catch (err) {
      const errorMsg = `Failed to subscribe: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      console.error('[useRealTimeCryptoData] ❌ Ошибка подписки:', err);
    }
  }, [getUseCase, handleDataUpdate]);

  // Отписка от real-time данных
  const unsubscribe = useCallback(async () => {
    try {
      console.log('[useRealTimeCryptoData] Отписка от real-time данных');
      
      const useCase = getUseCase();
      const result = await useCase.unsubscribe();

      if (result.isSuccess) {
        setIsConnected(false);
        setCurrentSubscription(null);
        setLastUpdate(null);
        console.log('[useRealTimeCryptoData] ✅ Отписка выполнена');
      } else {
        setError(result.error);
        console.error('[useRealTimeCryptoData] ❌ Ошибка отписки:', result.error);
      }
    } catch (err) {
      const errorMsg = `Failed to unsubscribe: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      console.error('[useRealTimeCryptoData] ❌ Ошибка отписки:', err);
    }
  }, [getUseCase]);

  // Проверяем статус соединения при изменении
  useEffect(() => {
    const checkConnection = async () => {
      const useCase = getUseCase();
      const connected = await useCase.isConnected();
      setIsConnected(connected);
      
      if (connected) {
        const subscription = useCase.getCurrentSubscription();
        setCurrentSubscription(subscription);
      }
    };

    // Проверяем каждые 30 секунд (вместо 5) для дневного таймфрейма
    const interval = setInterval(checkConnection, 30000);
    checkConnection(); // Первоначальная проверка

    return () => clearInterval(interval);
  }, [getUseCase]);

  return {
    isConnected,
    currentSubscription,
    lastUpdate,
    error,
    subscribe,
    unsubscribe
  };
} 