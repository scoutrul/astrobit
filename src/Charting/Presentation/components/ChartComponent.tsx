import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts';
import { TimeframeUtils } from '../../Infrastructure/utils/TimeframeUtils';
import { AstronomicalEventUtils, AstronomicalEvent } from '../../Infrastructure/utils/AstronomicalEventUtils';
import { BinanceKlineWebSocketData } from '../../../CryptoData/Infrastructure/external-services/BinanceWebSocketService';
import { LivePriceWidget } from './LivePriceWidget';

interface ChartComponentProps {
  symbol: string;
  timeframe: string;
  height?: number;
  className?: string;
  cryptoData?: any[];
  astronomicalEvents?: AstronomicalEvent[];
  eventFilters?: {
    lunar?: boolean;
    solar?: boolean;
    planetary?: boolean;
    meteor?: boolean;
  };
  isLoading?: boolean;
  realTimeData?: BinanceKlineWebSocketData | null; // Для виджета цены
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

    // Очищаем контейнер от любых существующих графиков
    const existingCharts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
    existingCharts.forEach(chart => chart.remove());

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

    // Сбрасываем флаги при смене символа/таймфрейма
    hasUserInteractedRef.current = false;
    isProgrammaticRangeChangeRef.current = false;
    initialRangeAppliedRef.current = false;
    lastManualRangeRef.current = null;

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
          mode: 0, // Режим 0 = свободное движение crosshair (не привязан к свечам)
          vertLine: {
            visible: false, // Скрываем вертикальную линию (индикатор цены)
            color: '#f7931a',
            width: 1,
            style: 2
          },
          horzLine: {
            visible: true, // ПОКАЗЫВАЕМ горизонтальную линию
            color: '#f7931a',
            width: 1,
            style: 2,
            labelVisible: true // Показываем лейбл с ценой
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
        },
        // Настройки для crosshair по всему графику
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true
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

