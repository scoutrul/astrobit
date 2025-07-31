import React, { useMemo, useEffect, useRef } from 'react';
import { useCryptoData } from '../../../hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../hooks/useAstronomicalEvents';
import { useRealTimeCryptoData } from '../../../hooks/useRealTimeCryptoData';
import { useStore } from '../../../store';
import { ChartComponent } from '../components/ChartComponent';
import { AstronomicalEvent as NewAstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { AstronomicalEvent as OldAstronomicalEvent } from '../../../services/astronomicalEvents';
import { combineHistoricalAndFutureCandles } from '../../../utils/futureCandlesGenerator';

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
    isConnected, 
    currentSubscription, 
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
  const { data: hookCryptoData, loading: cryptoLoading, error: cryptoError } = useCryptoData(symbol, timeframe);
  
  // Получаем астрономические события с стабилизированными датами
  const { events: hookAstronomicalEvents, loading: astroLoading } = useAstronomicalEvents(
    dateRange.startDate,
    dateRange.endDate
  );

  // Конвертируем старые события в новый формат
  const convertedHookEvents = hookAstronomicalEvents ? convertAstronomicalEvents(hookAstronomicalEvents) : [];
  
  // Используем события из пропсов или из хука
  const astronomicalEvents = propAstronomicalEvents || convertedHookEvents || [];

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
  }, [astronomicalEvents]);

  // Генерируем адаптивные будущие свечи с учетом событий
  const enhancedCryptoData = useMemo(() => {
    const historicalData = propCryptoData || hookCryptoData || [];
    
    if (historicalData.length === 0) {
      return historicalData;
    }

    // Объединяем исторические данные с адаптивными будущими свечами
    const combinedData = combineHistoricalAndFutureCandles(
      historicalData,
      timeframe,
      eventsForGenerator
    );

    console.log('[LegacyChartAdapter] 🔮 Адаптивная генерация свечей:', {
      symbol,
      timeframe,
      historicalCount: historicalData.length,
      eventsCount: eventsForGenerator.length,
      combinedCount: combinedData.length,
      futureCount: combinedData.length - historicalData.length
    });

    return combinedData;
  }, [propCryptoData, hookCryptoData, timeframe, eventsForGenerator]);

  // Управление WebSocket подпиской
  useEffect(() => {
    const currentSub = { symbol, timeframe };
    
    // Проверяем, изменились ли параметры подписки
    if (
      !prevSubscription.current ||
      prevSubscription.current.symbol !== symbol ||
      prevSubscription.current.timeframe !== timeframe
    ) {
      console.log('[LegacyChartAdapter] 🔄 Смена подписки:', {
        from: prevSubscription.current,
        to: currentSub
      });

      // Отписываемся от предыдущей подписки
      if (prevSubscription.current) {
        unsubscribe();
      }

      // Подписываемся на новую подписку
      if (symbol && timeframe) {
        subscribe(symbol, timeframe);
      }

      prevSubscription.current = currentSub;
    }
  }, [symbol, timeframe, subscribe, unsubscribe]);

  // Логирование real-time обновлений
  useEffect(() => {
    if (lastUpdate) {
      console.log('[LegacyChartAdapter] 📡 Real-time обновление:', {
        symbol: lastUpdate.symbol,
        interval: lastUpdate.interval,
        timestamp: new Date(lastUpdate.timestamp).toISOString(),
        close: lastUpdate.close,
        isClosed: lastUpdate.isClosed
      });
    }
  }, [lastUpdate]);

  // Комбинированный loading статус
  const isDataLoading = cryptoLoading || astroLoading;

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
      isLoading={isDataLoading}
      realTimeData={lastUpdate}
    />
  );
}; 