import React, { useMemo, useEffect, useRef } from 'react';
import { useCryptoData } from '../../../CryptoData/Presentation/hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../Astronomical/Presentation/hooks/useAstronomicalEvents';
import { useRealTimeCryptoData } from '../../../CryptoData/Presentation/hooks/useRealTimeCryptoData';
import { useStore } from '../../../Shared/presentation/store';
import { ChartComponent } from '../components/ChartComponent';
import { AstronomicalEvent as NewAstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { AstronomicalEvent as OldAstronomicalEvent } from '../../../Astronomical/Infrastructure/services/astronomicalEvents';
import { combineHistoricalAndFutureCandles } from '../../../CryptoData/Infrastructure/utils/futureCandlesGenerator';

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
    let combinedData = combineHistoricalAndFutureCandles(
      historicalData,
      timeframe,
      eventsForGenerator,
      symbol
    );

    // Если есть real-time данные, обновляем будущие свечи на основе последней цены
    if (lastUpdate && combinedData.length > 0) {
      const lastHistoricalIndex = historicalData.length - 1;
      const currentPrice = lastUpdate.close;
      
      // Обновляем все будущие свечи (после исторических) на текущую цену
      combinedData = combinedData.map((candle, index) => {
        if (index > lastHistoricalIndex) {
          return {
            ...candle,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice
          };
        }
        return candle;
      });
    }

    // Принудительно создаем новый массив для обеспечения изменения ссылки
    // Это гарантирует, что React увидит изменение даже если длина массива одинакова
    return [...combinedData];
  }, [propCryptoData, hookCryptoData, timeframe, eventsForGenerator, symbol, cryptoLoading, lastUpdate?.close]); // Добавляем lastUpdate

  // WebSocket подписка для виджета цены (НЕ для графика)
  useEffect(() => {
    // Подписываемся только если есть symbol и timeframe
    if (!symbol || !timeframe) {
      return;
    }

    const currentSubscription = { symbol, timeframe };
    
    // Проверяем, изменилась ли подписка
    const hasChanged = !prevSubscription.current || 
      prevSubscription.current.symbol !== symbol || 
      prevSubscription.current.timeframe !== timeframe;
    
    if (hasChanged) {
      console.log(`[LegacyChartAdapter] 🔄 Подписка изменилась: ${symbol}@${timeframe}`);
      
      // Подписываемся на новую подписку (старая автоматически отменится в хуке)
      subscribe(symbol, timeframe);
      prevSubscription.current = currentSubscription;
    }
  }, [symbol, timeframe, subscribe]);

  // Отдельный useEffect для очистки при размонтировании
  useEffect(() => {
    return () => {
      if (prevSubscription.current) {
        console.log(`[LegacyChartAdapter] 🧹 Очистка при размонтировании`);
        unsubscribe();
        prevSubscription.current = null;
      }
    };
  }, [unsubscribe]);

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

  return (
    <ChartComponent
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