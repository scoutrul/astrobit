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
  symbol,
  timeframe,
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
  const [localEventFilters, setLocalEventFilters] = useState(eventFilters);

  // Используем локальные фильтры, если не переданы извне
  const activeEventFilters = eventFilters || localEventFilters;

  // Логирование входных данных
  console.log('[ChartComponent] Props received:', {
    symbol,
    timeframe,
    cryptoDataLength: cryptoData.length,
    astronomicalEventsLength: astronomicalEvents.length,
    eventFilters,
    height,
    className
  });

  // Подробное логирование данных
  console.log('[ChartComponent] CryptoData details:', {
    firstData: cryptoData[0],
    lastData: cryptoData[cryptoData.length - 1],
    sampleData: cryptoData.slice(0, 3),
    allData: cryptoData
  });

  console.log('[ChartComponent] AstronomicalEvents details:', {
    firstEvent: astronomicalEvents[0],
    lastEvent: astronomicalEvents[astronomicalEvents.length - 1],
    sampleEvents: astronomicalEvents.slice(0, 3),
    allEvents: astronomicalEvents
  });

  // Логирование при изменении данных
  useEffect(() => {
    console.log('[ChartComponent] Data changed:', {
      cryptoDataLength: cryptoData.length,
      astronomicalEventsLength: astronomicalEvents.length,
      firstCryptoData: cryptoData[0],
      lastCryptoData: cryptoData[cryptoData.length - 1]
    });
  }, [cryptoData, astronomicalEvents]);

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
    console.log('[ChartComponent] 🔄 Initializing chart...', {
      chartContainerRef: !!chartContainerRef.current,
      containerWidth: chartContainerRef.current?.clientWidth,
      height,
      symbol,
      timeframe,
      cryptoDataLength: cryptoData.length,
      astronomicalEventsLength: astronomicalEvents.length,
      hasChartInstance: !!chartInstance
    });

    // Если график уже существует, не пересоздаем его
    if (chartInstance && seriesInstance) {
      console.log('[ChartComponent] ✅ Chart already exists, skipping initialization');
      return;
    }

    if (!chartContainerRef.current) {
      console.log('[ChartComponent] ❌ Chart container ref is null');
      return;
    }

    if (!chartContainerRef.current.clientWidth) {
      console.log('[ChartComponent] ⚠️ Chart container has no width, waiting...');
      // Ждем немного и пробуем снова
      setTimeout(() => {
        if (chartContainerRef.current && chartContainerRef.current.clientWidth) {
          console.log('[ChartComponent] ✅ Container now has width, re-triggering initialization');
          // Принудительно пересоздаем график
          setChartInstance(null);
          setSeriesInstance(null);
        }
      }, 100);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[ChartComponent] 📊 Creating chart instance...');

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

      console.log('[ChartComponent] ✅ Chart instance created');

      // Создаем серию свечей
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981'
      });

      console.log('[ChartComponent] ✅ Candlestick series created');

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
      console.log('[ChartComponent] ✅ Chart initialization completed');

      return () => {
        console.log('[ChartComponent] 🧹 Cleaning up chart...');
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error('[ChartComponent] ❌ Chart initialization error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка инициализации графика');
      setIsLoading(false);
    }
  }, [height, symbol, timeframe]); // Убрали cryptoData и astronomicalEvents из зависимостей

  // Обновление данных криптовалют
  useEffect(() => {
    console.log('[ChartComponent] 🔄 Updating crypto data...', {
      hasSeriesInstance: !!seriesInstance,
      cryptoDataLength: cryptoData.length,
      firstData: cryptoData[0],
      lastData: cryptoData[cryptoData.length - 1]
    });

    if (!seriesInstance) {
      console.log('[ChartComponent] ❌ No series instance available');
      return;
    }

    if (!cryptoData.length) {
      console.log('[ChartComponent] ⚠️ No crypto data available');
      return;
    }

    try {
      console.log('[ChartComponent] 📊 Converting data to chart format...');

      // Конвертируем данные в формат Lightweight Charts
      const chartData = cryptoData.map(item => {
        const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(item.time);
        return {
          time: timeInSeconds as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        };
      });

      console.log('[ChartComponent] 📊 Chart data converted:', {
        originalLength: cryptoData.length,
        convertedLength: chartData.length,
        firstConverted: chartData[0],
        lastConverted: chartData[chartData.length - 1],
        sampleTimes: chartData.slice(0, 5).map(d => d.time)
      });

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      console.log('[ChartComponent] 📊 Data processed:', {
        processedLength: processedData.length,
        firstProcessed: processedData[0],
        lastProcessed: processedData[processedData.length - 1]
      });

      if (processedData.length > 0) {
        console.log('[ChartComponent] 📊 Setting data to chart...');
        // Проверяем, что seriesInstance все еще валиден
        if (seriesInstance && typeof seriesInstance.setData === 'function') {
          seriesInstance.setData(processedData as any);
          console.log('[ChartComponent] ✅ Data set successfully');
        } else {
          console.log('[ChartComponent] ⚠️ Series instance is no longer valid');
        }
      } else {
        console.log('[ChartComponent] ⚠️ No processed data to set');
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating crypto data:', err);
      // Если ошибка связана с disposed объектом, не показываем ошибку пользователю
      if (err instanceof Error && err.message.includes('disposed')) {
        console.log('[ChartComponent] ℹ️ Chart was disposed, skipping update');
      }
    }
  }, [seriesInstance, cryptoData]);

  // Обновление астрономических событий
  useEffect(() => {
    console.log('[ChartComponent] 🌙 Updating astronomical events...', {
      hasSeriesInstance: !!seriesInstance,
      astronomicalEventsLength: astronomicalEvents.length,
      eventFilters,
      firstEvent: astronomicalEvents[0],
      lastEvent: astronomicalEvents[astronomicalEvents.length - 1]
    });

    if (!seriesInstance) {
      console.log('[ChartComponent] ❌ No series instance available for events');
      return;
    }

    if (!astronomicalEvents.length) {
      console.log('[ChartComponent] ⚠️ No astronomical events available');
      return;
    }

    try {
      console.log('[ChartComponent] 🌙 Filtering events...');

      // Фильтруем события по активным фильтрам
      const filteredEvents = AstronomicalEventUtils.filterEventsByType(
        astronomicalEvents,
        activeEventFilters
      );

      console.log('[ChartComponent] 🌙 Events filtered:', {
        originalCount: astronomicalEvents.length,
        filteredCount: filteredEvents.length,
        firstFiltered: filteredEvents[0],
        lastFiltered: filteredEvents[filteredEvents.length - 1]
      });

      // Конвертируем события в маркеры
      const markers = AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);

      console.log('[ChartComponent] 🌙 Events converted to markers:', {
        markersCount: markers.length,
        firstMarker: markers[0],
        lastMarker: markers[markers.length - 1]
      });

      // Добавляем маркеры на график
      if (markers.length > 0) {
        console.log('[ChartComponent] 🌙 Setting markers to chart...');
        // Проверяем, что seriesInstance все еще валиден
        if (seriesInstance && typeof seriesInstance.setMarkers === 'function') {
          markers.forEach(marker => {
            seriesInstance.setMarkers([marker as any]);
          });
          console.log('[ChartComponent] ✅ Markers set successfully');
        } else {
          console.log('[ChartComponent] ⚠️ Series instance is no longer valid for markers');
        }
      } else {
        console.log('[ChartComponent] ⚠️ No markers to set');
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating astronomical events:', err);
      // Если ошибка связана с disposed объектом, не показываем ошибку пользователю
      if (err instanceof Error && err.message.includes('disposed')) {
        console.log('[ChartComponent] ℹ️ Chart was disposed, skipping event update');
      }
    }
  }, [seriesInstance, astronomicalEvents, activeEventFilters]);

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
      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-[#0a0b1e]/90 backdrop-blur-sm border border-[#334155] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#e2e8f0] text-center flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f7931a]"></div>
            <div className="text-sm">Загрузка данных...</div>
          </div>
        </div>
      )}

      {/* Панель фильтров событий */}
      <div className="absolute top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-20 flex justify-center">
        <div className="w-full sm:w-auto max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 px-2 py-2 sm:px-3 md:px-4 bg-[#0a0b1e]/80 backdrop-blur-sm border border-[#334155] rounded-lg min-w-[100%] max-w-full">
            <span className="text-xs sm:text-sm text-[#8b8f9b] font-medium whitespace-nowrap">События:</span>
            
            {/* Лунные события */}
            <button
              onClick={() => setLocalEventFilters(prev => ({ ...prev, lunar: !prev.lunar }))}
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                activeEventFilters.lunar
                  ? 'bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24]'
                  : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#fbbf24]/50 hover:text-[#fbbf24]/70'
              }`}
            >
              <span className="text-xs sm:text-sm">🌙</span>
              <span className="text-xs font-medium hidden sm:inline">Лунные</span>
              <span className="text-xs font-medium sm:hidden">Л</span>
            </button>

            {/* Солнечные события */}
            <button
              onClick={() => setLocalEventFilters(prev => ({ ...prev, solar: !prev.solar }))}
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                activeEventFilters.solar
                  ? 'bg-[#f59e0b]/20 border border-[#f59e0b] text-[#f59e0b]'
                  : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#f59e0b]/50 hover:text-[#f59e0b]/70'
              }`}
            >
              <span className="text-xs sm:text-sm">☀️</span>
              <span className="text-xs font-medium hidden sm:inline">Солнечные</span>
              <span className="text-xs font-medium sm:hidden">С</span>
            </button>

            {/* Планетарные события */}
            <button
              onClick={() => setLocalEventFilters(prev => ({ ...prev, planetary: !prev.planetary }))}
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                activeEventFilters.planetary
                  ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6] text-[#8b5cf6]'
                  : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]/70'
              }`}
            >
              <span className="text-xs sm:text-sm">☿</span>
              <span className="text-xs font-medium hidden sm:inline">Планетарные</span>
              <span className="text-xs font-medium sm:hidden">П</span>
            </button>

            {/* Метеорные потоки */}
            <button
              onClick={() => setLocalEventFilters(prev => ({ ...prev, meteor: !prev.meteor }))}
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 rounded-md transition-all duration-200 focus:outline-none ${
                activeEventFilters.meteor
                  ? 'bg-[#ec4899]/20 border border-[#ec4899] text-[#ec4899]'
                  : 'bg-[#1e293b] border border-[#334155] text-[#8b8f9b] hover:border-[#ec4899]/50 hover:text-[#ec4899]/70'
              }`}
            >
              <span className="text-xs sm:text-sm">☄️</span>
              <span className="text-xs font-medium hidden sm:inline">Метеоры</span>
              <span className="text-xs font-medium sm:hidden">М</span>
            </button>
          </div>
        </div>
      </div>

      {/* Контейнер графика */}
      <div
        ref={chartContainerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />

      {/* Индикатор ошибки */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-[#dc2626]/90 backdrop-blur-sm border border-[#dc2626] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#fecaca] text-center">
            <div className="text-sm font-semibold mb-1">Ошибка</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      )}

      {/* Тултип для астрономических событий */}
      {tooltip.visible && (
        <div 
          className="absolute z-10 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`,
            maxWidth: '300px'
          }}
        >
          <div className="text-[#e2e8f0] font-semibold text-sm mb-1">{tooltip.title}</div>
          <div className="text-[#8b8f9b] text-xs">{tooltip.description}</div>
        </div>
      )}
    </div>
  );
}; 