      // Применяем прозрачность для исторических свечей
      candlestickSeries.applyOptions({
        lastValueVisible: false, // Скрываем последнее значение цены
        priceLineVisible: false, // Скрываем линию цены
        // Делаем исторические свечи полупрозрачными
        upColor: 'rgba(16, 185, 129, 0.6)', // #10b981 с прозрачностью 60%
        downColor: 'rgba(239, 68, 68, 0.6)', // #ef4444 с прозрачностью 60%
        borderDownColor: 'rgba(239, 68, 68, 0.9)',
        borderUpColor: 'rgba(16, 185, 129, 0.9)',
        wickDownColor: 'rgba(239, 68, 68, 0.9)',
        wickUpColor: 'rgba(16, 185, 129, 0.9)'
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
  const stableCryptoData = useMemo(() => {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Не используем данные если они загружаются
    // Это предотвращает использование старых кешированных данных при смене символа
    if (isLoading) {
      return [];
    }
    
    return cryptoData;
  }, [cryptoData, symbol, isLoading]);

  // Обновление данных криптовалют
  useEffect(() => {
    if (!seriesInstance || !stableCryptoData.length) {
      return;
    }



    try {
      // Сохраняем текущий диапазон перед обновлением данных
      let savedRange = null;
      if (chartInstance && hasUserInteractedRef.current) {
        try {
          savedRange = chartInstance.timeScale().getVisibleRange();

        } catch (err) {
          console.warn('[Chart] ⚠️ Не удалось сохранить диапазон:', err);
        }
      }
      
      // Конвертируем данные в формат Lightweight Charts
      const chartData = stableCryptoData.map(item => {
        const timeInSeconds = TimeframeUtils.convertTimestampToSeconds(item.time);
        const chartItem: any = {
          time: timeInSeconds as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        };
        
        // Если это будущая свеча (volume = 0), применяем прозрачность
        if (item.volume === 0 && (item.color || item.borderColor || item.wickColor)) {
          chartItem.color = item.color;
          chartItem.borderColor = item.borderColor;
          chartItem.wickColor = item.wickColor;
        }
        
        return chartItem;
      });

      // Фильтруем и сортируем данные
      const processedData = TimeframeUtils.processChartData(chartData);
      
      if (processedData.length > 0) {
        // Простое логирование цен для проверки
        console.log(`[ChartComponent] 💰 PRICE CHECK for ${symbol}:`, 
          `First: $${processedData[0]?.close} | ` +
          `Last: $${processedData[processedData.length - 1]?.close} | ` +
          `Length: ${processedData.length} | ` +
          `ChartKey: ${chartKey}`
        );
        
        seriesInstance.setData(processedData as any);

        // Зум с показом будущих событий - последняя реальная свеча по центру
        if (chartInstance && processedData.length > 0) {
          const totalDataPoints = processedData.length;
          
          // Минимальное количество точек для установки диапазона
          if (totalDataPoints < 2) {
            console.warn('[ChartComponent] ⚠️ Not enough data points for range setting:', totalDataPoints);
            return;
          }
          
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
          let endIndex = Math.min(totalDataPoints - 1, centerIndex + halfVisible);
          
          // Убеждаемся, что endIndex больше startIndex
          if (endIndex <= startIndex) {
            endIndex = Math.min(totalDataPoints - 1, startIndex + 1);
          }
          
          // Дополнительная проверка валидности индексов
          if (startIndex >= totalDataPoints || endIndex >= totalDataPoints || startIndex < 0 || endIndex < 0) {
            console.warn('[ChartComponent] ⚠️ Invalid indices:', { startIndex, endIndex, totalDataPoints });
            return;
          }
          
          const firstTime = processedData[startIndex].time as number;
          const lastTime = processedData[endIndex].time as number;
          
          // Восстанавливаем сохраненный диапазон или применяем начальный
          if (savedRange && hasUserInteractedRef.current) {
            // Восстанавливаем пользовательский диапазон
            try {
              isProgrammaticRangeChangeRef.current = true;
              chartInstance.timeScale().setVisibleRange(savedRange as any);

            } catch (err) {
              console.warn('[Chart] ⚠️ Не удалось восстановить диапазон, применяем дефолтный');
              // Применяем дефолтный диапазон при ошибке
              isProgrammaticRangeChangeRef.current = true;
              const range = { from: firstTime as Time, to: lastTime as Time };
              chartInstance.timeScale().setVisibleRange(range as any);
            }
          } else if (!initialRangeAppliedRef.current) {
            // Применяем начальный диапазон только один раз
            isProgrammaticRangeChangeRef.current = true;
            const range = { from: firstTime as Time, to: lastTime as Time };
            chartInstance.timeScale().setVisibleRange(range as any);
            initialRangeAppliedRef.current = true;
          }
        }
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating crypto data:', err);
      
      // Сбрасываем флаг, чтобы попытаться снова при следующем обновлении
      if (err instanceof Error && err.message.includes('right should be >= left')) {
        console.warn('[ChartComponent] 🔄 Resetting range flags due to range error');
        initialRangeAppliedRef.current = false;
      }
    }
  }, [seriesInstance, stableCryptoData, chartInstance]);

  // Обновление астрономических событий
  useEffect(() => {
    if (!chartInstance || !seriesInstance || !stableAstronomicalEvents.length) {
      return;
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

  // Установка загрузки графика
  useEffect(() => {
    if (cryptoData.length > 0) {
      // График загружен
    }

    // Проверяем, что в контейнере только один график
    if (chartContainerRef.current) {
      const charts = chartContainerRef.current.querySelectorAll('.tv-lightweight-charts');
      if (charts.length > 1) {
        console.warn('[Chart] ⚠️ Multiple charts in real-time update, skipping...');
        return;
      }
    }

    // Проверяем, что график готов к обновлению
    try {
      const existingData = seriesInstance?.data();
      if (!existingData || existingData.length === 0) {
        console.log('[ChartComponent] ⏳ График пустой, ждем исторические данные');
        return; // Возвращаемся, чтобы не обновлять пустой график
      }
      
      // Проверяем последнюю свечу для валидации времени
      const lastCandle = existingData[existingData.length - 1];
      
      // Проверяем, что real-time данные не старше последней свечи
      if (realTimeData && lastCandle) {
        const realTimeSeconds = Math.floor(realTimeData.timestamp / 1000);
        if (realTimeSeconds < (lastCandle.time as number)) {
          console.warn(`[ChartComponent] ⚠️ Real-time данные старше последней свечи: ${realTimeSeconds} < ${lastCandle.time}, пропускаем`);
          return;
        }
      }
    } catch (err) {
      console.warn('[ChartComponent] ⚠️ Ошибка получения данных графика, пропускаем');
      return;
    }

    try {
      if (!realTimeData || !seriesInstance) return;
      
      // Конвертируем WebSocket данные в формат для графика
      const timeInSeconds = Math.floor(realTimeData.timestamp / 1000);
      
      // Проверяем валидность данных
      if (!realTimeData.open || !realTimeData.high || !realTimeData.low || !realTimeData.close) {
        console.warn('[ChartComponent] ⚠️ Invalid real-time data received:', realTimeData);
        return;
      }

      // Отладочная информация (только для закрытых свечей)
      if (realTimeData.isClosed) {
        console.log(`[ChartComponent] 🔍 Processing closed candle: timestamp=${realTimeData.timestamp}, timeInSeconds=${timeInSeconds}, close=${realTimeData.close}`);
      }

      // Создаем обновленную свечу с правильным форматом времени
      const updatedCandle = {
        time: timeInSeconds as UTCTimestamp, // Правильный тип для LightweightCharts
        open: realTimeData.open,
        high: realTimeData.high,
        low: realTimeData.low,
        close: realTimeData.close
      };

      // Простое обновление - LightweightCharts сам разберется
      seriesInstance.update(updatedCandle);
      
      console.log(`[ChartComponent] 📈 Real-time update: ${realTimeData.symbol}@${realTimeData.interval} - Close: ${realTimeData.close} (${realTimeData.isClosed ? 'closed' : 'live'}) at ${new Date(realTimeData.timestamp).toLocaleTimeString()}`);

      // Автоматически скроллим к последней свече только если пользователь не взаимодействовал с графиком
      // и только для живых данных (не закрытых свечей)
      if (chartInstance && !hasUserInteractedRef.current && !realTimeData.isClosed) {
        const timeScale = chartInstance.timeScale();
        timeScale.scrollToPosition(0, false);
      }
    } catch (err) {
      console.error('[ChartComponent] ❌ Error updating real-time data:', err);
    }
  }, [realTimeData, seriesInstance, chartInstance, cryptoData]);

  // Обработчик событий графика (тултип при ховере)
  useEffect(() => {
    if (!chartInstance) return;



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

      {/* Live Price Widget */}
      <LivePriceWidget 
        symbol={symbol}
        realTimeData={realTimeData}
        isLoading={isLoading}
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