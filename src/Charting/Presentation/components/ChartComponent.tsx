import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';

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
  isLoading?: boolean;
  realTimeData?: BinanceKlineWebSocketData | null;
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
  eventFilters = { lunar: true, solar: true, planetary: true, meteor: true },
  isLoading = false,
  realTimeData = null
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [seriesInstance, setSeriesInstance] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: '',
    description: '',
    visible: false
  });
  const [localEventFilters, setLocalEventFilters] = useState(eventFilters);

  // Ключ для принудительного пересоздания компонента при смене symbol/timeframe
  const chartKey = `${symbol}-${timeframe}`;

  // Активные фильтры событий
  const activeEventFilters = {
    lunar: localEventFilters.lunar ?? true,
    solar: localEventFilters.solar ?? true,
    planetary: localEventFilters.planetary ?? true,
    meteor: localEventFilters.meteor ?? true
  };

  // Синхронизируем локальные фильтры с пропсами
  useEffect(() => {
    setLocalEventFilters(eventFilters);
  }, [eventFilters]);

  // Обработчик клика по маркеру
  const handleMarkerClick = (param: any) => {
    if (param.seriesData && param.seriesData.marker) {
      const marker = param.seriesData.marker;
      setTooltip({
        x: param.point.x,
        y: param.point.y,
        title: marker.title || 'Астрономическое событие',
        description: marker.description || 'Описание события',
        visible: true
      });
    }
  };

  // Инициализация графика
  useEffect(() => {
    console.log('[ChartComponent] 🔄 Initializing chart...', {
      chartKey,
      symbol,
      timeframe,
      height,
      containerWidth: chartContainerRef.current?.clientWidth,
      hasChartInstance: !!chartInstance
    });

    if (!chartContainerRef.current) {
      console.log('[ChartComponent] ❌ Chart container not available');
      return;
    }

    // Очищаем старый график если он существует
    if (chartInstance) {
      console.log('[ChartComponent] 🧹 Cleaning up existing chart...');
      try {
        chartInstance.remove();
      } catch (err) {
        console.log('[ChartComponent] ℹ️ Chart was already disposed during cleanup');
      }
      setChartInstance(null);
      setSeriesInstance(null);
    }

    // Проверяем ширину контейнера
    if (chartContainerRef.current.clientWidth === 0) {
      console.log('[ChartComponent] ⚠️ Container width is 0, waiting...');
      const timer = setTimeout(() => {
        if (chartContainerRef.current) {
          console.log('[ChartComponent] 🔄 Retrying initialization after delay...');
          setChartInstance(null);
          setSeriesInstance(null);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // setIsLoading(true); // Удалено локальное состояние isLoading
    setError(null);

    try {
      console.log('[ChartComponent] 🎨 Creating chart instance...');

      // Создаем новый график
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { color: '#0a0b1e' },
          textColor: '#e2e8f0'
        },
        grid: {
          vertLines: { color: '#1e293b' },
          horzLines: { color: '#1e293b' }
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#f7931a',
            width: 1,
            style: 2
          },
          horzLine: {
            color: '#f7931a',
            width: 1,
            style: 2
          }
        },
        rightPriceScale: {
          borderColor: '#334155',
          textColor: '#8b8f9b'
        },
        timeScale: {
          borderColor: '#334155',
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
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // setIsLoading(false); // Удалено локальное состояние isLoading
      console.log('[ChartComponent] ✅ Chart initialization completed');

      return () => {
        console.log('[ChartComponent] 🧹 Cleaning up chart...');
        window.removeEventListener('resize', handleResize);
        if (chart) {
          try {
            chart.remove();
          } catch (err) {
            console.log('[ChartComponent] ℹ️ Chart was already disposed during cleanup');
          }
        }
      };
    } catch (err) {
      console.error('[ChartComponent] ❌ Chart initialization error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка инициализации графика');
      // setIsLoading(false); // Удалено локальное состояние isLoading
    }
  }, [chartKey, height]); // Зависим только от ключа и высоты

  // Обновление данных криптовалют
  useEffect(() => {
    if (!seriesInstance || !cryptoData.length) {
      return;
    }

    console.log('[ChartComponent] 📊 Updating crypto data...', {
      cryptoDataLength: cryptoData.length,
      firstData: cryptoData[0],
      lastData: cryptoData[cryptoData.length - 1]
    });

    try {
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

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        console.log('[ChartComponent] 📊 Setting data to chart...');
        seriesInstance.setData(processedData as any);
        console.log('[ChartComponent] ✅ Data set successfully');

        // Зум на последние 50 свечей
        if (chartInstance && processedData.length > 0) {
          const visibleCount = Math.min(50, processedData.length);
          const lastTime = processedData[processedData.length - 1].time;
          const firstTime = processedData[Math.max(0, processedData.length - visibleCount)].time;
          
          console.log('[ChartComponent] 🔍 Setting zoom to last 50 candles:', {
            visibleCount,
            firstTime,
            lastTime,
            totalDataPoints: processedData.length
          });
          
          chartInstance.timeScale().setVisibleRange({
            from: firstTime,
            to: lastTime
          });
        }
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating crypto data:', err);
    }
  }, [seriesInstance, cryptoData, chartInstance]);

  // Обновление астрономических событий
  useEffect(() => {
    if (!seriesInstance || !astronomicalEvents.length) {
      return;
    }

    console.log('[ChartComponent] 🌙 Updating astronomical events...', {
      astronomicalEventsLength: astronomicalEvents.length,
      eventFilters: activeEventFilters
    });

    try {
      // Фильтруем события по активным фильтрам
      const filteredEvents = AstronomicalEventUtils.filterEventsByType(
        astronomicalEvents,
        activeEventFilters
      );

      // Конвертируем события в маркеры
      const markers = AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);

      if (markers.length > 0) {
        console.log('[ChartComponent] 🌙 Setting markers to chart...');
        seriesInstance.setMarkers(markers as any);
        console.log('[ChartComponent] ✅ Markers set successfully');
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating astronomical events:', err);
    }
  }, [seriesInstance, astronomicalEvents, activeEventFilters]);

  // Обработка real-time данных
  useEffect(() => {
    if (!seriesInstance || !realTimeData || !realTimeData.isClosed) {
      return;
    }

    console.log('[ChartComponent] 📡 Обновление real-time данных:', {
      symbol: realTimeData.symbol,
      interval: realTimeData.interval,
      timestamp: new Date(realTimeData.timestamp).toISOString(),
      close: realTimeData.close,
      volume: realTimeData.volume
    });

    try {
      // Конвертируем timestamp в секунды
      const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(realTimeData.timestamp);
      
      // Создаем новую свечу
      const newCandle = {
        time: timeInSeconds as any,
        open: realTimeData.open,
        high: realTimeData.high,
        low: realTimeData.low,
        close: realTimeData.close
      };

      // Обновляем последнюю свечу на графике
      seriesInstance.update(newCandle);
      
      console.log('[ChartComponent] ✅ Real-time данные обновлены на графике');
    } catch (err) {
      console.error('[ChartComponent] ❌ Ошибка обновления real-time данных:', err);
    }
  }, [seriesInstance, realTimeData]);

  // Обработчик клика по графику
  useEffect(() => {
    if (!chartInstance) return;

    const handleClick = (param: any) => {
      if (param.seriesData && param.seriesData.marker) {
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
        style={{ height: `${height}px`, marginTop: '60px' }} // Добавлен отступ сверху для фильтров
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