import React from 'react';
import { useCryptoData } from '../../../hooks/useCryptoData';
import { useAstronomicalEvents } from '../../../hooks/useAstronomicalEvents';
import { useStore } from '../../../store';
import { ChartComponent } from '../components/ChartComponent';
import { AstronomicalEvent as NewAstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { AstronomicalEvent as OldAstronomicalEvent } from '../../../services/astronomicalEvents';

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
  height = 400,
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

  // Получаем криптоданные через хук
  const { data: hookCryptoData, loading: cryptoLoading, error: cryptoError } = useCryptoData(symbol, timeframe);
  
  // Используем данные из пропсов или из хука
  const cryptoData = propCryptoData || hookCryptoData || [];

  // Получаем астрономические события
  const { events: hookAstronomicalEvents, loading: astroLoading } = useAstronomicalEvents(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 год назад
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)   // 3 месяца вперед
  );

  // Конвертируем старые события в новый формат
  const convertedHookEvents = hookAstronomicalEvents ? convertAstronomicalEvents(hookAstronomicalEvents) : [];
  
  // Используем события из пропсов или из хука
  const astronomicalEvents = propAstronomicalEvents || convertedHookEvents || [];

  console.log('[LegacyChartAdapter] 🔍 Astronomical events details:', {
    hookEventsLength: hookAstronomicalEvents?.length || 0,
    convertedHookEventsLength: convertedHookEvents.length,
    propEventsLength: propAstronomicalEvents?.length || 0,
    finalEventsLength: astronomicalEvents.length,
    firstEvent: astronomicalEvents[0],
    lastEvent: astronomicalEvents[astronomicalEvents.length - 1],
    astroLoading
  });

  console.log('[LegacyChartAdapter] Rendering with:', {
    symbol,
    timeframe,
    cryptoDataLength: cryptoData.length,
    astronomicalEventsLength: astronomicalEvents.length,
    cryptoLoading,
    astroLoading,
    cryptoError,
    hookCryptoDataLength: hookCryptoData?.length || 0,
    propCryptoDataLength: propCryptoData?.length || 0
  });

  return (
    <ChartComponent
      symbol={symbol}
      timeframe={timeframe}
      height={height}
      className={className}
      cryptoData={cryptoData}
      astronomicalEvents={astronomicalEvents}
      eventFilters={eventFilters}
    />
  );
}; 