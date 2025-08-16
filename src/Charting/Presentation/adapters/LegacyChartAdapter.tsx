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

  // Real-time данные
  const { 
    lastUpdate, 
    subscribe, 
    unsubscribe 
  } = useRealTimeCryptoData();

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

  // Подписка на real-time данные при изменении symbol/timeframe
  useEffect(() => {
    let isMounted = true;
    const currentSubscription = { symbol, timeframe };
    
    const handleSubscription = async () => {
      // Проверяем, изменилась ли подписка
      if (prevSubscription.current && 
          (prevSubscription.current.symbol !== symbol || 
           prevSubscription.current.timeframe !== timeframe)) {
        // Отписываемся от предыдущей подписки
        await unsubscribe();
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно закрываем все WebSocket соединения
        // Это гарантирует, что старые соединения полностью прекратят работу
        const container = DependencyContainer.getInstance();
        const webSocketService = container.resolve('BinanceWebSocketService') as any;
        if (webSocketService && typeof webSocketService.forceCloseAllConnections === 'function') {
          await webSocketService.forceCloseAllConnections();
        }
        
        // Увеличенная задержка для корректного закрытия WebSocket соединения
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Подписываемся на новую подписку только если компонент еще смонтирован
        // Пропускаем WebSocket подписку для недельных и месячных таймфреймов
        if (isMounted && symbol && timeframe) {
          if (timeframe === '1w' || timeframe === '1M') {
            console.log(`[LegacyChartAdapter] ℹ️ Skipping WebSocket subscription for ${timeframe} timeframe`);
            prevSubscription.current = currentSubscription;
          } else {
            await subscribe(symbol, timeframe);
            prevSubscription.current = currentSubscription;
          }
        }
      } else if (!prevSubscription.current && symbol && timeframe) {
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Подписываемся только при ПЕРВОМ изменении
        // НЕ при первоначальном монтировании компонента
        if (timeframe === '1w' || timeframe === '1M') {
          console.log(`[LegacyChartAdapter] ℹ️ Skipping WebSocket subscription for ${timeframe} timeframe`);
          prevSubscription.current = currentSubscription;
        } else {
          console.log(`[LegacyChartAdapter] 🔌 Initial WebSocket subscription for ${symbol}@${timeframe}`);
          await subscribe(symbol, timeframe);
          prevSubscription.current = currentSubscription;
        }
      }
    };

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ вызываем handleSubscription() при монтировании
    // Подписываемся только при изменении symbol/timeframe
    if (prevSubscription.current && 
        (prevSubscription.current.symbol !== symbol || 
         prevSubscription.current.timeframe !== timeframe)) {
      handleSubscription();
    }

    // Очистка при размонтировании
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [symbol, timeframe, subscribe, unsubscribe]);

  // НОВАЯ ЛОГИКА: Подписка на WebSocket после загрузки данных
  useEffect(() => {
    let isMounted = true;
    
    const setupWebSocket = async () => {
      // Подписываемся на WebSocket только если:
      // 1. Данные загружены (не loading)
      // 2. Есть данные для отображения
      // 3. Нет активной подписки
      // 4. Таймфрейм поддерживает real-time обновления
      if (!cryptoLoading && 
          (hookCryptoData.length > 0 || (propCryptoData && propCryptoData.length > 0)) &&
          !prevSubscription.current &&
          symbol && 
          timeframe &&
          timeframe !== '1w' && 
          timeframe !== '1M') {
        
        console.log(`[LegacyChartAdapter] 🔌 Setting up WebSocket for ${symbol}@${timeframe} after data load`);
        
        try {
          await subscribe(symbol, timeframe);
          prevSubscription.current = { symbol, timeframe };
          console.log(`[LegacyChartAdapter] ✅ WebSocket subscription established for ${symbol}@${timeframe}`);
        } catch (error) {
          console.warn(`[LegacyChartAdapter] ⚠️ Failed to setup WebSocket for ${symbol}@${timeframe}:`, error);
        }
      }
    };

    // Небольшая задержка для стабилизации данных
    const timer = setTimeout(setupWebSocket, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cryptoLoading, hookCryptoData.length, propCryptoData?.length, symbol, timeframe, subscribe]);

  // Обработка real-time обновлений для графика
  useEffect(() => {
    if (lastUpdate && lastUpdate.symbol && lastUpdate.interval) {
      console.log(`[LegacyChartAdapter] 🔄 Real-time update received:`, {
        symbol: lastUpdate.symbol,
        interval: lastUpdate.interval,
        price: lastUpdate.close,
        volume: lastUpdate.volume,
        timestamp: lastUpdate.timestamp
      });

      // Проверяем, что обновление соответствует текущей подписке
      if (lastUpdate.symbol === symbol && lastUpdate.interval === timeframe) {
        console.log(`[LegacyChartAdapter] ✅ Real-time update matches current subscription`);
        
        // Здесь можно добавить логику для обновления графика
        // Например, обновить последнюю свечу или добавить новую
        // Пока просто логируем для отладки
      } else {
        console.log(`[LegacyChartAdapter] ⚠️ Real-time update mismatch:`, {
          expected: `${symbol}@${timeframe}`,
          received: `${lastUpdate.symbol}@${lastUpdate.interval}`
        });
      }
    }
  }, [lastUpdate, symbol, timeframe]);


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
      realTimeData={lastUpdate}
    />
  );
}; 