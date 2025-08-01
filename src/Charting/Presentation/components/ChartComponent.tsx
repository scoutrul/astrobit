import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';

// Функция debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

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
  title?: string;
  description?: string;
  events?: AstronomicalEvent[];
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
    visible: false
  });

  // Используем фильтры из пропсов
  const activeEventFilters = eventFilters;

  // Ключ для принудительного пересоздания компонента при смене symbol/timeframe
  const chartKey = `${symbol}-${timeframe}`;

  // Обработчик движения курсора для ToolTip
  const handleCrosshairMove = (param: any) => {
    // Проверяем, есть ли данные о свече (либо param.time, либо param.seriesData)
    if ((param.time || param.seriesData) && param.point) {
      // param.time может быть уже в правильном формате (секунды)
      let timeInSeconds = 0;
      
      if (param.seriesData && param.seriesData.time) {
        // Используем время из seriesData (надежнее для наведения)
        timeInSeconds = param.seriesData.time;
      } else if (typeof param.time === 'number' && param.time > 1000000000) {
        // param.time уже в секундах (больше миллиарда)
        timeInSeconds = param.time;
      } else if (param.time) {
        // Fallback - конвертируем param.time из миллисекунд
        timeInSeconds = Math.floor(param.time / 1000);
      } else {
        // Нет времени - не можем показать ToolTip
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Динамический диапазон поиска в зависимости от таймфрейма
      let timeRange = 3600; // 1 час по умолчанию
      
      switch (timeframe) {
        case '1h':
          timeRange = 1800; // 30 минут для часового
          break;
        case '8h':
          timeRange = 14400; // 4 часа для 8-часового
          break;
        case '1d':
          timeRange = 86400; // 24 часа для дневного
          break;
        case '1w':
          timeRange = 604800; // 1 неделя для недельного
          break;
        case '1M':
          timeRange = 2592000; // 1 месяц для месячного
          break;
      }
      
      const eventsNearTime = astronomicalEvents.filter(event => {
        const eventTimeInSeconds = Math.floor(event.timestamp / 1000);
        const diff = Math.abs(eventTimeInSeconds - timeInSeconds);
        const isNear = diff <= timeRange;
        
        return isNear;
      });
      
      if (eventsNearTime.length > 0) {
        // Есть события - показываем ToolTip
        if (eventsNearTime.length === 1) {
          // Одно событие
          const event = eventsNearTime[0];
          const newTooltip = {
            x: param.point.x,
            y: param.point.y - 60, // Смещаем выше курсора
            title: event.name,
            description: event.description,
            visible: true
          };
          
          setTooltip(newTooltip);
        } else {
          // Несколько событий - стэк
          const newTooltip = {
            x: param.point.x,
            y: param.point.y - 60, // Смещаем выше курсора
            events: eventsNearTime,
            visible: true
          };
          
          setTooltip(newTooltip);
        }
      } else {
        // Нет событий - скрываем ToolTip
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    } else {
      // Курсор не над свечой - скрываем ToolTip
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    // Очищаем старый график если он существует
    if (chartInstance) {
      try {
        chartInstance.remove();
      } catch (err) {
        // Chart was already disposed
      }
      setChartInstance(null);
      setSeriesInstance(null);
    }

    // Проверяем ширину контейнера
    if (chartContainerRef.current.clientWidth === 0) {
      const timer = setTimeout(() => {
        if (chartContainerRef.current) {
          setChartInstance(null);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // setIsLoading(true); // Удалено локальное состояние isLoading
    setError(null);

    try {
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
          close: item.close,
          volume: item.volume // Добавляем volume для различения реальных и фейковых свечей
        };
      });

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        console.log('[ChartComponent] 📊 Setting data to chart...');
        seriesInstance.setData(processedData as any);
        console.log('[ChartComponent] ✅ Data set successfully');

        // Зум с показом будущих событий - последняя реальная свеча по центру
        if (chartInstance && processedData.length > 0) {
          const totalDataPoints = processedData.length;
          
          // Находим индекс последней реальной свечи (без фейковых)
          // Предполагаем, что фейковые свечи имеют volume = 0
          let lastRealCandleIndex = -1;
          for (let i = processedData.length - 1; i >= 0; i--) {
            const candle = processedData[i] as any;
            if (candle.volume && candle.volume > 0) {
              lastRealCandleIndex = i;
              break;
            }
          }
          
          // Если не нашли реальные свечи, используем последние 50
          const realCandleIndex = lastRealCandleIndex >= 0 ? lastRealCandleIndex : totalDataPoints - 1;
          
          // Показываем максимум 50 свечей
          const maxVisibleCandles = 50;
          
          // Вычисляем начальный индекс так, чтобы последняя реальная свеча была по центру
          const centerIndex = realCandleIndex;
          const halfVisible = Math.floor(maxVisibleCandles / 2);
          
          // Начальный индекс - половина видимых свечей до центра
          const startIndex = Math.max(0, centerIndex - halfVisible);
          
          // Конечный индекс - половина видимых свечей после центра
          const endIndex = Math.min(totalDataPoints - 1, centerIndex + halfVisible);
          
          const firstTime = processedData[startIndex].time;
          const lastTime = processedData[endIndex].time;
          
          console.log('[ChartComponent] 🔍 Setting zoom with centered real candle:', {
            totalDataPoints,
            realCandleIndex,
            centerIndex,
            startIndex,
            endIndex,
            visibleCandles: endIndex - startIndex + 1,
            firstTime,
            lastTime,
            lastRealCandleTime: processedData[realCandleIndex]?.time
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
    if (!seriesInstance || astronomicalEvents.length === 0) {
      return;
    }

    try {
      // Фильтруем события по активным фильтрам
      const filteredEvents = AstronomicalEventUtils.filterEventsByType(
        astronomicalEvents,
        activeEventFilters
      );

      // Конвертируем события в маркеры
      const markers = AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);

      if (markers.length > 0) {
        seriesInstance.setMarkers(markers as any);
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
    } catch (err) {
      console.error('[ChartComponent] ❌ Ошибка обновления real-time данных:', err);
    }
  }, [seriesInstance, realTimeData]);

  // Обработчик клика по графику
  useEffect(() => {
    if (!chartInstance) return;

    const handleClick = (param: any) => {
      handleCrosshairMove(param);
    };

    // Debounced обработчик мыши для hover
    const debouncedMouseMove = debounce((param: any) => {
      handleCrosshairMove(param);
    }, 100);

    chartInstance.subscribeClick(handleClick);
    chartInstance.subscribeCrosshairMove(debouncedMouseMove);

    return () => {
      chartInstance.unsubscribeClick(handleClick);
      chartInstance.unsubscribeCrosshairMove(debouncedMouseMove);
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
            maxWidth: '350px'
          }}
        >
          {tooltip.events ? (
            // Стэк событий
            <div className="space-y-2">
              <div className="text-[#e2e8f0] font-semibold text-sm mb-2 border-b border-[#334155] pb-1">
                События ({tooltip.events.length})
              </div>
              {tooltip.events.map((event, index) => (
                <div key={index} className="border-l-2 border-[#f7931a] pl-2">
                  <div className="text-[#e2e8f0] font-medium text-sm mb-1">
                    {event.name}
                  </div>
                  <div className="text-[#8b8f9b] text-xs mb-1">
                    {new Date(event.timestamp).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-[#8b8f9b] text-xs">
                    {event.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Одно событие
            <>
              <div className="text-[#e2e8f0] font-semibold text-sm mb-1">{tooltip.title}</div>
              <div className="text-[#8b8f9b] text-xs">{tooltip.description}</div>
            </>
          )}
        </div>
      )}


    </div>
  );
}; 