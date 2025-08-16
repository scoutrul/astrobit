import React, { useMemo, useEffect, useRef } from 'react';
import { useCryptoData } from '../../../CryptoData/Presentation/hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../Astronomical/Presentation/hooks/useAstronomicalEvents';
import { useRealTimeCryptoData } from '../../../CryptoData/Presentation/hooks/useRealTimeCryptoData';
import { useStore } from '../../../Shared/presentation/store';
import { ChartComponent } from '../components/ChartComponent';
import { AstronomicalEvent as NewAstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { AstronomicalEvent as OldAstronomicalEvent } from '../../../Astronomical/Infrastructure/services/astronomicalEvents';
import { combineHistoricalAndFutureCandles } from '../../../CryptoData/Infrastructure/utils/futureCandlesGenerator';
import { DependencyContainer } from '../../../Shared/infrastructure/DependencyContainer';

// Расширяем Window интерфейс для глобального отслеживания WebSocket подписок
declare global {
  interface Window {
    __astrobitWebSocketSubscriptions?: Set<string>;
  }
}

interface LegacyChartAdapterProps {
  height?: number;
  className?: string;
  cryptoData?: Array<{
    symbol: string;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  astronomicalEvents?: NewAstronomicalEvent[];
  eventFilters?: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  symbol?: string;
  timeframe?: string;
}

// Функция для конвертации старых астрономических событий в новый формат
function convertAstronomicalEvents(oldEvents: OldAstronomicalEvent[]): NewAstronomicalEvent[] {
  return oldEvents.map(event => ({
    timestamp: event.timestamp,
    name: event.name,
    description: event.description,
    type: event.type
  }));
}

export const LegacyChartAdapter: React.FC<LegacyChartAdapterProps> = ({
  height = 500, // Увеличена высота с 400 до 500
  className = '',
  cryptoData: propCryptoData,
  astronomicalEvents: propAstronomicalEvents,
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  symbol: propSymbol,
  timeframe: propTimeframe
}) => {
  // Получаем данные из store
  const { symbol: storeSymbol, timeframe: storeTimeframe } = useStore();
  
  // Используем пропсы или данные из store
  const symbol = propSymbol || storeSymbol;
  const timeframe = propTimeframe || storeTimeframe;

  // Real-time данные для виджета цены (НЕ для графика)
  const { 
    lastUpdate, 
    subscribe, 
    unsubscribe,
    isConnected,
    currentSubscription,
    error: wsError
  } = useRealTimeCryptoData();

  // Логирование WebSocket статуса
  console.log(`[LegacyChartAdapter] 🔌 WebSocket status:`, {
    symbol,
    timeframe,
    isConnected,
    currentSubscription,
    wsError,
    lastUpdate: lastUpdate ? 'received' : 'none'
  });

  // Ref для отслеживания изменений symbol/timeframe
  const prevSubscription = useRef<{ symbol: string; timeframe: string } | null>(null);

  // Стабилизируем даты для useAstronomicalEvents
  const dateRange = useMemo(() => {
    const now = Date.now();
    return {
      startDate: new Date(now - 365 * 24 * 60 * 60 * 1000), // 1 год назад
      endDate: new Date(now + 90 * 24 * 60 * 60 * 1000)    // 3 месяца вперед
    };
  }, []); // Пустой массив зависимостей - даты не должны меняться

  // Получаем криптоданные через хук
  const { data: hookCryptoData, loading: cryptoLoading } = useCryptoData(symbol, timeframe);
  

  
  // Получаем астрономические события с стабилизированными датами
  const { events: hookAstronomicalEvents, loading: astroLoading } = useAstronomicalEvents(
    dateRange.startDate,
    dateRange.endDate
  );

  // Конвертируем старые события в новый формат (стабилизируем)
  const convertedHookEvents = useMemo(() => {
    return hookAstronomicalEvents ? convertAstronomicalEvents(hookAstronomicalEvents) : [];
  }, [hookAstronomicalEvents]);
  
  // Используем события из пропсов или из хука (стабилизируем)
  const astronomicalEvents = useMemo(() => {
    return propAstronomicalEvents || convertedHookEvents || [];
  }, [propAstronomicalEvents, convertedHookEvents]);

  // Конвертируем астрономические события для генератора будущих свечей
  const eventsForGenerator = useMemo(() => {
    return astronomicalEvents.map(event => ({
      id: event.name,
      name: event.name,
      date: new Date(event.timestamp),
      type: event.type,
      description: event.description,
      significance: 'medium'
    }));
  }, [astronomicalEvents]); // Теперь можем использовать весь массив, так как он стабилизирован

  // Генерируем адаптивные будущие свечи с учетом событий
  const enhancedCryptoData = useMemo(() => {
    const historicalData = propCryptoData || hookCryptoData || [];
    
    console.log(`[LegacyChartAdapter] 📊 Processing data for ${symbol}:`, {
      symbol,
      timeframe,
      propDataLength: propCryptoData?.length || 0,
      hookDataLength: hookCryptoData?.length || 0,
      historicalDataLength: historicalData.length,
      firstPrice: historicalData[0]?.close,
      lastPrice: historicalData[historicalData.length - 1]?.close,
      cryptoLoading
    });
    
    // ВАЖНО: Не обрабатываем данные пока они загружаются
    // Это предотвращает использование старых кешированных данных
    if (cryptoLoading) {
      console.log(`[LegacyChartAdapter] ⏳ Data still loading for ${symbol}, waiting...`);
      return [];
    }
    
    if (historicalData.length === 0) {
      console.log(`[LegacyChartAdapter] ⚠️ No data available for ${symbol}`);
      return [];
    }

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, что данные соответствуют текущему символу
    // Это предотвращает использование кешированных данных от предыдущего символа
    if (historicalData.length > 0 && historicalData[0].symbol !== symbol) {
      console.warn(`[LegacyChartAdapter] ⚠️ Symbol mismatch: expected ${symbol}, got ${historicalData[0].symbol}`);
      return [];
    }

    // Объединяем исторические данные с адаптивными будущими свечами
    const combinedData = combineHistoricalAndFutureCandles(
      historicalData,
      timeframe,
      eventsForGenerator,
      symbol
    );

    console.log(`[LegacyChartAdapter] ✅ Enhanced data ready for ${symbol}:`, {
      originalLength: historicalData.length,
      combinedLength: combinedData.length,
      firstPrice: combinedData[0]?.close,
      lastPrice: combinedData[combinedData.length - 1]?.close
    });

    // Принудительно создаем новый массив для обеспечения изменения ссылки
    // Это гарантирует, что React увидит изменение даже если длина массива одинакова
    return [...combinedData];
  }, [propCryptoData, hookCryptoData, timeframe, eventsForGenerator, symbol, cryptoLoading]); // Добавляем cryptoLoading для отслеживания состояния загрузки

  // WebSocket подписка для виджета цены (НЕ для графика)
  useEffect(() => {
    let isMounted = true;
    const currentSubscription = { symbol, timeframe };
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, не пытаемся ли мы создать дублирующую подписку
    // Это защищает от React.StrictMode двойного рендера в development
    if (prevSubscription.current && 
        prevSubscription.current.symbol === symbol && 
        prevSubscription.current.timeframe === timeframe) {
      console.log(`[LegacyChartAdapter] ℹ️ Skipping duplicate subscription for ${symbol}@${timeframe}`);
      return;
    }

    // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Глобальная проверка на дублирующие подписки
    // Это предотвращает создание множественных WebSocket даже при разных рендерах
    const globalSubscriptionKey = `${symbol}@${timeframe}`;
    if (window.__astrobitWebSocketSubscriptions && window.__astrobitWebSocketSubscriptions.has(globalSubscriptionKey)) {
      console.log(`[LegacyChartAdapter] 🚨 Global duplicate subscription detected for ${globalSubscriptionKey}, skipping`);
      return;
    }
    
    // Регистрируем подписку глобально
    if (!window.__astrobitWebSocketSubscriptions) {
      window.__astrobitWebSocketSubscriptions = new Set();
    }
    window.__astrobitWebSocketSubscriptions.add(globalSubscriptionKey);
    
    const handleSubscription = async () => {
      // Проверяем, изменилась ли подписка
      if (prevSubscription.current && 
          (prevSubscription.current.symbol !== symbol || 
           prevSubscription.current.timeframe !== timeframe)) {
        console.log(`[LegacyChartAdapter] 🔄 Symbol/timeframe changed, cleaning up old subscription:`, {
          old: prevSubscription.current,
          new: currentSubscription
        });
        
        // Отписываемся от предыдущей подписки
        await unsubscribe();
        
        // Очищаем глобальное состояние для старой подписки
        if (window.__astrobitWebSocketSubscriptions && prevSubscription.current) {
          const oldGlobalKey = `${prevSubscription.current.symbol}@${prevSubscription.current.timeframe}`;
          window.__astrobitWebSocketSubscriptions.delete(oldGlobalKey);
          console.log(`[LegacyChartAdapter] 🧹 Removed old global subscription: ${oldGlobalKey}`);
        }
        
        // Принудительно закрываем все WebSocket соединения
        const container = DependencyContainer.getInstance();
        const webSocketService = container.resolve('BinanceWebSocketService') as any;
        if (webSocketService && typeof webSocketService.forceCloseAllConnections === 'function') {
          console.log(`[LegacyChartAdapter] 🚨 Force closing all WebSocket connections`);
          await webSocketService.forceCloseAllConnections();
        }
        
        // Увеличенная задержка для корректного закрытия WebSocket соединения
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Подписываемся на новую подписку только если компонент еще смонтирован
        if (isMounted && symbol && timeframe) {
          console.log(`[LegacyChartAdapter] 🔌 Subscribing to new symbol: ${symbol}@${timeframe}`);
          await subscribe(symbol, timeframe);
          prevSubscription.current = currentSubscription;
        }
      } else if (!prevSubscription.current && symbol && timeframe) {
        // Первая подписка
        console.log(`[LegacyChartAdapter] 🔌 Initial WebSocket subscription for ${symbol}@${timeframe}`);
        await subscribe(symbol, timeframe);
        prevSubscription.current = currentSubscription;
      }
    };

    // ВАЖНО: Вызываем handleSubscription при первом монтировании И при изменении
    if (!prevSubscription.current || 
        (prevSubscription.current.symbol !== symbol || 
         prevSubscription.current.timeframe !== timeframe)) {
      handleSubscription();
    }

    // Очистка при размонтировании
    return () => {
      isMounted = false;
      console.log(`[LegacyChartAdapter] 🧹 Cleaning up WebSocket subscription on unmount`);
      
      // Очищаем глобальное состояние
      if (window.__astrobitWebSocketSubscriptions) {
        const globalSubscriptionKey = `${symbol}@${timeframe}`;
        window.__astrobitWebSocketSubscriptions.delete(globalSubscriptionKey);
        console.log(`[LegacyChartAdapter] 🧹 Removed global subscription: ${globalSubscriptionKey}`);
      }
      
      unsubscribe();
    };
  }, [symbol, timeframe, subscribe, unsubscribe]);

  // Логирование WebSocket данных для отладки
  useEffect(() => {
    if (lastUpdate) {
      console.log(`[LegacyChartAdapter] 🔄 WebSocket data received:`, {
        symbol: lastUpdate.symbol,
        interval: lastUpdate.interval,
        price: lastUpdate.close,
        timestamp: new Date(lastUpdate.timestamp).toISOString()
      });
    }
  }, [lastUpdate]);


  // Ключ для принудительного пересоздания ChartComponent
  const chartKey = `${symbol}-${timeframe}`;



  return (
    <ChartComponent
      key={chartKey} // Принудительное пересоздание при смене параметров
      symbol={symbol}
      timeframe={timeframe}
      height={height}
      className={className}
      cryptoData={enhancedCryptoData}
      astronomicalEvents={astronomicalEvents}
      eventFilters={eventFilters}
      isLoading={cryptoLoading || astroLoading}
      realTimeData={lastUpdate} // Передаем для виджета цены
    />
  );
}; 