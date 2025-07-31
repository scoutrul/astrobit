import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';

interface ChartComponentProps {
  symbol: string;
  timeframe: string;
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
}

interface TooltipData {
  x: number;
  y: number;
  title: string;
  description: string;
  visible: boolean;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
  height = 400,
  className = '',
  cryptoData = [],
  astronomicalEvents = [],
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true }
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [seriesInstance, setSeriesInstance] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: '',
    description: '',
    visible: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обработчик клика по маркеру
  const handleMarkerClick = (param: any) => {
    if (param.seriesData) {
      const data = param.seriesData as any;
      setTooltip({
        x: param.point?.x || 0,
        y: param.point?.y || 0,
        title: data.title || 'Событие',
        description: data.description || '',
        visible: true
      });
    }
  };

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Создаем экземпляр графика
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { color: '#1a1a1a' },
          textColor: '#d1d5db'
        },
        grid: {
          vertLines: { color: '#2d2d2d' },
          horzLines: { color: '#2d2d2d' }
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#f7931a',
            width: 1,
            style: 3,
            labelBackgroundColor: '#f7931a'
          },
          horzLine: {
            color: '#f7931a',
            width: 1,
            style: 3,
            labelBackgroundColor: '#f7931a'
          }
        },
        rightPriceScale: {
          borderColor: '#2d2d2d',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1
          }
        },
        timeScale: {
          borderColor: '#2d2d2d',
          timeVisible: true,
          secondsVisible: false
        }
      });

      // Создаем серию свечей
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981'
      });

      setChartInstance(chart);
      setSeriesInstance(candlestickSeries);

      // Обработчик изменения размера
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth
          });
        }
      };

      window.addEventListener('resize', handleResize);

      setIsLoading(false);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка инициализации графика');
      setIsLoading(false);
    }
  }, [height]);

  // Обновление данных криптовалют
  useEffect(() => {
    if (!seriesInstance || !cryptoData.length) return;

    try {
      // Конвертируем данные в формат Lightweight Charts
      const chartData = cryptoData.map(item => ({
        time: TimeframeUtils.convertTimestampToSeconds(item.time) as any,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      }));

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        seriesInstance.setData(processedData as any);
      }
    } catch (err) {
      console.error('Ошибка обновления данных:', err);
    }
  }, [seriesInstance, cryptoData]);

  // Обновление астрономических событий
  useEffect(() => {
    if (!seriesInstance || !astronomicalEvents.length) return;

    try {
      // Фильтруем события по активным фильтрам
      const filteredEvents = AstronomicalEventUtils.filterEventsByType(
        astronomicalEvents,
        eventFilters
      );

      // Конвертируем события в маркеры
      const markers = AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);

      // Добавляем маркеры на график
      markers.forEach(marker => {
        seriesInstance.setMarkers([marker as any]);
      });
    } catch (err) {
      console.error('Ошибка обновления астрономических событий:', err);
    }
  }, [seriesInstance, astronomicalEvents, eventFilters]);

  // Обработчик клика по графику
  useEffect(() => {
    if (!chartInstance) return;

    const handleClick = (param: any) => {
      if (param.seriesData) {
        handleMarkerClick(param);
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };

    chartInstance.subscribeClick(handleClick);

    return () => {
      chartInstance.unsubscribeClick(handleClick);
    };
  }, [chartInstance]);

  return (
    <div className={`relative ${className}`}>
      {/* Контейнер графика */}
      <div
        ref={chartContainerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Загрузка графика...</div>
        </div>
      )}

      {/* Индикатор ошибки */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50">
          <div className="text-white text-center">
            <div className="font-bold">Ошибка</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-10 bg-gray-800 text-white p-2 rounded shadow-lg border border-gray-600"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-bold text-sm">{tooltip.title}</div>
          <div className="text-xs text-gray-300">{tooltip.description}</div>
        </div>
      )}
    </div>
  );
}; 