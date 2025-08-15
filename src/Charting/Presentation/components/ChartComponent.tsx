import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
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

  // Флаги и refs для управления зумом/скроллом без сбросов
  const hasUserInteractedRef = useRef(false);
  const isProgrammaticRangeChangeRef = useRef(false);
  const initialRangeAppliedRef = useRef(false);
  const lastManualRangeRef = useRef<{ from: number; to: number } | null>(null);

  // Стабилизируем фильтры событий, чтобы избежать лишних обновлений
  const activeEventFilters = useMemo(() => eventFilters, [
    eventFilters.lunar,
    eventFilters.solar,
    eventFilters.planetary,
    eventFilters.meteor
  ]);

  // Стабилизируем астрономические события, чтобы избежать лишних обновлений
  const stableAstronomicalEvents = useMemo(() => astronomicalEvents, [astronomicalEvents]);



  // Ключ для принудительного пересоздания компонента при смене symbol/timeframe
  const chartKey = `${symbol}-${timeframe}`;

  // Обработчик движения курсора для ToolTip
  const handleCrosshairMove = useCallback((param: any) => {
    // Проверяем наличие данных
    if (!param.point) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    let timeInSeconds = 0;
    
    // Получаем время из разных источников
    if (param.seriesData && param.seriesData.time) {
      timeInSeconds = param.seriesData.time;
    } else if (param.time && typeof param.time === 'number') {
      if (param.time > 1000000000) {
        timeInSeconds = param.time; // Уже в секундах
      } else {
        timeInSeconds = Math.floor(param.time / 1000); // Конвертируем из миллисекунд
      }
    } else {
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
    
    // Поиск событий вблизи времени
    const eventsNearTime = stableAstronomicalEvents.filter(event => {
      const eventTimeInSeconds = Math.floor(event.timestamp / 1000);
      const diff = Math.abs(eventTimeInSeconds - timeInSeconds);
      return diff <= timeRange;
    });
    
    if (eventsNearTime.length > 0) {
      // Есть события - показываем ToolTip мгновенно
      if (eventsNearTime.length === 1) {
        // Одно событие
        const event = eventsNearTime[0];
        setTooltip({
          x: param.point.x,
          y: param.point.y - 60,
          title: event.name,
          description: event.description,
          visible: true
        });
      } else {
        // Несколько событий - стэк
        setTooltip({
          x: param.point.x,
          y: param.point.y - 60,
          events: eventsNearTime,
          visible: true
        });
      }
    } else {
      // Нет событий - скрываем ToolTip мгновенно
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, [timeframe, stableAstronomicalEvents]);

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    // Проверяем, есть ли уже график в контейнере
    const existingChart = chartContainerRef.current.querySelector('.tv-lightweight-charts');
    if (existingChart) {
      console.warn('[Chart] ⚠️ Chart already exists in container, skipping initialization');
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

      // Подписка на изменение видимого диапазона для отслеживания пользовательского зума/скролла
      const timeScale = chart.timeScale();
      const handleVisibleRangeChange = (range: any) => {
        // Игнорируем собственные программные изменения диапазона
        if (isProgrammaticRangeChangeRef.current) {
          // Сбрасываем флаг только после первого уведомления от чарт-а
          isProgrammaticRangeChangeRef.current = false;
          return;
        }
        hasUserInteractedRef.current = true;
        if (range && typeof range.from === 'number' && typeof range.to === 'number') {
          lastManualRangeRef.current = { from: range.from, to: range.to };
        }
      };

      timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

      // Очистка при размонтировании
      return () => {
        window.removeEventListener('resize', handleResize);
        timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
        
        // Очищаем график из контейнера
        if (chartContainerRef.current) {
          const existingChart = chartContainerRef.current.querySelector('.tv-lightweight-charts');
          if (existingChart) {
            existingChart.remove();
          }
        }
      };
    } catch (err) {
      console.error('[ChartComponent] ❌ Chart initialization error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка инициализации графика');
    }
  }, [chartKey, height]); // Зависим только от ключа и высоты

  // Стабилизируем данные криптовалют, чтобы избежать лишних обновлений
  const stableCryptoData = useMemo(() => cryptoData, [cryptoData]);

  // Обновление данных криптовалют
  useEffect(() => {
    if (!seriesInstance || !stableCryptoData.length) {
      return;
    }

    // Дополнительная проверка - убеждаемся, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        console.warn('[Chart] ⚠️ Multiple charts detected, cleaning up...');
        // Удаляем все кроме первого
        for (let i = 1; i < charts.length; i++) {
          charts[i].remove();
        }
      }
    }

    try {
      // Конвертируем данные в формат Lightweight Charts
      const chartData = stableCryptoData.map(item => {
        const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(item.time);
        return {
          time: timeInSeconds as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        };
      });

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        seriesInstance.setData(processedData as any);

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
          
          const firstTime = processedData[startIndex].time as number;
          const lastTime = processedData[endIndex].time as number;
          
          // Применяем начальный видимый диапазон только один раз, чтобы не сбрасывать зум пользователя при обновлениях
          if (!initialRangeAppliedRef.current) {
            isProgrammaticRangeChangeRef.current = true;
            const range = { from: firstTime as Time, to: lastTime as Time };
            chartInstance.timeScale().setVisibleRange(range as any);
            initialRangeAppliedRef.current = true;
          } else {
            // Если зум уже был применен, проверяем, не нужно ли его скорректировать
            const currentRange = chartInstance.timeScale().getVisibleRange();
            if (currentRange && typeof currentRange.from === 'number' && typeof currentRange.to === 'number') {
              // Проверяем, не выходит ли текущий зум за пределы данных
              const currentFrom = currentRange.from as number;
              const currentTo = currentRange.to as number;
              
              if (currentFrom < firstTime || currentTo > lastTime) {
                // Корректируем зум, чтобы он не выходил за пределы данных
                const correctedFrom = Math.max(firstTime, currentFrom);
                const correctedTo = Math.min(lastTime, currentTo);
                
                if (correctedFrom !== currentFrom || correctedTo !== currentTo) {
                  isProgrammaticRangeChangeRef.current = true;
                  const correctedRange = { from: correctedFrom as Time, to: correctedTo as Time };
                  chartInstance.timeScale().setVisibleRange(correctedRange as any);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating crypto data:', err);
    }
  }, [seriesInstance, stableCryptoData, chartInstance]);

  // Обновление астрономических событий
  useEffect(() => {
    if (!chartInstance || !seriesInstance || !stableAstronomicalEvents.length) {
      return;
    }

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        console.warn('[Chart] ⚠️ Multiple charts in astronomical events update, skipping...');
        return;
      }
    }

    try {
      // Фильтруем события по активным фильтрам
      const filteredEvents = AstronomicalEventUtils.filterEventsByType(
        stableAstronomicalEvents,
        activeEventFilters
      );

      // Конвертируем события в маркеры
      const markers = AstronomicalEventUtils.convertEventsToMarkers(filteredEvents);

      if (markers.length > 0) {
        seriesInstance.setMarkers(markers as any);
      } else {
        seriesInstance.setMarkers([]);
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating astronomical events:', err);
    }
  }, [seriesInstance, stableAstronomicalEvents, activeEventFilters]);

  // Обновление real-time данных
  useEffect(() => {
    if (!realTimeData || !seriesInstance || !chartInstance) {
      return;
    }

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        console.warn('[Chart] ⚠️ Multiple charts in real-time update, skipping...');
        return;
      }
    }

    try {
      // Конвертируем WebSocket данные в формат для графика
      const timeInSeconds = Math.floor(realTimeData.timestamp / 1000);
      
      // Проверяем, есть ли уже свеча с таким временем
      const existingData = seriesInstance.dataByIndex(seriesInstance.dataByIndex(seriesInstance.dataByIndex(0, 0) as any, -1) as any);
      
      if (existingData && existingData.time === timeInSeconds) {
        // Обновляем существующую свечу
        const updatedCandle = {
          time: timeInSeconds as any,
          open: realTimeData.open,
          high: realTimeData.high,
          low: realTimeData.low,
          close: realTimeData.close,
          volume: realTimeData.volume
        };
        
        seriesInstance.update(updatedCandle as any);
      } else {
        // Добавляем новую свечу
        const newCandle = {
          time: timeInSeconds as any,
          open: realTimeData.open,
          high: realTimeData.high,
          low: realTimeData.low,
          close: realTimeData.close,
          volume: realTimeData.volume
        };
        
        seriesInstance.update(newCandle as any);
      }

      // Автоматически скроллим к последней свече, если пользователь не взаимодействовал с графиком
      if (!hasUserInteractedRef.current) {
        const timeScale = chartInstance.timeScale();
        timeScale.scrollToPosition(0, false);
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating real-time data:', err);
    }
  }, [realTimeData, seriesInstance, chartInstance]);

  // Обработчик событий графика (тултип при ховере)
  useEffect(() => {
    if (!chartInstance) return;

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        console.warn('[Chart] ⚠️ Multiple charts in event handler setup, skipping...');
        return;
      }
    }

    // Мгновенный обработчик мыши для hover (без debounce)
    const handleMouseMove = (param: any) => {
      handleCrosshairMove(param);
    };

    // Подписываемся на движение курсора для тултипов
    chartInstance.subscribeCrosshairMove(handleMouseMove);

    return () => {
      chartInstance.unsubscribeCrosshairMove(handleMouseMove);
    };
  }, [chartInstance, handleCrosshairMove]);

  return (
    <div className={`relative ${className}`}>
      {/* Контейнер графика - должен быть первым для правильного позиционирования */}
      <div
        ref={chartContainerRef}
        style={{ 
          height: `${height}px`,
          minHeight: `${height}px`,
          width: '100%',
          minWidth: '100%'
        }}
        className="w-full"
      />

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-[#0a0b1e]/90 backdrop-blur-sm border border-[#334155] rounded-lg px-4 py-3 shadow-lg">
          <div className="text-[#e2e8f0] text-center flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f7931a]"></div>
            <div className="text-sm">Загрузка данных...</div>
          </div>
        </div>
      )}

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
          className="absolute z-10 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 shadow-lg pointer-events-none astro-tooltip transition-instant opacity-instant tooltip-instant gpu-off tooltip-visible instant-response"
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

export default ChartComponent;