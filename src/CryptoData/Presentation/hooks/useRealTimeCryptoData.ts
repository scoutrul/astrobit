import { useState, useEffect, useCallback, useRef } from 'react';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';
import { SubscribeToRealTimeDataUseCase } from '../../Application/use-cases/SubscribeToRealTimeDataUseCase';
import { BinanceKlineWebSocketData } from '../../Infrastructure/external-services/BinanceWebSocketService';
import { Symbol } from '../../Domain/value-objects/Symbol';
import { Timeframe } from '../../Domain/value-objects/Timeframe';

export interface UseRealTimeCryptoDataResult {
  isConnected: boolean;
  currentSubscription: { symbol: string; interval: string } | null;
  lastUpdate: BinanceKlineWebSocketData | null;
  error: string | null;
  subscribe: (symbol: string, timeframe: string) => Promise<void>;
  unsubscribe: () => Promise<void>;
  // Новые методы для отладки
  getSubscriptionInfo: () => { activeStream: string | null; subscriptionsCount: number; handlersCount: number };
}

export function useRealTimeCryptoData(): UseRealTimeCryptoDataResult {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{ symbol: string; interval: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<BinanceKlineWebSocketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Уникальный идентификатор для этого хука
  const subscriberId = useRef<string>(`hook_${Date.now()}_${Math.random()}`);
  
  // Текущая активная подписка для отслеживания изменений
  const activeSubscriptionRef = useRef<{ symbol: string; timeframe: string } | null>(null);
  
  // Таймер для debounce подписок
  const subscribeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Получаем Use Case из DI контейнера
  const getUseCase = useCallback(() => {
    const container = DependencyContainer.getInstance();
    return container.resolve<SubscribeToRealTimeDataUseCase>('SubscribeToRealTimeDataUseCase');
  }, []);

  // Обработчик обновлений real-time данных
  const handleDataUpdate = useCallback((data: BinanceKlineWebSocketData) => {
    setLastUpdate(data);
    setError(null);
    
    // Обновляем информацию о подключении
    setIsConnected(true);
    if (!currentSubscription || 
        currentSubscription.symbol !== data.symbol || 
        currentSubscription.interval !== data.interval) {
      setCurrentSubscription({ symbol: data.symbol, interval: data.interval });
    }
  }, [currentSubscription]);

  // Подписка на real-time данные с оптимизацией
  const subscribe = useCallback(async (symbol: string, timeframe: string) => {
    // Очищаем предыдущий таймер
    if (subscribeTimeoutRef.current) {
      clearTimeout(subscribeTimeoutRef.current);
    }

    // Debounce для предотвращения слишком частых подписок
    subscribeTimeoutRef.current = setTimeout(async () => {
      try {
        setError(null);
        
        // Проверяем, не является ли это той же подпиской
        if (activeSubscriptionRef.current && 
            activeSubscriptionRef.current.symbol === symbol && 
            activeSubscriptionRef.current.timeframe === timeframe) {
          
          return;
        }

        const useCase = getUseCase();
        
        // Отписываемся от предыдущей подписки этого хука
        if (activeSubscriptionRef.current) {
          
          try {
            await useCase.unsubscribeHandler(subscriberId.current);
          } catch (unsubError) {
            
          }
        }
        
        const result = await useCase.executeWithId({
          symbol: new Symbol(symbol),
          timeframe: new Timeframe(timeframe as '1h' | '8h' | '1d' | '1w' | '1M'),
          onDataUpdate: handleDataUpdate,
          subscriberId: subscriberId.current
        });

        if (result.isSuccess) {
          activeSubscriptionRef.current = { symbol, timeframe };
          setCurrentSubscription({ symbol, interval: timeframe });
          
          // Проверяем, есть ли кэшированные данные
          const webSocketService = useCase.getWebSocketService();
          const cachedData = webSocketService.getLastData(symbol, timeframe);
          if (cachedData) {
            setLastUpdate(cachedData);
          }
          
          
        } else {
          setError(result.error);
          
        }
      } catch (err) {
        const errorMsg = `Failed to subscribe: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
        
      }
    }, 100); // 100ms debounce
  }, [getUseCase, handleDataUpdate]);

  // Отписка от real-time данных
  const unsubscribe = useCallback(async () => {
    try {
      if (!activeSubscriptionRef.current) {
        
        return;
      }

      const useCase = getUseCase();
      const result = await useCase.unsubscribeHandler(subscriberId.current);

      if (result.isSuccess) {
        activeSubscriptionRef.current = null;
        setIsConnected(false);
        setCurrentSubscription(null);
        setLastUpdate(null);
        
      } else {
        setError(result.error);
        
      }
    } catch (err) {
      const errorMsg = `Failed to unsubscribe: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      
    }
  }, [getUseCase]);

  // Получение информации о подписках для отладки
  const getSubscriptionInfo = useCallback(() => {
    try {
      const useCase = getUseCase();
      const webSocketService = useCase.getWebSocketService();
      return webSocketService.getSubscriptionsInfo();
    } catch (error) {
      
      return { activeStream: null, subscriptionsCount: 0, handlersCount: 0 };
    }
  }, [getUseCase]);

  // Проверяем статус соединения периодически
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const useCase = getUseCase();
        const connected = await useCase.isConnected();
        
        // Обновляем статус только если он изменился
        setIsConnected(prevConnected => {
          if (prevConnected !== connected) {
            
          }
          return connected;
        });
        
        if (connected) {
          const subscription = useCase.getCurrentSubscription();
          setCurrentSubscription(subscription);
        }
      } catch (error) {
        
        setIsConnected(false);
      }
    };

    // Проверяем каждые 30 секунд
    const interval = setInterval(checkConnection, 30000);
    checkConnection(); // Первоначальная проверка

    return () => clearInterval(interval);
  }, [getUseCase]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      // Очищаем таймер debounce
      if (subscribeTimeoutRef.current) {
        clearTimeout(subscribeTimeoutRef.current);
      }

      if (activeSubscriptionRef.current) {
        
        // Асинхронная отписка при размонтировании
        const cleanup = async () => {
          try {
            const useCase = getUseCase();
            await useCase.unsubscribeHandler(subscriberId.current);
          } catch (error) {
            
          }
        };
        cleanup();
      }
    };
  }, [getUseCase]);

  return {
    isConnected,
    currentSubscription,
    lastUpdate,
    error,
    subscribe,
    unsubscribe,
    getSubscriptionInfo
  };
} 