import React, { useMemo, useEffect, useRef } from 'react';
import { useCryptoData } from '../../../CryptoData/Presentation/hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../Astronomical/Presentation/hooks/useAstronomicalEvents';
import { useRealTimeCryptoData } from '../../../CryptoData/Presentation/hooks/useRealTimeCryptoData';
import { useStore } from '../../../Shared/presentation/store';
import { ChartComponent } from '../components/ChartComponent';
import { AstronomicalEvent as NewAstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { AstronomicalEvent as OldAstronomicalEvent } from '../../../Astronomical/Infrastructure/services/astronomicalEvents';
import { combineHistoricalAndFutureCandles, clearFutureCandlesCache } from '../../../CryptoData/Infrastructure/utils/futureCandlesGenerator';

interface LegacyChartAdapterProps {
  height?: number;
  cryptoData?: Array<{
    symbol: string;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    visible?: boolean;
  }>;
  astronomicalEvents?: NewAstronomicalEvent[];
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
  height = 400,
  cryptoData: propCryptoData = [],
  astronomicalEvents: propAstronomicalEvents = [],
  symbol: propSymbol,
  timeframe: propTimeframe
}) => {
  // Получаем данные из store
  const { symbol: storeSymbol, timeframe: storeTimeframe } = useStore();
  
  // Используем пропсы или данные из store
  const symbol = propSymbol || storeSymbol;
  const timeframe = propTimeframe || storeTimeframe;
  
  // Очищаем кэш при смене таймфрейма для применения новых ограничений
  useEffect(() => {
    clearFutureCandlesCache();
  }, [timeframe]);

  // Real-time данные
  const { 
    lastUpdate, 
    subscribe, 
    unsubscribe 
  } = useRealTimeCryptoData();

  // Ref для отслеживания изменений symbol/timeframe
  const prevSubscription = useRef<{ symbol: string; timeframe: string } | null>(null);

  // Стабилизируем даты для useAstronomicalEvents - широкий диапазон для полноты данных
  const dateRange = useMemo(() => {
    const now = Date.now();
    return {
      startDate: new Date('2020-01-01'), // Покрываем все астрономические события с 2020 года
      endDate: new Date(now + 365 * 24 * 60 * 60 * 1000)    // 1 год вперед для будущих событий
    };
  }, []); // Пустой массив зависимостей - даты не должны меняться

  // Получаем криптоданные через хук
  const { data: hookCryptoData } = useCryptoData(symbol, timeframe);
  
  // Получаем астрономические события с стабилизированными датами
  const { events: hookAstronomicalEvents } = useAstronomicalEvents(
    dateRange.startDate,
    dateRange.endDate
  );

  // Конвертируем старые события в новый формат
  const convertedHookEvents = hookAstronomicalEvents ? convertAstronomicalEvents(hookAstronomicalEvents) : [];
  
  // Используем события из пропсов или из хука
  const astronomicalEvents = propAstronomicalEvents || convertedHookEvents || [];

  // Комбинируем данные из пропсов и хука
  const combinedCryptoData = useMemo(() => {
    const propData = propCryptoData || [];
    const hookData = hookCryptoData || [];
    
    // Объединяем данные, приоритет у пропсов
    return propData.length > 0 ? propData : hookData;
  }, [propCryptoData, hookCryptoData]);

  // Генерируем будущие свечи на основе астрономических событий
  const eventsForGenerator = useMemo(() => {
    if (!astronomicalEvents || astronomicalEvents.length === 0) return [];
    
    return astronomicalEvents
      .filter(event => {
        const eventDate = new Date(event.timestamp);
        const now = new Date();
        const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        // События в ближайшие 30 дней
        return diffDays >= 0 && diffDays <= 30;
      })
      .map(event => ({
        id: event.name,
        name: event.name,
        date: new Date(event.timestamp),
        type: event.type,
        description: event.description,
        significance: 'medium'
      }));
  }, [astronomicalEvents]);

  // Комбинируем исторические и будущие свечи
  const enhancedCryptoData = useMemo(() => {
    if (!combinedCryptoData || combinedCryptoData.length === 0) return [];

    const historicalDataWithVisibility = combinedCryptoData.map(candle => ({
      ...candle,
      visible: true
    }));

    const combinedData = combineHistoricalAndFutureCandles(
      historicalDataWithVisibility,
      timeframe,
      eventsForGenerator
    );

    // Если есть real-time данные ТЕКУЩЕЙ подписки, обновляем будущие свечи на основе последней цены
    const rtMatchesCurrent = !!lastUpdate &&
      lastUpdate!.symbol.toLowerCase() === symbol.toLowerCase() &&
      lastUpdate!.interval === timeframe;

    if (rtMatchesCurrent && combinedData.length > 0) {
      // Находим индекс последней видимой (исторической) свечи
      const lastHistoricalIndex = historicalDataWithVisibility.length - 1;
      const currentPrice = lastUpdate.close;
      
      // Обновляем все будущие свечи (после исторических) на текущую цену, сохраняя невидимость
      combinedData.forEach((candle, index) => {
        if (index > lastHistoricalIndex) {
          candle.open = currentPrice;
          candle.high = currentPrice;
          candle.low = currentPrice;
          candle.close = currentPrice;
          candle.visible = false; // Сохраняем невидимость будущих свечей
          candle.volume = 0; // Нулевой объем для будущих свечей
        }
      });
    }

    return combinedData;
  }, [
    combinedCryptoData,
    timeframe,
    eventsForGenerator.length,
    symbol,
    lastUpdate?.close,
    lastUpdate?.symbol,
    lastUpdate?.interval
  ]);

  // Подписка на real-time данные при изменении symbol/timeframe
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
      // Подписываемся на новую подписку (старая автоматически отменится в хуке)
      subscribe(symbol, timeframe);
      prevSubscription.current = currentSubscription;
    }
  }, [symbol, timeframe, subscribe]);

  // Отдельный useEffect для очистки при размонтировании
  useEffect(() => {
    return () => {
      if (prevSubscription.current) {
        unsubscribe();
        prevSubscription.current = null;
      }
    };
  }, [unsubscribe]);

  return (
    <ChartComponent
      width={800}
      height={height}
      data={enhancedCryptoData.map(candle => ({
        timestamp: new Date(candle.time).getTime(),
        close: candle.close
      }))}
    />
  );
}; 