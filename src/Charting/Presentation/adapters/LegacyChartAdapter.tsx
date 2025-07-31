import React from 'react';
import { ChartComponent } from '../components/ChartComponent';
import { AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';

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
  astronomicalEvents?: AstronomicalEvent[];
  eventFilters?: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  symbol?: string;
  timeframe?: string;
}

export const LegacyChartAdapter: React.FC<LegacyChartAdapterProps> = ({
  height = 400,
  className = '',
  cryptoData = [],
  astronomicalEvents = [],
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  symbol = 'BTCUSDT',
  timeframe = '1d'
}) => {
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